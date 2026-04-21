import { Head, Link, router, useForm } from '@inertiajs/react';
import { Plus, Star, X } from 'lucide-react';
import { useState } from 'react';
import * as ProductController from '@/actions/App/Http/Controllers/Admin/ProductController';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// ─── Types ───────────────────────────────────────────────────────────────────

type Size = { id: number; name: string; label: string };
type CategoryOption = { id: number; name: string; type: string };
type BrandOption = { id: number; name: string };

type VariantData = {
    id?: number;
    size_id: number | '';
    color: string;
    color_hex: string;
    additional_price: number | '';
    sku: string;
    is_available: boolean;
};

type ExistingImage = {
    id: number;
    image_path: string;
    is_primary: boolean;
};

type Product = {
    id: number;
    name: string;
    slug: string;
    code: string;
    category_id: number;
    brand_id: number | null;
    description: string;
    price: number;
    deposit_price: number | '';
    weight_grams: number | '';
    is_hijab_friendly: boolean;
    is_maternity_friendly: boolean;
    is_big_size_friendly: boolean;
    is_active: boolean;
    is_featured: boolean;
    requires_dress_or_clutch: boolean;
    variants: (VariantData & { id: number; size: Size | null })[];
    images: ExistingImage[];
};

// ─── Form Page ───────────────────────────────────────────────────────────────

export default function ProductForm({
    product,
    categories,
    brands,
    sizes,
}: {
    product: Product | null;
    categories: CategoryOption[];
    brands: BrandOption[];
    sizes: Size[];
}) {
    const isEdit = !!product;

    const { data, setData, post, put, errors, processing } = useForm<{
        name: string;
        slug: string;
        code: string;
        category_id: number | '';
        brand_id: number | '';
        description: string;
        price: number | '';
        deposit_price: number | '';
        weight_grams: number | '';
        is_hijab_friendly: boolean;
        is_maternity_friendly: boolean;
        is_big_size_friendly: boolean;
        is_active: boolean;
        is_featured: boolean;
        requires_dress_or_clutch: boolean;
        variants: VariantData[];
        images: File[];
        primary_image_index: number;
    }>({
        name: product?.name ?? '',
        slug: product?.slug ?? '',
        code: product?.code ?? '',
        category_id: product?.category_id ?? '',
        brand_id: product?.brand_id ?? '',
        description: product?.description ?? '',
        price: product?.price ?? '',
        deposit_price: product?.deposit_price ?? '',
        weight_grams: product?.weight_grams ?? 1000,
        is_hijab_friendly: product?.is_hijab_friendly ?? false,
        is_maternity_friendly: product?.is_maternity_friendly ?? false,
        is_big_size_friendly: product?.is_big_size_friendly ?? false,
        is_active: product?.is_active ?? true,
        is_featured: product?.is_featured ?? false,
        requires_dress_or_clutch: product?.requires_dress_or_clutch ?? false,
        variants: product?.variants?.map((v) => ({
            id: v.id,
            size_id: v.size_id,
            color: v.color,
            color_hex: v.color_hex,
            additional_price: v.additional_price,
            sku: v.sku,
            is_available: v.is_available,
        })) ?? [emptyVariant()],
        images: [],
        primary_image_index: 0,
    });

    // Existing images (for edit mode)
    const [existingImages, setExistingImages] = useState<ExistingImage[]>(
        product?.images ?? [],
    );

    function emptyVariant(): VariantData {
        return {
            size_id: '',
            color: '',
            color_hex: '#000000',
            additional_price: '',
            sku: '',
            is_available: true,
        };
    }

    function addVariant() {
        setData('variants', [...data.variants, emptyVariant()]);
    }

    function removeVariant(index: number) {
        setData(
            'variants',
            data.variants.filter((_, i) => i !== index),
        );
    }

    function updateVariant<K extends keyof VariantData>(
        index: number,
        key: K,
        value: VariantData[K],
    ) {
        const updated = [...data.variants];
        updated[index] = { ...updated[index], [key]: value };
        setData('variants', updated);
    }

    function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files ?? []);
        const maxNew = 3 - existingImages.length;
        setData('images', files.slice(0, maxNew));
    }

    function handleDeleteExistingImage(imageId: number) {
        if (!product) {
return;
}

        if (!confirm('Hapus gambar ini?')) {
return;
}

        router.delete(
            ProductController.destroyImage({
                product: product.id,
                image: imageId,
            }).url,
            {
                preserveScroll: true,
                onSuccess: () =>
                    setExistingImages((imgs) =>
                        imgs.filter((img) => img.id !== imageId),
                    ),
            },
        );
    }

    function handleSetPrimary(imageId: number) {
        if (!product) {
return;
}

        router.patch(
            ProductController.setPrimaryImage({
                product: product.id,
                image: imageId,
            }).url,
            {},
            {
                preserveScroll: true,
                onSuccess: () =>
                    setExistingImages((imgs) =>
                        imgs.map((img) => ({
                            ...img,
                            is_primary: img.id === imageId,
                        })),
                    ),
            },
        );
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const opts = { forceFormData: true };

        if (isEdit) {
            put(ProductController.update(product!.id).url, opts);
        } else {
            post(ProductController.store().url, opts);
        }
    }

    return (
        <>
            <Head
                title={isEdit ? `Edit — ${product!.name}` : 'Tambah Produk'}
            />
            <div className="mx-auto max-w-3xl p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold">
                        {isEdit ? `Edit: ${product!.name}` : 'Tambah Produk'}
                    </h1>
                </div>

                <form
                    onSubmit={handleSubmit}
                    encType="multipart/form-data"
                    className="flex flex-col gap-8"
                >
                    {/* ── Basic Info ───────────────────────────────────── */}
                    <Section title="Informasi Dasar">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Nama Produk *" error={errors.name}>
                                <Input
                                    value={data.name}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                />
                            </Field>
                            <Field label="Kode Produk *" error={errors.code}>
                                <Input
                                    value={data.code}
                                    onChange={(e) =>
                                        setData('code', e.target.value)
                                    }
                                />
                            </Field>
                            <Field label="Slug" error={errors.slug}>
                                <Input
                                    value={data.slug}
                                    onChange={(e) =>
                                        setData('slug', e.target.value)
                                    }
                                    placeholder="auto-generate dari nama"
                                />
                            </Field>
                            <Field
                                label="Kategori *"
                                error={errors.category_id}
                            >
                                <select
                                    value={data.category_id}
                                    onChange={(e) =>
                                        setData(
                                            'category_id',
                                            e.target.value
                                                ? Number(e.target.value)
                                                : '',
                                        )
                                    }
                                    className="select-field"
                                >
                                    <option value="">— Pilih Kategori —</option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Brand" error={errors.brand_id}>
                                <select
                                    value={data.brand_id}
                                    onChange={(e) =>
                                        setData(
                                            'brand_id',
                                            e.target.value
                                                ? Number(e.target.value)
                                                : '',
                                        )
                                    }
                                    className="select-field"
                                >
                                    <option value="">— Tanpa Brand —</option>
                                    {brands.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.name}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                        </div>

                        <Field
                            label="Deskripsi"
                            error={errors.description}
                            className="mt-2"
                        >
                            <textarea
                                rows={4}
                                value={data.description}
                                onChange={(e) =>
                                    setData('description', e.target.value)
                                }
                                className="textarea-field"
                            />
                        </Field>
                    </Section>

                    {/* ── Pricing ──────────────────────────────────────── */}
                    <Section title="Harga">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field
                                label="Harga Sewa (Rp) *"
                                error={errors.price}
                            >
                                <Input
                                    type="number"
                                    min={0}
                                    value={data.price}
                                    onChange={(e) =>
                                        setData(
                                            'price',
                                            e.target.value
                                                ? Number(e.target.value)
                                                : '',
                                        )
                                    }
                                />
                            </Field>
                            <Field
                                label="Deposit (Rp)"
                                error={errors.deposit_price}
                            >
                                <Input
                                    type="number"
                                    min={0}
                                    value={data.deposit_price}
                                    onChange={(e) =>
                                        setData(
                                            'deposit_price',
                                            e.target.value
                                                ? Number(e.target.value)
                                                : '',
                                        )
                                    }
                                />
                            </Field>
                            <Field
                                label="Berat Produk (gram) *"
                                error={errors.weight_grams}
                            >
                                <Input
                                    type="number"
                                    min={1}
                                    value={data.weight_grams}
                                    onChange={(e) =>
                                        setData(
                                            'weight_grams',
                                            e.target.value
                                                ? Number(e.target.value)
                                                : '',
                                        )
                                    }
                                />
                            </Field>
                        </div>
                    </Section>

                    {/* ── Flags ────────────────────────────────────────── */}
                    <Section title="Atribut Produk">
                        <div className="flex flex-wrap gap-4">
                            {(
                                [
                                    ['is_hijab_friendly', 'Hijab Friendly'],
                                    [
                                        'is_maternity_friendly',
                                        'Maternity Friendly',
                                    ],
                                    [
                                        'is_big_size_friendly',
                                        'Big Size Friendly',
                                    ],
                                    [
                                        'requires_dress_or_clutch',
                                        'Butuh Dress/Clutch',
                                    ],
                                    ['is_featured', 'Unggulan'],
                                    ['is_active', 'Aktif'],
                                ] as [keyof typeof data, string][]
                            ).map(([key, label]) => (
                                <label
                                    key={key}
                                    className="flex cursor-pointer items-center gap-2 text-sm"
                                >
                                    <Checkbox
                                        checked={data[key] as boolean}
                                        onCheckedChange={(v) =>
                                            setData(key, !!v)
                                        }
                                    />
                                    {label}
                                </label>
                            ))}
                        </div>
                    </Section>

                    {/* ── Images ───────────────────────────────────────── */}
                    <Section title="Foto Produk (maks. 3)">
                        {/* Existing images in edit mode */}
                        {existingImages.length > 0 && (
                            <div className="mb-3 flex flex-wrap gap-3">
                                {existingImages.map((img) => (
                                    <div key={img.id} className="relative">
                                        <img
                                            src={`/storage/${img.image_path}`}
                                            alt="product"
                                            className="size-24 rounded-lg object-cover"
                                        />
                                        {img.is_primary && (
                                            <span className="absolute top-1 left-1 rounded bg-primary px-1 text-[10px] text-white">
                                                Utama
                                            </span>
                                        )}
                                        <div className="absolute top-1 right-1 flex gap-1">
                                            {!img.is_primary && (
                                                <button
                                                    type="button"
                                                    title="Jadikan utama"
                                                    onClick={() =>
                                                        handleSetPrimary(img.id)
                                                    }
                                                    className="rounded bg-white/80 p-0.5 text-amber-500 hover:bg-white"
                                                >
                                                    <Star className="size-3.5" />
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                title="Hapus"
                                                onClick={() =>
                                                    handleDeleteExistingImage(
                                                        img.id,
                                                    )
                                                }
                                                className="rounded bg-white/80 p-0.5 text-destructive hover:bg-white"
                                            >
                                                <X className="size-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {existingImages.length < 3 && (
                            <>
                                <Input
                                    type="file"
                                    multiple
                                    accept="image/jpg,image/jpeg,image/png,image/webp"
                                    onChange={handleImageChange}
                                />
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Pilih hingga {3 - existingImages.length}{' '}
                                    foto (JPG/PNG/WebP, maks. 3MB/foto)
                                </p>
                                {errors.images && (
                                    <p className="text-xs text-destructive">
                                        {errors.images}
                                    </p>
                                )}

                                {!isEdit && data.images.length > 1 && (
                                    <div className="mt-2 space-y-1">
                                        <Label className="text-xs">
                                            Foto Utama
                                        </Label>
                                        <div className="flex gap-2">
                                            {data.images.map((_, i) => (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    onClick={() =>
                                                        setData(
                                                            'primary_image_index',
                                                            i,
                                                        )
                                                    }
                                                    className={`rounded border px-2 py-1 text-xs ${data.primary_image_index === i ? 'border-primary bg-primary/10 font-semibold' : 'border-border'}`}
                                                >
                                                    Foto {i + 1}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </Section>

                    {/* ── Variants ─────────────────────────────────────── */}
                    <Section title="Varian (Ukuran & Warna)">
                        <div className="flex flex-col gap-3">
                            {data.variants.map((variant, i) => (
                                <div
                                    key={i}
                                    className="relative grid gap-3 rounded-lg border border-sidebar-border p-4 sm:grid-cols-3"
                                >
                                    <button
                                        type="button"
                                        onClick={() => removeVariant(i)}
                                        disabled={data.variants.length === 1}
                                        className="absolute top-2 right-2 text-muted-foreground hover:text-destructive disabled:opacity-30"
                                    >
                                        <X className="size-4" />
                                    </button>

                                    <Field
                                        label="Ukuran"
                                        error={
                                            (errors as Record<string, string>)[
                                                `variants.${i}.size_id`
                                            ]
                                        }
                                    >
                                        <select
                                            value={variant.size_id}
                                            onChange={(e) =>
                                                updateVariant(
                                                    i,
                                                    'size_id',
                                                    e.target.value
                                                        ? Number(e.target.value)
                                                        : '',
                                                )
                                            }
                                            className="select-field"
                                        >
                                            <option value="">— Pilih —</option>
                                            {sizes.map((s) => (
                                                <option key={s.id} value={s.id}>
                                                    {s.name} ({s.label})
                                                </option>
                                            ))}
                                        </select>
                                    </Field>

                                    <Field
                                        label="Warna"
                                        error={
                                            (errors as Record<string, string>)[
                                                `variants.${i}.color`
                                            ]
                                        }
                                    >
                                        <div className="flex gap-2">
                                            <Input
                                                value={variant.color}
                                                onChange={(e) =>
                                                    updateVariant(
                                                        i,
                                                        'color',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Nama warna"
                                                className="flex-1"
                                            />
                                            <input
                                                type="color"
                                                value={
                                                    variant.color_hex ||
                                                    '#000000'
                                                }
                                                onChange={(e) =>
                                                    updateVariant(
                                                        i,
                                                        'color_hex',
                                                        e.target.value,
                                                    )
                                                }
                                                className="h-9 w-10 cursor-pointer rounded border border-input p-0.5"
                                            />
                                        </div>
                                    </Field>

                                    <Field
                                        label="SKU *"
                                        error={
                                            (errors as Record<string, string>)[
                                                `variants.${i}.sku`
                                            ]
                                        }
                                    >
                                        <Input
                                            value={variant.sku}
                                            onChange={(e) =>
                                                updateVariant(
                                                    i,
                                                    'sku',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="e.g. DRSS-RED-M"
                                        />
                                    </Field>

                                    <Field label="Harga Tambahan (Rp)">
                                        <Input
                                            type="number"
                                            min={0}
                                            value={variant.additional_price}
                                            onChange={(e) =>
                                                updateVariant(
                                                    i,
                                                    'additional_price',
                                                    e.target.value
                                                        ? Number(e.target.value)
                                                        : '',
                                                )
                                            }
                                            placeholder="0"
                                        />
                                    </Field>

                                    <div className="flex items-end">
                                        <label className="flex cursor-pointer items-center gap-2 text-sm">
                                            <Checkbox
                                                checked={variant.is_available}
                                                onCheckedChange={(v) =>
                                                    updateVariant(
                                                        i,
                                                        'is_available',
                                                        !!v,
                                                    )
                                                }
                                            />
                                            Tersedia
                                        </label>
                                    </div>
                                </div>
                            ))}

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addVariant}
                            >
                                <Plus className="mr-1 size-4" />
                                Tambah Varian
                            </Button>
                        </div>
                    </Section>

                    {/* ── Submit ───────────────────────────────────────── */}
                    <div className="flex items-center gap-3 border-t border-sidebar-border pt-4">
                        <Button type="submit" disabled={processing}>
                            {processing
                                ? 'Menyimpan...'
                                : isEdit
                                  ? 'Perbarui Produk'
                                  : 'Simpan Produk'}
                        </Button>
                        <Button variant="ghost" asChild>
                            <Link href={ProductController.index().url}>
                                Batal
                            </Link>
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function Section({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <h2 className="mb-3 text-base font-semibold text-foreground">
                {title}
            </h2>
            {children}
        </div>
    );
}

function Field({
    label,
    error,
    children,
    className,
}: {
    label: string;
    error?: string;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={`space-y-1.5 ${className ?? ''}`}>
            <Label className="text-sm font-medium">{label}</Label>
            {children}
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}
