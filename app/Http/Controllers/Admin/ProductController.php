<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Product\HandleProductImages;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreProductRequest;
use App\Http\Requests\Admin\UpdateProductRequest;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\Size;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function __construct(
        private readonly HandleProductImages $imageHandler,
    ) {}

    public function index(): Response
    {
        $this->authorize('viewAny', Product::class);

        $products = Product::with(['category', 'brand', 'primaryImage'])
            ->withCount('variants')
            ->latest()
            ->paginate(30)
            ->through(fn (Product $p) => [
                'id'            => $p->id,
                'name'          => $p->name,
                'code'          => $p->code,
                'price'         => $p->price,
                'deposit_price' => $p->deposit_price,
                'weight_grams'  => $p->weight_grams,
                'category'      => $p->category?->name,
                'brand'         => $p->brand?->name,
                'variants_count'=> $p->variants_count,
                'is_active'     => $p->is_active,
                'is_featured'   => $p->is_featured,
                'image'         => $p->primaryImage?->image_path,
            ]);

        return Inertia::render('admin/products/index', compact('products'));
    }

    public function create(): Response
    {
        $this->authorize('create', Product::class);

        return Inertia::render('admin/products/form', [
            'product'    => null,
            'categories' => Category::orderBy('name')->get(['id', 'name', 'type']),
            'brands'     => Brand::orderBy('name')->get(['id', 'name']),
            'sizes'      => Size::orderBy('sort_order')->get(['id', 'name', 'label']),
        ]);
    }

    public function store(StoreProductRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['slug'] ??= Str::slug($data['name']);

        $variants  = $data['variants'] ?? [];
        $images    = $data['images']   ?? [];
        $primaryIdx = (int) ($data['primary_image_index'] ?? 0);

        unset($data['variants'], $data['images'], $data['primary_image_index']);

        $product = Product::create($data);

        // Create variants
        foreach ($variants as $variant) {
            $variant['sku'] ??= Str::upper(Str::random(8));
            $product->variants()->create($variant);
        }

        // Store images
        if ($images) {
            $this->imageHandler->store($product, $images, $primaryIdx);
        }

        return redirect()->route('admin.products.index')
            ->with('success', "Produk \"{$product->name}\" berhasil ditambahkan.");
    }

    public function show(Product $product): Response
    {
        $this->authorize('view', $product);

        $product->load(['category', 'brand', 'variants.size', 'images']);

        return Inertia::render('admin/products/show', compact('product'));
    }

    public function edit(Product $product): Response
    {
        $this->authorize('update', $product);

        $product->load(['variants.size', 'images']);

        return Inertia::render('admin/products/form', [
            'product'    => $product,
            'categories' => Category::orderBy('name')->get(['id', 'name', 'type']),
            'brands'     => Brand::orderBy('name')->get(['id', 'name']),
            'sizes'      => Size::orderBy('sort_order')->get(['id', 'name', 'label']),
        ]);
    }

    public function update(UpdateProductRequest $request, Product $product): RedirectResponse
    {
        $data = $request->validated();
        $data['slug'] ??= Str::slug($data['name']);

        $incomingVariants = $data['variants'] ?? [];
        $newImages        = $data['images']   ?? [];

        unset($data['variants'], $data['images']);

        $product->update($data);

        // Sync variants: update existing, create new, remove deleted
        $incomingIds = collect($incomingVariants)->pluck('id')->filter()->all();
        $product->variants()->whereNotIn('id', $incomingIds)->delete();

        foreach ($incomingVariants as $variantData) {
            if (! empty($variantData['id'])) {
                $product->variants()->find($variantData['id'])?->update($variantData);
            } else {
                $product->variants()->create($variantData);
            }
        }

        // Append new images (max 3 total)
        $currentCount = $product->images()->count();
        if ($newImages && $currentCount < 3) {
            $allowed = min(count($newImages), 3 - $currentCount);
            $this->imageHandler->store($product, array_slice($newImages, 0, $allowed));
        }

        return redirect()->route('admin.products.edit', $product)
            ->with('success', 'Produk berhasil diperbarui.');
    }

    public function destroy(Product $product): RedirectResponse
    {
        $this->authorize('delete', $product);

        $product->delete();

        return redirect()->route('admin.products.index')
            ->with('success', "Produk \"{$product->name}\" berhasil dihapus.");
    }

    public function destroyImage(Product $product, ProductImage $image): RedirectResponse
    {
        $this->authorize('update', $product);

        abort_if($image->product_id !== $product->id, 403);

        $this->imageHandler->delete($image);

        return back()->with('success', 'Gambar berhasil dihapus.');
    }

    public function setPrimaryImage(Product $product, ProductImage $image): RedirectResponse
    {
        $this->authorize('update', $product);

        abort_if($image->product_id !== $product->id, 403);

        $this->imageHandler->setPrimary($image);

        return back()->with('success', 'Gambar utama berhasil diubah.');
    }
}
