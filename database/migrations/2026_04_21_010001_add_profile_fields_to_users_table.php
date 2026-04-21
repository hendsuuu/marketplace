<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone')->nullable()->after('email');
            $table->text('address')->nullable()->after('phone');
            $table->string('instagram')->nullable()->after('address');
            $table->date('birth_date')->nullable()->after('instagram');
            $table->string('identity_card')->nullable()->after('birth_date'); // path to image
            $table->string('avatar')->nullable()->after('identity_card');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['phone', 'address', 'instagram', 'birth_date', 'identity_card', 'avatar']);
        });
    }
};
