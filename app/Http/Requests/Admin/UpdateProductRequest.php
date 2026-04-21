<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('products.update');
    }

    public function rules(): array
    {
        $productId = $this->route('product')?->id;

        return [
            'name'                     => ['required', 'string', 'max:200'],
            'slug'                     => ['nullable', 'string', 'max:220', Rule::unique('products', 'slug')->ignore($productId)],
            'code'                     => ['required', 'string', 'max:50', Rule::unique('products', 'code')->ignore($productId)],
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

            // Variants — support update (with id) or create (no id)
            'variants'                      => ['required', 'array', 'min:1'],
            'variants.*.id'                 => ['nullable', 'exists:product_variants,id'],
            'variants.*.size_id'            => ['nullable', 'exists:sizes,id'],
            'variants.*.color'              => ['nullable', 'string', 'max:50'],
            'variants.*.color_hex'          => ['nullable', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'variants.*.additional_price'   => ['nullable', 'integer', 'min:0'],
            'variants.*.sku'                => [
                'required', 'string', 'max:80', 'distinct',
                Rule::unique('product_variants', 'sku')->ignore($this->route('product')?->id, 'product_id'),
            ],
            'variants.*.is_available' => ['boolean'],

            // New images to append (max 3 total across all)
            'images'              => ['nullable', 'array'],
            'images.*'            => ['image', 'mimes:jpg,jpeg,png,webp', 'max:3072'],
        ];
    }
}
