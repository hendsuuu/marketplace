<?php

use App\Http\Controllers\CartController;
use App\Http\Controllers\CatalogController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\CustomerDashboardController;
use App\Http\Controllers\MidtransNotificationController;
use App\Http\Controllers\PublicProductController;
use App\Http\Controllers\ShippingQuoteController;
use App\Http\Controllers\WishlistController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/catalog')->name('home');
Route::post('payments/midtrans/notifications', MidtransNotificationController::class)->name('payments.midtrans.notifications');

Route::get('/catalog', [CatalogController::class, 'index'])->name('catalog');
Route::get('/products/{product:slug}', [PublicProductController::class, 'show'])->name('products.show');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        if (request()->user()->hasAnyRole(['superadmin', 'admin'])) {
            return redirect()->route('admin.dashboard');
        }

        return app(CustomerDashboardController::class)(request());
    })->name('dashboard');

    Route::get('cart', [CartController::class, 'index'])->name('cart.index');
    Route::post('cart', [CartController::class, 'store'])->name('cart.store');
    Route::patch('cart/items/{item}', [CartController::class, 'update'])->name('cart.items.update');
    Route::delete('cart/items/{item}', [CartController::class, 'destroy'])->name('cart.items.destroy');
    Route::get('checkout', [CheckoutController::class, 'index'])->name('checkout.index');
    Route::post('checkout', [CheckoutController::class, 'store'])->name('checkout.store');
    Route::get('checkout/orders/{order}', [CheckoutController::class, 'show'])->name('checkout.orders.show');
    Route::post('checkout/orders/{order}/refresh', [CheckoutController::class, 'refresh'])->name('checkout.orders.refresh');
    Route::post('shipping/quote', ShippingQuoteController::class)->name('shipping.quote');

    Route::get('account/wishlist', [WishlistController::class, 'index'])->name('account.wishlist');
    Route::post('wishlist/toggle', [WishlistController::class, 'toggle'])->name('wishlist.toggle');
});

require __DIR__.'/settings.php';
