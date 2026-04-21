import { Head, Link } from '@inertiajs/react';
import {
    Bell,
    CalendarDays,
    CheckCircle2,
    ClipboardList,
    Heart,
    MapPinned,
    Settings,
    ShoppingBag,
    Truck,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { dashboard } from '@/routes';

type DashboardStats = {
    cart_items: number;
    wishlist_items: number;
    active_orders: number;
    completed_orders: number;
    unread_notifications: number;
};

type ProfileData = {
    completion: number;
    shipping_ready: boolean;
    checklist: Array<{
        label: string;
        completed: boolean;
    }>;
    missing_items: string[];
};

type NextOrder = {
    order_number: string;
    status_label: string;
    status_color: string;
    rental_start_date: string | null;
    rental_end_date: string | null;
    shipping_address: string | null;
    shipping_city: string | null;
    shipping_province: string | null;
    total: number;
} | null;

type RecentOrder = {
    id: number;
    order_number: string;
    status: string;
    status_label: string;
    status_color: string;
    total: number;
    rental_start_date: string | null;
    rental_end_date: string | null;
    created_at: string;
};

export default function Dashboard({
    stats,
    profile,
    next_order,
    recent_orders,
}: {
    stats: DashboardStats;
    profile: ProfileData;
    next_order: NextOrder;
    recent_orders: RecentOrder[];
}) {
    return (
        <>
            <Head title="Dashboard" />

            <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
                <section className="rounded-[1.25rem] border border-[rgba(131,98,70,0.18)] bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(247,239,230,0.92),rgba(239,224,208,0.86))] p-6 shadow-[0_20px_50px_rgba(88,62,43,0.08)] sm:p-8">
                    <p className="text-sm uppercase tracking-[0.35em] text-primary">Customer area</p>
                    <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-3xl">
                            <h1 className="text-4xl font-semibold leading-tight text-[#3f2a1f] sm:text-5xl">Dashboard account yang benar-benar kepakai untuk rental harian.</h1>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6a5140] sm:text-base">
                                Pantau order aktif, kelengkapan profil, cart, wishlist, dan kesiapan pengiriman dari satu tempat.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <QuickAction href="/catalog" label="Lihat katalog" icon={<ShoppingBag className="size-4" />} />
                            <QuickAction href="/cart" label="Buka cart" icon={<ClipboardList className="size-4" />} />
                            <QuickAction href="/settings/profile" label="Lengkapi profil" icon={<Settings className="size-4" />} />
                        </div>
                    </div>
                </section>

                <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                    <StatCard label="Item di cart" value={stats.cart_items} sub="Siap lanjut checkout" icon={<ShoppingBag className="size-4" />} />
                    <StatCard label="Wishlist" value={stats.wishlist_items} sub="Favorit yang disimpan" icon={<Heart className="size-4" />} />
                    <StatCard label="Order aktif" value={stats.active_orders} sub="Masih berjalan" icon={<Truck className="size-4" />} />
                    <StatCard label="Order selesai" value={stats.completed_orders} sub="Riwayat rental" icon={<CheckCircle2 className="size-4" />} />
                    <StatCard label="Notifikasi baru" value={stats.unread_notifications} sub="Perlu dicek" icon={<Bell className="size-4" />} />
                </section>

                <section className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                    <div className="space-y-6">
                        <div className="rounded-[1.1rem] border border-border bg-white p-5 shadow-[0_14px_34px_rgba(88,62,43,0.05)]">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-sm font-semibold text-[#4a3225]">Kelengkapan profil</p>
                                    <p className="mt-1 text-sm leading-6 text-[#6a5140]">Semakin lengkap profil, semakin cepat proses verifikasi, checkout, dan pengiriman.</p>
                                </div>
                                <span className="inline-flex rounded-full bg-primary/12 px-3 py-1 text-sm font-semibold text-primary">{profile.completion}%</span>
                            </div>

                            <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
                                <div className="h-full rounded-full bg-primary" style={{ width: `${profile.completion}%` }} />
                            </div>

                            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                {profile.checklist.map((item) => (
                                    <div key={item.label} className="flex items-center gap-2 rounded-[0.85rem] border border-border bg-[rgba(255,251,247,0.85)] px-3 py-2.5">
                                        <span className={`flex size-6 items-center justify-center rounded-full ${item.completed ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-500'}`}>
                                            <CheckCircle2 className="size-3.5" />
                                        </span>
                                        <span className={`text-sm ${item.completed ? 'font-medium text-[#4a3225]' : 'text-[#6f5948]'}`}>{item.label}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-5 flex flex-wrap items-center gap-3">
                                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${profile.shipping_ready ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>
                                    {profile.shipping_ready ? 'Shipping profile siap' : 'Shipping profile belum lengkap'}
                                </span>
                                <Link href="/settings/profile" className="text-sm font-medium text-primary underline underline-offset-4">
                                    Perbarui profil
                                </Link>
                            </div>

                            {profile.missing_items.length > 0 && (
                                <p className="mt-3 text-xs leading-5 text-[#6f5948]">
                                    Prioritas berikutnya: {profile.missing_items.slice(0, 3).join(', ')}.
                                </p>
                            )}
                        </div>

                        <div className="rounded-[1.1rem] border border-border bg-white p-5 shadow-[0_14px_34px_rgba(88,62,43,0.05)]">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm uppercase tracking-[0.24em] text-primary">Riwayat terbaru</p>
                                    <h2 className="mt-1 text-2xl font-semibold text-[#3f2a1f]">Order history</h2>
                                </div>
                                <Link href="/cart" className="text-sm font-medium text-primary underline underline-offset-4">
                                    Kelola cart
                                </Link>
                            </div>

                            {recent_orders.length === 0 ? (
                                <div className="mt-5 rounded-[1rem] border border-dashed border-border bg-secondary/25 px-5 py-10 text-center">
                                    <p className="text-base font-semibold text-[#4a3225]">Belum ada order</p>
                                    <p className="mt-2 text-sm text-[#6a5140]">Mulai dari katalog untuk membuat rental pertama Anda.</p>
                                    <Link href="/catalog" className="mt-4 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                                        Jelajahi katalog
                                    </Link>
                                </div>
                            ) : (
                                <div className="mt-5 space-y-3">
                                    {recent_orders.map((order) => (
                                        <div key={order.id} className="rounded-[1rem] border border-border bg-[rgba(255,251,247,0.86)] px-4 py-3">
                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                <div>
                                                    <p className="text-sm font-semibold text-[#4a3225]">{order.order_number}</p>
                                                    <p className="mt-1 text-xs text-[#6a5140]">Dibuat {order.created_at}</p>
                                                    <p className="mt-2 text-xs text-[#6f5948]">
                                                        {order.rental_start_date && order.rental_end_date
                                                            ? `${order.rental_start_date} - ${order.rental_end_date}`
                                                            : 'Tanggal rental akan tampil setelah checkout lengkap.'}
                                                    </p>
                                                </div>
                                                <div className="text-left sm:text-right">
                                                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusColorClasses(order.status_color)}`}>
                                                        {order.status_label}
                                                    </span>
                                                    <p className="mt-2 text-sm font-semibold text-primary">{formatIDR(order.total)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="rounded-[1.1rem] border border-border bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(247,239,230,0.95))] p-5 shadow-[0_14px_34px_rgba(88,62,43,0.06)]">
                            <div className="flex items-center gap-2">
                                <CalendarDays className="size-4 text-primary" />
                                <p className="text-sm uppercase tracking-[0.24em] text-primary">Order berikutnya</p>
                            </div>

                            {next_order ? (
                                <div className="mt-4 space-y-4">
                                    <div>
                                        <p className="text-2xl font-semibold text-[#3f2a1f]">{next_order.order_number}</p>
                                        <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusColorClasses(next_order.status_color)}`}>
                                            {next_order.status_label}
                                        </span>
                                    </div>

                                    <div className="grid gap-3 rounded-[1rem] border border-primary/10 bg-white/85 p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="rounded-full bg-secondary p-2 text-primary">
                                                <CalendarDays className="size-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-[#4a3225]">Jadwal rental</p>
                                                <p className="mt-1 text-sm text-[#6a5140]">
                                                    {next_order.rental_start_date && next_order.rental_end_date
                                                        ? `${next_order.rental_start_date} - ${next_order.rental_end_date}`
                                                        : 'Tanggal rental belum tersimpan lengkap.'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <div className="rounded-full bg-secondary p-2 text-primary">
                                                <MapPinned className="size-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-[#4a3225]">Alamat tujuan</p>
                                                <p className="mt-1 text-sm text-[#6a5140]">
                                                    {[next_order.shipping_address, next_order.shipping_city, next_order.shipping_province].filter(Boolean).join(', ') || 'Alamat pengiriman belum lengkap.'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between rounded-[1rem] border border-border bg-white/85 px-4 py-3">
                                        <span className="text-sm text-[#6a5140]">Total order</span>
                                        <span className="text-lg font-semibold text-primary">{formatIDR(next_order.total)}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-4 rounded-[1rem] border border-dashed border-border bg-white/80 px-5 py-10 text-center">
                                    <p className="text-base font-semibold text-[#4a3225]">Belum ada order aktif</p>
                                    <p className="mt-2 text-sm text-[#6a5140]">Cart dan wishlist Anda sudah siap dipakai kapan saja untuk memulai order berikutnya.</p>
                                </div>
                            )}
                        </div>

                        <div className="rounded-[1.1rem] border border-border bg-white p-5 shadow-[0_14px_34px_rgba(88,62,43,0.05)]">
                            <p className="text-sm uppercase tracking-[0.24em] text-primary">Shortcut</p>
                            <div className="mt-4 grid gap-3">
                                <ShortcutCard href="/catalog" title="Cari koleksi baru" description="Telusuri dress, clutch, dan aksesoris yang siap disewa." />
                                <ShortcutCard href="/account/wishlist" title="Buka wishlist" description="Lanjutkan item favorit ke tahap pemilihan final." />
                                <ShortcutCard href="/settings/security" title="Keamanan akun" description="Perbarui password dan aktifkan verifikasi tambahan." />
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}

function QuickAction({ href, label, icon }: { href: string; label: string; icon: ReactNode }) {
    return (
        <Link href={href} className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-white/90 px-4 py-2 text-sm font-medium text-[#4a3225] transition hover:border-primary/35 hover:bg-white">
            {icon}
            {label}
        </Link>
    );
}

function StatCard({
    label,
    value,
    sub,
    icon,
}: {
    label: string;
    value: number;
    sub: string;
    icon: ReactNode;
}) {
    return (
        <div className="rounded-[1rem] border border-border bg-white p-4 shadow-[0_12px_28px_rgba(88,62,43,0.04)]">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[#7c6553]">{label}</p>
                    <p className="mt-2 text-3xl font-semibold text-[#3f2a1f]">{value}</p>
                    <p className="mt-1 text-xs text-[#6a5140]">{sub}</p>
                </div>
                <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-primary">{icon}</span>
            </div>
        </div>
    );
}

function ShortcutCard({ href, title, description }: { href: string; title: string; description: string }) {
    return (
        <Link href={href} className="rounded-[0.95rem] border border-border bg-[rgba(255,251,247,0.85)] px-4 py-3 transition hover:border-primary/25 hover:bg-white">
            <p className="text-sm font-semibold text-[#4a3225]">{title}</p>
            <p className="mt-1 text-sm leading-6 text-[#6a5140]">{description}</p>
        </Link>
    );
}

function formatIDR(amount: number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
}

function statusColorClasses(color: string) {
    return (
        {
            yellow: 'bg-amber-100 text-amber-800',
            blue: 'bg-sky-100 text-sky-800',
            indigo: 'bg-indigo-100 text-indigo-800',
            purple: 'bg-purple-100 text-purple-800',
            teal: 'bg-teal-100 text-teal-800',
            green: 'bg-green-100 text-green-800',
            orange: 'bg-orange-100 text-orange-800',
            emerald: 'bg-emerald-100 text-emerald-800',
            red: 'bg-rose-100 text-rose-800',
            gray: 'bg-stone-200 text-stone-700',
        }[color] ?? 'bg-stone-200 text-stone-700'
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
