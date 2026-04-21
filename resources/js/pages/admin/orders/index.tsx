import { Head, router } from '@inertiajs/react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { BreadcrumbItem } from '@/types';

// ─── Types ───────────────────────────────────────────────────────────────────

type Order = {
    id: number;
    order_number: string;
    customer_name: string;
    customer_email: string;
    status: string;
    status_label: string;
    status_color: string;
    total: number;
    rental_start: string | null;
    rental_end: string | null;
    created_at: string;
};

type StatusOption = {
    value: string;
    label: string;
    color: string;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginatedOrders = {
    data: Order[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: PaginationLink[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Breadcrumbs ─────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Pesanan', href: '/admin/orders' },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function OrdersIndex({
    orders,
    statuses,
    filters,
}: {
    orders: PaginatedOrders;
    statuses: StatusOption[];
    filters: { search?: string; status?: string };
}) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    function applyFilters(overrides: { search?: string; status?: string }) {
        router.get(
            '/admin/orders',
            { search, status, ...overrides },
            { preserveScroll: true, replace: true },
        );
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        applyFilters({ search });
    }

    function handleStatusFilter(val: string) {
        setStatus(val);
        applyFilters({ status: val });
    }

    function updateStatus(order: Order, newStatus: string) {
        if (newStatus === order.status) {
return;
}

        setUpdatingId(order.id);
        router.patch(
            `/admin/orders/${order.id}/status`,
            { status: newStatus },
            {
                preserveScroll: true,
                onFinish: () => setUpdatingId(null),
            },
        );
    }

    return (
        <>
            <Head title="Manajemen Pesanan" />

            <div className="flex flex-col gap-6 p-4 sm:p-6">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="font-serif text-2xl font-semibold text-foreground">
                            Manajemen Pesanan
                        </h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            {orders.total} total pesanan
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-3 sm:flex-row">
                    <form onSubmit={handleSearch} className="flex flex-1 gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari no. pesanan atau nama pelanggan…"
                                className="pl-9"
                            />
                        </div>
                        <Button type="submit" variant="outline">
                            Cari
                        </Button>
                    </form>

                    <select
                        value={status}
                        onChange={(e) => handleStatusFilter(e.target.value)}
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
                    >
                        <option value="">Semua Status</option>
                        {statuses.map((s) => (
                            <option key={s.value} value={s.value}>
                                {s.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Table */}
                {orders.data.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
                        Tidak ada pesanan ditemukan.
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-border">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-border text-sm">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                                            No. Pesanan
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                                            Pelanggan
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                                            Status
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                                            Periode Sewa
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                                            Total
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                                            Tanggal
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                                            Ubah Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border bg-card">
                                    {orders.data.map((order) => (
                                        <tr
                                            key={order.id}
                                            className="hover:bg-muted/30"
                                        >
                                            <td className="px-4 py-3 font-mono text-xs text-foreground">
                                                {order.order_number}
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-foreground">
                                                    {order.customer_name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {order.customer_email}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE_COLORS[order.status_color] ?? 'bg-gray-100 text-gray-700'}`}
                                                >
                                                    {order.status_label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-muted-foreground">
                                                {order.rental_start &&
                                                order.rental_end
                                                    ? `${order.rental_start} – ${order.rental_end}`
                                                    : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-foreground">
                                                {formatIDR(order.total)}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-muted-foreground">
                                                {order.created_at}
                                            </td>
                                            <td className="px-4 py-3">
                                                <select
                                                    value={order.status}
                                                    disabled={
                                                        updatingId === order.id
                                                    }
                                                    onChange={(e) =>
                                                        updateStatus(
                                                            order,
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:ring-2 focus:ring-ring focus:outline-none disabled:opacity-50"
                                                >
                                                    {statuses.map((s) => (
                                                        <option
                                                            key={s.value}
                                                            value={s.value}
                                                        >
                                                            {s.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Pagination */}
                {orders.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <p>
                            Halaman {orders.current_page} dari{' '}
                            {orders.last_page}
                        </p>
                        <div className="flex gap-1">
                            {orders.links.map((link, i) => {
                                if (link.label === '&laquo; Previous') {
                                    return (
                                        <Button
                                            key={i}
                                            size="sm"
                                            variant="outline"
                                            disabled={!link.url}
                                            onClick={() =>
                                                link.url && router.get(link.url)
                                            }
                                        >
                                            <ChevronLeft className="size-4" />
                                        </Button>
                                    );
                                }

                                if (link.label === 'Next &raquo;') {
                                    return (
                                        <Button
                                            key={i}
                                            size="sm"
                                            variant="outline"
                                            disabled={!link.url}
                                            onClick={() =>
                                                link.url && router.get(link.url)
                                            }
                                        >
                                            <ChevronRight className="size-4" />
                                        </Button>
                                    );
                                }

                                return (
                                    <Button
                                        key={i}
                                        size="sm"
                                        variant={
                                            link.active ? 'default' : 'outline'
                                        }
                                        disabled={!link.url}
                                        onClick={() =>
                                            link.url && router.get(link.url)
                                        }
                                    >
                                        {link.label}
                                    </Button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

OrdersIndex.layout = { breadcrumbs };
