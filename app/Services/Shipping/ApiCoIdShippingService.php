<?php

namespace App\Services\Shipping;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class ApiCoIdShippingService
{
    public function calculateVillageShippingCost(
        int|string $destinationVillageCode,
        int $weightInGram,
        ?array $couriers = null,
        int|string|null $originVillageCode = null,
    ): array {
        $apiKey = trim((string) config('services.api_co_id.api_key'));
        $origin = $originVillageCode ?? config('services.api_co_id.origin_village_code');
        $allowedCouriers = $this->normalizeCourierCodes($couriers ?: config('services.api_co_id.couriers', []));
        $roundedWeightInKilogram = $this->convertGramToRoundedKilogram($weightInGram);

        if ($apiKey === '' || blank($origin)) {
            throw new RuntimeException('API ongkir api.co.id belum dikonfigurasi lengkap. Isi API key dan origin village code terlebih dahulu.');
        }

        if ($allowedCouriers === []) {
            throw new RuntimeException('Belum ada courier api.co.id yang aktif. Isi konfigurasi courier terlebih dahulu.');
        }

        $payload = Cache::remember(
            'api-co-id-shipping-cost:'.md5(implode('|', [(string) $origin, (string) $destinationVillageCode, (string) $roundedWeightInKilogram])),
            now()->addMinutes(30),
            function () use ($apiKey, $destinationVillageCode, $origin, $roundedWeightInKilogram) {
                $response = $this->request($apiKey)
                    ->retry(2, 300, throw: false)
                    ->get('expedition/shipping-cost', [
                        'origin_village_code' => (string) $origin,
                        'destination_village_code' => (string) $destinationVillageCode,
                        'weight' => $roundedWeightInKilogram,
                    ]);

                if ($response->failed()) {
                    $this->throwKnownResponseError($response);
                }

                return $response->json();
            },
        );

        if (($payload['is_success'] ?? false) !== true) {
            throw new RuntimeException($payload['message'] ?? 'Respons api.co.id tidak valid. Coba lagi beberapa saat.');
        }

        $couriersData = data_get($payload, 'data.couriers');

        if (! is_array($couriersData)) {
            throw new RuntimeException('Respons api.co.id tidak valid. Daftar courier tidak ditemukan.');
        }

        return collect($couriersData)
            ->filter(fn (array $item) => in_array($this->normalizeCourierCode($item['courier_code'] ?? null), $allowedCouriers, true))
            ->map(fn (array $item) => $this->normalizeRateItem($item, $weightInGram))
            ->sortBy('shipping_cost')
            ->values()
            ->all();
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

    private function convertGramToRoundedKilogram(int $weightInGram): int
    {
        return max(1, (int) ceil(max($weightInGram, 1) / 1000));
    }

    /**
     * @param  array<int, mixed>  $couriers
     * @return array<int, string>
     */
    private function normalizeCourierCodes(array $couriers): array
    {
        return collect($couriers)
            ->map(fn ($code) => $this->normalizeCourierCode($code))
            ->filter()
            ->unique()
            ->values()
            ->all();
    }

    private function normalizeCourierCode(mixed $code): string
    {
        return strtoupper((string) preg_replace('/[^a-z0-9]/i', '', trim((string) $code)));
    }

    /**
     * @param  array<string, mixed>  $item
     * @return array<string, mixed>
     */
    private function normalizeRateItem(array $item, int $weightInGram): array
    {
        $courierCode = strtoupper((string) ($item['courier_code'] ?? ''));
        $shippingCost = (int) ($item['price'] ?? 0);
        $weightInKilogram = (int) ($item['weight'] ?? 0);

        return [
            'shipping_name' => $item['courier_name'] ?? null,
            'shipping_code' => $courierCode,
            'service_name' => $courierCode !== '' ? $courierCode : null,
            'service_description' => null,
            'weight' => $weightInKilogram > 0 ? $weightInKilogram * 1000 : $weightInGram,
            'shipping_cost' => $shippingCost,
            'shipping_cost_net' => $shippingCost,
            'shipping_cashback' => null,
            'service_fee' => null,
            'grandtotal' => $shippingCost,
            'etd' => $item['estimation'] ?? null,
            'is_cod' => false,
        ];
    }

    private function throwKnownResponseError(\Illuminate\Http\Client\Response $response): never
    {
        $payload = $response->json();
        $message = is_array($payload) ? ($payload['message'] ?? null) : null;

        if (is_string($message) && $message !== '') {
            throw new RuntimeException($message);
        }

        throw new RequestException($response);
    }
}
