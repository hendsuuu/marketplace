<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('users')) {
            return;
        }

        $missingColumns = collect([
            'shipping_province',
            'shipping_city',
            'shipping_district',
            'shipping_postal_code',
            'shipping_district_id',
        ])->filter(fn (string $column) => ! Schema::hasColumn('users', $column));

        if ($missingColumns->isEmpty()) {
            return;
        }

        Schema::table('users', function (Blueprint $table) use ($missingColumns) {
            if ($missingColumns->contains('shipping_province')) {
                $table->string('shipping_province')->nullable()->after('avatar');
            }

            if ($missingColumns->contains('shipping_city')) {
                $table->string('shipping_city')->nullable()->after('shipping_province');
            }

            if ($missingColumns->contains('shipping_district')) {
                $table->string('shipping_district')->nullable()->after('shipping_city');
            }

            if ($missingColumns->contains('shipping_postal_code')) {
                $table->string('shipping_postal_code', 10)->nullable()->after('shipping_district');
            }

            if ($missingColumns->contains('shipping_district_id')) {
                $table->unsignedBigInteger('shipping_district_id')->nullable()->after('shipping_postal_code');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('users')) {
            return;
        }

        $existingColumns = collect([
            'shipping_district_id',
            'shipping_postal_code',
            'shipping_district',
            'shipping_city',
            'shipping_province',
        ])->filter(fn (string $column) => Schema::hasColumn('users', $column));

        if ($existingColumns->isEmpty()) {
            return;
        }

        Schema::table('users', function (Blueprint $table) use ($existingColumns) {
            $table->dropColumn($existingColumns->all());
        });
    }
};
