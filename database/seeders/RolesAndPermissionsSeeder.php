<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            'products.create',
            'products.read',
            'products.update',
            'products.delete',
            'categories.create',
            'categories.read',
            'categories.update',
            'categories.delete',
            'brands.create',
            'brands.read',
            'brands.update',
            'brands.delete',
            'sizes.create',
            'sizes.read',
            'sizes.update',
            'sizes.delete',
            'orders.read',
            'orders.update',
            'orders.cancel',
            'orders.delete',
            'users.read',
            'users.update',
            'users.delete',
            'users.reset-password',
            'roles.create',
            'roles.read',
            'roles.update',
            'roles.delete',
            'roles.assign',
            'permissions.create',
            'permissions.read',
            'permissions.update',
            'permissions.delete',
            'reports.read',
            'settings.read',
            'settings.update',
            'notifications.read',
            'notifications.send',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        $superadmin = Role::firstOrCreate(['name' => 'superadmin']);
        $superadmin->syncPermissions(Permission::all());

        $admin = Role::firstOrCreate(['name' => 'admin']);
        $admin->syncPermissions([
            'products.create',
            'products.read',
            'products.update',
            'categories.read',
            'brands.read',
            'sizes.read',
            'users.read',
            'users.reset-password',
        ]);

        Role::firstOrCreate(['name' => 'customer']);
    }
}
