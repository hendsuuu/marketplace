<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileDeleteRequest;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use App\Services\Location\ApiCoIdRegionalService;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class ProfileController extends Controller
{
    public function __construct(
        private readonly ApiCoIdRegionalService $regionalService,
    ) {}

    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();
        $villageCode = filled($request->user()?->shipping_district_id)
            ? str_pad((string) $request->user()->shipping_district_id, 10, '0', STR_PAD_LEFT)
            : '';

        $regencyCode = strlen($villageCode) >= 4 ? substr($villageCode, 0, 4) : null;
        $districtCode = strlen($villageCode) >= 6 ? substr($villageCode, 0, 6) : null;

        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
            'locationOptions' => [
                'provinces' => $this->safeRegions(fn () => $this->regionalService->provinces()),
                'regencies' => $this->seededRegionOption($regencyCode, $user?->shipping_city),
                'districts' => $this->seededRegionOption($districtCode, $user?->shipping_district),
                'villages' => $this->seededRegionOption($villageCode, $user?->shipping_postal_code ? 'Kelurahan / desa tersimpan' : null, $user?->shipping_postal_code),
            ],
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $user = $request->user();

        if ($request->hasFile('identity_card')) {
            if ($user->identity_card) {
                Storage::disk('public')->delete($user->identity_card);
            }

            $data['identity_card'] = $request->file('identity_card')->store('identity-cards', 'public');
        }

        $user->fill($data);

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        return to_route('profile.edit')->with('success', 'Profile berhasil diperbarui.');
    }

    /**
     * Delete the user's profile.
     */
    public function destroy(ProfileDeleteRequest $request): RedirectResponse
    {
        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }

    /**
     * @return array<int, array{code: string, name: string, postal_code: string|null}>
     */
    private function safeRegions(callable $callback): array
    {
        try {
            $regions = $callback();

            return array_values(array_filter(array_map(
                fn (mixed $region) => $this->normalizeRegion($region),
                is_array($regions) ? $regions : [],
            )));
        } catch (Throwable $exception) {
            report($exception);

            return [];
        }
    }

    /**
     * @return array{code: string, name: string, postal_code: string|null}|null
     */
    private function normalizeRegion(mixed $region): ?array
    {
        if (! is_array($region)) {
            return null;
        }

        $code = trim((string) data_get($region, 'code', ''));
        $name = trim((string) data_get($region, 'name', ''));

        if ($code === '' || $name === '') {
            return null;
        }

        return [
            'code' => $code,
            'name' => $name,
            'postal_code' => $this->normalizePostalCode(data_get($region, 'postal_code') ?? data_get($region, 'postal_codes')),
        ];
    }

    private function normalizePostalCode(mixed $postalCode): ?string
    {
        if (is_array($postalCode)) {
            foreach ($postalCode as $candidate) {
                $normalized = $this->normalizePostalCode($candidate);

                if ($normalized !== null) {
                    return $normalized;
                }
            }

            return null;
        }

        if (! is_scalar($postalCode)) {
            return null;
        }

        $digits = preg_replace('/\D+/', '', (string) $postalCode) ?? '';

        if (strlen($digits) < 4 || strlen($digits) > 10) {
            return null;
        }

        return $digits;
    }

    /**
     * @return array<int, array{code: string, name: string, postal_code: string|null}>
     */
    private function seededRegionOption(?string $code, ?string $name, ?string $postalCode = null): array
    {
        $normalizedCode = trim((string) $code);
        $normalizedName = trim((string) $name);

        if ($normalizedCode === '' || $normalizedName === '') {
            return [];
        }

        return [[
            'code' => $normalizedCode,
            'name' => $normalizedName,
            'postal_code' => $this->normalizePostalCode($postalCode),
        ]];
    }
}
