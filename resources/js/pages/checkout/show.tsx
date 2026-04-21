import { Head, Link, router } from '@inertiajs/react';
import { AlertCircle, CreditCard, ExternalLink, LoaderCircle, ReceiptText, RefreshCcw, ShieldCheck, Truck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type OrderItem = {
    id: number;
    product_name: string;
    product_code: string;
    variant_size: string | null;
    variant_color: string | null;
    price: number;
    deposit_price: number;
    quantity: number;
};

type OrderPayload = {
    id: number;
    order_number: string;
    status: string | null;
    status_label: string | null;
    status_color: string | null;
    subtotal: number;
    deposit_total: number;
    shipping_cost: number;
    total: number;
    rental_start_date: string | null;
    rental_end_date: string | null;
    shipping: {
        name: string | null;
        phone: string | null;
        address: string | null;
        city: string | null;
        province: string | null;
        postal_code: string | null;
        courier: string | null;
        service: string | null;
        etd: string | null;
        tracking_number: string | null;
    };
    payment: {
        gateway: string | null;
        method: string | null;
        reference: string | null;
        token: string | null;
        redirect_url: string | null;
        paid_at: string | null;
    };
    items: OrderItem[];
};

type MidtransProps = {
    is_configured: boolean;
    snap_js_url: string;
    client_key: string;
};

declare global {
    interface Window {
        snap?: {
            pay: (
                token: string,
                options?: {
                    onSuccess?: () => void;
                    onPending?: () => void;
                    onError?: (result: unknown) => void;
                    onClose?: () => void;
                },
            ) => void;
        };
    }
}

export default function CheckoutShow({
    order,
    midtrans,
}: {
    order: OrderPayload;
    midtrans: MidtransProps;
}) {
    const [snapAvailable, setSnapAvailable] = useState(() => typeof window !== 'undefined' && Boolean(window.snap));
    const [syncing, setSyncing] = useState(false);
    const [localMessage, setLocalMessage] = useState<string | null>(null);

    const canPay = useMemo(
        () =>
            order.status === 'pending_payment' &&
            midtrans.is_configured &&
            Boolean(order.payment.token),
        [midtrans.is_configured, order.payment.token, order.status],
    );
    const snapLoading = canPay && !snapAvailable;

    useEffect(() => {
        if (!canPay) {
            return;
        }

        if (window.snap) {
            const frame = window.requestAnimationFrame(() => setSnapAvailable(true));

            return () => window.cancelAnimationFrame(frame);
        }

        const scriptSelector = 'script[data-midtrans-snap="true"]';
        const existingScript = document.querySelector<HTMLScriptElement>(scriptSelector);

        const handleReady = () => {
            setSnapAvailable(Boolean(window.snap));
        };
        const handleError = () => {
            setLocalMessage('Snap.js Midtrans belum berhasil dimuat. Gunakan tombol redirect sandbox sebagai fallback.');
        };

        if (existingScript) {
            existingScript.addEventListener('load', handleReady, { once: true });

            return () => existingScript.removeEventListener('load', handleReady);
        }

        const script = document.createElement('script');
        script.src = midtrans.snap_js_url;
        script.async = true;
        script.dataset.midtransSnap = 'true';
        script.dataset.clientKey = midtrans.client_key;
        script.setAttribute('data-client-key', midtrans.client_key);
        script.addEventListener('load', handleReady, { once: true });
        script.addEventListener('error', handleError, { once: true });

        document.body.appendChild(script);

        return () => {
            script.removeEventListener('load', handleReady);
            script.removeEventListener('error', handleError);
        };
    }, [canPay, midtrans.client_key, midtrans.snap_js_url]);

    function refreshStatus() {
        setSyncing(true);

        router.post(
            `/checkout/orders/${order.id}/refresh`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setSyncing(false),
            },
        );
    }

    function payNow() {
        if (!order.payment.token) {
            setLocalMessage('Token pembayaran Midtrans belum tersedia untuk order ini.');

            return;
        }

        if (!window.snap) {
            setLocalMessage('Snap.js belum siap. Gunakan tombol redirect sandbox atau coba refresh halaman.');

            return;
        }

        setLocalMessage(null);

        window.snap.pay(order.payment.token, {
            onSuccess: refreshStatus,
            onPending: refreshStatus,
            onError: () => setLocalMessage('Midtrans mengembalikan error pada simulasi pembayaran. Cek status atau coba lagi.'),
            onClose: () => setLocalMessage('Popup Midtrans ditutup. Anda bisa membuka lagi kapan saja dari halaman ini.'),
        });
    }

    return (
        <>
            <Head title={`Pembayaran ${order.order_number}`} />

            <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
                <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                    <div className="space-y-6">
                        <section className="store-gradient-panel p-6 sm:p-7">
                            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                <div>
                                    <p className="text-sm uppercase tracking-[0.35em] text-primary">Pembayaran order</p>
                                    <h1 className="mt-3 text-3xl font-semibold text-[#3f2a1f] dark:text-stone-50">
                                        {order.order_number}
                                    </h1>
                                    <p className="store-copy mt-2 max-w-2xl text-sm leading-6">
                                        Halaman ini dipakai untuk simulasi pembayaran Midtrans sandbox dan memantau status order setelah callback atau webhook masuk.
                                    </p>
                                </div>

                                <Badge className={statusBadgeClass(order.status_color)}>
                                    {order.status_label ?? 'Status belum tersedia'}
                                </Badge>
                            </div>

                            <div className="mt-5 grid gap-3 sm:grid-cols-3">
                                <HighlightCard
                                    label="Rental"
                                    value={order.rental_start_date && order.rental_end_date
                                        ? `${order.rental_start_date} - ${order.rental_end_date}`
                                        : 'Belum lengkap'}
                                />
                                <HighlightCard
                                    label="Courier"
                                    value={[order.shipping.courier, order.shipping.service].filter(Boolean).join(' / ') || 'Belum dipilih'}
                                />
                                <HighlightCard label="Total" value={formatIDR(order.total)} />
                            </div>
                        </section>

                        {localMessage && (
                            <Alert className="border border-amber-200 bg-amber-50 text-amber-900">
                                <AlertCircle className="size-4" />
                                <AlertTitle>Informasi pembayaran</AlertTitle>
                                <AlertDescription className="text-amber-900/80">
                                    {localMessage}
                                </AlertDescription>
                            </Alert>
                        )}

                        <section className="store-panel p-6">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="size-4 text-primary" />
                                <p className="text-sm uppercase tracking-[0.24em] text-primary">Instruksi sandbox</p>
                            </div>

                            <div className="mt-4 grid gap-4 md:grid-cols-2">
                                <div className="store-panel-subtle p-4">
                                    <p className="text-sm font-semibold">Opsi 1: Snap popup</p>
                                    <p className="store-copy mt-2 text-sm leading-6">
                                        Gunakan popup Midtrans untuk simulasi paling mirip alur live. Setelah selesai, tekan refresh status bila Anda sedang di local environment.
                                    </p>

                                    <Button
                                        type="button"
                                        className="mt-4 w-full"
                                        disabled={!canPay || syncing || snapLoading}
                                        onClick={payNow}
                                    >
                                        {(snapLoading || syncing) && <LoaderCircle className="size-4 animate-spin" />}
                                        <CreditCard className="size-4" />
                                        {snapLoading ? 'Menyiapkan Snap...' : 'Bayar dengan Midtrans Snap'}
                                    </Button>
                                </div>

                                <div className="store-panel-subtle p-4">
                                    <p className="text-sm font-semibold">Opsi 2: Redirect fallback</p>
                                    <p className="store-copy mt-2 text-sm leading-6">
                                        Jika Snap.js terblokir atau Anda sedang menguji callback secara manual, gunakan halaman redirect sandbox bawaan Midtrans.
                                    </p>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="mt-4 w-full"
                                        disabled={!order.payment.redirect_url}
                                        onClick={() => {
                                            if (order.payment.redirect_url) {
                                                window.open(order.payment.redirect_url, '_blank', 'noopener,noreferrer');
                                            }
                                        }}
                                    >
                                        <ExternalLink className="size-4" />
                                        Buka halaman redirect sandbox
                                    </Button>
                                </div>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-3">
                                <Button type="button" variant="outline" onClick={refreshStatus} disabled={syncing}>
                                    {syncing && <LoaderCircle className="size-4 animate-spin" />}
                                    <RefreshCcw className="size-4" />
                                    Refresh status pembayaran
                                </Button>
                                <Button variant="outline" asChild>
                                    <Link href="/catalog">Kembali ke katalog</Link>
                                </Button>
                            </div>
                        </section>

                        <section className="store-panel p-6">
                            <div className="flex items-center gap-2">
                                <ReceiptText className="size-4 text-primary" />
                                <p className="text-sm uppercase tracking-[0.24em] text-primary">Rincian order</p>
                            </div>

                            <div className="mt-4 space-y-3">
                                {order.items.map((item) => (
                                    <div key={item.id} className="store-panel-subtle p-4">
                                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                            <div>
                                                <p className="text-sm font-semibold text-[#4a3225] dark:text-stone-100">
                                                    {item.product_name}
                                                </p>
                                                <p className="store-copy mt-1 text-xs">
                                                    {item.product_code}
                                                    {item.variant_size ? ` · Size ${item.variant_size}` : ''}
                                                    {item.variant_color ? ` · ${item.variant_color}` : ''}
                                                </p>
                                            </div>

                                            <div className="space-y-1 text-sm md:text-right">
                                                <p className="store-copy">Sewa {formatIDR(item.price)}</p>
                                                <p className="store-copy">Deposit {formatIDR(item.deposit_price)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    <aside className="store-gradient-panel h-fit p-6">
                        <div className="flex items-center gap-2">
                            <Truck className="size-4 text-primary" />
                            <p className="text-sm uppercase tracking-[0.24em] text-primary">Ringkasan</p>
                        </div>

                        <div className="mt-5 space-y-3 text-sm">
                            <SummaryRow label="Subtotal sewa" value={formatIDR(order.subtotal)} />
                            <SummaryRow label="Deposit" value={formatIDR(order.deposit_total)} />
                            <SummaryRow label="Ongkir" value={formatIDR(order.shipping_cost)} />
                        </div>

                        <div className="my-5 border-t border-border" />

                        <div className="flex items-center justify-between">
                            <span className="text-base font-medium">Total dibayar</span>
                            <span className="text-2xl font-semibold text-primary">{formatIDR(order.total)}</span>
                        </div>

                        <div className="mt-5 space-y-3">
                            <div className="store-panel-subtle p-4">
                                <p className="text-sm font-semibold">Alamat pengiriman</p>
                                <p className="store-copy mt-2 text-sm leading-6">
                                    {[order.shipping.name, order.shipping.phone].filter(Boolean).join(' · ')}
                                </p>
                                <p className="store-copy mt-1 text-sm leading-6">
                                    {[order.shipping.address, order.shipping.city, order.shipping.province].filter(Boolean).join(', ')}
                                </p>
                                {order.shipping.postal_code && (
                                    <p className="store-copy-muted mt-1 text-xs">
                                        Kode pos {order.shipping.postal_code}
                                    </p>
                                )}
                            </div>

                            <div className="store-panel-subtle p-4">
                                <p className="text-sm font-semibold">Payment gateway</p>
                                <p className="store-copy mt-2 text-sm">
                                    {order.payment.gateway ? order.payment.gateway.toUpperCase() : 'Midtrans'}
                                </p>
                                <p className="store-copy mt-1 text-xs">
                                    {order.payment.method ? `Metode terakhir: ${order.payment.method}` : 'Metode pembayaran akan muncul setelah simulasi dimulai.'}
                                </p>
                                {order.payment.reference && (
                                    <p className="store-copy-muted mt-2 text-xs break-all">
                                        Ref: {order.payment.reference}
                                    </p>
                                )}
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </>
    );
}

function HighlightCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="store-panel-subtle p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-primary">{label}</p>
            <p className="mt-2 text-sm font-semibold text-[#4a3225] dark:text-stone-100">{value}</p>
        </div>
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

function statusBadgeClass(color: string | null) {
    return [
        'border-transparent',
        {
            yellow: 'bg-amber-100 text-amber-800',
            blue: 'bg-sky-100 text-sky-800',
            indigo: 'bg-indigo-100 text-indigo-800',
            purple: 'bg-purple-100 text-purple-800',
            teal: 'bg-teal-100 text-teal-800',
            green: 'bg-green-100 text-green-800',
            orange: 'bg-orange-100 text-orange-800',
            emerald: 'bg-emerald-100 text-emerald-800',
            red: 'bg-rose-100 text-rose-800',
            gray: 'bg-stone-200 text-stone-700',
        }[color ?? 'gray'] ?? 'bg-stone-200 text-stone-700',
    ].join(' ');
}

function formatIDR(amount: number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(amount);
}
