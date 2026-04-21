import { Head, Link, useForm } from '@inertiajs/react';
import * as BrandController from '@/actions/App/Http/Controllers/Admin/BrandController';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Brand = {
    id: number;
    name: string;
    slug: string;
    logo: string | null;
    description: string | null;
    is_active: boolean;
};

export default function BrandForm({ brand }: { brand: Brand | null }) {
    const isEdit = !!brand;

    const {
        data,
        setData,
        post,
        put,
        errors,
        processing,
    } = useForm<{
        name: string;
        slug: string;
        logo: File | null;
        description: string;
        is_active: boolean;
    }>({
        name: brand?.name ?? '',
        slug: brand?.slug ?? '',
        logo: null,
        description: brand?.description ?? '',
        is_active: brand?.is_active ?? true,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const options = { forceFormData: true };

        if (isEdit) {
            put(BrandController.update(brand!.id).url, options);
        } else {
            post(BrandController.store().url, options);
        }
    }

    return (
        <>
            <Head
                title={isEdit ? `Edit Brand — ${brand!.name}` : 'Tambah Brand'}
            />
            <div className="mx-auto max-w-lg p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold">
                        {isEdit ? `Edit: ${brand!.name}` : 'Tambah Brand'}
                    </h1>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="flex flex-col gap-5"
                    encType="multipart/form-data"
                >
                    <div className="space-y-1.5">
                        <Label htmlFor="name">Nama *</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                        />
                        {errors.name && (
                            <p className="text-xs text-destructive">
                                {errors.name}
                            </p>
                        )}
                    </div>

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

                    <div className="space-y-1.5">
                        <Label htmlFor="logo">Logo</Label>
                        {isEdit && brand!.logo && (
                            <img
                                src={`/storage/${brand!.logo}`}
                                alt="Logo saat ini"
                                className="mb-2 h-16 w-auto rounded object-contain"
                            />
                        )}
                        <Input
                            id="logo"
                            type="file"
                            accept="image/jpg,image/jpeg,image/png,image/webp,image/svg+xml"
                            onChange={(e) =>
                                setData('logo', e.target.files?.[0] ?? null)
                            }
                        />
                        {errors.logo && (
                            <p className="text-xs text-destructive">
                                {errors.logo}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="description">Deskripsi</Label>
                        <textarea
                            id="description"
                            rows={3}
                            value={data.description}
                            onChange={(e) =>
                                setData('description', e.target.value)
                            }
                            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="is_active"
                            checked={data.is_active}
                            onCheckedChange={(v) => setData('is_active', !!v)}
                        />
                        <Label htmlFor="is_active">Aktif</Label>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <Button type="submit" disabled={processing}>
                            {processing
                                ? 'Menyimpan...'
                                : isEdit
                                  ? 'Perbarui'
                                  : 'Simpan'}
                        </Button>
                        <Button variant="ghost" asChild>
                            <Link href={BrandController.index().url}>
                                Batal
                            </Link>
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}
