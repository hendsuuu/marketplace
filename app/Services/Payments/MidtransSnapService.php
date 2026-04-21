<?php

namespace App\Services\Payments;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class MidtransSnapService
{
    /**
     * @param  array<int, array<string, mixed>>  $itemDetails
     * @param  array<string, mixed>  $customerDetails
     * @return array{token: string, redirect_url: string, payload: array<string, mixed>}
     */
    public function createTransaction(
        string $orderId,
        int $grossAmount,
        array $itemDetails,
        array $customerDetails,
        ?string $finishUrl = null,
    ): array {
        $response = $this->snapRequest()
            ->post('/snap/v1/transactions', array_filter([
                'transaction_details' => [
                    'order_id' => $orderId,
                    'gross_amount' => $grossAmount,
                ],
                'credit_card' => [
                    'secure' => true,
                ],
                'item_details' => $itemDetails,
                'customer_details' => $customerDetails,
                'callbacks' => $finishUrl ? ['finish' => $finishUrl] : null,
            ], fn (mixed $value) => $value !== null));

        if ($response->failed()) {
            $this->throwResponseError($response);
        }

        $payload = $response->json();
        $token = data_get($payload, 'token');
        $redirectUrl = data_get($payload, 'redirect_url');

        if (! is_string($token) || $token === '' || ! is_string($redirectUrl) || $redirectUrl === '') {
            throw new RuntimeException('Respons Midtrans Snap tidak valid. Token pembayaran tidak ditemukan.');
        }

        return [
            'token' => $token,
            'redirect_url' => $redirectUrl,
            'payload' => is_array($payload) ? $payload : [],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function getTransactionStatus(string $orderId): array
    {
        $response = $this->apiRequest()->get("/v2/{$orderId}/status");

        if ($response->failed()) {
            $this->throwResponseError($response);
        }

        $payload = $response->json();

        if (! is_array($payload)) {
            throw new RuntimeException('Respons status transaksi Midtrans tidak valid.');
        }

        return $payload;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function verifySignature(array $payload): bool
    {
        $signatureKey = data_get($payload, 'signature_key');
        $orderId = data_get($payload, 'order_id');
        $statusCode = data_get($payload, 'status_code');
        $grossAmount = data_get($payload, 'gross_amount');
        $serverKey = trim((string) config('services.midtrans.server_key'));

        if (! is_string($signatureKey) || $signatureKey === '' || $serverKey === '') {
            return false;
        }

        $expectedSignature = hash('sha512', (string) $orderId.(string) $statusCode.(string) $grossAmount.$serverKey);

        return hash_equals($expectedSignature, $signatureKey);
    }

    public function snapJsUrl(): string
    {
        return (string) config('services.midtrans.snap_js_url');
    }

    public function clientKey(): string
    {
        return trim((string) config('services.midtrans.client_key'));
    }

    public function isConfigured(): bool
    {
        return $this->clientKey() !== '' && trim((string) config('services.midtrans.server_key')) !== '';
    }

    private function snapRequest(): PendingRequest
    {
        return Http::baseUrl((string) config('services.midtrans.snap_base_url'))
            ->acceptJson()
            ->timeout(20)
            ->withHeaders([
                'Authorization' => $this->basicAuthorizationHeader(),
                'Content-Type' => 'application/json',
            ]);
    }

    private function apiRequest(): PendingRequest
    {
        return Http::baseUrl((string) config('services.midtrans.api_base_url'))
            ->acceptJson()
            ->timeout(20)
            ->withHeaders([
                'Authorization' => $this->basicAuthorizationHeader(),
            ]);
    }

    private function basicAuthorizationHeader(): string
    {
        $serverKey = trim((string) config('services.midtrans.server_key'));

        if ($serverKey === '') {
            throw new RuntimeException('Midtrans belum dikonfigurasi. Isi MIDTRANS_SERVER_KEY dan MIDTRANS_CLIENT_KEY terlebih dahulu.');
        }

        return 'Basic '.base64_encode($serverKey.':');
    }

    private function throwResponseError(\Illuminate\Http\Client\Response $response): never
    {
        $payload = $response->json();
        $message = is_array($payload) ? ($payload['status_message'] ?? $payload['message'] ?? null) : null;

        if (is_string($message) && $message !== '') {
            throw new RuntimeException($message);
        }

        throw new RequestException($response);
    }
}
