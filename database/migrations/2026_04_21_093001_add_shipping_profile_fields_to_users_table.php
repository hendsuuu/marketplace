<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('shipping_province')->nullable()->after('avatar');
            $table->string('shipping_city')->nullable()->after('shipping_province');
            $table->string('shipping_district')->nullable()->after('shipping_city');
            $table->string('shipping_postal_code', 10)->nullable()->after('shipping_district');
            $table->unsignedBigInteger('shipping_district_id')->nullable()->after('shipping_postal_code');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'shipping_province',
                'shipping_city',
                'shipping_district',
                'shipping_postal_code',
                'shipping_district_id',
            ]);
        });
    }
};
