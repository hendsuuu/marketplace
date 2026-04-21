<?php

use App\Models\User;

test('admin can access admin dashboard', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin)
        ->getInertia(route('admin.dashboard'))
        ->assertOk()
        ->assertJsonPath('component', 'admin/dashboard');
});

test('superadmin can access admin dashboard', function () {
    $superadmin = User::factory()->create();
    $superadmin->assignRole('superadmin');

    $this->actingAs($superadmin)
        ->getInertia(route('admin.dashboard'))
        ->assertOk()
        ->assertJsonPath('component', 'admin/dashboard');
});

test('customer cannot access admin dashboard', function () {
    $customer = User::factory()->create();
    $customer->assignRole('customer');

    $this->actingAs($customer)
        ->get(route('admin.dashboard'))
        ->assertForbidden();
});
