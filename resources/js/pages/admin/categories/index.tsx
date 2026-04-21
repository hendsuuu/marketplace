import { Head, Link, router } from '@inertiajs/react';
import { Plus, Pencil, Trash2, CheckCircle, XCircle } from 'lucide-react';
import * as CategoryController from '@/actions/App/Http/Controllers/Admin/CategoryController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

type Category = {
    id: number;
    name: string;
    slug: string;
    type: string;
    parent_name: string | null;
    is_active: boolean;
    sort_order: number;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard() },
    { title: 'Kategori', href: CategoryController.index().url },
];

export default function CategoriesIndex({
    categories,
}: {
    categories: Category[];
}) {
    function handleDelete(id: number, name: string) {
        if (!confirm(`Hapus kategori "${name}"?`)) {
return;
}

        router.delete(CategoryController.destroy(id).url);
    }

    return (
        <>
            <Head title="Kategori" />
            <div className="flex flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Kategori</h1>
                        <p className="text-sm text-muted-foreground">
                            {categories.length} kategori
                        </p>
                    </div>
                    <Button asChild>
                        <Link href={CategoryController.create().url}>
                            <Plus className="mr-1 size-4" />
                            Tambah Kategori
                        </Link>
                    </Button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-xl border border-sidebar-border bg-card">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-sidebar-border bg-muted/30 text-muted-foreground">
                                <th className="px-4 py-3 text-left font-medium">
                                    #
                                </th>
                                <th className="px-4 py-3 text-left font-medium">
                                    Nama
                                </th>
                                <th className="px-4 py-3 text-left font-medium">
                                    Tipe
                                </th>
                                <th className="px-4 py-3 text-left font-medium">
                                    Parent
                                </th>
                                <th className="px-4 py-3 text-left font-medium">
                                    Urutan
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
                            {categories.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="py-10 text-center text-muted-foreground"
                                    >
                                        Belum ada kategori.
                                    </td>
                                </tr>
                            )}
                            {categories.map((cat, i) => (
                                <tr
                                    key={cat.id}
                                    className="border-b border-sidebar-border/50 last:border-0 hover:bg-muted/20"
                                >
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {i + 1}
                                    </td>
                                    <td className="px-4 py-3 font-medium">
                                        {cat.name}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge variant="outline">
                                            {cat.type}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {cat.parent_name ?? (
                                            <span className="italic">Root</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {cat.sort_order}
                                    </td>
                                    <td className="px-4 py-3">
                                        {cat.is_active ? (
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
                                                        CategoryController.edit(
                                                            cat.id,
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
                                                        cat.id,
                                                        cat.name,
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

CategoriesIndex.layout = { breadcrumbs };
