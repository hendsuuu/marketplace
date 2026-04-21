<?php

use App\Models\User;

test('confirm password screen can be rendered', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->getInertia(route('password.confirm'));

    $response
        ->assertOk()
        ->assertJsonPath('component', 'auth/confirm-password');
});

test('password confirmation requires authentication', function () {
    $response = $this->get(route('password.confirm'));

    $response->assertRedirect(route('login'));
});
