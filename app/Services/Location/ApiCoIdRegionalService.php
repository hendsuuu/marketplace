<?php

namespace App\Services\Location;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class ApiCoIdRegionalService
{
    public function provinces(): array
    {
        return $this->fetchAll('regional/indonesia/provinces');
    }

    public function regencies(string $provinceCode): array
    {
        return $this->fetchAll("regional/indonesia/provinces/{$provinceCode}/regencies");
    }

    public function districts(string $regencyCode): array
    {
        return $this->fetchAll("regional/indonesia/regencies/{$regencyCode}/districts");
    }

    public function villages(string $districtCode): array
    {
        return $this->fetchAll("regional/indonesia/districts/{$districtCode}/villages");
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function fetchAll(string $endpoint): array
    {
        $cacheKey = 'api-co-id-regional:'.md5($endpoint);

        return Cache::remember($cacheKey, now()->addDay(), function () use ($endpoint) {
            $apiKey = trim((string) config('services.api_co_id.api_key'));

            if ($apiKey === '') {
                throw new RuntimeException('API regional api.co.id belum dikonfigurasi. Isi API_CO_ID_KEY terlebih dahulu.');
            }

            $page = 1;
            $results = [];
            $totalPages = 1;

            do {
                $response = $this->request($apiKey)
                    ->retry(2, 250, throw: false)
                    ->get($endpoint, ['page' => $page]);

                if ($response->failed()) {
                    $message = $response->json('message');

                    throw new RuntimeException(
                        is_string($message) && $message !== ''
                            ? $message
                            : 'Gagal mengambil data wilayah dari api.co.id.',
                    );
                }

                $payload = $response->json();

                if (($payload['is_success'] ?? false) !== true || ! is_array($payload['data'] ?? null)) {
                    throw new RuntimeException($payload['message'] ?? 'Respons data wilayah api.co.id tidak valid.');
                }

                $results = [...$results, ...$payload['data']];
                $totalPages = (int) data_get($payload, 'paging.total_page', 1);
                $page++;
            } while ($page <= max($totalPages, 1));

            return $results;
        });
    }

    private function request(string $apiKey): PendingRequest
    {
        return Http::baseUrl((string) config('services.api_co_id.base_url'))
            ->acceptJson()
            ->timeout(15)
            ->withHeaders([
                'x-api-co-id' => $apiKey,
            ]);
    }
}
