<?php

namespace App\Http\Controllers;

use App\Http\Requests\Storefront\CalculateShippingRatesRequest;
use App\Services\Shipping\ApiCoIdShippingService;
use Illuminate\Http\JsonResponse;
use RuntimeException;
use Throwable;

class ShippingQuoteController extends Controller
{
    public function __construct(
        private readonly ApiCoIdShippingService $shippingService,
    ) {}

    public function __invoke(CalculateShippingRatesRequest $request): JsonResponse
    {
        try {
            $destinationVillageCode = $request->input('destination_village_code') ?: $request->user()?->shipping_district_id;

            if (blank($destinationVillageCode)) {
                return response()->json([
                    'message' => 'Lokasi pengiriman customer belum lengkap. Simpan kelurahan atau desa tujuan di profil terlebih dahulu.',
                ], 422);
            }

            $rates = $this->shippingService->calculateVillageShippingCost(
                destinationVillageCode: $destinationVillageCode,
                weightInGram: $request->integer('weight'),
                couriers: $request->input('couriers'),
            );
        } catch (RuntimeException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 422);
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'message' => 'Layanan ongkir api.co.id sedang tidak dapat dihubungi. Coba lagi beberapa saat.',
            ], 502);
        }

        return response()->json([
            'data' => $rates,
        ]);
    }
}
