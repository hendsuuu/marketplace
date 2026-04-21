<?php

namespace App\Http\Controllers;

use App\Enums\OrderStatus;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerDashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        $cart = $user->cart()->withCount('items')->first();

        $activeStatuses = [
            OrderStatus::PendingPayment->value,
            OrderStatus::PaymentReceived->value,
            OrderStatus::Processing->value,
            OrderStatus::Shipped->value,
            OrderStatus::Delivered->value,
            OrderStatus::Renting->value,
            OrderStatus::AwaitingReturn->value,
        ];

        $profileChecklist = [
            ['label' => 'Nomor telepon', 'completed' => filled($user->phone)],
            ['label' => 'Alamat lengkap', 'completed' => filled($user->address)],
            ['label' => 'Instagram', 'completed' => filled($user->instagram)],
            ['label' => 'Tanggal lahir', 'completed' => filled($user->birth_date)],
            ['label' => 'Kartu identitas', 'completed' => filled($user->identity_card)],
            ['label' => 'Data pengiriman', 'completed' => filled($user->shipping_city) && filled($user->shipping_district) && filled($user->shipping_district_id)],
        ];

        $profileCompletion = (int) round(
            collect($profileChecklist)->where('completed', true)->count() / max(1, count($profileChecklist)) * 100
        );

        $recentOrders = $user->orders()
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn ($order) => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'status' => $order->status->value,
                'status_label' => $order->status->label(),
                'status_color' => $order->status->color(),
                'total' => $order->total,
                'rental_start_date' => $order->rental_start_date?->format('d M Y'),
                'rental_end_date' => $order->rental_end_date?->format('d M Y'),
                'created_at' => $order->created_at->format('d M Y'),
            ])
            ->values();

        $nextOrder = $user->orders()
            ->whereIn('status', $activeStatuses)
            ->orderByRaw('CASE WHEN rental_start_date IS NULL THEN 1 ELSE 0 END')
            ->orderBy('rental_start_date')
            ->first();

        return Inertia::render('dashboard', [
            'stats' => [
                'cart_items' => $cart?->items_count ?? 0,
                'wishlist_items' => $user->wishlists()->count(),
                'active_orders' => $user->orders()->whereIn('status', $activeStatuses)->count(),
                'completed_orders' => $user->orders()->whereIn('status', [
                    OrderStatus::Completed->value,
                    OrderStatus::DepositReturned->value,
                ])->count(),
                'unread_notifications' => $user->notifications()->whereNull('read_at')->count(),
            ],
            'profile' => [
                'completion' => $profileCompletion,
                'shipping_ready' => filled($user->shipping_district_id),
                'checklist' => $profileChecklist,
                'missing_items' => collect($profileChecklist)
                    ->where('completed', false)
                    ->pluck('label')
                    ->values()
                    ->all(),
            ],
            'next_order' => $nextOrder ? [
                'order_number' => $nextOrder->order_number,
                'status_label' => $nextOrder->status->label(),
                'status_color' => $nextOrder->status->color(),
                'rental_start_date' => $nextOrder->rental_start_date?->format('d M Y'),
                'rental_end_date' => $nextOrder->rental_end_date?->format('d M Y'),
                'shipping_address' => $nextOrder->shipping_address,
                'shipping_city' => $nextOrder->shipping_city,
                'shipping_province' => $nextOrder->shipping_province,
                'total' => $nextOrder->total,
            ] : null,
            'recent_orders' => $recentOrders,
        ]);
    }
}
