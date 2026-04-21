<?php

use App\Models\User;

test('admin can access assigned admin resource pages', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    foreach ([
        'admin.dashboard' => [],
        'admin.products.index' => [],
        'admin.categories.index' => [],
        'admin.brands.index' => [],
        'admin.users.index' => [],
    ] as $route => $parameters) {
        $this->actingAs($admin)
            ->getInertia(route($route, $parameters))
            ->assertOk();
    }
});

test('superadmin can access all primary admin index pages', function () {
    $superadmin = User::factory()->create();
    $superadmin->assignRole('superadmin');

    foreach ([
        'admin.dashboard' => [],
        'admin.products.index' => [],
        'admin.categories.index' => [],
        'admin.brands.index' => [],
        'admin.users.index' => [],
        'admin.orders.index' => [],
    ] as $route => $parameters) {
        $this->actingAs($superadmin)
            ->getInertia(route($route, $parameters))
            ->assertOk();
    }
});
