<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained()->cascadeOnDelete();
            $table->foreignId('brand_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('code')->unique(); // kode produk
            $table->text('description')->nullable();
            $table->unsignedBigInteger('price');         // harga sewa (Rupiah)
            $table->unsignedBigInteger('deposit_price')->default(0); // harga deposit
            $table->boolean('is_hijab_friendly')->default(false);
            $table->boolean('is_maternity_friendly')->default(false);
            $table->boolean('is_big_size_friendly')->default(false);
            $table->boolean('is_active')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->boolean('requires_dress_or_clutch')->default(false); // accessories rule
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
