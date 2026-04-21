<?php

use App\Models\User;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;

test('profile page is displayed', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->getInertia(route('profile.edit'));

    $response->assertOk();
});

test('profile page only bootstraps provinces for address selector', function () {
    Config::set('services.api_co_id.api_key', 'test-key');

    $user = User::factory()->create([
        'shipping_city' => 'Kabupaten Pati',
        'shipping_district' => 'Pati',
        'shipping_district_id' => 3318102010,
    ]);

    Http::fake([
        'https://use.api.co.id/regional/indonesia/provinces*' => Http::response([
            'is_success' => true,
            'message' => 'Success',
            'data' => [
                ['code' => '33', 'name' => 'JAWA TENGAH'],
            ],
            'paging' => [
                'page' => 1,
                'size' => 100,
                'total_item' => 1,
                'total_page' => 1,
            ],
        ]),
        '*' => Http::response([
            'is_success' => false,
            'message' => 'Unexpected endpoint',
            'data' => [],
        ], 500),
    ]);

    $this
        ->actingAs($user)
        ->getInertia(route('profile.edit'))
        ->assertOk();

    Http::assertSentCount(1);
    Http::assertSent(fn ($request) => str_contains($request->url(), '/regional/indonesia/provinces'));
});

test('profile information can be updated', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patch(route('profile.update'), [
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('profile.edit'));

    $user->refresh();

    expect($user->name)->toBe('Test User');
    expect($user->email)->toBe('test@example.com');
    expect($user->email_verified_at)->toBeNull();
});

test('profile information can be updated without premium postal code data', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patch(route('profile.update'), [
            'name' => 'Customer Baru',
            'email' => $user->email,
            'shipping_province' => 'Jawa Tengah',
            'shipping_city' => 'Kabupaten Pati',
            'shipping_district' => 'Pati',
            'shipping_district_id' => '3318102010',
            'shipping_postal_code' => 'postal_code available only on premium',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('profile.edit'));

    $user->refresh();

    expect($user->shipping_province)->toBe('Jawa Tengah');
    expect($user->shipping_city)->toBe('Kabupaten Pati');
    expect($user->shipping_district)->toBe('Pati');
    expect($user->shipping_district_id)->toBe(3318102010);
    expect($user->shipping_postal_code)->toBeNull();
});

test('email verification status is unchanged when the email address is unchanged', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patch(route('profile.update'), [
            'name' => 'Test User',
            'email' => $user->email,
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('profile.edit'));

    expect($user->refresh()->email_verified_at)->not->toBeNull();
});

test('user can delete their account', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->delete(route('profile.destroy'), [
            'password' => 'password',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('home'));

    $this->assertGuest();
    expect($user->fresh())->toBeNull();
});

test('correct password must be provided to delete account', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->from(route('profile.edit'))
        ->delete(route('profile.destroy'), [
            'password' => 'wrong-password',
        ]);

    $response
        ->assertSessionHasErrors('password')
        ->assertRedirect(route('profile.edit'));

    expect($user->fresh())->not->toBeNull();
});
