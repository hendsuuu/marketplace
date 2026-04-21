<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('order_number')->unique();
            $table->string('status')->default('pending_payment');

            // Pricing
            $table->unsignedBigInteger('subtotal');
            $table->unsignedBigInteger('deposit_total')->default(0);
            $table->unsignedBigInteger('shipping_cost')->default(0);
            $table->unsignedBigInteger('total');

            // Rental period
            $table->date('rental_start_date');
            $table->date('rental_end_date');

            // Shipping info
            $table->string('shipping_name');
            $table->string('shipping_phone');
            $table->text('shipping_address');
            $table->string('shipping_city');
            $table->string('shipping_province');
            $table->string('shipping_postal_code');
            $table->string('shipping_courier')->nullable();
            $table->string('shipping_tracking_number')->nullable();

            // Payment
            $table->string('payment_method')->nullable();
            $table->string('payment_reference')->nullable();  // gateway transaction ID
            $table->timestamp('paid_at')->nullable();

            // Notes
            $table->text('notes')->nullable();
            $table->text('admin_notes')->nullable();

            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_variant_id')->constrained('product_variants');

            // Snapshot at time of order
            $table->string('product_name');
            $table->string('product_code');
            $table->string('variant_size')->nullable();
            $table->string('variant_color')->nullable();
            $table->unsignedBigInteger('price');         // harga sewa
            $table->unsignedBigInteger('deposit_price'); // harga deposit
            $table->unsignedInteger('quantity')->default(1);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
    }
};
