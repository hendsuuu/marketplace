<?php

use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;

test('authenticated customer can fetch normalized shipping quotes from api co id', function () {
    Cache::flush();
    Config::set('services.api_co_id.api_key', 'test-key');
    Config::set('services.api_co_id.origin_village_code', '3318102010');
    Config::set('services.api_co_id.couriers', ['JNE', 'JT', 'LION']);

    Http::fake([
        'https://use.api.co.id/*' => Http::response([
            'is_success' => true,
            'message' => 'Success',
            'data' => [
                'origin_village_code' => '3318102010',
                'destination_village_code' => '3174050001',
                'weight' => 2,
                'couriers' => [
                    [
                        'courier_code' => 'JT',
                        'courier_name' => 'J&T Express',
                        'price' => 18000,
                        'weight' => 2,
                        'estimation' => '1 - 2 days',
                    ],
                    [
                        'courier_code' => 'LION',
                        'courier_name' => 'Lion Parcel',
                        'price' => 21000,
                        'weight' => 2,
                        'estimation' => '2 - 3 days',
                    ],
                    [
                        'courier_code' => 'SAP',
                        'courier_name' => 'SAP Express',
                        'price' => 26000,
                        'weight' => 2,
                        'estimation' => '3 - 4 days',
                    ],
                ],
            ],
        ]),
    ]);

    $response = $this
        ->actingAs(User::factory()->create())
        ->postJson(route('shipping.quote'), [
            'destination_village_code' => 3174050001,
            'weight' => 1500,
            'couriers' => ['JT', 'LION'],
        ]);

    $response
        ->assertOk()
        ->assertJsonPath('data.0.shipping_name', 'J&T Express')
        ->assertJsonPath('data.0.shipping_code', 'JT')
        ->assertJsonPath('data.0.service_name', 'JT')
        ->assertJsonPath('data.0.shipping_cost', 18000)
        ->assertJsonPath('data.0.weight', 2000)
        ->assertJsonCount(2, 'data');

    Http::assertSent(function ($request) {
        return $request->url() === 'https://use.api.co.id/expedition/shipping-cost?origin_village_code=3318102010&destination_village_code=3174050001&weight=2'
            && $request->hasHeader('x-api-co-id', 'test-key');
    });
});

test('shipping quote can use authenticated customer destination from profile', function () {
    Cache::flush();
    Config::set('services.api_co_id.api_key', 'test-key');
    Config::set('services.api_co_id.origin_village_code', '3318102010');
    Config::set('services.api_co_id.couriers', ['JT']);

    Http::fake([
        'https://use.api.co.id/*' => Http::response([
            'is_success' => true,
            'message' => 'Success',
            'data' => [
                'couriers' => [
                    [
                        'courier_code' => 'JT',
                        'courier_name' => 'J&T Express',
                        'price' => 19000,
                        'weight' => 2,
                        'estimation' => '2 - 3 days',
                    ],
                ],
            ],
        ]),
    ]);

    $user = User::factory()->create([
        'shipping_district_id' => 3174050001,
    ]);

    $response = $this
        ->actingAs($user)
        ->postJson(route('shipping.quote'), [
            'weight' => 1500,
            'couriers' => ['JT'],
        ]);

    $response
        ->assertOk()
        ->assertJsonPath('data.0.shipping_code', 'JT')
        ->assertJsonPath('data.0.shipping_cost', 19000);

    Http::assertSent(fn ($request) => str_contains($request->url(), 'destination_village_code=3174050001'));
});

test('shipping quote returns validation style error when api co id is not configured', function () {
    Cache::flush();
    Config::set('services.api_co_id.api_key', null);
    Config::set('services.api_co_id.origin_village_code', null);

    $response = $this
        ->actingAs(User::factory()->create())
        ->postJson(route('shipping.quote'), [
            'destination_village_code' => 3174050001,
            'weight' => 1200,
            'couriers' => ['JT'],
        ]);

    $response
        ->assertStatus(422)
        ->assertJsonPath('message', 'API ongkir api.co.id belum dikonfigurasi lengkap. Isi API key dan origin village code terlebih dahulu.');
});

test('shipping quote returns graceful upstream error when api co id is unavailable', function () {
    Cache::flush();
    Config::set('services.api_co_id.api_key', 'test-key');
    Config::set('services.api_co_id.origin_village_code', '3318102010');
    Config::set('services.api_co_id.couriers', ['JT']);

    Http::fake([
        'https://use.api.co.id/*' => Http::response([
            'is_success' => false,
            'message' => 'Upstream error',
        ], 500),
    ]);

    $response = $this
        ->actingAs(User::factory()->create())
        ->postJson(route('shipping.quote'), [
            'destination_village_code' => 3174050001,
            'weight' => 1200,
            'couriers' => ['JT'],
        ]);

    $response
        ->assertStatus(422)
        ->assertJsonPath('message', 'Upstream error');
});
