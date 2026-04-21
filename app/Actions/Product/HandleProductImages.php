<?php

namespace App\Actions\Product;

use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class HandleProductImages
{
    /**
     * Store uploaded images for a product.
     * Returns the created ProductImage models.
     *
     * @param  UploadedFile[]  $files
     */
    public function store(Product $product, array $files, int $primaryIndex = 0): void
    {
        $existingCount = $product->images()->count();

        foreach ($files as $index => $file) {
            $path = $file->store('products/' . $product->id, 'public');

            ProductImage::create([
                'product_id' => $product->id,
                'image_path' => $path,
                'sort_order' => $existingCount + $index,
                'is_primary'  => ($existingCount === 0 && $index === $primaryIndex),
            ]);
        }
    }

    /**
     * Delete a product image file and its record.
     */
    public function delete(ProductImage $image): void
    {
        Storage::disk('public')->delete($image->image_path);
        $image->delete();

        // Re-assign primary to the next image if this was primary
        if ($image->is_primary) {
            $image->product->images()->oldest('sort_order')->first()?->update(['is_primary' => true]);
        }
    }

    /**
     * Set an image as primary, clearing others.
     */
    public function setPrimary(ProductImage $image): void
    {
        ProductImage::where('product_id', $image->product_id)
            ->update(['is_primary' => false]);

        $image->update(['is_primary' => true]);
    }
}
