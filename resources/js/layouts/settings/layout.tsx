import { Link } from '@inertiajs/react';
import { ShieldCheck, UserRound } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import { edit as editProfile } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import type { NavItem } from '@/types';

const accountNavItems: Array<NavItem & { description: string }> = [
    {
        title: 'Profil Customer',
        href: editProfile(),
        icon: UserRound,
        description: 'Data pribadi, alamat, dan identitas rental.',
    },
    {
        title: 'Keamanan Akun',
        href: editSecurity(),
        icon: ShieldCheck,
        description: 'Password dan verifikasi tambahan akun.',
    },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();

    return (
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
            <div className="mb-8">
                <p className="text-sm uppercase tracking-[0.35em] text-primary">Customer area</p>
                <h1 className="mt-2 text-3xl font-semibold">Pengaturan Akun</h1>
                <p className="store-copy mt-2 max-w-2xl text-sm leading-6">
                    Kelola profil customer, alamat pengiriman, dokumen identitas, dan keamanan akun tanpa masuk ke area admin.
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
                <aside className="store-gradient-panel h-fit p-4">
                    <nav className="space-y-2" aria-label="Pengaturan akun customer">
                        {accountNavItems.map((item, index) => {
                            const active = isCurrentOrParentUrl(item.href);

                            return (
                                <Link
                                    key={`${toUrl(item.href)}-${index}`}
                                    href={item.href}
                                    className={cn(
                                        'block rounded-lg border px-4 py-3 transition',
                                        active
                                            ? 'border-primary/20 bg-primary/10'
                                            : 'border-transparent hover:border-primary/10 hover:bg-white/80 dark:hover:bg-card',
                                    )}
                                >
                                    <div className="flex items-start gap-3">
                                        {item.icon && (
                                            <span
                                                className={cn(
                                                    'mt-0.5 flex size-9 items-center justify-center rounded-md',
                                                    active
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'bg-secondary text-primary dark:bg-secondary/80',
                                                )}
                                            >
                                                <item.icon className="size-4" />
                                            </span>
                                        )}
                                        <div>
                                            <p className={cn('text-sm font-semibold', active ? 'text-primary' : 'store-ink')}>
                                                {item.title}
                                            </p>
                                            <p className="store-copy mt-1 text-xs leading-5">{item.description}</p>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </nav>
                </aside>

                <div className="store-panel p-6 sm:p-7">
                    <section className="space-y-10">{children}</section>
                </div>
            </div>
        </div>
    );
}
