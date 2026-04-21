<?php

$midtransIsProduction = filter_var(env('MIDTRANS_IS_PRODUCTION', false), FILTER_VALIDATE_BOOL);

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'api_co_id' => [
        'base_url' => env('API_CO_ID_BASE_URL', 'https://use.api.co.id'),
        'api_key' => env('API_CO_ID_KEY'),
        'origin_village_code' => env('API_CO_ID_ORIGIN_VILLAGE_CODE', '3318102010'),
        'origin_label' => env('API_CO_ID_ORIGIN_LABEL', 'Pati, Jawa Tengah'),
        'origin_village_name' => env('API_CO_ID_ORIGIN_VILLAGE_NAME', 'Winong'),
        'origin_district_name' => env('API_CO_ID_ORIGIN_DISTRICT_NAME', 'Pati'),
        'origin_regency_name' => env('API_CO_ID_ORIGIN_REGENCY_NAME', 'Kabupaten Pati'),
        'origin_province_name' => env('API_CO_ID_ORIGIN_PROVINCE_NAME', 'Jawa Tengah'),
        'couriers' => array_values(array_filter(array_map('trim', explode(':', (string) env('API_CO_ID_COURIERS', 'JNE:JT:LION'))))),
    ],

    'midtrans' => [
        'is_production' => $midtransIsProduction,
        'server_key' => env('MIDTRANS_SERVER_KEY'),
        'client_key' => env('MIDTRANS_CLIENT_KEY'),
        'merchant_id' => env('MIDTRANS_MERCHANT_ID'),
        'snap_base_url' => env('MIDTRANS_SNAP_BASE_URL', $midtransIsProduction ? 'https://app.midtrans.com' : 'https://app.sandbox.midtrans.com'),
        'api_base_url' => env('MIDTRANS_API_BASE_URL', $midtransIsProduction ? 'https://api.midtrans.com' : 'https://api.sandbox.midtrans.com'),
        'snap_js_url' => env('MIDTRANS_SNAP_JS_URL', $midtransIsProduction ? 'https://app.midtrans.com/snap/snap.js' : 'https://app.sandbox.midtrans.com/snap/snap.js'),
    ],

];
