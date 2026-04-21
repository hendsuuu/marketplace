<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('orders')) {
            return;
        }

        $missingColumns = collect([
            'shipping_service',
            'shipping_etd',
            'payment_gateway',
            'payment_token',
            'payment_redirect_url',
            'payment_payload',
        ])->filter(fn (string $column) => ! Schema::hasColumn('orders', $column));

        if ($missingColumns->isEmpty()) {
            return;
        }

        Schema::table('orders', function (Blueprint $table) use ($missingColumns) {
            if ($missingColumns->contains('shipping_service')) {
                $table->string('shipping_service')->nullable()->after('shipping_courier');
            }

            if ($missingColumns->contains('shipping_etd')) {
                $table->string('shipping_etd')->nullable()->after('shipping_service');
            }

            if ($missingColumns->contains('payment_gateway')) {
                $table->string('payment_gateway')->nullable()->after('payment_method');
            }

            if ($missingColumns->contains('payment_token')) {
                $table->string('payment_token')->nullable()->after('payment_gateway');
            }

            if ($missingColumns->contains('payment_redirect_url')) {
                $table->text('payment_redirect_url')->nullable()->after('payment_token');
            }

            if ($missingColumns->contains('payment_payload')) {
                $table->json('payment_payload')->nullable()->after('payment_redirect_url');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('orders')) {
            return;
        }

        $existingColumns = collect([
            'payment_payload',
            'payment_redirect_url',
            'payment_token',
            'payment_gateway',
            'shipping_etd',
            'shipping_service',
        ])->filter(fn (string $column) => Schema::hasColumn('orders', $column));

        if ($existingColumns->isEmpty()) {
            return;
        }

        Schema::table('orders', function (Blueprint $table) use ($existingColumns) {
            $table->dropColumn($existingColumns->all());
        });
    }
};
