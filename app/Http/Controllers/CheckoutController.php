<?php

namespace App\Http\Controllers;

use App\Actions\Checkout\CreateOrderFromCartAction;
use App\Actions\Payments\SyncMidtransOrderStatusAction;
use App\Enums\OrderStatus;
use App\Http\Requests\Storefront\StoreCheckoutRequest;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\User;
use App\Services\Payments\MidtransSnapService;
use App\Services\Shipping\ApiCoIdShippingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;
use Throwable;

class CheckoutController extends Controller
{
    public function __construct(
        private readonly ApiCoIdShippingService $shippingService,
        private readonly CreateOrderFromCartAction $createOrderFromCart,
        private readonly MidtransSnapService $midtrans,
        private readonly SyncMidtransOrderStatusAction $syncMidtransOrderStatus,
    ) {}

    public function index(Request $request): Response|RedirectResponse
    {
        [$cart, $items, $summary, $shipping] = $this->prepareCheckoutSnapshot($request->user());

        if ($items->isEmpty()) {
            return redirect()->route('cart.index')->with('error', 'Cart masih kosong. Tambahkan produk terlebih dahulu sebelum checkout.');
        }

        if ($shipping['quote_error']) {
            return redirect()->route('cart.index')->with('error', $shipping['quote_error']);
        }

        $selectedRate = $this->resolveSelectedRate(
            rates: $shipping['rates'],
            shippingCode: $request->string('shipping_code')->toString(),
            serviceName: $request->string('service_name')->toString(),
        );

        if ($selectedRate === null) {
            return redirect()->route('cart.index')->with('error', 'Pilih layanan pengiriman dari cart terlebih dahulu sebelum checkout.');
        }

        return Inertia::render('checkout/index', [
            'items' => $items->values()->all(),
            'summary' => $summary,
            'shipping' => [
                'selected_rate' => $selectedRate,
                'address' => $shipping['destination'],
                'origin' => $shipping['origin'],
            ],
            'payment' => [
                'gateway' => 'midtrans',
                'gateway_label' => 'Midtrans Snap',
                'is_configured' => $this->midtrans->isConfigured(),
            ],
        ]);
    }

    public function store(StoreCheckoutRequest $request): RedirectResponse
    {
        [$cart, $items, $summary, $shipping] = $this->prepareCheckoutSnapshot($request->user());

        if ($items->isEmpty()) {
            return redirect()->route('cart.index')->with('error', 'Cart masih kosong. Tambahkan produk terlebih dahulu sebelum checkout.');
        }

        if ($shipping['quote_error']) {
            return redirect()->route('cart.index')->with('error', $shipping['quote_error']);
        }

        if (! $this->midtrans->isConfigured()) {
            return back()->with('error', 'Midtrans sandbox belum dikonfigurasi. Isi server key dan client key terlebih dahulu.');
        }

        $selectedRate = $this->resolveSelectedRate(
            rates: $shipping['rates'],
            shippingCode: $request->string('shipping_code')->toString(),
            serviceName: $request->string('service_name')->toString(),
        );

        if ($selectedRate === null) {
            return redirect()->route('cart.index')->with('error', 'Layanan pengiriman yang dipilih tidak valid. Silakan pilih ulang dari cart.');
        }

        $order = null;

        try {
            $order = $this->createOrderFromCart->execute(
                user: $request->user(),
                cart: $cart,
                items: $items,
                summary: $summary,
                selectedRate: $selectedRate,
                notes: $request->string('notes')->toString() ?: null,
            );

            $payment = $this->midtrans->createTransaction(
                orderId: $order->order_number,
                grossAmount: (int) $order->total,
                itemDetails: $this->buildMidtransItemDetails($order),
                customerDetails: $this->buildMidtransCustomerDetails($request->user(), $order),
                finishUrl: route('checkout.orders.show', $order),
            );

            $order->update([
                'payment_token' => $payment['token'],
                'payment_redirect_url' => $payment['redirect_url'],
                'payment_payload' => $payment['payload'],
            ]);

            $cart->items()->delete();
        } catch (Throwable $exception) {
            report($exception);

            if ($order instanceof Order) {
                $this->cleanupFailedOrder($order);
            }

            return back()->with('error', $exception instanceof RuntimeException
                ? $exception->getMessage()
                : 'Checkout belum berhasil diproses. Coba lagi beberapa saat.');
        }

        return redirect()
            ->route('checkout.orders.show', $order)
            ->with('success', 'Pesanan berhasil dibuat. Lanjutkan pembayaran melalui Midtrans sandbox.');
    }

    public function show(Request $request, Order $order): Response
    {
        $this->ensureOrderVisibleToUser($request, $order);

        $order->load('items');

        return Inertia::render('checkout/show', [
            'order' => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'status' => $order->status?->value,
                'status_label' => $order->status?->label(),
                'status_color' => $order->status?->color(),
                'subtotal' => (int) $order->subtotal,
                'deposit_total' => (int) $order->deposit_total,
                'shipping_cost' => (int) $order->shipping_cost,
                'total' => (int) $order->total,
                'rental_start_date' => $order->rental_start_date?->format('Y-m-d'),
                'rental_end_date' => $order->rental_end_date?->format('Y-m-d'),
                'shipping' => [
                    'name' => $order->shipping_name,
                    'phone' => $order->shipping_phone,
                    'address' => $order->shipping_address,
                    'city' => $order->shipping_city,
                    'province' => $order->shipping_province,
                    'postal_code' => $order->shipping_postal_code,
                    'courier' => $order->shipping_courier,
                    'service' => $order->shipping_service,
                    'etd' => $order->shipping_etd,
                    'tracking_number' => $order->shipping_tracking_number,
                ],
                'payment' => [
                    'gateway' => $order->payment_gateway,
                    'method' => $order->payment_method,
                    'reference' => $order->payment_reference,
                    'token' => $order->payment_token,
                    'redirect_url' => $order->payment_redirect_url,
                    'paid_at' => $order->paid_at?->toAtomString(),
                ],
                'items' => $order->items->map(fn ($item) => [
                    'id' => $item->id,
                    'product_name' => $item->product_name,
                    'product_code' => $item->product_code,
                    'variant_size' => $item->variant_size,
                    'variant_color' => $item->variant_color,
                    'price' => (int) $item->price,
                    'deposit_price' => (int) $item->deposit_price,
                    'quantity' => (int) $item->quantity,
                ])->values()->all(),
            ],
            'midtrans' => [
                'is_configured' => $this->midtrans->isConfigured(),
                'snap_js_url' => $this->midtrans->snapJsUrl(),
                'client_key' => $this->midtrans->clientKey(),
            ],
        ]);
    }

    public function refresh(Request $request, Order $order): RedirectResponse
    {
        $this->ensureOrderVisibleToUser($request, $order);

        try {
            $payload = $this->midtrans->getTransactionStatus($order->order_number);
            $this->syncMidtransOrderStatus->execute($order, $payload);
        } catch (Throwable $exception) {
            report($exception);

            return back()->with('error', $exception instanceof RuntimeException
                ? $exception->getMessage()
                : 'Status pembayaran belum bisa diperbarui dari Midtrans. Coba lagi beberapa saat.');
        }

        return back()->with('success', 'Status pembayaran berhasil diperbarui dari Midtrans.');
    }

    /**
     * @return array{0: Cart, 1: Collection<int, array<string, mixed>>, 2: array<string, int>, 3: array<string, mixed>}
     */
    private function prepareCheckoutSnapshot(User $user): array
    {
        $cart = $user->cart()->firstOrCreate();

        $cart->load([
            'items.variant.product.primaryImage',
            'items.variant.product.category.parent',
            'items.variant.size',
        ]);

        $items = $cart->items->map(function (CartItem $item) {
            $variant = $item->variant;
            $product = $variant?->product;
            $rentalPrice = ($product?->price ?? 0) + ($variant?->additional_price ?? 0);
            $depositPrice = $product?->deposit_price ?? 0;

            return [
                'id' => $item->id,
                'rental_start_date' => $item->rental_start_date?->format('Y-m-d'),
                'rental_end_date' => $item->rental_end_date?->format('Y-m-d'),
                'product' => [
                    'id' => $product?->id,
                    'name' => $product?->name,
                    'slug' => $product?->slug,
                    'code' => $product?->code,
                    'image' => $product?->primaryImage?->image_path,
                    'category_name' => $product?->category?->name,
                    'weight_grams' => $product?->weight_grams ?? 0,
                ],
                'variant' => [
                    'id' => $variant?->id,
                    'size_name' => $variant?->size?->name,
                    'color' => $variant?->color,
                    'sku' => $variant?->sku,
                ],
                'pricing' => [
                    'rental' => $rentalPrice,
                    'deposit' => $depositPrice,
                    'subtotal' => $rentalPrice + $depositPrice,
                ],
            ];
        })->values();

        $summary = [
            'items_count' => $items->count(),
            'rental_total' => (int) $items->sum('pricing.rental'),
            'deposit_total' => (int) $items->sum('pricing.deposit'),
            'grand_total' => (int) $items->sum('pricing.subtotal'),
            'total_weight_grams' => (int) $items->sum('product.weight_grams'),
        ];

        [$shippingRates, $shippingQuoteError] = $this->resolveShippingRates(
            destinationVillageCode: $user->shipping_district_id,
            weightInGram: $summary['total_weight_grams'],
        );

        return [
            $cart,
            $items,
            $summary,
            [
                'destination' => [
                    'name' => $user->name,
                    'phone' => $user->phone,
                    'address' => $user->address,
                    'province' => $user->shipping_province,
                    'city' => $user->shipping_city,
                    'district' => $user->shipping_district,
                    'postal_code' => $user->shipping_postal_code,
                    'village_code' => $user->shipping_district_id,
                ],
                'origin' => [
                    'label' => config('services.api_co_id.origin_label'),
                    'village_name' => config('services.api_co_id.origin_village_name'),
                    'district_name' => config('services.api_co_id.origin_district_name'),
                    'regency_name' => config('services.api_co_id.origin_regency_name'),
                    'province_name' => config('services.api_co_id.origin_province_name'),
                    'village_code' => (string) config('services.api_co_id.origin_village_code'),
                ],
                'destination_ready' => filled($user->shipping_district_id),
                'courier_options' => $this->courierOptions(),
                'rates' => $shippingRates,
                'quote_error' => $shippingQuoteError,
            ],
        ];
    }

    /**
     * @return array{0: array<int, array<string, mixed>>, 1: string|null}
     */
    private function resolveShippingRates(int|string|null $destinationVillageCode, int $weightInGram): array
    {
        if (blank($destinationVillageCode)) {
            return [[], 'Lengkapi lokasi pengiriman customer sampai kelurahan atau desa di profil terlebih dahulu sebelum checkout.'];
        }

        if ($weightInGram < 1) {
            return [[], 'Cart belum memiliki berat produk yang valid untuk dihitung ongkirnya.'];
        }

        try {
            return [
                $this->shippingService->calculateVillageShippingCost(
                    destinationVillageCode: $destinationVillageCode,
                    weightInGram: $weightInGram,
                    couriers: collect($this->courierOptions())->pluck('code')->all(),
                ),
                null,
            ];
        } catch (RuntimeException $exception) {
            return [[], $exception->getMessage()];
        } catch (Throwable $exception) {
            report($exception);

            return [[], 'Layanan ongkir api.co.id sedang tidak dapat dihubungi. Coba lagi beberapa saat.'];
        }
    }

    /**
     * @return array<int, array{code: string, label: string}>
     */
    private function courierOptions(): array
    {
        return collect(config('services.api_co_id.couriers', []))
            ->map(fn (string $code) => [
                'code' => strtoupper($code),
                'label' => match (strtoupper($code)) {
                    'JT' => 'J&T Express',
                    'LION' => 'Lion Parcel',
                    'JNE' => 'JNE Express',
                    'JNECARGO' => 'JNE Cargo',
                    'SAP' => 'SAP Express',
                    default => strtoupper($code),
                },
            ])
            ->values()
            ->all();
    }

    /**
     * @param  array<int, array<string, mixed>>  $rates
     * @return array<string, mixed>|null
     */
    private function resolveSelectedRate(array $rates, ?string $shippingCode, ?string $serviceName): ?array
    {
        if ($rates === []) {
            return null;
        }

        $normalizedCode = strtoupper(trim((string) $shippingCode));
        $normalizedService = trim((string) $serviceName);

        if ($normalizedCode === '') {
            return $rates[0];
        }

        return collect($rates)->first(function (array $rate) use ($normalizedCode, $normalizedService) {
            $rateCode = strtoupper((string) ($rate['shipping_code'] ?? ''));
            $rateService = trim((string) ($rate['service_name'] ?? ''));

            if ($rateCode !== $normalizedCode) {
                return false;
            }

            return $normalizedService === '' || $rateService === $normalizedService;
        });
    }

    /**
     * @return array<int, array<string, int|string>>
     */
    private function buildMidtransItemDetails(Order $order): array
    {
        $items = $order->items->map(fn ($item) => [
            'id' => 'ITEM-'.$item->id,
            'price' => (int) $item->price,
            'quantity' => (int) $item->quantity,
            'name' => Str::limit(trim($item->product_name.' '.collect([$item->variant_size, $item->variant_color])->filter()->implode('/')), 50, ''),
        ])->values();

        if ((int) $order->deposit_total > 0) {
            $items->push([
                'id' => 'DEPOSIT',
                'price' => (int) $order->deposit_total,
                'quantity' => 1,
                'name' => 'Deposit keamanan',
            ]);
        }

        if ((int) $order->shipping_cost > 0) {
            $items->push([
                'id' => 'SHIPPING',
                'price' => (int) $order->shipping_cost,
                'quantity' => 1,
                'name' => Str::limit(trim('Ongkir '.implode(' ', array_filter([$order->shipping_courier, $order->shipping_service]))), 50, ''),
            ]);
        }

        return $items->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function buildMidtransCustomerDetails(User $user, Order $order): array
    {
        return array_filter([
            'first_name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'shipping_address' => [
                'first_name' => $order->shipping_name,
                'phone' => $order->shipping_phone,
                'address' => $order->shipping_address,
                'city' => $order->shipping_city,
                'postal_code' => $order->shipping_postal_code,
                'country_code' => 'IDN',
            ],
        ], function (mixed $value) {
            if (is_array($value)) {
                return collect($value)->filter(fn ($item) => filled($item))->isNotEmpty();
            }

            return filled($value);
        });
    }

    private function cleanupFailedOrder(Order $order): void
    {
        $order->items()->delete();
        $order->forceDelete();
    }

    private function ensureOrderVisibleToUser(Request $request, Order $order): void
    {
        $user = $request->user();

        abort_if(
            $user->id !== $order->user_id && ! $user->hasAnyRole(['admin', 'superadmin']),
            403,
        );
    }
}
