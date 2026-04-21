import { Head, Link, router, usePage } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Heart, Info, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import LoginRequiredModal from '@/components/login-required-modal';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { resolveMediaUrl } from '@/lib/media';
import { catalog } from '@/routes';
import type { SharedData } from '@/types';

type ProductImage = { id: number; image_path: string; is_primary: boolean };

type Variant = {
    id: number;
    size_name: string | null;
    size_label: string | null;
    color: string | null;
    color_hex: string | null;
    additional_price: number;
    sku: string;
    is_available: boolean;
};

type ProductDetail = {
    id: number;
    name: string;
    slug: string;
    code: string;
    description: string | null;
    price: number;
    deposit_price: number | null;
    is_hijab_friendly: boolean;
    is_maternity_friendly: boolean;
    is_big_size_friendly: boolean;
    requires_dress_or_clutch: boolean;
    category_name: string | null;
    brand_name: string | null;
    images: ProductImage[];
    variants: Variant[];
};

type RelatedProduct = {
    id: number;
    name: string;
    slug: string;
    code: string;
    price: number;
    deposit_price: number | null;
    image: string | null;
};

export default function ProductShow({
    product,
    related,
    in_wishlist,
}: {
    product: ProductDetail;
    related: RelatedProduct[];
    in_wishlist: boolean;
}) {
    const { auth, flash, errors } = usePage<SharedData & { errors: Record<string, string | undefined> }>().props;
    const defaultVariant = product.variants.find((variant) => variant.is_available) ?? null;

    const [currentImageIdx, setCurrentImageIdx] = useState(0);
    const [selectedSize, setSelectedSize] = useState<string | null>(defaultVariant?.size_name ?? null);
    const [selectedColor, setSelectedColor] = useState<string | null>(defaultVariant?.color ?? null);
    const [wishlist, setWishlist] = useState(in_wishlist);
    const [loginModalOpen, setLoginModalOpen] = useState(false);
    const [rentalStartDate, setRentalStartDate] = useState(getDefaultDate(1));
    const [rentalEndDate, setRentalEndDate] = useState(getDefaultDate(4));
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [clientCartNotice, setClientCartNotice] = useState<string | null>(null);

    const uniqueSizes = [...new Map(product.variants.filter((variant) => variant.size_name).map((variant) => [variant.size_name, variant])).values()];
    const uniqueColors = [...new Map(product.variants.filter((variant) => variant.color).map((variant) => [variant.color, variant])).values()];

    const selectedVariant =
        product.variants.find(
            (variant) =>
                variant.is_available &&
                (selectedSize ? variant.size_name === selectedSize : true) &&
                (selectedColor ? variant.color === selectedColor : true),
        ) ?? defaultVariant;

    const totalPrice = product.price + (selectedVariant?.additional_price ?? 0);
    const currentImage = product.images[currentImageIdx];
    const currentImageUrl = resolveMediaUrl(currentImage?.image_path);
    const addToCartMessage =
        clientCartNotice ??
        errors.product_variant_id ??
        errors.rental_start_date ??
        errors.rental_end_date ??
        flash.error ??
        null;

    function selectSize(sizeName: string | null) {
        const matchingVariant =
            product.variants.find(
                (variant) =>
                    variant.is_available &&
                    variant.size_name === sizeName &&
                    (selectedColor ? variant.color === selectedColor : true),
            ) ??
            product.variants.find(
                (variant) => variant.is_available && variant.size_name === sizeName,
            ) ??
            null;

        setSelectedSize(sizeName);
        setSelectedColor(matchingVariant?.color ?? null);
        setClientCartNotice(null);
    }

    function selectColor(colorName: string | null) {
        const matchingVariant =
            product.variants.find(
                (variant) =>
                    variant.is_available &&
                    variant.color === colorName &&
                    (selectedSize ? variant.size_name === selectedSize : true),
            ) ??
            product.variants.find(
                (variant) => variant.is_available && variant.color === colorName,
            ) ??
            null;

        setSelectedColor(colorName);
        setSelectedSize(matchingVariant?.size_name ?? null);
        setClientCartNotice(null);
    }

    function toggleWishlist() {
        if (!auth.user) {
            setLoginModalOpen(true);

            return;
        }

        router.post(
            '/wishlist/toggle',
            { product_id: product.id },
            {
                preserveScroll: true,
                onSuccess: () => setWishlist((current) => !current),
            },
        );
    }

    function addToCart() {
        if (!auth.user) {
            setLoginModalOpen(true);

            return;
        }

        if (!selectedVariant) {
            setClientCartNotice('Pilih kombinasi ukuran dan warna yang tersedia terlebih dahulu.');

            return;
        }

        setClientCartNotice(null);
        setIsAddingToCart(true);

        router.post(
            '/cart',
            {
                product_variant_id: selectedVariant.id,
                rental_start_date: rentalStartDate,
                rental_end_date: rentalEndDate,
            },
            {
                preserveScroll: true,
                onError: (formErrors) => {
                    setClientCartNotice(
                        formErrors.product_variant_id ??
                            formErrors.rental_start_date ??
                            formErrors.rental_end_date ??
                            'Produk belum bisa dimasukkan ke cart. Cek pilihan dan tanggal sewanya.',
                    );
                },
                onFinish: () => setIsAddingToCart(false),
            },
        );
    }

    return (
        <>
            <Head title={product.name} />

            <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
                <nav className="mb-6 flex items-center gap-2 text-sm text-[#6f5948]">
                    <Link href={catalog()}>Katalog</Link>
                    <span>/</span>
                    {product.category_name && (
                        <>
                            <span>{product.category_name}</span>
                            <span>/</span>
                        </>
                    )}
                    <span className="text-foreground">{product.name}</span>
                </nav>

                <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="flex flex-col gap-4">
                        <div className="relative aspect-[3/4] overflow-hidden rounded-[1.25rem] bg-secondary/40">
                            {currentImageUrl ? (
                                <img src={currentImageUrl} alt={product.name} className="size-full object-cover" />
                            ) : (
                                <div className="size-full bg-secondary/60" />
                            )}

                            {product.images.length > 1 && (
                                <>
                                    <button
                                        onClick={() => setCurrentImageIdx((current) => (current === 0 ? product.images.length - 1 : current - 1))}
                                        className="absolute left-4 top-1/2 rounded-full bg-white/90 p-2 shadow"
                                    >
                                        <ChevronLeft className="size-5" />
                                    </button>
                                    <button
                                        onClick={() => setCurrentImageIdx((current) => (current === product.images.length - 1 ? 0 : current + 1))}
                                        className="absolute right-4 top-1/2 rounded-full bg-white/90 p-2 shadow"
                                    >
                                        <ChevronRight className="size-5" />
                                    </button>
                                </>
                            )}
                        </div>

                        {product.images.length > 1 && (
                            <div className="flex gap-3 overflow-x-auto pb-1">
                                {product.images.map((image, index) => {
                                    const imageUrl = resolveMediaUrl(image.image_path);

                                    return (
                                        <button
                                            key={image.id}
                                            onClick={() => setCurrentImageIdx(index)}
                                            className={`overflow-hidden rounded-[0.9rem] border-2 ${index === currentImageIdx ? 'border-primary' : 'border-transparent'}`}
                                        >
                                            {imageUrl ? <img src={imageUrl} alt="" className="h-20 w-16 object-cover" /> : <div className="h-20 w-16 bg-secondary" />}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-5">
                        {product.brand_name && <p className="text-xs uppercase tracking-[0.35em] text-[#7a634f]">{product.brand_name}</p>}
                        <div>
                            <h1 className="text-3xl font-semibold leading-tight">{product.name}</h1>
                            <p className="mt-2 text-sm text-[#6a5140]">Kode produk: {product.code}</p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {product.is_hijab_friendly && <Badge>Hijab Friendly</Badge>}
                            {product.is_maternity_friendly && <Badge variant="secondary">Bumil Friendly</Badge>}
                            {product.is_big_size_friendly && <Badge variant="outline">Big Size</Badge>}
                        </div>

                        <div className="rounded-[1.25rem] border border-border bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(247,239,230,0.92))] p-5">
                            <p className="text-sm text-[#6a5140]">Harga sewa</p>
                            <p className="mt-1 text-4xl font-semibold text-primary">{formatIDR(totalPrice)}</p>
                            <p className="mt-2 text-sm text-[#6a5140]">
                                Deposit {formatIDR(product.deposit_price ?? 0)} akan dikembalikan setelah item selesai dan terverifikasi.
                            </p>
                        </div>

                        {uniqueSizes.length > 0 && (
                            <div>
                                <p className="mb-2 text-sm font-semibold">Pilih ukuran</p>
                                <div className="flex flex-wrap gap-2">
                                    {uniqueSizes.map((variant) => {
                                        const available = product.variants.some(
                                            (item) => item.size_name === variant.size_name && item.is_available && (selectedColor ? item.color === selectedColor : true),
                                        );

                                        return (
                                            <button
                                                key={variant.size_name}
                                                disabled={!available}
                                                onClick={() => selectSize(variant.size_name)}
                                                className={`rounded-full border px-3 py-1.5 text-sm transition disabled:opacity-40 ${selectedSize === variant.size_name ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-white text-[#5a4030] hover:border-primary hover:text-primary'}`}
                                            >
                                                {variant.size_name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {uniqueColors.length > 0 && (
                            <div>
                                <p className="mb-2 text-sm font-semibold">Pilih warna</p>
                                <div className="flex flex-wrap gap-2">
                                    {uniqueColors.map((variant) => {
                                        const available = product.variants.some(
                                            (item) => item.color === variant.color && item.is_available && (selectedSize ? item.size_name === selectedSize : true),
                                        );

                                        return (
                                            <button
                                                key={variant.color}
                                                disabled={!available}
                                                onClick={() => selectColor(variant.color)}
                                                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition disabled:opacity-40 ${selectedColor === variant.color ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-white text-[#5a4030] hover:border-primary hover:text-primary'}`}
                                            >
                                                {variant.color_hex && <span className="size-3 rounded-full border border-black/10" style={{ backgroundColor: variant.color_hex }} />}
                                                {variant.color}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="grid gap-4 rounded-[1.25rem] border border-border bg-white p-5 sm:grid-cols-2">
                            <label className="grid gap-2 text-sm">
                                <span className="font-semibold">Mulai sewa</span>
                                <input type="date" value={rentalStartDate} onChange={(event) => setRentalStartDate(event.target.value)} className="select-field" />
                            </label>
                            <label className="grid gap-2 text-sm">
                                <span className="font-semibold">Selesai sewa</span>
                                <input type="date" value={rentalEndDate} onChange={(event) => setRentalEndDate(event.target.value)} className="select-field" />
                            </label>
                        </div>

                        {product.requires_dress_or_clutch && (
                            <div className="flex items-start gap-2 rounded-[1rem] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                                <Info className="mt-0.5 size-4 shrink-0" />
                                Produk aksesori ini hanya bisa disewa jika cart Anda sudah berisi dress atau clutch.
                            </div>
                        )}

                        <div className="flex gap-3">
                            <Button className="flex-1" type="button" disabled={!selectedVariant || isAddingToCart} onClick={addToCart}>
                                <ShoppingBag className="size-4" />
                                {isAddingToCart ? 'Memproses...' : 'Tambah ke Cart'}
                            </Button>
                            <Button variant="outline" size="icon" type="button" onClick={toggleWishlist} title={wishlist ? 'Hapus dari wishlist' : 'Simpan ke wishlist'}>
                                <Heart className={`size-5 ${wishlist ? 'fill-primary text-primary' : ''}`} />
                            </Button>
                        </div>

                        {addToCartMessage && (
                            <Alert variant="destructive" className="border border-destructive/20 bg-destructive/5">
                                <Info className="size-4" />
                                <AlertTitle>Tambah ke cart belum berhasil</AlertTitle>
                                <AlertDescription className="text-destructive/90">{addToCartMessage}</AlertDescription>
                            </Alert>
                        )}

                        {!addToCartMessage && !selectedVariant && (
                            <Alert className="border border-amber-200 bg-amber-50 text-amber-900">
                                <Info className="size-4" />
                                <AlertTitle>Pilih varian yang tersedia</AlertTitle>
                                <AlertDescription className="text-amber-900/80">
                                    Kombinasi ukuran dan warna ini belum tersedia. Pilih opsi lain untuk melanjutkan.
                                </AlertDescription>
                            </Alert>
                        )}

                        {product.description && (
                            <div className="rounded-[1.25rem] border border-border bg-white p-5">
                                <p className="mb-2 text-sm font-semibold">Deskripsi</p>
                                <p className="whitespace-pre-line text-sm leading-6 text-[#6a5140]">{product.description}</p>
                            </div>
                        )}
                    </div>
                </div>

                {related.length > 0 && (
                    <section className="mt-16">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm uppercase tracking-[0.35em] text-primary">You may like</p>
                                <h2 className="mt-2 text-2xl font-semibold">Lengkapi pilihan look Anda.</h2>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                            {related.map((item) => {
                                const imageUrl = resolveMediaUrl(item.image);

                                return (
                                    <Link key={item.id} href={`/products/${item.slug}`} className="group overflow-hidden rounded-[1rem] border border-border bg-card transition hover:-translate-y-1 hover:shadow-xl">
                                        <div className="aspect-[3/4] overflow-hidden bg-secondary/40">
                                            {imageUrl ? <img src={imageUrl} alt={item.name} className="size-full object-cover transition duration-300 group-hover:scale-105" /> : <div className="size-full bg-secondary" />}
                                        </div>
                                        <div className="p-3">
                                            <p className="line-clamp-2 text-sm font-semibold">{item.name}</p>
                                            <p className="mt-1 text-sm text-primary">{formatIDR(item.price)}</p>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </section>
                )}
            </div>

            <LoginRequiredModal
                open={loginModalOpen}
                onClose={() => setLoginModalOpen(false)}
                message="Silakan masuk atau daftar terlebih dahulu untuk menyimpan wishlist dan melanjutkan pemesanan."
            />
        </>
    );
}

function getDefaultDate(offsetDays: number) {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);

    return date.toISOString().slice(0, 10);
}

function formatIDR(amount: number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
}
