import { Head, Link, router } from '@inertiajs/react';
import { Plus, Pencil, Trash2, CheckCircle, XCircle } from 'lucide-react';
import * as BrandController from '@/actions/App/Http/Controllers/Admin/BrandController';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

type Brand = {
    id: number;
    name: string;
    slug: string;
    logo: string | null;
    is_active: boolean;
    products_count?: number;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard() },
    { title: 'Brand', href: BrandController.index().url },
];

export default function BrandsIndex({ brands }: { brands: Brand[] }) {
    function handleDelete(id: number, name: string) {
        if (!confirm(`Hapus brand "${name}"?`)) {
return;
}

        router.delete(BrandController.destroy(id).url);
    }

    return (
        <>
            <Head title="Brand" />
            <div className="flex flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Brand</h1>
                        <p className="text-sm text-muted-foreground">
                            {brands.length} brand
                        </p>
                    </div>
                    <Button asChild>
                        <Link href={BrandController.create().url}>
                            <Plus className="mr-1 size-4" />
                            Tambah Brand
                        </Link>
                    </Button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-sidebar-border bg-card">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-sidebar-border bg-muted/30 text-muted-foreground">
                                <th className="px-4 py-3 text-left font-medium">
                                    #
                                </th>
                                <th className="px-4 py-3 text-left font-medium">
                                    Logo
                                </th>
                                <th className="px-4 py-3 text-left font-medium">
                                    Nama
                                </th>
                                <th className="px-4 py-3 text-left font-medium">
                                    Produk
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
                            {brands.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="py-10 text-center text-muted-foreground"
                                    >
                                        Belum ada brand.
                                    </td>
                                </tr>
                            )}
                            {brands.map((brand, i) => (
                                <tr
                                    key={brand.id}
                                    className="border-b border-sidebar-border/50 last:border-0 hover:bg-muted/20"
                                >
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {i + 1}
                                    </td>
                                    <td className="px-4 py-3">
                                        {brand.logo ? (
                                            <img
                                                src={`/storage/${brand.logo}`}
                                                alt={brand.name}
                                                className="size-8 rounded object-contain"
                                            />
                                        ) : (
                                            <div className="size-8 rounded bg-muted" />
                                        )}
                                    </td>
                                    <td className="px-4 py-3 font-medium">
                                        {brand.name}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {brand.products_count ?? 0}
                                    </td>
                                    <td className="px-4 py-3">
                                        {brand.is_active ? (
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
                                                        BrandController.edit(
                                                            brand.id,
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
                                                    handleDelete(
                                                        brand.id,
                                                        brand.name,
                                                    )
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
            </div>
        </>
    );
}

BrandsIndex.layout = { breadcrumbs };
