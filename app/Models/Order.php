<?php

namespace App\Models;

use App\Enums\OrderStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Order extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id', 'order_number', 'status',
        'subtotal', 'deposit_total', 'shipping_cost', 'total',
        'rental_start_date', 'rental_end_date',
        'shipping_name', 'shipping_phone', 'shipping_address',
        'shipping_city', 'shipping_province', 'shipping_postal_code',
        'shipping_courier', 'shipping_service', 'shipping_etd', 'shipping_tracking_number',
        'payment_method', 'payment_gateway', 'payment_reference', 'payment_token', 'payment_redirect_url', 'payment_payload', 'paid_at',
        'notes', 'admin_notes',
    ];

    protected function casts(): array
    {
        return [
            'status'             => OrderStatus::class,
            'rental_start_date'  => 'date',
            'rental_end_date'    => 'date',
            'payment_payload'    => 'array',
            'paid_at'            => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
}
