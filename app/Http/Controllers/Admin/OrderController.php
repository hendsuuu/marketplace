<?php

namespace App\Http\Controllers\Admin;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OrderController extends Controller
{
    public function index(Request $request): \Inertia\Response
    {
        abort_unless($request->user()->can('orders.read'), 403);

        $query = Order::with('user')->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $query->where(function ($query) use ($request) {
                $query->where('order_number', 'like', '%'.$request->search.'%')
                    ->orWhereHas('user', fn ($user) => $user->where('name', 'like', '%'.$request->search.'%')
                        ->orWhere('email', 'like', '%'.$request->search.'%'));
            });
        }

        $orders = $query->paginate(20)->withQueryString()->through(fn ($order) => [
            'id' => $order->id,
            'order_number' => $order->order_number,
            'customer' => $order->user?->name ?? '—',
            'customer_email' => $order->user?->email ?? '—',
            'status' => $order->status->value,
            'status_label' => $order->status->label(),
            'status_color' => $order->status->color(),
            'total' => $order->total,
            'rental_start' => $order->rental_start_date?->format('d M Y'),
            'rental_end' => $order->rental_end_date?->format('d M Y'),
            'created_at' => $order->created_at->format('d M Y H:i'),
        ]);

        $statuses = collect(OrderStatus::cases())->map(fn ($status) => [
            'value' => $status->value,
            'label' => $status->label(),
        ]);

        return Inertia::render('admin/orders/index', [
            'orders' => $orders,
            'statuses' => $statuses,
            'filters' => $request->only(['status', 'search']),
        ]);
    }

    public function updateStatus(Request $request, Order $order): \Illuminate\Http\RedirectResponse
    {
        abort_unless($request->user()->can('orders.update'), 403);

        $request->validate([
            'status' => ['required', 'string', 'in:'.implode(',', array_column(OrderStatus::cases(), 'value'))],
        ]);

        $order->update(['status' => $request->status]);

        return back()->with('success', 'Status pesanan berhasil diperbarui.');
    }
}
