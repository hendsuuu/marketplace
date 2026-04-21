<?php

namespace App\Http\Controllers;

use App\Services\Location\ApiCoIdRegionalService;
use Illuminate\Http\JsonResponse;
use RuntimeException;
use Throwable;

class LocationRegionController extends Controller
{
    public function __construct(
        private readonly ApiCoIdRegionalService $regionalService,
    ) {}

    public function provinces(): JsonResponse
    {
        return $this->respond(fn () => $this->regionalService->provinces());
    }

    public function regencies(string $provinceCode): JsonResponse
    {
        return $this->respond(fn () => $this->regionalService->regencies($provinceCode));
    }

    public function districts(string $regencyCode): JsonResponse
    {
        return $this->respond(fn () => $this->regionalService->districts($regencyCode));
    }

    public function villages(string $districtCode): JsonResponse
    {
        return $this->respond(fn () => $this->regionalService->villages($districtCode));
    }

    private function respond(callable $callback): JsonResponse
    {
        try {
            $regions = $callback();

            return response()->json([
                'data' => array_values(array_filter(array_map(
                    fn (mixed $region) => $this->normalizeRegion($region),
                    is_array($regions) ? $regions : [],
                ))),
            ]);
        } catch (RuntimeException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 422);
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'message' => 'Layanan data wilayah sedang tidak dapat dihubungi. Coba lagi beberapa saat.',
            ], 502);
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
}
