<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(RolesAndPermissionsSeeder::class);
        $this->call(SizeSeeder::class);
        $this->call(ProductSeeder::class);

        $superadmin = User::firstOrCreate(
            ['email' => 'superadmin@marketplace.test'],
            [
                'name' => 'Super Admin',
                'phone' => '081111111111',
                'address' => 'Jl. Senopati Raya No. 18, Kebayoran Baru',
                'instagram' => 'superadmin.marketplace',
                'shipping_province' => 'DKI Jakarta',
                'shipping_city' => 'Jakarta Selatan',
                'shipping_district' => 'Kebayoran Baru',
                'shipping_postal_code' => '12190',
                'password' => Hash::make('password'),
            ]
        );
        $superadmin->assignRole('superadmin');
        $superadmin->cart()->firstOrCreate();

        $admin = User::firstOrCreate(
            ['email' => 'admin@marketplace.test'],
            [
                'name' => 'Admin',
                'phone' => '082222222222',
                'address' => 'Jl. Braga No. 88, Sumur Bandung',
                'instagram' => 'admin.marketplace',
                'shipping_province' => 'Jawa Barat',
                'shipping_city' => 'Bandung',
                'shipping_district' => 'Sumur Bandung',
                'shipping_postal_code' => '40111',
                'password' => Hash::make('password'),
            ]
        );
        $admin->assignRole('admin');
        $admin->cart()->firstOrCreate();

        $customer = User::firstOrCreate(
            ['email' => 'customer@marketplace.test'],
            [
                'name' => 'Customer',
                'phone' => '081234567890',
                'address' => 'Jl. Dharmahusada Indah Barat No. 10',
                'instagram' => 'customer.rental',
                'birth_date' => '1997-06-15',
                'shipping_province' => 'Jawa Timur',
                'shipping_city' => 'Surabaya',
                'shipping_district' => 'Mulyorejo',
                'shipping_postal_code' => '60115',
                'password' => Hash::make('password'),
            ]
        );
        $customer->assignRole('customer');
        $customer->cart()->firstOrCreate();
    }
}
