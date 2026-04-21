<?php

use App\Enums\OrderStatus;
use App\Models\Brand;
use App\Models\Cart;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Size;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;

test('authenticated customer can create checkout order and receive midtrans snap token', function () {
    Cache::flush();

    Config::set('services.api_co_id.api_key', 'api-co-test');
    Config::set('services.api_co_id.origin_village_code', '3318102010');
    Config::set('services.api_co_id.couriers', ['JT']);
    Config::set('services.midtrans.server_key', 'mid-server-test');
    Config::set('services.midtrans.client_key', 'mid-client-test');
    Config::set('services.midtrans.snap_base_url', 'https://app.sandbox.midtrans.com');
    Config::set('services.midtrans.api_base_url', 'https://api.sandbox.midtrans.com');

    Http::fake([
        'https://use.api.co.id/*' => Http::response([
            'is_success' => true,
            'message' => 'Success',
            'data' => [
                'couriers' => [
                    [
                        'courier_code' => 'JT',
                        'courier_name' => 'J&T Express',
                        'price' => 18000,
                        'weight' => 2,
                        'estimation' => '1 - 2 days',
                    ],
                ],
            ],
        ]),
        'https://app.sandbox.midtrans.com/snap/v1/transactions' => Http::response([
            'token' => 'snap-token-123',
            'redirect_url' => 'https://app.sandbox.midtrans.com/snap/v4/redirection/token-123',
        ]),
    ]);

    $user = User::factory()->create([
        'phone' => '08123456789',
        'address' => 'Jl. Sudirman No. 10',
        'shipping_province' => 'Jawa Tengah',
        'shipping_city' => 'Kabupaten Pati',
        'shipping_district' => 'Pati',
        'shipping_postal_code' => '59111',
        'shipping_district_id' => 3318102010,
    ]);

    seedCartForCheckout($user);

    $response = $this->actingAs($user)->post(route('checkout.store'), [
        'shipping_code' => 'JT',
        'service_name' => 'JT',
        'notes' => 'Mohon dikonfirmasi via WhatsApp.',
    ]);

    $order = Order::query()->first();

    expect($order)->not->toBeNull();

    $response->assertRedirect(route('checkout.orders.show', $order));

    expect($order->status)->toBe(OrderStatus::PendingPayment)
        ->and($order->shipping_cost)->toBe(18000)
        ->and($order->payment_token)->toBe('snap-token-123')
        ->and($order->payment_redirect_url)->toBe('https://app.sandbox.midtrans.com/snap/v4/redirection/token-123')
        ->and($order->items()->count())->toBe(1)
        ->and($user->cart()->first()?->items()->count())->toBe(0);

    Http::assertSent(function ($request) {
        return $request->url() === 'https://app.sandbox.midtrans.com/snap/v1/transactions'
            && data_get($request->data(), 'transaction_details.gross_amount') === 418000;
    });
});

test('midtrans notification updates pending order to payment received', function () {
    Config::set('services.midtrans.server_key', 'mid-server-test');

    $user = User::factory()->create();
    $order = Order::query()->create([
        'user_id' => $user->id,
        'order_number' => 'ORD-TEST-001',
        'status' => OrderStatus::PendingPayment->value,
        'subtotal' => 400000,
        'deposit_total' => 100000,
        'shipping_cost' => 18000,
        'total' => 518000,
        'rental_start_date' => now()->toDateString(),
        'rental_end_date' => now()->addDays(3)->toDateString(),
        'shipping_name' => $user->name,
        'shipping_phone' => '08123456789',
        'shipping_address' => 'Jl. Sudirman No. 10',
        'shipping_city' => 'Kabupaten Pati',
        'shipping_province' => 'Jawa Tengah',
        'shipping_postal_code' => '59111',
    ]);

    $grossAmount = '518000.00';
    $statusCode = '200';
    $signature = hash('sha512', $order->order_number.$statusCode.$grossAmount.'mid-server-test');

    $response = $this->postJson(route('payments.midtrans.notifications'), [
        'order_id' => $order->order_number,
        'status_code' => $statusCode,
        'gross_amount' => $grossAmount,
        'signature_key' => $signature,
        'transaction_status' => 'settlement',
        'payment_type' => 'bank_transfer',
        'transaction_id' => 'trx-123',
        'settlement_time' => now()->toDateTimeString(),
    ]);

    $response->assertOk()->assertJsonPath('message', 'OK');

    expect($order->fresh()->status)->toBe(OrderStatus::PaymentReceived)
        ->and($order->fresh()->payment_reference)->toBe('trx-123')
        ->and($order->fresh()->payment_method)->toBe('bank_transfer')
        ->and($order->fresh()->paid_at)->not->toBeNull();
});

test('customer can refresh order payment status from midtrans api', function () {
    Config::set('services.midtrans.server_key', 'mid-server-test');
    Config::set('services.midtrans.client_key', 'mid-client-test');
    Config::set('services.midtrans.api_base_url', 'https://api.sandbox.midtrans.com');

    Http::fake([
        'https://api.sandbox.midtrans.com/v2/*/status' => Http::response([
            'transaction_status' => 'settlement',
            'payment_type' => 'bank_transfer',
            'transaction_id' => 'trx-refresh-001',
            'settlement_time' => now()->toDateTimeString(),
        ]),
    ]);

    $user = User::factory()->create();
    $order = Order::query()->create([
        'user_id' => $user->id,
        'order_number' => 'ORD-TEST-REFRESH',
        'status' => OrderStatus::PendingPayment->value,
        'subtotal' => 250000,
        'deposit_total' => 100000,
        'shipping_cost' => 18000,
        'total' => 368000,
        'rental_start_date' => now()->toDateString(),
        'rental_end_date' => now()->addDays(2)->toDateString(),
        'shipping_name' => $user->name,
        'shipping_phone' => '08123456789',
        'shipping_address' => 'Jl. Sudirman No. 10',
        'shipping_city' => 'Kabupaten Pati',
        'shipping_province' => 'Jawa Tengah',
        'shipping_postal_code' => '59111',
    ]);

    $response = $this->actingAs($user)->post(route('checkout.orders.refresh', $order));

    $response->assertRedirect();

    expect($order->fresh()->status)->toBe(OrderStatus::PaymentReceived)
        ->and($order->fresh()->payment_reference)->toBe('trx-refresh-001');
});

function seedCartForCheckout(User $user): Cart
{
    $category = Category::query()->create([
        'name' => 'Dress',
        'slug' => 'dress-test',
        'type' => 'dress',
        'sort_order' => 1,
        'is_active' => true,
    ]);

    $brand = Brand::query()->create([
        'name' => 'Aurelia',
        'slug' => 'aurelia',
        'is_active' => true,
    ]);

    $size = Size::query()->create([
        'name' => 'M',
        'label' => 'Medium',
        'sort_order' => 2,
    ]);

    $product = Product::query()->create([
        'category_id' => $category->id,
        'brand_id' => $brand->id,
        'name' => 'Aurelia Evening Dress',
        'slug' => 'aurelia-evening-dress',
        'code' => 'DRS-001',
        'price' => 300000,
        'deposit_price' => 100000,
        'weight_grams' => 1500,
        'is_active' => true,
    ]);

    $variant = ProductVariant::query()->create([
        'product_id' => $product->id,
        'size_id' => $size->id,
        'color' => 'Mocha',
        'stock' => 1,
        'additional_price' => 0,
        'sku' => 'DRS-001-M',
        'is_available' => true,
    ]);

    $cart = $user->cart()->create();
    $cart->items()->create([
        'product_variant_id' => $variant->id,
        'rental_start_date' => now()->addDays(2)->toDateString(),
        'rental_end_date' => now()->addDays(5)->toDateString(),
    ]);

    return $cart;
}
