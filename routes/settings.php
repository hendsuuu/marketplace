<?php

use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\SecurityController;
use App\Http\Controllers\LocationRegionController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    Route::redirect('settings', '/settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::get('location/regions/provinces', [LocationRegionController::class, 'provinces'])->name('location.regions.provinces');
    Route::get('location/regions/provinces/{provinceCode}/regencies', [LocationRegionController::class, 'regencies'])->name('location.regions.regencies');
    Route::get('location/regions/regencies/{regencyCode}/districts', [LocationRegionController::class, 'districts'])->name('location.regions.districts');
    Route::get('location/regions/districts/{districtCode}/villages', [LocationRegionController::class, 'villages'])->name('location.regions.villages');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('settings/security', [SecurityController::class, 'edit'])->name('security.edit');

    Route::put('settings/password', [SecurityController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('user-password.update');

    Route::inertia('settings/appearance', 'settings/appearance')->name('appearance.edit');
});
