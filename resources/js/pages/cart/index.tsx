import { Head, Link, router } from '@inertiajs/react';
import { CalendarDays, MapPinned, ShoppingBag, Trash2, Truck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { resolveMediaUrl } from '@/lib/media';

type CartItem = {
    id: number;
    rental_start_date: string;
    rental_end_date: string;
    product: {
        id: number;
        name: string;
        slug: string;
        code: string;
        image: string | null;
        category_name: string | null;
        requires_dress_or_clutch: boolean;
        weight_grams: number;
    };
    variant: {
        id: number;
        size_name: string | null;
        color: string | null;
        sku: string | null;
    };
    pricing: {
        rental: number;
        deposit: number;
        subtotal: number;
    };
};

type Summary = {
    items_count: number;
    rental_total: number;
    deposit_total: number;
    grand_total: number;
    total_weight_grams: number;
};

type ShippingProps = {
    destination: {
        address: string | null;
        province: string | null;
        city: string | null;
        district: string | null;
        postal_code: string | null;
        village_code: number | null;
    };
    origin: {
        label: string | null;
        village_name: string | null;
        district_name: string | null;
        regency_name: string | null;
        province_name: string | null;
        village_code: string | null;
    };
    courier_options: Array<{
        code: string;
        label: string;
    }>;
    destination_ready: boolean;
    rates: ShippingRate[];
    quote_error: string | null;
};

type ShippingRate = {
    shipping_name: string | null;
    shipping_code: string | null;
    service_name: string | null;
    service_description: string | null;
    weight: number | null;
    shipping_cost: number;
    shipping_cost_net: number | null;
    shipping_cashback: number | null;
    service_fee: number | null;
    grandtotal: number | null;
    etd: string | null;
    is_cod: boolean;
};

export default function CartIndex({
    items,
    summary,
    shipping,
}: {
    items: CartItem[];
    summary: Summary;
    shipping: ShippingProps;
}) {
    const [dates, setDates] = useState<Record<number, { start: string; end: string }>>(
        Object.fromEntries(items.map((item) => [item.id, { start: item.rental_start_date, end: item.rental_end_date }])),
    );
    const [selectedRateKey, setSelectedRateKey] = useState<string | null>(
        shipping.rates[0] ? shippingRateKey(shipping.rates[0], 0) : null,
    );

    const totalWeightLabel = formatWeight(summary.total_weight_grams);
    const selectedShippingRate = useMemo(() => {
        if (shipping.rates.length === 0) {
            return null;
        }

        return (
            shipping.rates.find((rate, index) => shippingRateKey(rate, index) === selectedRateKey) ??
            shipping.rates[0]
        );
    }, [selectedRateKey, shipping.rates]);
    const selectedShippingRateKey = selectedShippingRate
        ? shippingRateKey(selectedShippingRate, shipping.rates.findIndex((rate) => rate === selectedShippingRate))
        : null;
    const shippingTotal = selectedShippingRate?.shipping_cost ?? 0;
    const grandTotalWithShipping = summary.grand_total + shippingTotal;
    const canProceedToCheckout = Boolean(selectedShippingRate && shipping.destination_ready && !shipping.quote_error);

    function proceedToCheckout() {
        if (!selectedShippingRate) {
            return;
        }

        router.get('/checkout', {
            shipping_code: selectedShippingRate.shipping_code,
            service_name: selectedShippingRate.service_name,
        });
    }

    return (
        <>
            <Head title="Cart" />

            <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
                <div className="mb-8">
                    <p className="text-sm uppercase tracking-[0.35em] text-primary">Customer area</p>
                    <h1 className="mt-2 text-3xl font-semibold">Cart Penyewaan</h1>
                    <p className="store-copy mt-2 text-sm">
                        Atur tanggal sewa, cek deposit, lalu lanjutkan ke checkout saat siap.
                    </p>
                </div>

                {items.length === 0 ? (
                    <div className="store-outline-panel px-6 py-20 text-center">
                        <ShoppingBag className="mx-auto size-10 text-primary/60" />
                        <h2 className="mt-4 text-xl font-semibold">Cart masih kosong</h2>
                        <p className="store-copy mt-2 text-sm">
                            Tambahkan dress, clutch, atau aksesori yang ingin Anda sewa dari katalog.
                        </p>
                        <Link
                            href="/catalog"
                            className="mt-6 inline-flex rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
                        >
                            Kembali ke Katalog
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
                        <div className="space-y-4">
                            {items.map((item) => {
                                const imageUrl = resolveMediaUrl(item.product.image);
                                const currentDates = dates[item.id];

                                return (
                                    <div key={item.id} className="store-panel overflow-hidden">
                                        <div className="grid gap-4 p-4 sm:grid-cols-[140px_1fr] sm:p-5">
                                            <div className="overflow-hidden rounded-lg bg-secondary/40">
                                                {imageUrl ? (
                                                    <img
                                                        src={imageUrl}
                                                        alt={item.product.name}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="aspect-[3/4] bg-secondary" />
                                                )}
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex flex-wrap items-start justify-between gap-3">
                                                    <div>
                                                        <p className="store-copy-muted text-xs uppercase tracking-[0.25em]">
                                                            {item.product.category_name}
                                                        </p>
                                                        <h2 className="mt-1 text-xl font-semibold">
                                                            {item.product.name}
                                                        </h2>
                                                        <p className="store-copy mt-1 text-sm">
                                                            {item.variant.size_name
                                                                ? `Ukuran ${item.variant.size_name}`
                                                                : 'Free size'}
                                                            {item.variant.color ? ` / ${item.variant.color}` : ''}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => router.delete(`/cart/items/${item.id}`)}
                                                        className="rounded-md border border-border p-2 text-muted-foreground transition hover:border-destructive hover:text-destructive"
                                                        aria-label="Hapus item"
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </button>
                                                </div>

                                                <div className="grid gap-3 md:grid-cols-2">
                                                    <label className="grid gap-2 text-sm">
                                                        <span className="font-medium">Mulai sewa</span>
                                                        <input
                                                            type="date"
                                                            value={currentDates.start}
                                                            onChange={(event) =>
                                                                setDates((current) => ({
                                                                    ...current,
                                                                    [item.id]: {
                                                                        ...current[item.id],
                                                                        start: event.target.value,
                                                                    },
                                                                }))
                                                            }
                                                            className="select-field"
                                                        />
                                                    </label>
                                                    <label className="grid gap-2 text-sm">
                                                        <span className="font-medium">Selesai sewa</span>
                                                        <input
                                                            type="date"
                                                            value={currentDates.end}
                                                            onChange={(event) =>
                                                                setDates((current) => ({
                                                                    ...current,
                                                                    [item.id]: {
                                                                        ...current[item.id],
                                                                        end: event.target.value,
                                                                    },
                                                                }))
                                                            }
                                                            className="select-field"
                                                        />
                                                    </label>
                                                </div>

                                                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-secondary/40 px-4 py-3 dark:bg-secondary/65">
                                                    <div className="store-copy text-sm">
                                                        <p>Sewa {formatIDR(item.pricing.rental)}</p>
                                                        <p>Deposit {formatIDR(item.pricing.deposit)}</p>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        <Button
                                                            variant="outline"
                                                            onClick={() =>
                                                                router.patch(`/cart/items/${item.id}`, {
                                                                    rental_start_date: currentDates.start,
                                                                    rental_end_date: currentDates.end,
                                                                })
                                                            }
                                                        >
                                                            <CalendarDays className="size-4" />
                                                            Simpan tanggal
                                                        </Button>
                                                        <span className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-primary dark:bg-card">
                                                            {formatIDR(item.pricing.subtotal)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <aside className="store-gradient-panel h-fit p-6">
                            <div className="store-panel-subtle p-4">
                                <div className="flex items-start gap-3">
                                    <div className="rounded-md bg-secondary p-2 text-primary dark:bg-secondary/80">
                                        <MapPinned className="size-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold">Alamat pengiriman aktif</p>
                                        <p className="store-copy mt-1 text-sm">
                                            {[
                                                shipping.destination.address,
                                                shipping.destination.district,
                                                shipping.destination.city,
                                                shipping.destination.province,
                                            ]
                                                .filter(Boolean)
                                                .join(', ') || 'Profil shipping belum lengkap.'}
                                        </p>
                                        <p className="store-copy-muted mt-1 text-xs">
                                            {shipping.destination.postal_code
                                                ? `Kode pos ${shipping.destination.postal_code}`
                                                : 'Lengkapi profile agar checkout lebih cepat.'}
                                        </p>
                                        <p className="store-copy-muted mt-2 text-xs">
                                            Asal toko: {shipping.origin.label}
                                        </p>
                                        <Link
                                            href="/settings/profile"
                                            className="mt-3 inline-flex text-xs font-medium text-primary underline underline-offset-4"
                                        >
                                            Perbarui profile shipping
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            <div className="store-panel-subtle mt-5 p-4">
                                <div className="flex items-center gap-2">
                                    <Truck className="size-4 text-primary" />
                                    <p className="text-sm font-semibold">Pilih jasa pengiriman</p>
                                </div>
                                <p className="store-copy mt-2 text-xs leading-5">
                                    Ongkir otomatis dihitung dari lokasi profile customer dengan berat cart {totalWeightLabel}. Pilih layanan yang paling sesuai untuk melanjutkan checkout.
                                </p>

                                {shipping.quote_error && (
                                    <p className="mt-4 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                                        {shipping.quote_error}
                                    </p>
                                )}

                                {!shipping.quote_error && shipping.rates.length > 0 && (
                                    <div className="mt-4 space-y-3">
                                        {shipping.rates.map((rate, index) => {
                                            const rateKey = shippingRateKey(rate, index);
                                            const active = rateKey === selectedShippingRateKey;

                                            return (
                                                <button
                                                    key={rateKey}
                                                    type="button"
                                                    onClick={() => setSelectedRateKey(rateKey)}
                                                    className={`store-panel-subtle block w-full p-3 text-left transition ${
                                                        active
                                                            ? 'border-primary bg-primary/8 shadow-[0_0_0_1px_rgba(163,127,85,0.2)]'
                                                            : 'hover:border-primary/30 hover:bg-secondary/40'
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <p className="text-sm font-semibold">
                                                                {rate.shipping_name}{' '}
                                                                {rate.service_name ? `/ ${rate.service_name}` : ''}
                                                            </p>
                                                            <p className="store-copy mt-1 text-xs">
                                                                {rate.service_description ??
                                                                    rate.etd ??
                                                                    'Estimasi mengikuti layanan courier.'}
                                                            </p>
                                                        </div>
                                                        <span className="text-sm font-semibold text-primary">
                                                            {formatIDR(rate.shipping_cost)}
                                                        </span>
                                                    </div>
                                                    <div className="store-copy mt-3 flex flex-wrap items-center gap-2 text-xs">
                                                        <span className="inline-flex items-center rounded-md bg-white px-2.5 py-1 dark:bg-card">
                                                            {rate.etd ? `Estimasi ${rate.etd}` : 'Estimasi menyusul'}
                                                        </span>
                                                        <span className="inline-flex items-center rounded-md bg-white px-2.5 py-1 dark:bg-card">
                                                            {formatWeight(rate.weight ?? summary.total_weight_grams)}
                                                        </span>
                                                        {active && (
                                                            <span className="inline-flex items-center rounded-md bg-primary px-2.5 py-1 font-medium text-primary-foreground">
                                                                Dipilih
                                                            </span>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {!shipping.quote_error && shipping.rates.length === 0 && shipping.destination_ready && (
                                    <p className="store-copy mt-4 rounded-md border border-border/70 bg-white/70 px-3 py-2 text-sm dark:bg-card/70">
                                        Belum ada layanan pengiriman yang tersedia untuk alamat dan berat cart saat ini.
                                    </p>
                                )}
                            </div>

                            <div className="mt-5">
                                <p className="text-sm uppercase tracking-[0.25em] text-primary">Ringkasan</p>
                                <div className="store-copy mt-5 space-y-3 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span>Total item</span>
                                        <span>{summary.items_count}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>Total berat</span>
                                        <span>{totalWeightLabel}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>Total sewa</span>
                                        <span>{formatIDR(summary.rental_total)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>Total deposit</span>
                                        <span>{formatIDR(summary.deposit_total)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>Ongkir terpilih</span>
                                        <span>{selectedShippingRate ? formatIDR(shippingTotal) : '-'}</span>
                                    </div>
                                </div>

                                <div className="my-5 border-t border-border" />

                                <div className="flex items-center justify-between">
                                    <span className="text-base font-medium">Grand total sementara</span>
                                    <span className="text-2xl font-semibold text-primary">
                                        {formatIDR(grandTotalWithShipping)}
                                    </span>
                                </div>

                                <p className="store-copy mt-4 text-xs leading-5">
                                    Total ini mencakup produk, deposit, dan ongkir layanan yang sedang dipilih.
                                </p>

                                <Button
                                    type="button"
                                    className="mt-6 w-full"
                                    disabled={!canProceedToCheckout}
                                    onClick={proceedToCheckout}
                                >
                                    Lanjut ke Checkout
                                </Button>

                                {!canProceedToCheckout && (
                                    <p className="store-copy-muted mt-3 text-xs leading-5">
                                        Pilih layanan pengiriman yang tersedia dan pastikan alamat profile sudah lengkap untuk melanjutkan ke checkout.
                                    </p>
                                )}
                            </div>

                            <Link
                                href="/catalog"
                                className="mt-3 inline-flex w-full items-center justify-center rounded-md border border-border px-4 py-2.5 text-sm font-medium transition hover:border-primary/30 hover:bg-secondary"
                            >
                                Tambah Produk Lagi
                            </Link>
                        </aside>
                    </div>
                )}
            </div>
        </>
    );
}

function formatIDR(amount: number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(amount);
}

function formatWeight(weight: number) {
    if (weight >= 1000) {
        return `${(weight / 1000).toFixed(weight % 1000 === 0 ? 0 : 1)} kg`;
    }

    return `${weight} gr`;
}

function shippingRateKey(rate: ShippingRate, index: number) {
    return `${rate.shipping_code ?? 'rate'}-${rate.service_name ?? 'service'}-${index}`;
}
