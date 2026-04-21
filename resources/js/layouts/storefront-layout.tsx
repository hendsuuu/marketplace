import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState  } from 'react';
import type {ReactNode} from 'react';
import type { SharedData } from '@/types';

function MenuIcon() {
    return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
    );
}

function XIcon() {
    return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
    );
}

function SearchIcon() {
    return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
    );
}

function HeartIcon() {
    return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
        </svg>
    );
}

function CartIcon({ count = 0 }: { count?: number }) {
    return (
        <BadgeIcon count={count}>
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" />
            </svg>
        </BadgeIcon>
    );
}

function BellIcon({ count = 0 }: { count?: number }) {
    return (
        <BadgeIcon count={count}>
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </svg>
        </BadgeIcon>
    );
}

function BadgeIcon({ count = 0, children }: { count?: number; children: ReactNode }) {
    return (
        <div className="relative">
            {children}
            {count > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                    {count > 9 ? '9+' : count}
                </span>
            )}
        </div>
    );
}

const navItems = [
    { label: 'Home', href: '/catalog' },
    { label: 'Promo', href: '/catalog?sort=featured' },
    { label: 'New Arrival', href: '/catalog?sort=newest' },
    {
        label: 'All Dresses',
        children: [
            { label: 'Gaun Pesta', href: '/catalog?category=gaun-pesta' },
            { label: 'Cheongsam', href: '/catalog?category=cheongsam' },
        ],
    },
    {
        label: 'Categories',
        children: [
            { label: 'Hijab-Friendly', href: '/catalog?hijab_friendly=1' },
            { label: 'Bumil-Friendly', href: '/catalog?maternity_friendly=1' },
            { label: 'Big Size-Friendly', href: '/catalog?big_size_friendly=1' },
            { label: 'Kebaya / Batik', href: '/catalog?category=kebaya-batik' },
        ],
    },
    {
        label: 'Kids',
        children: [
            { label: 'Dresses', href: '/catalog?category=kids-dresses' },
            { label: 'Accessories', href: '/catalog?category=kids-accessories' },
        ],
    },
    { label: 'Clutch', href: '/catalog?category=clutch' },
    {
        label: 'Aksesoris',
        children: [
            { label: 'Kalung', href: '/catalog?category=kalung' },
            { label: 'Anting', href: '/catalog?category=anting' },
            { label: 'Scarf', href: '/catalog?category=scarf' },
            { label: 'Hiasan Rambut', href: '/catalog?category=hiasan-rambut' },
            { label: 'Sabuk', href: '/catalog?category=sabuk' },
            { label: 'Sarung Tangan', href: '/catalog?category=sarung-tangan' },
            { label: 'Bolero', href: '/catalog?category=bolero' },
            { label: 'Hijab', href: '/catalog?category=hijab' },
        ],
    },
    { label: 'Winter Coat', href: '/catalog?category=winter-coat' },
];

const brandName = import.meta.env.VITE_APP_NAME || 'Elegance Rental';

function NavDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
    const [expanded, setExpanded] = useState<string | null>(null);

    useEffect(() => {
        const handler = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handler);

        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);

    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : '';

        return () => {
            document.body.style.overflow = '';
        };
    }, [open]);

    return (
        <>
            <div
                className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
                onClick={onClose}
                aria-hidden="true"
            />

            <div
                className={`fixed inset-y-0 left-0 z-50 flex w-80 flex-col bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,239,230,0.98))] shadow-2xl transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}
                role="dialog"
                aria-modal="true"
                aria-label="Navigation menu"
            >
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                    <Link href="/catalog" onClick={onClose} className="font-serif store-ink text-lg font-semibold uppercase tracking-[0.25em]">
                        {brandName}
                    </Link>
                    <button onClick={onClose} className="rounded-md p-1.5 text-secondary-foreground transition hover:bg-secondary hover:text-foreground" aria-label="Close menu">
                        <XIcon />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto px-4 py-4">
                    <ul className="space-y-1">
                        {navItems.map((item) =>
                            item.children ? (
                                <li key={item.label}>
                                    <button
                                        onClick={() => setExpanded(expanded === item.label ? null : item.label)}
                                        className="store-ink flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-sm font-medium transition hover:bg-secondary hover:text-foreground"
                                    >
                                        <span>{item.label}</span>
                                        <svg
                                            className={`h-4 w-4 text-secondary-foreground transition-transform ${expanded === item.label ? 'rotate-180' : ''}`}
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
                                        </svg>
                                    </button>
                                    {expanded === item.label && (
                                        <ul className="ml-3 mt-1 space-y-1 border-l border-border/80 pl-3">
                                            {item.children.map((child) => (
                                                <li key={child.label}>
                                                    <Link
                                                        href={child.href}
                                                        onClick={onClose}
                                                        className="store-copy block rounded-md px-3 py-2 text-sm font-medium transition hover:bg-secondary hover:text-foreground"
                                                    >
                                                        {child.label}
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </li>
                            ) : (
                                <li key={item.label}>
                                    <Link
                                        href={item.href}
                                        onClick={onClose}
                                    className="store-ink block rounded-md px-3 py-2.5 text-sm font-medium transition hover:bg-secondary hover:text-foreground"
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            ),
                        )}
                    </ul>
                </nav>

                <div className="border-t border-border px-5 py-4">
                    <p className="text-xs text-secondary-foreground dark:text-stone-300">Fashion rental yang rapi, premium, dan siap dipakai.</p>
                </div>
            </div>
        </>
    );
}

function UserMenu({ user, roles }: { user: { name: string; email: string }; roles: string[] }) {
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const isAdmin = roles.includes('admin') || roles.includes('superadmin');

    useEffect(() => {
        const handler = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handler);

        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div ref={menuRef} className="relative">
            <button
                onClick={() => setOpen((current) => !current)}
                className="store-ink flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-1.5 text-sm font-medium transition hover:border-primary/30 hover:bg-secondary dark:bg-card"
            >
                <span className="hidden max-w-[96px] truncate sm:inline">{user.name.split(' ')[0]}</span>
                <svg className="h-4 w-4 text-secondary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <circle cx="12" cy="8" r="4" />
                    <path strokeLinecap="round" d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
            </button>

            {open && (
                <div className="store-panel absolute right-0 top-full z-40 mt-2 w-56 p-2 shadow-xl">
                    <div className="rounded-lg bg-secondary/60 px-3 py-2">
                        <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
                        <p className="truncate text-xs text-secondary-foreground dark:text-stone-300">{user.email}</p>
                    </div>

                    <div className="mt-2 space-y-1">
                        <Link href="/dashboard" onClick={() => setOpen(false)} className="store-ink block rounded-md px-3 py-2 text-sm transition hover:bg-secondary">
                            Dashboard
                        </Link>
                        <Link href="/settings/profile" onClick={() => setOpen(false)} className="store-ink block rounded-md px-3 py-2 text-sm transition hover:bg-secondary">
                            Profil Saya
                        </Link>
                        <Link href="/account/wishlist" onClick={() => setOpen(false)} className="store-ink block rounded-md px-3 py-2 text-sm transition hover:bg-secondary">
                            Wishlist
                        </Link>
                        <Link href="/cart" onClick={() => setOpen(false)} className="store-ink block rounded-md px-3 py-2 text-sm transition hover:bg-secondary">
                            Cart
                        </Link>
                        {isAdmin && (
                            <Link href="/admin/dashboard" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-medium text-primary transition hover:bg-secondary">
                                Admin Panel
                            </Link>
                        )}
                        <button
                            onClick={() => {
                                setOpen(false);
                                router.post('/logout');
                            }}
                            className="block w-full rounded-lg px-3 py-2 text-left text-sm text-destructive transition hover:bg-secondary"
                        >
                            Keluar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function StoreFrontHeader() {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const { auth, storefront } = usePage<SharedData>().props;

    return (
        <>
            <header className="sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setDrawerOpen(true)}
                            className="store-ink rounded-md border border-border bg-white p-2 transition hover:border-primary/30 hover:bg-secondary hover:text-foreground dark:bg-card"
                            aria-label="Open menu"
                        >
                            <MenuIcon />
                        </button>
                        <Link href="/catalog" className="store-copy-muted hidden font-serif text-sm uppercase tracking-[0.3em] sm:block">
                            Curated Wardrobe
                        </Link>
                    </div>

                    <Link href="/catalog" className="store-ink absolute left-1/2 -translate-x-1/2 font-serif text-xl font-semibold uppercase tracking-[0.3em] sm:text-2xl">
                        {brandName}
                    </Link>

                    <div className="store-ink flex items-center gap-1.5">
                        <Link href="/catalog" className="rounded-md border border-transparent p-2 text-current transition hover:border-primary/20 hover:bg-secondary hover:text-foreground" aria-label="Search">
                            <SearchIcon />
                        </Link>

                        {auth.user ? (
                            <>
                                <Link href="/account/wishlist" className="rounded-md border border-transparent p-2 text-current transition hover:border-primary/20 hover:bg-secondary hover:text-foreground" aria-label="Wishlist">
                                    <BadgeIcon count={storefront.wishlist_count}>
                                        <HeartIcon />
                                    </BadgeIcon>
                                </Link>
                                <button className="rounded-md border border-transparent p-2 text-current transition hover:border-primary/20 hover:bg-secondary hover:text-foreground" aria-label="Notifications">
                                    <BellIcon count={storefront.unread_notifications_count} />
                                </button>
                                <Link href="/cart" className="rounded-md border border-transparent p-2 text-current transition hover:border-primary/20 hover:bg-secondary hover:text-foreground" aria-label="Cart">
                                    <CartIcon count={storefront.cart_count} />
                                </Link>
                                <UserMenu user={auth.user} roles={auth.roles ?? []} />
                            </>
                        ) : (
                            <div className="hidden items-center gap-2 sm:flex">
                                <Link href="/login" className="rounded-md border border-border px-4 py-2 text-sm font-medium transition hover:border-primary/30 hover:bg-secondary">
                                    Masuk
                                </Link>
                                <Link href="/register" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90">
                                    Daftar
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
        </>
    );
}

function StoreFrontFooter() {
    const footerLinks = [
        { label: 'Terms & Conditions', href: '/terms' },
        { label: 'How to Rent', href: '/how-to-rent' },
        { label: 'FAQ', href: '/faq' },
        { label: 'Measurement Guide', href: '/measurement-guide' },
        { label: 'Location', href: '/location' },
        { label: 'Contact Us', href: '/contact' },
        { label: 'Kritik & Saran', href: '/feedback' },
        { label: 'Consignment', href: '/consignment' },
        { label: 'Collaboration', href: '/collaboration' },
    ];

    return (
        <footer className="mt-auto border-t border-border bg-white dark:bg-background">
            <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
                <div className="store-gradient-panel p-6 sm:p-8">
                    <div className="mb-6 text-center">
                        <p className="font-serif text-2xl uppercase tracking-[0.35em] text-primary">{brandName}</p>
                        <p className="mt-2 text-sm text-secondary-foreground dark:text-stone-300">Simple, classy, dan siap mendukung pengalaman rental fashion premium.</p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
                        {footerLinks.map((link) => (
                            <Link key={link.href} href={link.href} className="text-xs text-secondary-foreground transition hover:text-primary dark:text-stone-300">
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}

function WhatsAppButton() {
    const waNumber = import.meta.env.VITE_WA_CS_NUMBER || '6281234567890';
    const waMessage = encodeURIComponent('Halo, saya ingin menanyakan tentang rental fashion.');

    return (
        <a
            href={`https://wa.me/${waNumber}?text=${waMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-lg transition-transform hover:scale-105"
            aria-label="Chat via WhatsApp"
        >
            <svg className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884" />
            </svg>
        </a>
    );
}

export default function StoreFrontLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex min-h-screen flex-col bg-background">
            <StoreFrontHeader />
            <main className="flex-1">{children}</main>
            <StoreFrontFooter />
            <WhatsAppButton />
        </div>
    );
}
