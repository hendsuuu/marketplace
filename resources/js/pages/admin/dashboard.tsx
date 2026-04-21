import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowRight,
    CheckCircle,
    Clock,
    Layers,
    Package,
    ShoppingCart,
    Tag,
    TrendingUp,
    Users,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import type { BreadcrumbItem } from '@/types';

type Stats = {
    products: number;
    active_products: number;
    categories: number;
    brands: number;
    customers: number;
    total_orders: number;
    pending_orders: number;
    active_orders: number;
    revenue_month: number;
    revenue_total: number;
};

type OrderStatus = {
    value: string;
    label: string;
    color: string;
    count: number;
};

type RecentOrder = {
    id: number;
    order_number: string;
    customer: string;
    status: string;
    status_label: string;
    status_color: string;
    total: number;
    created_at: string;
};

type LowStockProduct = {
    id: number;
    name: string;
    code: string;
    count: number;
};

function formatIDR(amount: number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(amount);
}

const STATUS_BADGE_COLORS: Record<string, string> = {
    yellow: 'bg-yellow-100 text-yellow-800',
    blue: 'bg-blue-100 text-blue-800',
    indigo: 'bg-indigo-100 text-indigo-800',
    purple: 'bg-purple-100 text-purple-800',
    teal: 'bg-teal-100 text-teal-800',
    green: 'bg-green-100 text-green-800',
    orange: 'bg-orange-100 text-orange-800',
    emerald: 'bg-emerald-100 text-emerald-800',
    red: 'bg-red-100 text-red-800',
    gray: 'bg-gray-100 text-gray-700',
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
];

export default function AdminDashboard({
    stats,
    ordersByStatus,
    recentOrders,
    lowStockProducts,
}: {
    stats: Stats;
    ordersByStatus: OrderStatus[];
    recentOrders: RecentOrder[];
    lowStockProducts: LowStockProduct[];
}) {
    return (
        <>
            <Head title="Admin Dashboard" />

            <div className="flex flex-col gap-6 p-4 sm:p-6">
                <div>
                    <h1 className="font-serif text-2xl font-semibold text-foreground">Admin Dashboard</h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">Selamat datang kembali. Berikut ringkasan aktivitas toko Anda.</p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                    <StatCard
                        label="Total Produk"
                        value={stats.products}
                        sub={`${stats.active_products} aktif`}
                        icon={<Package className="size-5 text-primary" />}
                        href="/admin/products"
                    />
                    <StatCard label="Kategori" value={stats.categories} icon={<Layers className="size-5 text-primary" />} href="/admin/categories" />
                    <StatCard label="Brand" value={stats.brands} icon={<Tag className="size-5 text-primary" />} href="/admin/brands" />
                    <StatCard label="Pelanggan" value={stats.customers} icon={<Users className="size-5 text-primary" />} href="/admin/users" />
                    <StatCard
                        label="Total Pesanan"
                        value={stats.total_orders}
                        sub={`${stats.pending_orders} menunggu bayar`}
                        icon={<ShoppingCart className="size-5 text-primary" />}
                        href="/admin/orders"
                        highlight={stats.pending_orders > 0}
                    />
                    <StatCard label="Pesanan Aktif" value={stats.active_orders} sub="sedang berjalan" icon={<Clock className="size-5 text-blue-500" />} href="/admin/orders" />
                    <StatCard label="Pendapatan Bulan Ini" value={formatIDR(stats.revenue_month)} isText icon={<TrendingUp className="size-5 text-emerald-500" />} />
                    <StatCard label="Total Pendapatan" value={formatIDR(stats.revenue_total)} isText icon={<CheckCircle className="size-5 text-emerald-600" />} />
                </div>

                <section>
                    <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Aksi Cepat</h2>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <QuickAction href="/admin/products/create" label="+ Tambah Produk" color="primary" />
                        <QuickAction href="/admin/categories/create" label="+ Tambah Kategori" color="indigo" />
                        <QuickAction href="/admin/brands/create" label="+ Tambah Brand" color="teal" />
                        <QuickAction href="/admin/orders" label="Lihat Pesanan" color="orange" />
                    </div>
                </section>

                <div className="grid gap-6 lg:grid-cols-3">
                    <section className="lg:col-span-2">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pesanan Terbaru</h2>
                            <Link href="/admin/orders" className="flex items-center gap-1 text-xs text-primary hover:underline">
                                Lihat semua <ArrowRight className="size-3" />
                            </Link>
                        </div>

                        {recentOrders.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">Belum ada pesanan.</div>
                        ) : (
                            <div className="overflow-hidden rounded-xl border border-border">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-border text-sm">
                                        <thead className="bg-muted/50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">No. Pesanan</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Pelanggan</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Total</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Tanggal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border bg-card">
                                            {recentOrders.map((order) => (
                                                <tr key={order.id} className="hover:bg-muted/30">
                                                    <td className="px-4 py-3 font-mono text-xs text-foreground">{order.order_number}</td>
                                                    <td className="px-4 py-3 text-foreground">{order.customer}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE_COLORS[order.status_color] ?? 'bg-gray-100 text-gray-700'}`}>
                                                            {order.status_label}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-foreground">{formatIDR(order.total)}</td>
                                                    <td className="px-4 py-3 text-right text-xs text-muted-foreground">{order.created_at}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </section>

                    <div className="flex flex-col gap-6">
                        {ordersByStatus.length > 0 && (
                            <section>
                                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status Pesanan</h2>
                                <div className="rounded-xl border border-border bg-card">
                                    <ul className="divide-y divide-border">
                                        {ordersByStatus.map((status) => (
                                            <li key={status.value} className="flex items-center justify-between px-4 py-2.5">
                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE_COLORS[status.color] ?? 'bg-gray-100 text-gray-700'}`}>
                                                    {status.label}
                                                </span>
                                                <span className="text-sm font-semibold text-foreground">{status.count}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </section>
                        )}

                        {lowStockProducts.length > 0 && (
                            <section>
                                <h2 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    <AlertTriangle className="size-3.5 text-orange-500" />
                                    Stok Rendah
                                </h2>
                                <div className="rounded-xl border border-border bg-card">
                                    <ul className="divide-y divide-border">
                                        {lowStockProducts.map((product) => (
                                            <li key={product.id} className="flex items-center justify-between px-4 py-2.5">
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium text-foreground">{product.name}</p>
                                                    <p className="text-xs text-muted-foreground">{product.code}</p>
                                                </div>
                                                <Badge variant={product.count === 0 ? 'destructive' : 'outline'} className="ml-2 shrink-0">
                                                    {product.count} varian
                                                </Badge>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </section>
                        )}

                        <section>
                            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Menu Manajemen</h2>
                            <div className="flex flex-col gap-2">
                                {[
                                    { href: '/admin/products', label: 'Semua Produk' },
                                    { href: '/admin/categories', label: 'Kategori' },
                                    { href: '/admin/brands', label: 'Brand' },
                                    { href: '/admin/orders', label: 'Semua Pesanan' },
                                    { href: '/admin/users', label: 'Pengguna & Akses' },
                                ].map((item) => (
                                    <Link key={item.href} href={item.href} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground transition hover:bg-accent">
                                        {item.label}
                                        <ArrowRight className="size-3.5 text-muted-foreground" />
                                    </Link>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </>
    );
}

function StatCard({
    label,
    value,
    sub,
    icon,
    href,
    highlight,
    isText,
}: {
    label: string;
    value: number | string;
    sub?: string;
    icon: ReactNode;
    href?: string;
    highlight?: boolean;
    isText?: boolean;
}) {
    const inner = (
        <div className={`h-full rounded-xl border bg-card p-4 transition ${href ? 'cursor-pointer hover:shadow-md' : ''} ${highlight ? 'border-orange-300 bg-orange-50' : 'border-border'}`}>
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
                    <p className={`mt-1 font-bold leading-tight text-foreground ${isText ? 'text-sm' : 'text-2xl'}`}>{value}</p>
                    {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
                </div>
                <div className="shrink-0 rounded-lg bg-muted p-2">{icon}</div>
            </div>
        </div>
    );

    return href ? <Link href={href}>{inner}</Link> : <div>{inner}</div>;
}

function QuickAction({
    href,
    label,
    color,
}: {
    href: string;
    label: string;
    color: 'primary' | 'indigo' | 'teal' | 'orange';
}) {
    const colorMap: Record<string, string> = {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
        indigo: 'bg-indigo-600 text-white hover:bg-indigo-700',
        teal: 'bg-teal-600 text-white hover:bg-teal-700',
        orange: 'bg-orange-500 text-white hover:bg-orange-600',
    };

    return (
        <Link href={href} className={`flex items-center justify-center rounded-lg px-3 py-3 text-center text-sm font-medium transition ${colorMap[color]}`}>
            {label}
        </Link>
    );
}

AdminDashboard.layout = { breadcrumbs };
