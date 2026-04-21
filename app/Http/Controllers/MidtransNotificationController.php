<?php

namespace App\Http\Controllers;

use App\Actions\Payments\SyncMidtransOrderStatusAction;
use App\Models\Order;
use App\Services\Payments\MidtransSnapService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MidtransNotificationController extends Controller
{
    public function __construct(
        private readonly MidtransSnapService $midtrans,
        private readonly SyncMidtransOrderStatusAction $syncMidtransOrderStatus,
    ) {}

    public function __invoke(Request $request): JsonResponse
    {
        $payload = $request->all();

        if (! is_array($payload) || ! $this->midtrans->verifySignature($payload)) {
            return response()->json([
                'message' => 'Signature Midtrans tidak valid.',
            ], 403);
        }

        $orderId = (string) ($payload['order_id'] ?? '');
        $order = Order::query()->where('order_number', $orderId)->first();

        if (! $order) {
            return response()->json([
                'message' => 'Order tidak ditemukan.',
            ], 404);
        }

        $this->syncMidtransOrderStatus->execute($order, $payload);

        return response()->json([
            'message' => 'OK',
        ]);
    }
}
