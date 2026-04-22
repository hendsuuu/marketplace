<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class PublicProductController extends Controller
{
    public function show(Product $product): Response
    {
        abort_if(! $product->is_active, 404);

        $product->load([
            'category',
            'brand',
            'images' => fn ($q) => $q->orderBy('sort_order'),
            'variants' => fn ($q) => $q->where('is_available', true)->with('size'),
        ])->loadCount('variants');

        // "You May Also Like" — same category, not same product
        $related = Product::where('category_id', $product->category_id)
            ->where('id', '!=', $product->id)
            ->where('is_active', true)
            ->with('primaryImage')
            ->inRandomOrder()
            ->limit(6)
            ->get(['id', 'name', 'slug', 'code', 'price', 'deposit_price']);

        $user = Auth::user();

        $inWishlist = $user
            ? $user->wishlists()->where('product_id', $product->id)->exists()
            : false;

        return Inertia::render('product/show', [
            'product' => [
                'id'                     => $product->id,
                'name'                   => $product->name,
                'slug'                   => $product->slug,
                'code'                   => $product->code,
                'description'            => $product->description,
                'price'                  => $product->price,
                'deposit_price'          => $product->deposit_price,
                'is_hijab_friendly'      => $product->is_hijab_friendly,
                'is_maternity_friendly'  => $product->is_maternity_friendly,
                'is_big_size_friendly'   => $product->is_big_size_friendly,
                'requires_dress_or_clutch' => $product->requires_dress_or_clutch,
                'has_configured_variants' => $product->variants_count > 0,
                'category_name'          => $product->category?->name,
                'brand_name'             => $product->brand?->name,
                'images'                 => $product->images->map(fn ($img) => [
                    'id'         => $img->id,
                    'image_path' => $img->image_path,
                    'is_primary' => $img->is_primary,
                ]),
                'variants' => $product->variants->map(fn ($v) => [
                    'id'               => $v->id,
                    'size_name'        => $v->size?->name,
                    'size_label'       => $v->size?->label,
                    'color'            => $v->color,
                    'color_hex'        => $v->color_hex,
                    'additional_price' => $v->additional_price,
                    'sku'              => $v->sku,
                    'is_available'     => $v->is_available,
                ]),
            ],
            'related'    => $related->map(fn ($r) => [
                'id'            => $r->id,
                'name'          => $r->name,
                'slug'          => $r->slug,
                'code'          => $r->code,
                'price'         => $r->price,
                'deposit_price' => $r->deposit_price,
                'image'         => $r->primaryImage?->image_path,
            ]),
            'in_wishlist' => $inWishlist,
        ]);
    }
}
