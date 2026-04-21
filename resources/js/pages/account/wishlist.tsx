import { Head, Link, router } from '@inertiajs/react';
import { Heart, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { resolveMediaUrl } from '@/lib/media';

type WishlistItem = {
    id: number;
    created_at: string | null;
    product: {
        id: number;
        name: string;
        slug: string;
        code: string;
        price: number;
        deposit_price: number | null;
        image: string | null;
        brand_name: string | null;
        category_name: string | null;
    };
};

export default function WishlistIndex({ wishlists }: { wishlists: WishlistItem[] }) {
    return (
        <>
            <Head title="Wishlist" />

            <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
                <div className="mb-8 flex items-end justify-between gap-4">
                    <div>
                        <p className="text-sm uppercase tracking-[0.35em] text-primary">Customer area</p>
                        <h1 className="mt-2 text-3xl font-semibold">Wishlist Anda</h1>
                        <p className="store-copy mt-2 text-sm">
                            Simpan item favorit lalu lanjutkan ke cart saat sudah siap menyewa.
                        </p>
                    </div>
                    <Link
                        href="/cart"
                        className="hidden rounded-md border border-border px-4 py-2 text-sm font-medium transition hover:border-primary/30 hover:bg-secondary sm:inline-flex"
                    >
                        Lihat Cart
                    </Link>
                </div>

                {wishlists.length === 0 ? (
                    <div className="store-outline-panel px-6 py-20 text-center">
                        <Heart className="mx-auto size-10 text-primary/60" />
                        <h2 className="mt-4 text-xl font-semibold">Wishlist masih kosong</h2>
                        <p className="store-copy mt-2 text-sm">
                            Simpan produk yang menarik dari katalog untuk mempermudah perbandingan nanti.
                        </p>
                        <Link
                            href="/catalog"
                            className="mt-6 inline-flex rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
                        >
                            Jelajahi Katalog
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {wishlists.map((wishlist) => {
                            const imageUrl = resolveMediaUrl(wishlist.product.image);

                            return (
                                <div key={wishlist.id} className="store-panel overflow-hidden">
                                    <div className="aspect-[3/4] bg-secondary/40">
                                        {imageUrl ? (
                                            <img src={imageUrl} alt={wishlist.product.name} className="size-full object-cover" />
                                        ) : (
                                            <div className="size-full bg-secondary" />
                                        )}
                                    </div>
                                    <div className="space-y-3 p-5">
                                        <div>
                                            {wishlist.product.brand_name && (
                                                <p className="store-copy-muted text-[11px] uppercase tracking-[0.25em]">
                                                    {wishlist.product.brand_name}
                                                </p>
                                            )}
                                            <h2 className="mt-1 text-lg font-semibold">{wishlist.product.name}</h2>
                                            <p className="store-copy mt-1 text-sm">{wishlist.product.category_name}</p>
                                        </div>

                                        <div>
                                            <p className="text-lg font-semibold text-primary">
                                                {formatIDR(wishlist.product.price)}
                                            </p>
                                            <p className="store-copy text-xs">
                                                Deposit {formatIDR(wishlist.product.deposit_price ?? 0)}
                                            </p>
                                        </div>

                                        <div className="flex gap-2">
                                            <Link
                                                href={`/products/${wishlist.product.slug}`}
                                                className="inline-flex flex-1 items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
                                            >
                                                <ShoppingBag className="mr-2 size-4" />
                                                Lihat Detail
                                            </Link>
                                            <Button
                                                variant="outline"
                                                onClick={() => router.post('/wishlist/toggle', { product_id: wishlist.product.id })}
                                            >
                                                Hapus
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
}

function formatIDR(amount: number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
}
