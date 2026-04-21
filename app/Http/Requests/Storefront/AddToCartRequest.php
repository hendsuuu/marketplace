<?php

namespace App\Http\Requests\Storefront;

use Illuminate\Foundation\Http\FormRequest;

class AddToCartRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'product_variant_id' => ['required', 'exists:product_variants,id'],
            'rental_start_date' => ['required', 'date', 'after_or_equal:today'],
            'rental_end_date' => ['required', 'date', 'after:rental_start_date'],
        ];
    }
}
