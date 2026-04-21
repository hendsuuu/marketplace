<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function index(Request $request): \Inertia\Response
    {
        $query = User::with('roles')->latest();

        if (! $request->user()->hasRole('superadmin')) {
            $query->role('customer');
        }

        if ($request->filled('search')) {
            $query->where(function ($query) use ($request) {
                $query->where('name', 'like', '%'.$request->search.'%')
                    ->orWhere('email', 'like', '%'.$request->search.'%');
            });
        }

        if ($request->filled('role') && $request->user()->hasRole('superadmin')) {
            $query->role($request->role);
        }

        $users = $query->paginate(20)->withQueryString()->through(fn ($user) => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'roles' => $user->getRoleNames()->values()->all(),
            'created_at' => $user->created_at->format('d M Y'),
        ]);

        $roles = Role::orderBy('name')->pluck('name');

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'roles' => $roles,
            'filters' => $request->only(['search', 'role']),
            'can_manage_roles' => $request->user()->hasRole('superadmin'),
            'can_reset_password' => $request->user()->can('users.reset-password'),
        ]);
    }

    public function updateRoles(Request $request, User $user): \Illuminate\Http\RedirectResponse
    {
        $request->validate([
            'roles' => ['required', 'array'],
            'roles.*' => ['string', 'exists:roles,name'],
        ]);

        if ($user->hasRole('superadmin') && ! collect($request->roles)->contains('superadmin')) {
            return back()->withErrors(['roles' => 'Tidak dapat menghapus role superadmin dari pengguna ini.']);
        }

        $user->syncRoles($request->roles);

        return back()->with('success', "Role pengguna {$user->name} berhasil diperbarui.");
    }

    public function updatePassword(Request $request, User $user): \Illuminate\Http\RedirectResponse
    {
        abort_unless($request->user()->can('users.reset-password'), 403);
        abort_if(! $user->hasRole('customer'), 403);

        $validated = $request->validate([
            'password' => ['required', 'string', 'confirmed', 'min:8'],
        ]);

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        return back()->with('success', "Password customer {$user->name} berhasil diperbarui.");
    }
}
