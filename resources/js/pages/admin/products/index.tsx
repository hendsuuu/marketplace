import { Head, Link, router } from '@inertiajs/react';
import { Plus, Pencil, Trash2, CheckCircle, XCircle, Star } from 'lucide-react';
import * as ProductController from '@/actions/App/Http/Controllers/Admin/ProductController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

type Product = {
    id: number;
    name: string;
    code: string;
    price: number;
    deposit_price: number | null;
    weight_grams: number;
    category: string | null;
    brand: string | null;
    variants_count: number;
    is_active: boolean;
    is_featured: boolean;
    image: string | null;
};

type Paginator<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard() },
    { title: 'Produk', href: ProductController.index().url },
];

function formatIDR(amount: number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(amount);
}

export default function ProductsIndex({
    products,
}: {
    products: Paginator<Product>;
}) {
    function handleDelete(id: number, name: string) {
        if (!confirm(`Hapus produk "${name}"?`)) {
return;
}

        router.delete(ProductController.destroy(id).url);
    }

    return (
        <>
            <Head title="Produk" />
            <div className="flex flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Produk</h1>
                        <p className="text-sm text-muted-foreground">
                            {products.total} produk
                        </p>
                    </div>
                    <Button asChild>
                        <Link href={ProductController.create().url}>
                            <Plus className="mr-1 size-4" />
                            Tambah Produk
                        </Link>
                    </Button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-xl border border-sidebar-border bg-card">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-sidebar-border bg-muted/30 text-muted-foreground">
                                <th className="px-4 py-3 text-left font-medium">
                                    Foto
                                </th>
                                <th className="px-4 py-3 text-left font-medium">
                                    Nama / Kode
                                </th>
                                <th className="px-4 py-3 text-left font-medium">
                                    Kategori
                                </th>
                                <th className="px-4 py-3 text-left font-medium">
                                    Harga Sewa
                                </th>
                                <th className="px-4 py-3 text-left font-medium">
                                    Varian
                                </th>
                                <th className="px-4 py-3 text-left font-medium">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    Aksi
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.data.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="py-10 text-center text-muted-foreground"
                                    >
                                        Belum ada produk.
                                    </td>
                                </tr>
                            )}
                            {products.data.map((p) => (
                                <tr
                                    key={p.id}
                                    className="border-b border-sidebar-border/50 last:border-0 hover:bg-muted/20"
                                >
                                    <td className="px-4 py-3">
                                        {p.image ? (
                                            <img
                                                src={`/storage/${p.image}`}
                                                alt={p.name}
                                                className="size-12 rounded-lg object-cover"
                                            />
                                        ) : (
                                            <div className="size-12 rounded-lg bg-muted" />
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="leading-tight font-medium">
                                            {p.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {p.code}
                                        </p>
                                        {p.is_featured && (
                                            <span className="mt-0.5 inline-flex items-center gap-0.5 text-xs text-amber-500">
                                                <Star className="size-3 fill-amber-400" />{' '}
                                                Unggulan
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        {p.category && (
                                            <Badge variant="outline">
                                                {p.category}
                                            </Badge>
                                        )}
                                        {p.brand && (
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                {p.brand}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <p>{formatIDR(p.price)}</p>
                                        {p.deposit_price && (
                                            <p className="text-xs text-muted-foreground">
                                                Deposit:{' '}
                                                {formatIDR(p.deposit_price)}
                                            </p>
                                        )}
                                        <p className="text-xs text-muted-foreground">Berat: {formatWeight(p.weight_grams)}</p>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {p.variants_count}
                                    </td>
                                    <td className="px-4 py-3">
                                        {p.is_active ? (
                                            <span className="flex items-center gap-1 text-green-600">
                                                <CheckCircle className="size-4" />{' '}
                                                Aktif
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-muted-foreground">
                                                <XCircle className="size-4" />{' '}
                                                Nonaktif
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                asChild
                                            >
                                                <Link
                                                    href={
                                                        ProductController.edit(
                                                            p.id,
                                                        ).url
                                                    }
                                                >
                                                    <Pencil className="size-4" />
                                                </Link>
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() =>
                                                    handleDelete(p.id, p.name)
                                                }
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {products.last_page > 1 && (
                    <div className="flex flex-wrap items-center justify-center gap-1">
                        {products.links.map((link, i) => (
                            <Button
                                key={i}
                                size="sm"
                                variant={link.active ? 'default' : 'ghost'}
                                disabled={!link.url}
                                onClick={() =>
                                    link.url && router.visit(link.url)
                                }
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

ProductsIndex.layout = { breadcrumbs };

function formatWeight(weight: number) {
    if (weight >= 1000) {
        return `${(weight / 1000).toFixed(weight % 1000 === 0 ? 0 : 1)} kg`;
    }

    return `${weight} gr`;
}
