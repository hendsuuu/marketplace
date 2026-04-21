<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $categories = $this->seedCategories();
        $brands = $this->seedBrands();
        $sizes = \App\Models\Size::query()->get()->keyBy('name');

        $blueprints = $this->productBlueprints($categories, $brands);
        $products = $this->expandBlueprints($blueprints, $sizes);

        foreach ($products as $productData) {
            $variants = Arr::pull($productData, 'variants');
            $images = Arr::pull($productData, 'images');

            $product = Product::updateOrCreate(
                ['slug' => $productData['slug']],
                $productData,
            );

            foreach ($variants as $variant) {
                ProductVariant::updateOrCreate(
                    ['sku' => $variant['sku']],
                    [
                        'product_id' => $product->id,
                        'size_id' => $variant['size_id'],
                        'color' => $variant['color'],
                        'color_hex' => $variant['color_hex'],
                        'additional_price' => $variant['additional_price'],
                        'stock' => 1,
                        'is_available' => true,
                    ],
                );
            }

            foreach ($images as $index => $imagePath) {
                ProductImage::updateOrCreate(
                    [
                        'product_id' => $product->id,
                        'image_path' => $imagePath,
                    ],
                    [
                        'sort_order' => $index,
                        'is_primary' => $index === 0,
                    ],
                );
            }
        }

        $this->command?->info('Products seeded: '.count($products).' catalog products ready.');
    }

    /**
     * @return array<string, Category>
     */
    private function seedCategories(): array
    {
        $categories = [
            ['slug' => 'dress', 'name' => 'Dress', 'parent_slug' => null, 'sort_order' => 1],
            ['slug' => 'gaun-pesta', 'name' => 'Gaun Pesta', 'parent_slug' => 'dress', 'sort_order' => 1],
            ['slug' => 'cheongsam', 'name' => 'Cheongsam', 'parent_slug' => 'dress', 'sort_order' => 2],
            ['slug' => 'kebaya-batik', 'name' => 'Kebaya / Batik', 'parent_slug' => null, 'sort_order' => 2],
            ['slug' => 'clutch', 'name' => 'Clutch', 'parent_slug' => null, 'sort_order' => 3],
            ['slug' => 'aksesoris', 'name' => 'Aksesoris', 'parent_slug' => null, 'sort_order' => 4],
            ['slug' => 'kalung', 'name' => 'Kalung', 'parent_slug' => 'aksesoris', 'sort_order' => 1],
            ['slug' => 'anting', 'name' => 'Anting', 'parent_slug' => 'aksesoris', 'sort_order' => 2],
            ['slug' => 'scarf', 'name' => 'Scarf', 'parent_slug' => 'aksesoris', 'sort_order' => 3],
            ['slug' => 'hiasan-rambut', 'name' => 'Hiasan Rambut', 'parent_slug' => 'aksesoris', 'sort_order' => 4],
            ['slug' => 'sabuk', 'name' => 'Sabuk', 'parent_slug' => 'aksesoris', 'sort_order' => 5],
            ['slug' => 'sarung-tangan', 'name' => 'Sarung Tangan', 'parent_slug' => 'aksesoris', 'sort_order' => 6],
            ['slug' => 'bolero', 'name' => 'Bolero', 'parent_slug' => 'aksesoris', 'sort_order' => 7],
            ['slug' => 'hijab', 'name' => 'Hijab', 'parent_slug' => 'aksesoris', 'sort_order' => 8],
            ['slug' => 'winter-coat', 'name' => 'Winter Coat', 'parent_slug' => null, 'sort_order' => 5],
            ['slug' => 'kids', 'name' => 'Kids', 'parent_slug' => null, 'sort_order' => 6],
            ['slug' => 'kids-dresses', 'name' => 'Kids Dresses', 'parent_slug' => 'kids', 'sort_order' => 1],
            ['slug' => 'kids-accessories', 'name' => 'Kids Accessories', 'parent_slug' => 'kids', 'sort_order' => 2],
        ];

        $persisted = [];

        foreach ($categories as $item) {
            $parentId = $item['parent_slug'] ? ($persisted[$item['parent_slug']]?->id ?? null) : null;

            $persisted[$item['slug']] = Category::updateOrCreate(
                ['slug' => $item['slug']],
                [
                    'name' => $item['name'],
                    'parent_id' => $parentId,
                    'type' => 'product',
                    'sort_order' => $item['sort_order'],
                    'is_active' => true,
                ],
            );
        }

        return $persisted;
    }

    /**
     * @return array<string, Brand>
     */
    private function seedBrands(): array
    {
        $brands = [
            ['slug' => 'nova-elegance', 'name' => 'Nova Elegance', 'description' => 'Gaun pesta elegan dengan siluet feminin modern.'],
            ['slug' => 'luxe-atelier', 'name' => 'Luxe Atelier', 'description' => 'Koleksi modern mewah untuk acara spesial dan formal.'],
            ['slug' => 'javara', 'name' => 'Javara', 'description' => 'Spesialis kebaya dan batik kontemporer yang refined.'],
            ['slug' => 'mirage', 'name' => 'Mirage', 'description' => 'Clutch dan aksesori statement untuk melengkapi tampilan.'],
            ['slug' => 'petite-muse', 'name' => 'Petite Muse', 'description' => 'Koleksi premium untuk little ladies dan family moments.'],
        ];

        $persisted = [];

        foreach ($brands as $brand) {
            $persisted[$brand['slug']] = Brand::updateOrCreate(
                ['slug' => $brand['slug']],
                [
                    'name' => $brand['name'],
                    'description' => $brand['description'],
                    'is_active' => true,
                ],
            );
        }

        return $persisted;
    }

    /**
     * @param  array<string, Category>  $categories
     * @param  array<string, Brand>  $brands
     * @return array<int, array<string, mixed>>
     */
    private function productBlueprints(array $categories, array $brands): array
    {
        return [
            [
                'series_count' => 90,
                'category_id' => $categories['gaun-pesta']->id,
                'brand_id' => $brands['nova-elegance']->id,
                'name' => 'Gaun Malam Celestia',
                'code_prefix' => 'GMC',
                'description' => 'Gaun malam elegan dengan detail payet halus dan jatuh kain yang anggun untuk resepsi, gala dinner, dan acara formal.',
                'price' => 350000,
                'deposit_price' => 700000,
                'weight_grams' => 1500,
                'flags' => ['is_hijab_friendly' => true],
                'requires_dress_or_clutch' => false,
                'image_family' => 'dress',
                'variants' => [
                    ['size' => 'S', 'color' => 'Midnight Blue', 'color_hex' => '#1A2C4F', 'additional_price' => 0],
                    ['size' => 'M', 'color' => 'Champagne', 'color_hex' => '#DAB894', 'additional_price' => 0],
                    ['size' => 'L', 'color' => 'Rose Gold', 'color_hex' => '#B76E79', 'additional_price' => 25000],
                ],
            ],
            [
                'series_count' => 70,
                'category_id' => $categories['gaun-pesta']->id,
                'brand_id' => $brands['luxe-atelier']->id,
                'name' => 'Gown Seraphine',
                'code_prefix' => 'GWS',
                'description' => 'Gown modern dengan potongan clean dan finish premium untuk tampilan classy, minimal, dan tetap berkelas.',
                'price' => 420000,
                'deposit_price' => 850000,
                'weight_grams' => 1700,
                'flags' => [],
                'requires_dress_or_clutch' => false,
                'image_family' => 'dress',
                'variants' => [
                    ['size' => 'S', 'color' => 'Ivory', 'color_hex' => '#F6F0E7', 'additional_price' => 0],
                    ['size' => 'M', 'color' => 'Mocha', 'color_hex' => '#8B6A4E', 'additional_price' => 0],
                    ['size' => 'XL', 'color' => 'Espresso', 'color_hex' => '#4A3326', 'additional_price' => 50000],
                ],
            ],
            [
                'series_count' => 70,
                'category_id' => $categories['cheongsam']->id,
                'brand_id' => $brands['luxe-atelier']->id,
                'name' => 'Cheongsam Empress',
                'code_prefix' => 'CHE',
                'description' => 'Cheongsam modern dengan bordir refined dan potongan tegas untuk acara oriental, engagement, dan pesta malam.',
                'price' => 320000,
                'deposit_price' => 640000,
                'weight_grams' => 1250,
                'flags' => [],
                'requires_dress_or_clutch' => false,
                'image_family' => 'dress',
                'variants' => [
                    ['size' => 'S', 'color' => 'Scarlet', 'color_hex' => '#B3292A', 'additional_price' => 0],
                    ['size' => 'M', 'color' => 'Gold', 'color_hex' => '#CC9A2D', 'additional_price' => 0],
                    ['size' => 'L', 'color' => 'Black Jade', 'color_hex' => '#1E1D1A', 'additional_price' => 25000],
                ],
            ],
            [
                'series_count' => 80,
                'category_id' => $categories['kebaya-batik']->id,
                'brand_id' => $brands['javara']->id,
                'name' => 'Kebaya Encim Nusantara',
                'code_prefix' => 'KEN',
                'description' => 'Kebaya modern yang lembut, refined, dan cocok untuk akad, sangjit, wisuda, hingga acara keluarga besar.',
                'price' => 285000,
                'deposit_price' => 560000,
                'weight_grams' => 1350,
                'flags' => ['is_hijab_friendly' => true],
                'requires_dress_or_clutch' => false,
                'image_family' => 'kebaya',
                'variants' => [
                    ['size' => 'S', 'color' => 'Cream', 'color_hex' => '#F4E8D4', 'additional_price' => 0],
                    ['size' => 'M', 'color' => 'Dusty Rose', 'color_hex' => '#C98D82', 'additional_price' => 0],
                    ['size' => 'L', 'color' => 'Taupe', 'color_hex' => '#8D7966', 'additional_price' => 20000],
                ],
            ],
            [
                'series_count' => 80,
                'category_id' => $categories['kebaya-batik']->id,
                'brand_id' => $brands['javara']->id,
                'name' => 'Batik Kontemporer Dewi',
                'code_prefix' => 'BKD',
                'description' => 'Batik kontemporer dengan motif lembut dan nuansa earth tone, pas untuk acara formal dan semi-formal.',
                'price' => 240000,
                'deposit_price' => 480000,
                'weight_grams' => 1200,
                'flags' => ['is_hijab_friendly' => true, 'is_big_size_friendly' => true],
                'requires_dress_or_clutch' => false,
                'image_family' => 'kebaya',
                'variants' => [
                    ['size' => 'M', 'color' => 'Brown Earth', 'color_hex' => '#7A5436', 'additional_price' => 0],
                    ['size' => 'L', 'color' => 'Terracotta', 'color_hex' => '#A75D43', 'additional_price' => 0],
                    ['size' => 'XL', 'color' => 'Sage', 'color_hex' => '#9AA382', 'additional_price' => 25000],
                ],
            ],
            [
                'series_count' => 70,
                'category_id' => $categories['clutch']->id,
                'brand_id' => $brands['mirage']->id,
                'name' => 'Clutch Malam Belia',
                'code_prefix' => 'CMB',
                'description' => 'Clutch premium untuk menyempurnakan styling malam Anda, ringan, classy, dan mudah dipadukan.',
                'price' => 100000,
                'deposit_price' => 250000,
                'weight_grams' => 500,
                'flags' => ['is_hijab_friendly' => true, 'is_maternity_friendly' => true, 'is_big_size_friendly' => true],
                'requires_dress_or_clutch' => false,
                'image_family' => 'clutch',
                'variants' => [
                    ['size' => 'Free Size', 'color' => 'Gold', 'color_hex' => '#C99A4B', 'additional_price' => 0],
                    ['size' => 'Free Size', 'color' => 'Silver', 'color_hex' => '#B6B8BF', 'additional_price' => 0],
                ],
            ],
            [
                'series_count' => 70,
                'category_id' => $categories['kalung']->id,
                'brand_id' => $brands['mirage']->id,
                'name' => 'Kalung Mutiara Classic',
                'code_prefix' => 'KMC',
                'description' => 'Aksesori kalung lembut dan timeless untuk melengkapi tampilan dress atau clutch favorit Anda.',
                'price' => 75000,
                'deposit_price' => 200000,
                'weight_grams' => 200,
                'flags' => ['is_hijab_friendly' => true, 'is_maternity_friendly' => true, 'is_big_size_friendly' => true],
                'requires_dress_or_clutch' => true,
                'image_family' => 'accessory',
                'variants' => [
                    ['size' => 'Free Size', 'color' => 'White Pearl', 'color_hex' => '#F5F4EF', 'additional_price' => 0],
                    ['size' => 'Free Size', 'color' => 'Champagne Pearl', 'color_hex' => '#E7D7BC', 'additional_price' => 0],
                ],
            ],
            [
                'series_count' => 70,
                'category_id' => $categories['anting']->id,
                'brand_id' => $brands['mirage']->id,
                'name' => 'Anting Aurora Drop',
                'code_prefix' => 'AAD',
                'description' => 'Anting ringan dengan kilau halus yang membuat tampilan lebih polished tanpa terasa berlebihan.',
                'price' => 65000,
                'deposit_price' => 175000,
                'weight_grams' => 150,
                'flags' => ['is_hijab_friendly' => true, 'is_maternity_friendly' => true, 'is_big_size_friendly' => true],
                'requires_dress_or_clutch' => true,
                'image_family' => 'accessory',
                'variants' => [
                    ['size' => 'Free Size', 'color' => 'Gold Mist', 'color_hex' => '#C99E50', 'additional_price' => 0],
                    ['size' => 'Free Size', 'color' => 'Silver Dew', 'color_hex' => '#BFC7D4', 'additional_price' => 0],
                ],
            ],
            [
                'series_count' => 50,
                'category_id' => $categories['winter-coat']->id,
                'brand_id' => $brands['luxe-atelier']->id,
                'name' => 'Wool Coat Parisian',
                'code_prefix' => 'WCP',
                'description' => 'Winter coat hangat dengan siluet clean dan warna versatile untuk perjalanan empat musim.',
                'price' => 225000,
                'deposit_price' => 520000,
                'weight_grams' => 2200,
                'flags' => ['is_hijab_friendly' => true],
                'requires_dress_or_clutch' => false,
                'image_family' => 'coat',
                'variants' => [
                    ['size' => 'M', 'color' => 'Camel', 'color_hex' => '#B58A62', 'additional_price' => 0],
                    ['size' => 'L', 'color' => 'Stone', 'color_hex' => '#9D9389', 'additional_price' => 0],
                    ['size' => 'XL', 'color' => 'Espresso', 'color_hex' => '#4A3124', 'additional_price' => 25000],
                ],
            ],
            [
                'series_count' => 40,
                'category_id' => $categories['kids-dresses']->id,
                'brand_id' => $brands['petite-muse']->id,
                'name' => 'Kids Party Dress Blossom',
                'code_prefix' => 'KPB',
                'description' => 'Dress anak premium yang nyaman, manis, dan tetap terlihat rapi untuk pesta dan sesi foto keluarga.',
                'price' => 150000,
                'deposit_price' => 280000,
                'weight_grams' => 850,
                'flags' => ['is_big_size_friendly' => true],
                'requires_dress_or_clutch' => false,
                'image_family' => 'kids',
                'variants' => [
                    ['size' => 'XS', 'color' => 'Soft Pink', 'color_hex' => '#E7B7B2', 'additional_price' => 0],
                    ['size' => 'S', 'color' => 'Vanilla', 'color_hex' => '#F6EBD4', 'additional_price' => 0],
                    ['size' => 'M', 'color' => 'Lilac', 'color_hex' => '#B79BCF', 'additional_price' => 10000],
                ],
            ],
            [
                'series_count' => 40,
                'category_id' => $categories['kids-accessories']->id,
                'brand_id' => $brands['petite-muse']->id,
                'name' => 'Kids Hair Accent Bloom',
                'code_prefix' => 'KHB',
                'description' => 'Aksesori rambut anak untuk melengkapi dress pesta dengan detail yang lembut dan polished.',
                'price' => 45000,
                'deposit_price' => 90000,
                'weight_grams' => 100,
                'flags' => ['is_big_size_friendly' => true],
                'requires_dress_or_clutch' => true,
                'image_family' => 'kids',
                'variants' => [
                    ['size' => 'Free Size', 'color' => 'Rose Cream', 'color_hex' => '#D9A79D', 'additional_price' => 0],
                    ['size' => 'Free Size', 'color' => 'Pearl Ivory', 'color_hex' => '#E8E1D3', 'additional_price' => 0],
                ],
            ],
        ];
    }

    /**
     * @param  array<int, array<string, mixed>>  $blueprints
     * @param  Collection<string, \App\Models\Size>  $sizes
     * @return array<int, array<string, mixed>>
     */
    private function expandBlueprints(array $blueprints, Collection $sizes): array
    {
        $products = [];

        foreach ($blueprints as $blueprint) {
            for ($index = 1; $index <= $blueprint['series_count']; $index++) {
                $series = str_pad((string) $index, 3, '0', STR_PAD_LEFT);
                $name = "{$blueprint['name']} {$series}";
                $code = "{$blueprint['code_prefix']}-{$series}";
                $priceOffset = (($index - 1) % 5) * 10000;
                $depositOffset = (($index - 1) % 5) * 20000;

                $products[] = [
                    'category_id' => $blueprint['category_id'],
                    'brand_id' => $blueprint['brand_id'],
                    'name' => $name,
                    'slug' => Str::slug($name),
                    'code' => $code,
                    'description' => $blueprint['description'],
                    'price' => $blueprint['price'] + $priceOffset,
                    'deposit_price' => $blueprint['deposit_price'] + $depositOffset,
                    'weight_grams' => $blueprint['weight_grams'],
                    'is_hijab_friendly' => $blueprint['flags']['is_hijab_friendly'] ?? false,
                    'is_maternity_friendly' => $blueprint['flags']['is_maternity_friendly'] ?? false,
                    'is_big_size_friendly' => $blueprint['flags']['is_big_size_friendly'] ?? false,
                    'is_active' => true,
                    'is_featured' => $index <= 3,
                    'requires_dress_or_clutch' => $blueprint['requires_dress_or_clutch'],
                    'variants' => collect($blueprint['variants'])->map(function (array $variant, int $variantIndex) use ($code, $sizes) {
                        $variantCode = strtoupper(substr(Str::slug($variant['color'], ''), 0, 3));

                        return [
                            'size_id' => $sizes->get($variant['size'])?->id,
                            'color' => $variant['color'],
                            'color_hex' => $variant['color_hex'],
                            'additional_price' => $variant['additional_price'],
                            'sku' => "{$code}-".($variant['size'] === 'Free Size' ? 'FS' : $variant['size'])."-{$variantCode}{$variantIndex}",
                        ];
                    })->all(),
                    'images' => $this->placeholderImages($blueprint['image_family'], $index),
                ];
            }
        }

        return $products;
    }

    /**
     * @return array<int, string>
     */
    private function placeholderImages(string $family, int $seed): array
    {
        $sets = [
            'dress' => [
                '/images/placeholders/dress-hero.svg',
                '/images/placeholders/dress-detail.svg',
                '/images/placeholders/dress-fabric.svg',
            ],
            'kebaya' => [
                '/images/placeholders/kebaya-hero.svg',
                '/images/placeholders/kebaya-detail.svg',
                '/images/placeholders/kebaya-fabric.svg',
            ],
            'clutch' => [
                '/images/placeholders/clutch-hero.svg',
                '/images/placeholders/clutch-detail.svg',
            ],
            'accessory' => [
                '/images/placeholders/accessory-hero.svg',
                '/images/placeholders/accessory-detail.svg',
            ],
            'coat' => [
                '/images/placeholders/coat-hero.svg',
                '/images/placeholders/coat-detail.svg',
            ],
            'kids' => [
                '/images/placeholders/kids-hero.svg',
                '/images/placeholders/kids-detail.svg',
            ],
        ];

        $images = $sets[$family] ?? ['/images/placeholders/dress-hero.svg'];
        $count = min(count($images), 1 + (($seed - 1) % count($images)));

        return array_slice($images, 0, $count);
    }
}
