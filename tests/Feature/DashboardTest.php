<?php

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\User;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    Order::create([
        'user_id' => $user->id,
        'order_number' => 'ORD-TEST-001',
        'status' => OrderStatus::Processing->value,
        'subtotal' => 300000,
        'deposit_total' => 150000,
        'shipping_cost' => 25000,
        'total' => 475000,
        'rental_start_date' => now()->addDays(3)->toDateString(),
        'rental_end_date' => now()->addDays(6)->toDateString(),
        'shipping_name' => 'Test User',
        'shipping_phone' => '08123456789',
        'shipping_address' => 'Jl. Mawar No. 1',
        'shipping_city' => 'Surabaya',
        'shipping_province' => 'Jawa Timur',
        'shipping_postal_code' => '60115',
    ]);

    $response = $this->getInertia(route('dashboard'));
    $response
        ->assertOk()
        ->assertJsonPath('component', 'dashboard')
        ->assertJsonPath('props.stats.active_orders', 1)
        ->assertJsonPath('props.recent_orders.0.order_number', 'ORD-TEST-001');
});
