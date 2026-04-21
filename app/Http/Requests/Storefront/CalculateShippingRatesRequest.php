<?php

namespace App\Http\Requests\Storefront;

use Illuminate\Foundation\Http\FormRequest;

class CalculateShippingRatesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'destination_village_code' => ['nullable', 'integer', 'digits_between:10,10'],
            'weight' => ['required', 'integer', 'min:1'],
            'couriers' => ['nullable', 'array'],
            'couriers.*' => ['string', 'max:30'],
        ];
    }
}
