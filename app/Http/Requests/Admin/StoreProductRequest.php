<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('products.create');
    }

    public function rules(): array
    {
        return [
            'name'                     => ['required', 'string', 'max:200'],
            'slug'                     => ['nullable', 'string', 'max:220', 'unique:products,slug'],
            'code'                     => ['required', 'string', 'max:50', 'unique:products,code'],
            'category_id'              => ['required', 'exists:categories,id'],
            'brand_id'                 => ['nullable', 'exists:brands,id'],
            'description'              => ['nullable', 'string'],
            'price'                    => ['required', 'integer', 'min:0'],
            'deposit_price'            => ['nullable', 'integer', 'min:0'],
            'weight_grams'             => ['required', 'integer', 'min:1'],
            'is_hijab_friendly'        => ['boolean'],
            'is_maternity_friendly'    => ['boolean'],
            'is_big_size_friendly'     => ['boolean'],
            'is_active'                => ['boolean'],
            'is_featured'              => ['boolean'],
            'requires_dress_or_clutch' => ['boolean'],

            // Variants
            'variants'                      => ['required', 'array', 'min:1'],
            'variants.*.size_id'            => ['nullable', 'exists:sizes,id'],
            'variants.*.color'              => ['nullable', 'string', 'max:50'],
            'variants.*.color_hex'          => ['nullable', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'variants.*.additional_price'   => ['nullable', 'integer', 'min:0'],
            'variants.*.sku'                => ['required', 'string', 'max:80', 'distinct', Rule::unique('product_variants', 'sku')],
            'variants.*.is_available'       => ['boolean'],

            // Images (1–3)
            'images'                => ['nullable', 'array', 'max:3'],
            'images.*'              => ['image', 'mimes:jpg,jpeg,png,webp', 'max:3072'],
            'primary_image_index'   => ['nullable', 'integer', 'min:0'],
        ];
    }
}
