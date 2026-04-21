<?php

namespace App\Http\Requests\Settings;

use App\Concerns\ProfileValidationRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ProfileUpdateRequest extends FormRequest
{
    use ProfileValidationRules;

    protected function prepareForValidation(): void
    {
        $districtId = preg_replace('/\D+/', '', (string) $this->input('shipping_district_id', '')) ?? '';
        $postalCode = preg_replace('/\D+/', '', (string) $this->input('shipping_postal_code', '')) ?? '';

        $this->merge([
            'instagram' => $this->filled('instagram') ? ltrim((string) $this->instagram, '@') : null,
            'shipping_province' => $this->filled('shipping_province') ? trim((string) $this->shipping_province) : null,
            'shipping_city' => $this->filled('shipping_city') ? trim((string) $this->shipping_city) : null,
            'shipping_district' => $this->filled('shipping_district') ? trim((string) $this->shipping_district) : null,
            'shipping_district_id' => strlen($districtId) === 10 ? (int) $districtId : null,
            'shipping_postal_code' => strlen($postalCode) >= 4 && strlen($postalCode) <= 10 ? $postalCode : null,
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            ...$this->profileRules($this->user()->id),
            'identity_card' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:5120'],
        ];
    }
}
