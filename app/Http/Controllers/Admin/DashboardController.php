<?php

namespace App\Http\Controllers\Admin;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request): \Inertia\Response
    {
        // ── Stats ─────────────────────────────────────────────────────────
        $stats = [
            'products'       => Product::count(),
            'active_products'=> Product::where('is_active', true)->count(),
            'categories'     => Category::count(),
            'brands'         => Brand::count(),
            'customers'      => User::role('customer')->count(),
            'total_orders'   => Order::count(),
            'pending_orders' => Order::where('status', OrderStatus::PendingPayment->value)->count(),
            'active_orders'  => Order::whereIn('status', [
                OrderStatus::PaymentReceived->value,
                OrderStatus::Processing->value,
                OrderStatus::Shipped->value,
                OrderStatus::Delivered->value,
                OrderStatus::Renting->value,
                OrderStatus::AwaitingReturn->value,
            ])->count(),
            'revenue_month'  => Order::whereNotIn('status', [
                OrderStatus::Cancelled->value,
                OrderStatus::PendingPayment->value,
            ])
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->sum('total'),
            'revenue_total'  => Order::whereNotIn('status', [
                OrderStatus::Cancelled->value,
                OrderStatus::PendingPayment->value,
            ])->sum('total'),
        ];

        // ── Orders by status ──────────────────────────────────────────────
        $ordersByStatus = collect(OrderStatus::cases())->map(fn ($s) => [
            'value' => $s->value,
            'label' => $s->label(),
            'color' => $s->color(),
            'count' => Order::where('status', $s->value)->count(),
        ])->filter(fn ($s) => $s['count'] > 0)->values();

        // ── Recent orders ─────────────────────────────────────────────────
        $recentOrders = Order::with('user')
            ->latest()
            ->limit(8)
            ->get()
            ->map(fn ($order) => [
                'id'           => $order->id,
                'order_number' => $order->order_number,
                'customer'     => $order->user?->name ?? '—',
                'status'       => $order->status->value,
                'status_label' => $order->status->label(),
                'status_color' => $order->status->color(),
                'total'        => $order->total,
                'created_at'   => $order->created_at->format('d M Y'),
            ]);

        // ── Low-stock products ────────────────────────────────────────────
        $lowStockProducts = Product::withCount([
            'variants as available_variants_count' => fn ($q) => $q->where('is_available', true),
        ])
            ->where('is_active', true)
            ->latest()
            ->get()
            ->filter(fn (Product $product) => $product->available_variants_count <= 2)
            ->take(5)
            ->map(fn ($p) => [
                'id'    => $p->id,
                'name'  => $p->name,
                'code'  => $p->code,
                'count' => $p->available_variants_count,
            ]);

        return Inertia::render('admin/dashboard', [
            'stats'            => $stats,
            'ordersByStatus'   => $ordersByStatus,
            'recentOrders'     => $recentOrders,
            'lowStockProducts' => $lowStockProducts,
        ]);
    }
}
