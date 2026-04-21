<?php

namespace App\Http\Controllers;

use App\Http\Requests\Storefront\AddToCartRequest;
use App\Http\Requests\Storefront\UpdateCartItemRequest;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\ProductVariant;
use App\Services\Shipping\ApiCoIdShippingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;
use Throwable;

class CartController extends Controller
{
    public function __construct(
        private readonly ApiCoIdShippingService $shippingService,
    ) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
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
                    'requires_dress_or_clutch' => $product?->requires_dress_or_clutch ?? false,
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
            'rental_total' => $items->sum('pricing.rental'),
            'deposit_total' => $items->sum('pricing.deposit'),
            'grand_total' => $items->sum('pricing.subtotal'),
            'total_weight_grams' => $items->sum('product.weight_grams'),
        ];

        $courierOptions = $this->courierOptions();
        [$shippingRates, $shippingQuoteError] = $this->resolveShippingRates(
            destinationVillageCode: $user->shipping_district_id,
            weightInGram: (int) $summary['total_weight_grams'],
            courierOptions: $courierOptions,
        );

        return Inertia::render('cart/index', [
            'items' => $items,
            'summary' => $summary,
            'shipping' => [
                'destination' => [
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
                'courier_options' => $courierOptions,
                'rates' => $shippingRates,
                'quote_error' => $shippingQuoteError,
            ],
        ]);
    }

    public function store(AddToCartRequest $request): RedirectResponse
    {
        $variant = ProductVariant::query()
            ->with('product.category.parent')
            ->where('is_available', true)
            ->findOrFail($request->integer('product_variant_id'));

        $product = $variant->product;

        if (! $product || ! $product->is_active || $variant->stock < 1) {
            return back()->withErrors([
                'product_variant_id' => 'Varian produk tidak tersedia untuk disewa saat ini.',
            ]);
        }

        $cart = $request->user()->cart()->firstOrCreate();

        if ($product->requires_dress_or_clutch && ! $this->cartHasDressOrClutch($cart)) {
            return back()->withErrors([
                'product_variant_id' => 'Aksesori hanya bisa disewa jika cart sudah berisi dress atau clutch.',
            ]);
        }

        $cart->items()->updateOrCreate(
            ['product_variant_id' => $variant->id],
            [
                'rental_start_date' => $request->date('rental_start_date'),
                'rental_end_date' => $request->date('rental_end_date'),
            ],
        );

        return redirect()->route('cart.index')
            ->with('success', 'Produk berhasil ditambahkan ke cart.');
    }

    public function update(UpdateCartItemRequest $request, CartItem $item): RedirectResponse
    {
        abort_if($item->cart?->user_id !== $request->user()->id, 403);

        $item->update($request->validated());

        return back()->with('success', 'Tanggal sewa pada cart berhasil diperbarui.');
    }

    public function destroy(Request $request, CartItem $item): RedirectResponse
    {
        abort_if($item->cart?->user_id !== $request->user()->id, 403);

        $item->delete();

        return back()->with('success', 'Item berhasil dihapus dari cart.');
    }

    private function cartHasDressOrClutch(Cart $cart): bool
    {
        return $cart->items()
            ->whereHas('variant.product.category', function ($query) {
                $query->where('slug', 'clutch')
                    ->orWhere('slug', 'dress')
                    ->orWhere('slug', 'kids-dresses')
                    ->orWhereHas('parent', fn ($parent) => $parent->where('slug', 'dress'));
            })
            ->exists();
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
     * @param  array<int, array{code: string, label: string}>  $courierOptions
     * @return array{0: array<int, array<string, mixed>>, 1: string|null}
     */
    private function resolveShippingRates(
        int|string|null $destinationVillageCode,
        int $weightInGram,
        array $courierOptions,
    ): array {
        if (blank($destinationVillageCode)) {
            return [[], 'Lengkapi lokasi pengiriman sampai kelurahan atau desa di profil customer untuk melihat ongkir otomatis.'];
        }

        if ($weightInGram < 1 || $courierOptions === []) {
            return [[], null];
        }

        try {
            return [
                $this->shippingService->calculateVillageShippingCost(
                    destinationVillageCode: $destinationVillageCode,
                    weightInGram: $weightInGram,
                    couriers: collect($courierOptions)->pluck('code')->all(),
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
}
