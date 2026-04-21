import { Head, Link, useForm } from '@inertiajs/react';
import * as CategoryController from '@/actions/App/Http/Controllers/Admin/CategoryController';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Category = {
    id: number;
    name: string;
    slug: string;
    type: string;
    parent_id: number | null;
    icon: string | null;
    description: string | null;
    sort_order: number;
    is_active: boolean;
};

type Parent = { id: number; name: string };

const CATEGORY_TYPES = [
    { value: 'dress', label: 'Dress' },
    { value: 'clutch', label: 'Clutch' },
    { value: 'accessories', label: 'Accessories' },
    { value: 'kids', label: 'Kids' },
    { value: 'winter_coat', label: 'Winter Coat' },
    { value: 'other', label: 'Lainnya' },
];

export default function CategoryForm({
    category,
    parents,
}: {
    category: Category | null;
    parents: Parent[];
}) {
    const isEdit = !!category;

    const { data, setData, post, put, errors, processing } = useForm({
        name: category?.name ?? '',
        slug: category?.slug ?? '',
        parent_id: category?.parent_id ?? '',
        type: category?.type ?? 'dress',
        icon: category?.icon ?? '',
        description: category?.description ?? '',
        sort_order: category?.sort_order ?? 0,
        is_active: category?.is_active ?? true,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (isEdit) {
            put(CategoryController.update(category!.id).url);
        } else {
            post(CategoryController.store().url);
        }
    }

    return (
        <>
            <Head
                title={
                    isEdit
                        ? `Edit Kategori — ${category!.name}`
                        : 'Tambah Kategori'
                }
            />
            <div className="mx-auto max-w-2xl p-6">
                {/* Breadcrumbs not stored in layout because they depend on runtime data */}
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold">
                        {isEdit ? `Edit: ${category!.name}` : 'Tambah Kategori'}
                    </h1>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    {/* Name */}
                    <div className="space-y-1.5">
                        <Label htmlFor="name">Nama *</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="Nama kategori"
                        />
                        {errors.name && (
                            <p className="text-xs text-destructive">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    {/* Slug */}
                    <div className="space-y-1.5">
                        <Label htmlFor="slug">Slug</Label>
                        <Input
                            id="slug"
                            value={data.slug}
                            onChange={(e) => setData('slug', e.target.value)}
                            placeholder="auto-generate dari nama"
                        />
                        {errors.slug && (
                            <p className="text-xs text-destructive">
                                {errors.slug}
                            </p>
                        )}
                    </div>

                    {/* Type */}
                    <div className="space-y-1.5">
                        <Label htmlFor="type">Tipe *</Label>
                        <select
                            id="type"
                            value={data.type}
                            onChange={(e) => setData('type', e.target.value)}
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                        >
                            {CATEGORY_TYPES.map((t) => (
                                <option key={t.value} value={t.value}>
                                    {t.label}
                                </option>
                            ))}
                        </select>
                        {errors.type && (
                            <p className="text-xs text-destructive">
                                {errors.type}
                            </p>
                        )}
                    </div>

                    {/* Parent */}
                    <div className="space-y-1.5">
                        <Label htmlFor="parent_id">Parent Kategori</Label>
                        <select
                            id="parent_id"
                            value={data.parent_id}
                            onChange={(e) =>
                                setData(
                                    'parent_id',
                                    e.target.value
                                        ? Number(e.target.value)
                                        : '',
                                )
                            }
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                        >
                            <option value="">— Tidak ada (root) —</option>
                            {parents.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Sort Order */}
                    <div className="space-y-1.5">
                        <Label htmlFor="sort_order">Urutan</Label>
                        <Input
                            id="sort_order"
                            type="number"
                            min={0}
                            value={data.sort_order}
                            onChange={(e) =>
                                setData('sort_order', Number(e.target.value))
                            }
                        />
                    </div>

                    {/* Is Active */}
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="is_active"
                            checked={data.is_active}
                            onCheckedChange={(checked) =>
                                setData('is_active', !!checked)
                            }
                        />
                        <Label htmlFor="is_active">Aktif</Label>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-2">
                        <Button type="submit" disabled={processing}>
                            {processing
                                ? 'Menyimpan...'
                                : isEdit
                                  ? 'Perbarui'
                                  : 'Simpan'}
                        </Button>
                        <Button variant="ghost" asChild>
                            <Link href={CategoryController.index().url}>
                                Batal
                            </Link>
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}
