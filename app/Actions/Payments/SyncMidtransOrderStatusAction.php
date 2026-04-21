<?php

namespace App\Actions\Payments;

use App\Enums\OrderStatus;
use App\Models\Order;
use Illuminate\Support\Carbon;

class SyncMidtransOrderStatusAction
{
    /**
     * @param  array<string, mixed>  $payload
     */
    public function execute(Order $order, array $payload): Order
    {
        $transactionStatus = (string) data_get($payload, 'transaction_status', '');
        $fraudStatus = (string) data_get($payload, 'fraud_status', '');
        $nextStatus = $this->mapOrderStatus($transactionStatus, $fraudStatus);

        $order->fill([
            'status' => $this->resolveNextStatus($order->status, $nextStatus)->value,
            'payment_gateway' => 'midtrans',
            'payment_method' => data_get($payload, 'payment_type') ?: $order->payment_method,
            'payment_reference' => data_get($payload, 'transaction_id') ?: $order->payment_reference,
            'payment_payload' => $payload,
            'paid_at' => $this->resolvePaidAt($payload, $nextStatus, $order),
        ]);

        $order->save();

        return $order->refresh();
    }

    private function mapOrderStatus(string $transactionStatus, string $fraudStatus): OrderStatus
    {
        return match ($transactionStatus) {
            'capture' => $fraudStatus === 'challenge'
                ? OrderStatus::PendingPayment
                : OrderStatus::PaymentReceived,
            'settlement' => OrderStatus::PaymentReceived,
            'pending', 'authorize' => OrderStatus::PendingPayment,
            'cancel', 'deny', 'expire', 'failure' => OrderStatus::Cancelled,
            default => OrderStatus::PendingPayment,
        };
    }

    private function resolveNextStatus(OrderStatus $currentStatus, OrderStatus $nextStatus): OrderStatus
    {
        if (in_array($currentStatus, [
            OrderStatus::Processing,
            OrderStatus::Shipped,
            OrderStatus::Delivered,
            OrderStatus::Renting,
            OrderStatus::AwaitingReturn,
            OrderStatus::Completed,
            OrderStatus::DepositReturned,
        ], true)) {
            return $currentStatus;
        }

        return $nextStatus;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function resolvePaidAt(array $payload, OrderStatus $nextStatus, Order $order): ?Carbon
    {
        if ($order->paid_at) {
            return $order->paid_at;
        }

        if ($nextStatus !== OrderStatus::PaymentReceived) {
            return null;
        }

        $settlementTime = data_get($payload, 'settlement_time') ?: data_get($payload, 'transaction_time');

        return is_string($settlementTime) && $settlementTime !== ''
            ? Carbon::parse($settlementTime)
            : now();
    }
}
