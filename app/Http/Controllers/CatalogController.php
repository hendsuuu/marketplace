<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use App\Models\Size;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CatalogController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Product::query()
            ->with(['category', 'brand', 'primaryImage', 'variants.size'])
            ->where('is_active', true);

        // ── Filters ───────────────────────────────────────────────────────
        if ($request->filled('category')) {
            $query->whereHas('category', fn ($q) => $q->where('slug', $request->category));
        }

        if ($request->filled('brand')) {
            $query->whereHas('brand', fn ($q) => $q->where('slug', $request->brand));
        }

        if ($request->filled('color')) {
            $query->whereHas('variants', fn ($q) => $q->where('color', 'like', "%{$request->color}%"));
        }

        if ($request->filled('size')) {
            $query->whereHas('variants', fn ($q) => $q->whereHas('size', fn ($sq) => $sq->where('name', $request->size)));
        }

        if ($request->boolean('hijab_friendly')) {
            $query->where('is_hijab_friendly', true);
        }

        if ($request->boolean('maternity_friendly')) {
            $query->where('is_maternity_friendly', true);
        }

        if ($request->boolean('big_size_friendly')) {
            $query->where('is_big_size_friendly', true);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(fn ($q) => $q
                ->where('name', 'like', "%{$search}%")
                ->orWhere('code', 'like', "%{$search}%")
                ->orWhereHas('brand', fn ($bq) => $bq->where('name', 'like', "%{$search}%"))
            );
        }

        // ── Sorting ───────────────────────────────────────────────────────
        $sort = $request->input('sort', 'newest');

        match ($sort) {
            'price_asc'  => $query->orderBy('price'),
            'price_desc' => $query->orderByDesc('price'),
            'size_asc'   => $query->leftJoin('product_variants', 'products.id', '=', 'product_variants.product_id')
                ->leftJoin('sizes', 'product_variants.size_id', '=', 'sizes.id')
                ->orderBy('sizes.sort_order')
                ->select('products.*')
                ->distinct(),
            'size_desc'  => $query->leftJoin('product_variants', 'products.id', '=', 'product_variants.product_id')
                ->leftJoin('sizes', 'product_variants.size_id', '=', 'sizes.id')
                ->orderByDesc('sizes.sort_order')
                ->select('products.*')
                ->distinct(),
            'featured'   => $query->orderByDesc('is_featured')->orderByDesc('id'),
            default      => $query->latest('products.id'),
        };

        $products = $query->paginate(24)->withQueryString()
            ->through(fn (Product $p) => [
                'id'            => $p->id,
                'name'          => $p->name,
                'slug'          => $p->slug,
                'code'          => $p->code,
                'price'         => $p->price,
                'deposit_price' => $p->deposit_price,
                'image'         => $p->primaryImage?->image_path,
                'category_name' => $p->category?->name,
                'brand_name'    => $p->brand?->name,
                'sizes'         => $p->variants->map(fn ($v) => $v->size?->name)->filter()->unique()->values(),
                'colors'        => $p->variants->map(fn ($v) => ['name' => $v->color, 'hex' => $v->color_hex])->filter()->unique('name')->values(),
                'is_hijab_friendly'     => $p->is_hijab_friendly,
                'is_maternity_friendly' => $p->is_maternity_friendly,
                'is_big_size_friendly'  => $p->is_big_size_friendly,
            ]);

        // Sidebar filter data
        $categories = Category::where('is_active', true)
            ->with('children')
            ->whereNull('parent_id')
            ->orderBy('sort_order')
            ->get(['id', 'name', 'slug', 'type']);

        $sizes = Size::orderBy('sort_order')->get(['id', 'name', 'label']);

        return Inertia::render('catalog/index', [
            'products'   => $products,
            'categories' => $categories,
            'sizes'      => $sizes,
            'filters'    => $request->only(['category', 'brand', 'color', 'size', 'search', 'sort', 'hijab_friendly', 'maternity_friendly', 'big_size_friendly']),
        ]);
    }
}
