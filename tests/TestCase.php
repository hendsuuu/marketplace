<?php

namespace Tests;

use App\Http\Middleware\HandleInertiaRequests;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Testing\TestResponse;
use Laravel\Fortify\Features;
use ReflectionObject;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->isolateCompiledViews();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    protected function skipUnlessFortifyHas(string $feature, ?string $message = null): void
    {
        if (! Features::enabled($feature)) {
            $this->markTestSkipped($message ?? "Fortify feature [{$feature}] is not enabled.");
        }
    }

    protected function getInertia(string $uri): TestResponse
    {
        $version = app(HandleInertiaRequests::class)->version(request());

        return $this->get($uri, [
            'X-Inertia' => 'true',
            'X-Requested-With' => 'XMLHttpRequest',
            'X-Inertia-Version' => (string) $version,
        ]);
    }

    private function isolateCompiledViews(): void
    {
        $compiledPath = storage_path('framework/views/testing-'.md5(static::class.'::'.$this->name()));

        if (! is_dir($compiledPath)) {
            mkdir($compiledPath, 0777, true);
        }

        config()->set('view.compiled', $compiledPath);

        $compiler = app('blade.compiler');
        $reflection = new ReflectionObject($compiler);

        while ($reflection && ! $reflection->hasProperty('cachePath')) {
            $reflection = $reflection->getParentClass();
        }

        if ($reflection && $reflection->hasProperty('cachePath')) {
            $property = $reflection->getProperty('cachePath');
            $property->setAccessible(true);
            $property->setValue($compiler, $compiledPath);
        }
    }
}
