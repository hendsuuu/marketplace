<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'category_id', 'brand_id', 'name', 'slug', 'code', 'description',
        'price', 'deposit_price', 'weight_grams',
        'is_hijab_friendly', 'is_maternity_friendly', 'is_big_size_friendly',
        'is_active', 'is_featured', 'requires_dress_or_clutch',
    ];

    protected function casts(): array
    {
        return [
            'price'                    => 'integer',
            'deposit_price'            => 'integer',
            'weight_grams'             => 'integer',
            'is_hijab_friendly'        => 'boolean',
            'is_maternity_friendly'    => 'boolean',
            'is_big_size_friendly'     => 'boolean',
            'is_active'                => 'boolean',
            'is_featured'              => 'boolean',
            'requires_dress_or_clutch' => 'boolean',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class)->orderBy('sort_order');
    }

    public function primaryImage(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(ProductImage::class)->where('is_primary', true)->orderBy('sort_order');
    }

    public function wishlists(): HasMany
    {
        return $this->hasMany(Wishlist::class);
    }
}
