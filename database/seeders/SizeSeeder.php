<?php

namespace Database\Seeders;

use App\Models\Size;
use Illuminate\Database\Seeder;

class SizeSeeder extends Seeder
{
    public function run(): void
    {
        $sizes = [
            ['name' => 'XS', 'label' => 'Extra Small', 'sort_order' => 1],
            ['name' => 'S', 'label' => 'Small', 'sort_order' => 2],
            ['name' => 'M', 'label' => 'Medium', 'sort_order' => 3],
            ['name' => 'L', 'label' => 'Large', 'sort_order' => 4],
            ['name' => 'XL', 'label' => 'Extra Large', 'sort_order' => 5],
            ['name' => 'XXL', 'label' => '2X Large', 'sort_order' => 6],
            ['name' => 'XXXL', 'label' => '3X Large', 'sort_order' => 7],
            ['name' => 'Free Size', 'label' => 'Free Size', 'sort_order' => 8],
        ];

        foreach ($sizes as $size) {
            Size::updateOrCreate(['name' => $size['name']], $size);
        }
    }
}
