import { Head, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, KeyRound, Search, Shield } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { BreadcrumbItem } from '@/types';

type User = {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    roles: string[];
    created_at: string;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginatedUsers = {
    data: User[];
    current_page: number;
    last_page: number;
    total: number;
    links: PaginationLink[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Pengguna & Akses', href: '/admin/users' },
];

const ROLE_COLORS: Record<string, string> = {
    superadmin: 'bg-purple-100 text-purple-800',
    admin: 'bg-blue-100 text-blue-800',
    customer: 'bg-stone-100 text-stone-700',
};

function RoleBadge({ role }: { role: string }) {
    return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[role] ?? 'bg-gray-100 text-gray-700'}`}>
            {role}
        </span>
    );
}

export default function UsersIndex({
    users,
    roles,
    filters,
    can_manage_roles,
    can_reset_password,
}: {
    users: PaginatedUsers;
    roles: string[];
    filters: { search?: string; role?: string };
    can_manage_roles: boolean;
    can_reset_password: boolean;
}) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [roleFilter, setRoleFilter] = useState(filters.role ?? '');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [selectedRoles, setSelectedRoles] = useState<Record<number, string[]>>({});
    const [passwordDrafts, setPasswordDrafts] = useState<Record<number, { password: string; confirmation: string }>>({});
    const [savingId, setSavingId] = useState<number | null>(null);
    const [passwordSavingId, setPasswordSavingId] = useState<number | null>(null);

    function applyFilters(overrides: { search?: string; role?: string }) {
        router.get('/admin/users', { search, role: roleFilter, ...overrides }, { preserveScroll: true, replace: true });
    }

    function startEditing(user: User) {
        setEditingId(user.id);
        setSelectedRoles((current) => ({ ...current, [user.id]: [...user.roles] }));
    }

    function toggleRole(userId: number, role: string) {
        setSelectedRoles((current) => {
            const selected = current[userId] ?? [];

            return {
                ...current,
                [userId]: selected.includes(role) ? selected.filter((item) => item !== role) : [...selected, role],
            };
        });
    }

    function saveRoles(user: User) {
        const newRoles = selectedRoles[user.id] ?? user.roles;

        if (newRoles.length === 0) {
            return;
        }

        setSavingId(user.id);
        router.patch(
            `/admin/users/${user.id}/roles`,
            { roles: newRoles },
            {
                preserveScroll: true,
                onSuccess: () => setEditingId(null),
                onFinish: () => setSavingId(null),
            },
        );
    }

    function savePassword(user: User) {
        const draft = passwordDrafts[user.id];

        if (!draft?.password || !draft.confirmation) {
            return;
        }

        setPasswordSavingId(user.id);
        router.patch(
            `/admin/users/${user.id}/password`,
            {
                password: draft.password,
                password_confirmation: draft.confirmation,
            },
            {
                preserveScroll: true,
                onSuccess: () =>
                    setPasswordDrafts((current) => ({
                        ...current,
                        [user.id]: { password: '', confirmation: '' },
                    })),
                onFinish: () => setPasswordSavingId(null),
            },
        );
    }

    return (
        <>
            <Head title="Pengguna & Akses" />

            <div className="flex flex-col gap-6 p-4 sm:p-6">
                <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-purple-100">
                        {can_manage_roles ? <Shield className="size-5 text-purple-600" /> : <KeyRound className="size-5 text-primary" />}
                    </div>
                    <div>
                        <h1 className="font-serif text-2xl font-semibold text-foreground">{can_manage_roles ? 'Pengguna & Akses' : 'Customer Password'}</h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            {users.total} pengguna terdaftar
                            {can_manage_roles ? ' — kelola role dan reset password customer' : ' — reset password khusus akun customer'}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            applyFilters({ search });
                        }}
                        className="flex flex-1 gap-2"
                    >
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama atau email pengguna" className="pl-9" />
                        </div>
                        <Button type="submit" variant="outline">
                            Cari
                        </Button>
                    </form>

                    {can_manage_roles && (
                        <select
                            value={roleFilter}
                            onChange={(event) => {
                                setRoleFilter(event.target.value);
                                applyFilters({ role: event.target.value });
                            }}
                            className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                            <option value="">Semua Role</option>
                            {roles.map((role) => (
                                <option key={role} value={role}>
                                    {role}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                {users.data.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
                        Tidak ada pengguna ditemukan.
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-border">
                        <table className="min-w-full divide-y divide-border text-sm">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Pengguna</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Role Saat Ini</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Reset Password</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border bg-card">
                                {users.data.map((user) => {
                                    const isEditing = editingId === user.id;
                                    const roleSelection = selectedRoles[user.id] ?? user.roles;
                                    const passwordDraft = passwordDrafts[user.id] ?? { password: '', confirmation: '' };

                                    return (
                                        <tr key={user.id} className="align-top hover:bg-muted/30">
                                            <td className="px-4 py-4">
                                                <p className="font-medium text-foreground">{user.name}</p>
                                                <p className="text-xs text-muted-foreground">{user.email}</p>
                                                {user.phone && <p className="mt-1 text-xs text-muted-foreground">{user.phone}</p>}
                                            </td>
                                            <td className="px-4 py-4">
                                                {isEditing && can_manage_roles ? (
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {roles.map((role) => (
                                                            <label key={role} className="flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs transition hover:bg-accent">
                                                                <input type="checkbox" checked={roleSelection.includes(role)} onChange={() => toggleRole(user.id, role)} className="size-3 rounded" />
                                                                <span className={roleSelection.includes(role) ? 'font-medium' : ''}>{role}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-wrap gap-1">
                                                        {user.roles.map((role) => (
                                                            <RoleBadge key={role} role={role} />
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                {can_reset_password && user.roles.includes('customer') ? (
                                                    <div className="grid gap-2 md:max-w-xs">
                                                        <Input
                                                            type="password"
                                                            placeholder="Password baru"
                                                            value={passwordDraft.password}
                                                            onChange={(event) =>
                                                                setPasswordDrafts((current) => ({
                                                                    ...current,
                                                                    [user.id]: { ...passwordDraft, password: event.target.value },
                                                                }))
                                                            }
                                                        />
                                                        <Input
                                                            type="password"
                                                            placeholder="Konfirmasi password"
                                                            value={passwordDraft.confirmation}
                                                            onChange={(event) =>
                                                                setPasswordDrafts((current) => ({
                                                                    ...current,
                                                                    [user.id]: { ...passwordDraft, confirmation: event.target.value },
                                                                }))
                                                            }
                                                        />
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">Reset password hanya untuk customer.</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex flex-wrap gap-2">
                                                    {can_manage_roles && (
                                                        isEditing ? (
                                                            <>
                                                                <Button size="sm" disabled={savingId === user.id || roleSelection.length === 0} onClick={() => saveRoles(user)}>
                                                                    {savingId === user.id ? 'Menyimpan...' : 'Simpan role'}
                                                                </Button>
                                                                <Button size="sm" variant="outline" disabled={savingId === user.id} onClick={() => setEditingId(null)}>
                                                                    Batal
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            <Button size="sm" variant="outline" onClick={() => startEditing(user)}>
                                                                Edit role
                                                            </Button>
                                                        )
                                                    )}

                                                    {can_reset_password && user.roles.includes('customer') && (
                                                        <Button size="sm" variant="secondary" disabled={passwordSavingId === user.id || !passwordDraft.password || !passwordDraft.confirmation} onClick={() => savePassword(user)}>
                                                            {passwordSavingId === user.id ? 'Menyimpan...' : 'Reset password'}
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {users.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <p>
                            Halaman {users.current_page} dari {users.last_page}
                        </p>
                        <div className="flex gap-1">
                            {users.links.map((link, index) => {
                                if (link.label === '&laquo; Previous') {
                                    return (
                                        <Button key={index} size="sm" variant="outline" disabled={!link.url} onClick={() => link.url && router.get(link.url)}>
                                            <ChevronLeft className="size-4" />
                                        </Button>
                                    );
                                }

                                if (link.label === 'Next &raquo;') {
                                    return (
                                        <Button key={index} size="sm" variant="outline" disabled={!link.url} onClick={() => link.url && router.get(link.url)}>
                                            <ChevronRight className="size-4" />
                                        </Button>
                                    );
                                }

                                return (
                                    <Button key={index} size="sm" variant={link.active ? 'default' : 'outline'} disabled={!link.url} onClick={() => link.url && router.get(link.url)}>
                                        {link.label}
                                    </Button>
                                );
                            })}
                        </div>
                    </div>
                )}

                <p className="text-xs text-muted-foreground">
                    {can_manage_roles
                        ? 'Superadmin dapat mengatur role dan permission, sedangkan admin hanya fokus ke reset password customer.'
                        : 'Admin dibatasi hanya untuk reset password akun customer sesuai aturan bisnis saat ini.'}
                </p>
            </div>
        </>
    );
}

UsersIndex.layout = { breadcrumbs };
