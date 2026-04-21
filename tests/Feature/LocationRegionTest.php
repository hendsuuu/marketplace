<?php

use App\Models\User;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;

test('authenticated user can fetch provinces from api co id regional endpoint', function () {
    Config::set('services.api_co_id.api_key', 'test-key');

    Http::fake([
        'https://use.api.co.id/regional/indonesia/provinces*' => Http::response([
            'is_success' => true,
            'message' => 'Success',
            'data' => [
                ['code' => '33', 'name' => 'JAWA TENGAH'],
                ['code' => '35', 'name' => 'JAWA TIMUR'],
            ],
            'paging' => [
                'page' => 1,
                'size' => 100,
                'total_item' => 2,
                'total_page' => 1,
            ],
        ]),
    ]);

    $this->actingAs(User::factory()->create())
        ->getJson(route('location.regions.provinces'))
        ->assertOk()
        ->assertJsonPath('data.0.code', '33')
        ->assertJsonPath('data.0.name', 'JAWA TENGAH');
});

test('village endpoint strips premium postal code placeholders', function () {
    Config::set('services.api_co_id.api_key', 'test-key');

    Http::fake([
        'https://use.api.co.id/regional/indonesia/districts/331810/villages*' => Http::response([
            'is_success' => true,
            'message' => 'Success',
            'data' => [
                [
                    'code' => '3318102010',
                    'name' => 'WINONG',
                    'postal_code' => 'postal_code available only on premium',
                ],
            ],
            'paging' => [
                'page' => 1,
                'size' => 100,
                'total_item' => 1,
                'total_page' => 1,
            ],
        ]),
    ]);

    $this->actingAs(User::factory()->create())
        ->getJson(route('location.regions.villages', ['districtCode' => '331810']))
        ->assertOk()
        ->assertJsonPath('data.0.code', '3318102010')
        ->assertJsonPath('data.0.postal_code', null);
});
