<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Wishlist;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WishlistController extends Controller
{
    public function index(Request $request): Response
    {
        $wishlists = $request->user()
            ->wishlists()
            ->with(['product.primaryImage', 'product.brand', 'product.category'])
            ->latest()
            ->get()
            ->map(function (Wishlist $wishlist) {
                $product = $wishlist->product;

                return [
                    'id' => $wishlist->id,
                    'product' => [
                        'id' => $product?->id,
                        'name' => $product?->name,
                        'slug' => $product?->slug,
                        'code' => $product?->code,
                        'price' => $product?->price,
                        'deposit_price' => $product?->deposit_price,
                        'image' => $product?->primaryImage?->image_path,
                        'brand_name' => $product?->brand?->name,
                        'category_name' => $product?->category?->name,
                    ],
                    'created_at' => $wishlist->created_at?->format('d M Y'),
                ];
            })
            ->filter(fn (array $wishlist) => $wishlist['product']['id'] !== null)
            ->values();

        return Inertia::render('account/wishlist', [
            'wishlists' => $wishlists,
        ]);
    }

    public function toggle(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
        ]);

        $product = Product::query()->where('is_active', true)->findOrFail($validated['product_id']);

        $existing = $request->user()
            ->wishlists()
            ->where('product_id', $product->id)
            ->first();

        if ($existing) {
            $existing->delete();

            return back()->with('success', 'Produk dihapus dari wishlist.');
        }

        Wishlist::firstOrCreate([
            'user_id' => $request->user()->id,
            'product_id' => $product->id,
        ]);

        return back()->with('success', 'Produk ditambahkan ke wishlist.');
    }
}
