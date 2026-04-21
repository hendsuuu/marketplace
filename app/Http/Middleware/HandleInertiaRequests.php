<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $user = $request->user();
        $cartCount = 0;
        $wishlistCount = 0;
        $unreadNotificationCount = 0;

        if ($user) {
            $cartCount = $user->cart()->withCount('items')->first()?->items_count ?? 0;
            $wishlistCount = $user->wishlists()->count();
            $unreadNotificationCount = $user->notifications()->whereNull('read_at')->count();
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'address' => $user->address,
                    'instagram' => $user->instagram,
                    'birth_date' => $user->birth_date?->format('Y-m-d'),
                    'identity_card' => $user->identity_card,
                    'avatar' => $user->avatar,
                    'shipping_province' => $user->shipping_province,
                    'shipping_city' => $user->shipping_city,
                    'shipping_district' => $user->shipping_district,
                    'shipping_village_code' => $user->shipping_district_id,
                    'shipping_postal_code' => $user->shipping_postal_code,
                    'shipping_district_id' => $user->shipping_district_id,
                    'email_verified_at' => $user->email_verified_at?->toAtomString(),
                    'two_factor_enabled' => filled($user->two_factor_secret),
                    'created_at' => $user->created_at?->toAtomString(),
                    'updated_at' => $user->updated_at?->toAtomString(),
                ] : null,
                'roles' => $user?->getRoleNames()->values()->all() ?? [],
                'permissions' => $user?->getAllPermissions()->pluck('name')->values()->all() ?? [],
            ],
            'storefront' => [
                'cart_count' => $cartCount,
                'wishlist_count' => $wishlistCount,
                'unread_notifications_count' => $unreadNotificationCount,
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
        ];
    }
}
