import { Head, Link, useForm } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, CreditCard, MapPinned, ShieldCheck, Truck } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type CheckoutItem = {
    id: number;
    rental_start_date: string;
    rental_end_date: string;
    product: {
        id: number;
        name: string;
        slug: string;
        code: string;
        category_name: string | null;
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

type CheckoutSummary = {
    items_count: number;
    rental_total: number;
    deposit_total: number;
    grand_total: number;
    total_weight_grams: number;
};

type SelectedRate = {
    shipping_name: string | null;
    shipping_code: string | null;
    service_name: string | null;
    service_description: string | null;
    shipping_cost: number;
    etd: string | null;
};

type ShippingAddress = {
    name: string | null;
    phone: string | null;
    address: string | null;
    province: string | null;
    city: string | null;
    district: string | null;
    postal_code: string | null;
};

export default function CheckoutIndex({
    items,
    summary,
    shipping,
    payment,
}: {
    items: CheckoutItem[];
    summary: CheckoutSummary;
    shipping: {
        selected_rate: SelectedRate;
        address: ShippingAddress;
        origin: {
            label: string | null;
        };
    };
    payment: {
        gateway: string;
        gateway_label: string;
        is_configured: boolean;
    };
}) {
    const form = useForm({
        shipping_code: shipping.selected_rate.shipping_code ?? '',
        service_name: shipping.selected_rate.service_name ?? '',
        notes: '',
    });

    const grandTotal = summary.grand_total + shipping.selected_rate.shipping_cost;

    function submit() {
        form.post('/checkout', {
            preserveScroll: true,
        });
    }

    return (
        <>
            <Head title="Checkout" />

            <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
                <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                    <div className="space-y-6">
                        <section className="store-gradient-panel p-6 sm:p-7">
                            <p className="text-sm uppercase tracking-[0.35em] text-primary">Checkout</p>
                            <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                                <div className="max-w-2xl">
                                    <h1 className="text-3xl font-semibold text-[#3f2a1f] dark:text-stone-50">
                                        Review pesanan sebelum masuk ke Midtrans sandbox.
                                    </h1>
                                    <p className="store-copy mt-2 text-sm leading-6">
                                        Semua total di bawah ini sudah termasuk harga sewa, deposit, dan ongkir dari alamat customer yang tersimpan.
                                    </p>
                                </div>

                                <Button variant="outline" asChild>
                                    <Link href="/cart">
                                        <ArrowLeft className="size-4" />
                                        Kembali ke cart
                                    </Link>
                                </Button>
                            </div>
                        </section>

                        {!payment.is_configured && (
                            <Alert className="border border-amber-200 bg-amber-50 text-amber-900">
                                <AlertCircle className="size-4" />
                                <AlertTitle>Midtrans sandbox belum siap</AlertTitle>
                                <AlertDescription className="text-amber-900/80">
                                    Isi `MIDTRANS_SERVER_KEY` dan `MIDTRANS_CLIENT_KEY` di environment agar tombol bayar bisa dipakai.
                                </AlertDescription>
                            </Alert>
                        )}

                        <section className="store-panel p-6">
                            <div className="flex items-center gap-2">
                                <Truck className="size-4 text-primary" />
                                <p className="text-sm uppercase tracking-[0.24em] text-primary">Pengiriman</p>
                            </div>

                            <div className="mt-4 grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
                                <div className="store-panel-subtle p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="rounded-md bg-secondary p-2 text-primary dark:bg-secondary/80">
                                            <MapPinned className="size-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold">Alamat tujuan</p>
                                            <p className="store-copy mt-1 text-sm">
                                                {[shipping.address.name, shipping.address.phone].filter(Boolean).join(' · ')}
                                            </p>
                                            <p className="store-copy mt-2 text-sm leading-6">
                                                {[
                                                    shipping.address.address,
                                                    shipping.address.district,
                                                    shipping.address.city,
                                                    shipping.address.province,
                                                ]
                                                    .filter(Boolean)
                                                    .join(', ')}
                                            </p>
                                            {shipping.address.postal_code && (
                                                <p className="store-copy-muted mt-1 text-xs">
                                                    Kode pos {shipping.address.postal_code}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="store-panel-subtle p-4">
                                    <p className="text-sm font-semibold">Layanan terpilih</p>
                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                        <Badge>{shipping.selected_rate.shipping_name ?? shipping.selected_rate.shipping_code ?? 'Courier'}</Badge>
                                        {shipping.selected_rate.service_name && (
                                            <Badge variant="secondary">{shipping.selected_rate.service_name}</Badge>
                                        )}
                                    </div>
                                    <p className="store-copy mt-3 text-sm">
                                        {shipping.selected_rate.service_description ??
                                            shipping.selected_rate.etd ??
                                            'Estimasi mengikuti layanan courier terpilih.'}
                                    </p>
                                    <p className="mt-4 text-sm font-semibold text-primary">
                                        {formatIDR(shipping.selected_rate.shipping_cost)}
                                    </p>
                                    <p className="store-copy-muted mt-1 text-xs">
                                        Asal toko: {shipping.origin.label}
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section className="store-panel p-6">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="size-4 text-primary" />
                                <p className="text-sm uppercase tracking-[0.24em] text-primary">Item pesanan</p>
                            </div>

                            <div className="mt-4 space-y-3">
                                {items.map((item) => (
                                    <div key={item.id} className="store-panel-subtle p-4">
                                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                            <div>
                                                <p className="text-sm font-semibold text-[#4a3225] dark:text-stone-100">
                                                    {item.product.name}
                                                </p>
                                                <p className="store-copy mt-1 text-xs">
                                                    {item.product.code}
                                                    {item.variant.size_name ? ` · Size ${item.variant.size_name}` : ''}
                                                    {item.variant.color ? ` · ${item.variant.color}` : ''}
                                                </p>
                                                <p className="store-copy mt-2 text-xs">
                                                    {item.rental_start_date} sampai {item.rental_end_date}
                                                </p>
                                            </div>

                                            <div className="space-y-1 text-sm md:text-right">
                                                <p className="store-copy">Sewa {formatIDR(item.pricing.rental)}</p>
                                                <p className="store-copy">Deposit {formatIDR(item.pricing.deposit)}</p>
                                                <p className="font-semibold text-primary">{formatIDR(item.pricing.subtotal)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="store-panel p-6">
                            <div className="flex items-center gap-2">
                                <CreditCard className="size-4 text-primary" />
                                <p className="text-sm uppercase tracking-[0.24em] text-primary">Catatan & pembayaran</p>
                            </div>

                            <div className="mt-4 space-y-4">
                                <div>
                                    <label htmlFor="notes" className="text-sm font-medium">
                                        Catatan untuk tim kami
                                    </label>
                                    <textarea
                                        id="notes"
                                        value={form.data.notes}
                                        onChange={(event) => form.setData('notes', event.target.value)}
                                        placeholder="Contoh: butuh dikirim H-1 sore, mohon konfirmasi via WhatsApp."
                                        className="textarea-field mt-2 min-h-[120px]"
                                    />
                                    {form.errors.notes && (
                                        <p className="mt-2 text-sm text-destructive">{form.errors.notes}</p>
                                    )}
                                </div>

                                <div className="store-panel-subtle p-4">
                                    <p className="text-sm font-semibold">{payment.gateway_label}</p>
                                    <p className="store-copy mt-1 text-sm leading-6">
                                        Setelah order dibuat, Anda akan diarahkan ke popup pembayaran Midtrans Snap sandbox untuk simulasi pembayaran.
                                    </p>
                                </div>
                            </div>
                        </section>
                    </div>

                    <aside className="store-gradient-panel h-fit p-6">
                        <p className="text-sm uppercase tracking-[0.25em] text-primary">Ringkasan akhir</p>

                        <div className="mt-5 space-y-3 text-sm">
                            <SummaryRow label="Jumlah item" value={String(summary.items_count)} />
                            <SummaryRow label="Total sewa" value={formatIDR(summary.rental_total)} />
                            <SummaryRow label="Total deposit" value={formatIDR(summary.deposit_total)} />
                            <SummaryRow label="Ongkir" value={formatIDR(shipping.selected_rate.shipping_cost)} />
                        </div>

                        <div className="my-5 border-t border-border" />

                        <div className="flex items-center justify-between">
                            <span className="text-base font-medium">Grand total</span>
                            <span className="text-2xl font-semibold text-primary">{formatIDR(grandTotal)}</span>
                        </div>

                        <p className="store-copy mt-4 text-xs leading-5">
                            Total ini akan dikirim apa adanya ke Midtrans Snap sandbox agar nominal simulasi pembayaran konsisten.
                        </p>

                        <Button
                            type="button"
                            className="mt-6 w-full"
                            disabled={form.processing || !payment.is_configured}
                            onClick={submit}
                        >
                            <CreditCard className="size-4" />
                            {form.processing ? 'Membuat order...' : 'Buat order & lanjut bayar'}
                        </Button>

                        <Button variant="outline" asChild className="mt-3 w-full">
                            <Link href="/cart">Ubah pilihan dari cart</Link>
                        </Button>
                    </aside>
                </div>
            </div>
        </>
    );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <span className="store-copy">{label}</span>
            <span className="font-medium text-foreground">{value}</span>
        </div>
    );
}

function formatIDR(amount: number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(amount);
}
