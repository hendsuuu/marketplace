<?php

namespace App\Actions\Checkout;

use App\Enums\OrderStatus;
use App\Models\Cart;
use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CreateOrderFromCartAction
{
    /**
     * @param  Collection<int, array<string, mixed>>  $items
     * @param  array<string, mixed>  $summary
     * @param  array<string, mixed>  $selectedRate
     */
    public function execute(
        User $user,
        Cart $cart,
        Collection $items,
        array $summary,
        array $selectedRate,
        ?string $notes = null,
    ): Order {
        return DB::transaction(function () use ($items, $notes, $selectedRate, $summary, $user) {
            $order = Order::create([
                'user_id' => $user->id,
                'order_number' => $this->generateOrderNumber(),
                'status' => OrderStatus::PendingPayment->value,
                'subtotal' => (int) ($summary['rental_total'] ?? 0),
                'deposit_total' => (int) ($summary['deposit_total'] ?? 0),
                'shipping_cost' => (int) ($selectedRate['shipping_cost'] ?? 0),
                'total' => (int) ($summary['grand_total'] ?? 0) + (int) ($selectedRate['shipping_cost'] ?? 0),
                'rental_start_date' => $items->min('rental_start_date'),
                'rental_end_date' => $items->max('rental_end_date'),
                'shipping_name' => $user->name,
                'shipping_phone' => $user->phone ?: '-',
                'shipping_address' => $user->address ?: '-',
                'shipping_city' => $user->shipping_city ?: '-',
                'shipping_province' => $user->shipping_province ?: '-',
                'shipping_postal_code' => $user->shipping_postal_code ?: '-',
                'shipping_courier' => $selectedRate['shipping_name'] ?? $selectedRate['shipping_code'] ?? null,
                'shipping_service' => $selectedRate['service_name'] ?? null,
                'shipping_etd' => $selectedRate['etd'] ?? null,
                'payment_gateway' => 'midtrans',
                'notes' => $notes,
            ]);

            $order->items()->createMany($items->map(fn (array $item) => [
                'product_variant_id' => $item['variant']['id'],
                'product_name' => $item['product']['name'],
                'product_code' => $item['product']['code'],
                'variant_size' => $item['variant']['size_name'],
                'variant_color' => $item['variant']['color'],
                'price' => $item['pricing']['rental'],
                'deposit_price' => $item['pricing']['deposit'],
                'quantity' => 1,
            ])->all());

            return $order->refresh();
        });
    }

    private function generateOrderNumber(): string
    {
        return 'ORD-'.now()->format('YmdHis').'-'.Str::upper(Str::random(4));
    }
}
