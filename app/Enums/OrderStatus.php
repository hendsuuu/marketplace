<?php

namespace App\Enums;

enum OrderStatus: string
{
    case PendingPayment    = 'pending_payment';
    case PaymentReceived   = 'payment_received';
    case Processing        = 'processing';
    case Shipped           = 'shipped';
    case Delivered         = 'delivered';
    case Renting           = 'renting';
    case AwaitingReturn    = 'awaiting_return';
    case Completed         = 'completed';
    case Cancelled         = 'cancelled';
    case DepositReturned   = 'deposit_returned';

    public function label(): string
    {
        return match($this) {
            self::PendingPayment  => 'Menunggu Pembayaran',
            self::PaymentReceived => 'Pembayaran Diterima',
            self::Processing      => 'Diproses',
            self::Shipped         => 'Sedang Dikirim',
            self::Delivered       => 'Sudah Sampai',
            self::Renting         => 'Sedang Disewa',
            self::AwaitingReturn  => 'Menunggu Pengembalian',
            self::Completed       => 'Selesai',
            self::Cancelled       => 'Dibatalkan',
            self::DepositReturned => 'Deposit Dikembalikan',
        };
    }

    public function color(): string
    {
        return match($this) {
            self::PendingPayment  => 'yellow',
            self::PaymentReceived => 'blue',
            self::Processing      => 'indigo',
            self::Shipped         => 'purple',
            self::Delivered       => 'teal',
            self::Renting         => 'green',
            self::AwaitingReturn  => 'orange',
            self::Completed       => 'emerald',
            self::Cancelled       => 'red',
            self::DepositReturned => 'gray',
        };
    }

    /** Status yang masih bisa di-edit oleh customer */
    public function isEditable(): bool
    {
        return in_array($this, [
            self::PendingPayment,
            self::PaymentReceived,
        ]);
    }

    /** Status yang masih bisa di-cancel oleh customer */
    public function isCancellable(): bool
    {
        return in_array($this, [
            self::PendingPayment,
        ]);
    }
}
