<?php

use App\Http\Controllers\Admin\BrandController;
use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\OrderController;
use App\Http\Controllers\Admin\ProductController;
use App\Http\Controllers\Admin\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'role:admin|superadmin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

        Route::resource('categories', CategoryController::class)->except(['show']);
        Route::resource('brands', BrandController::class)->except(['show']);

        Route::resource('products', ProductController::class);
        Route::delete('products/{product}/images/{image}', [ProductController::class, 'destroyImage'])
            ->name('products.images.destroy');
        Route::patch('products/{product}/images/{image}/primary', [ProductController::class, 'setPrimaryImage'])
            ->name('products.images.primary');

        Route::get('users', [UserController::class, 'index'])
            ->middleware('permission:users.read')
            ->name('users.index');
        Route::patch('users/{user}/password', [UserController::class, 'updatePassword'])
            ->middleware('permission:users.reset-password')
            ->name('users.update-password');

        Route::get('orders', [OrderController::class, 'index'])->name('orders.index');
        Route::patch('orders/{order}/status', [OrderController::class, 'updateStatus'])->name('orders.update-status');

        Route::middleware('role:superadmin')->group(function () {
            Route::patch('users/{user}/roles', [UserController::class, 'updateRoles'])->name('users.update-roles');
        });
    });
