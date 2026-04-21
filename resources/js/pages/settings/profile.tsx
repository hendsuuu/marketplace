import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { MapPinned } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { resolveMediaUrl } from '@/lib/media';
import { edit, update as updateProfile } from '@/routes/profile';
import { send } from '@/routes/verification';
import type { SharedData } from '@/types';

type RegionOption = {
    code: string;
    name: string;
    postal_code?: string | null;
};

type ProfileFormData = {
    name: string;
    email: string;
    phone: string;
    instagram: string;
    address: string;
    shipping_province: string;
    shipping_city: string;
    shipping_district: string;
    shipping_postal_code: string;
    shipping_district_id: string;
    birth_date: string;
    identity_card: File | null;
};

type ProfileProps = {
    mustVerifyEmail: boolean;
    status?: string;
    locationOptions: {
        provinces: RegionOption[];
        regencies: RegionOption[];
        districts: RegionOption[];
        villages: RegionOption[];
    };
};

const regionOptionsCache = new Map<string, RegionOption[]>();
const regionRequestCache = new Map<string, Promise<RegionOption[] | { message: string }>>();

export default function Profile({ mustVerifyEmail, status, locationOptions }: ProfileProps) {
    const { auth, flash } = usePage<SharedData>().props;
    const identityCardUrl = resolveMediaUrl(auth.user?.identity_card);
    const initialVillageCode = useMemo(() => {
        const raw = auth.user?.shipping_village_code ?? auth.user?.shipping_district_id;

        return raw ? String(raw).padStart(10, '0') : '';
    }, [auth.user?.shipping_district_id, auth.user?.shipping_village_code]);

    const [provinceCode, setProvinceCode] = useState(initialVillageCode.slice(0, 2));
    const [regencyCode, setRegencyCode] = useState(initialVillageCode.slice(0, 4));
    const [districtCode, setDistrictCode] = useState(initialVillageCode.slice(0, 6));
    const [villageCode, setVillageCode] = useState(initialVillageCode);

    primeRegionCache('/location/regions/provinces', locationOptions.provinces);
    primeRegionCache(`/location/regions/provinces/${provinceCode}/regencies`, locationOptions.regencies);
    primeRegionCache(`/location/regions/regencies/${regencyCode}/districts`, locationOptions.districts);
    primeRegionCache(`/location/regions/districts/${districtCode}/villages`, locationOptions.villages);

    const [provinces] = useState<RegionOption[]>(locationOptions.provinces);
    const [regencies, setRegencies] = useState<RegionOption[]>(locationOptions.regencies);
    const [districts, setDistricts] = useState<RegionOption[]>(locationOptions.districts);
    const [villages, setVillages] = useState<RegionOption[]>(locationOptions.villages);
    const [loadingRegion, setLoadingRegion] = useState<'regency' | 'district' | 'village' | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);

    const form = useForm<ProfileFormData>({
        name: auth.user?.name ?? '',
        email: auth.user?.email ?? '',
        phone: auth.user?.phone ?? '',
        instagram: auth.user?.instagram ? `@${auth.user.instagram}` : '',
        address: auth.user?.address ?? '',
        shipping_province: auth.user?.shipping_province ?? '',
        shipping_city: auth.user?.shipping_city ?? '',
        shipping_district: auth.user?.shipping_district ?? '',
        shipping_postal_code: normalizePostalCode(auth.user?.shipping_postal_code),
        shipping_district_id: initialVillageCode,
        birth_date: auth.user?.birth_date ?? '',
        identity_card: null,
    });

    const selectedVillage = villages.find((item) => item.code === villageCode) ?? null;
    const shippingSummary = [
        form.data.shipping_district && `Kec. ${form.data.shipping_district}`,
        selectedVillage && `Kel. ${toDisplayName(selectedVillage.name)}`,
        form.data.shipping_city,
        form.data.shipping_province,
    ]
        .filter(Boolean)
        .join(', ');

    function submitProfile(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        form.patch(updateProfile.url(), {
            preserveScroll: true,
            forceFormData: true,
        });
    }

    async function resetProvince(nextCode: string) {
        const option = provinces.find((item) => item.code === nextCode);

        setProvinceCode(nextCode);
        setRegencyCode('');
        setDistrictCode('');
        setVillageCode('');
        setRegencies([]);
        setDistricts([]);
        setVillages([]);
        setLocationError(null);
        form.setData({
            ...form.data,
            shipping_province: option ? toDisplayName(option.name) : '',
            shipping_city: '',
            shipping_district: '',
            shipping_postal_code: '',
            shipping_district_id: '',
        });

        if (!nextCode) {
            setLoadingRegion(null);

            return;
        }

        setLoadingRegion('regency');

        const payload = await fetchRegionOptions(`/location/regions/provinces/${nextCode}/regencies`);

        if ('message' in payload) {
            setLocationError(payload.message);
            setLoadingRegion(null);

            return;
        }

        setRegencies(payload);
        setLoadingRegion(null);
    }

    async function resetRegency(nextCode: string) {
        const option = regencies.find((item) => item.code === nextCode);

        setRegencyCode(nextCode);
        setDistrictCode('');
        setVillageCode('');
        setDistricts([]);
        setVillages([]);
        setLocationError(null);
        form.setData({
            ...form.data,
            shipping_city: option ? toDisplayName(option.name) : '',
            shipping_district: '',
            shipping_postal_code: '',
            shipping_district_id: '',
        });

        if (!nextCode) {
            setLoadingRegion(null);

            return;
        }

        setLoadingRegion('district');

        const payload = await fetchRegionOptions(`/location/regions/regencies/${nextCode}/districts`);

        if ('message' in payload) {
            setLocationError(payload.message);
            setLoadingRegion(null);

            return;
        }

        setDistricts(payload);
        setLoadingRegion(null);
    }

    async function resetDistrict(nextCode: string) {
        const option = districts.find((item) => item.code === nextCode);

        setDistrictCode(nextCode);
        setVillageCode('');
        setVillages([]);
        setLocationError(null);
        form.setData({
            ...form.data,
            shipping_district: option ? toDisplayName(option.name) : '',
            shipping_postal_code: '',
            shipping_district_id: '',
        });

        if (!nextCode) {
            setLoadingRegion(null);

            return;
        }

        setLoadingRegion('village');

        const payload = await fetchRegionOptions(`/location/regions/districts/${nextCode}/villages`);

        if ('message' in payload) {
            setLocationError(payload.message);
            setLoadingRegion(null);

            return;
        }

        setVillages(payload);
        setLoadingRegion(null);
    }

    function selectVillage(nextCode: string) {
        const option = villages.find((item) => item.code === nextCode);

        setVillageCode(nextCode);
        form.setData({
            ...form.data,
            shipping_district_id: option?.code ?? '',
            shipping_postal_code: normalizePostalCode(option?.postal_code),
        });
    }

    return (
        <>
            <Head title="Profil customer" />

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Informasi akun customer"
                    description="Lengkapi data profil, alamat, identitas, dan lokasi pengiriman agar proses rental berjalan lebih cepat dan lebih rapi."
                />

                {flash.success && (
                    <div className="rounded-lg border border-primary/20 bg-primary/8 px-4 py-3 text-sm font-medium text-primary dark:border-primary/30 dark:bg-primary/12 dark:text-stone-100">
                        {flash.success}
                    </div>
                )}

                <form onSubmit={submitProfile} className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nama Lengkap</Label>
                            <Input
                                id="name"
                                name="name"
                                required
                                autoComplete="name"
                                value={form.data.name}
                                onChange={(event) => form.setData('name', event.target.value)}
                            />
                            <InputError className="mt-1" message={form.errors.name} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                required
                                autoComplete="username"
                                value={form.data.email}
                                onChange={(event) => form.setData('email', event.target.value)}
                            />
                            <InputError className="mt-1" message={form.errors.email} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="phone">No. Telepon</Label>
                            <Input
                                id="phone"
                                name="phone"
                                autoComplete="tel"
                                placeholder="08xxxxxxxxxx"
                                value={form.data.phone}
                                onChange={(event) => form.setData('phone', event.target.value)}
                            />
                            <InputError className="mt-1" message={form.errors.phone} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="instagram">Instagram</Label>
                            <Input
                                id="instagram"
                                name="instagram"
                                placeholder="@username"
                                value={form.data.instagram}
                                onChange={(event) => form.setData('instagram', event.target.value)}
                            />
                            <InputError className="mt-1" message={form.errors.instagram} />
                        </div>

                        <div className="grid gap-2 md:col-span-2">
                            <Label htmlFor="address">Alamat</Label>
                            <textarea
                                id="address"
                                name="address"
                                rows={4}
                                className="textarea-field"
                                placeholder="Alamat lengkap untuk pengiriman dan pengembalian"
                                value={form.data.address}
                                onChange={(event) => form.setData('address', event.target.value)}
                            />
                            <InputError className="mt-1" message={form.errors.address} />
                        </div>
                    </div>

                    <div className="store-gradient-panel p-5">
                        <div className="flex items-start gap-3">
                            <div className="rounded-md bg-secondary p-2 text-primary dark:bg-secondary/80">
                                <MapPinned className="size-4" />
                            </div>
                            <div>
                                <p className="store-ink text-sm font-semibold">Lokasi pengiriman customer</p>
                                <p className="store-copy mt-1 text-sm leading-6">
                                    Pilih lokasi bertahap sampai kelurahan atau desa. Sistem menyimpan kode wilayah otomatis untuk checkout dan cek ongkir, jadi Anda tidak perlu
                                    mengetik ID wilayah manual.
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 grid gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="province_code">Provinsi</Label>
                                <select
                                    id="province_code"
                                    value={provinceCode}
                                    onChange={(event) => void resetProvince(event.target.value)}
                                    className="select-field"
                                >
                                    <option value="">Pilih provinsi</option>
                                    {provinces.map((province) => (
                                        <option key={province.code} value={province.code}>
                                            {toDisplayName(province.name)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="regency_code">Kabupaten / Kota</Label>
                                <select
                                    id="regency_code"
                                    value={regencyCode}
                                    onChange={(event) => void resetRegency(event.target.value)}
                                    className="select-field"
                                    disabled={!provinceCode || loadingRegion === 'regency'}
                                >
                                    <option value="">Pilih kabupaten / kota</option>
                                    {regencies.map((regency) => (
                                        <option key={regency.code} value={regency.code}>
                                            {toDisplayName(regency.name)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="district_code">Kecamatan</Label>
                                <select
                                    id="district_code"
                                    value={districtCode}
                                    onChange={(event) => void resetDistrict(event.target.value)}
                                    className="select-field"
                                    disabled={!regencyCode || loadingRegion === 'district'}
                                >
                                    <option value="">Pilih kecamatan</option>
                                    {districts.map((district) => (
                                        <option key={district.code} value={district.code}>
                                            {toDisplayName(district.name)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="village_code">Kelurahan / Desa</Label>
                                <select
                                    id="village_code"
                                    value={villageCode}
                                    onChange={(event) => selectVillage(event.target.value)}
                                    className="select-field"
                                    disabled={!districtCode || loadingRegion === 'village'}
                                >
                                    <option value="">Pilih kelurahan / desa</option>
                                    {villages.map((village) => (
                                        <option key={village.code} value={village.code}>
                                            {toDisplayName(village.name)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="shipping_postal_code">Kode Pos (opsional)</Label>
                                <Input
                                    id="shipping_postal_code"
                                    inputMode="numeric"
                                    maxLength={10}
                                    placeholder="Isi manual jika diperlukan"
                                    value={form.data.shipping_postal_code}
                                    onChange={(event) => form.setData('shipping_postal_code', normalizePostalCode(event.target.value))}
                                />
                                <p className="store-copy text-xs leading-5">
                                    Sebagian paket API wilayah tidak menyediakan kode pos otomatis. Anda tetap bisa menyimpan profil tanpa field ini.
                                </p>
                                <InputError className="mt-1" message={form.errors.shipping_postal_code} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="shipping_summary">Ringkasan lokasi</Label>
                                <Input
                                    id="shipping_summary"
                                    readOnly
                                    className="bg-muted/60"
                                    value={shippingSummary}
                                    placeholder="Pilih wilayah sampai kelurahan / desa"
                                />
                                <InputError className="mt-1" message={form.errors.shipping_district_id} />
                            </div>
                        </div>

                        {locationError && (
                            <p className="mt-4 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                                {locationError}
                            </p>
                        )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="birth_date">Tanggal Lahir</Label>
                            <Input
                                id="birth_date"
                                name="birth_date"
                                type="date"
                                value={form.data.birth_date}
                                onChange={(event) => form.setData('birth_date', event.target.value)}
                            />
                            <InputError className="mt-1" message={form.errors.birth_date} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="identity_card">Kartu Identitas</Label>
                            <Input
                                id="identity_card"
                                name="identity_card"
                                type="file"
                                accept=".jpg,.jpeg,.png,.webp,.pdf"
                                onChange={(event) => form.setData('identity_card', event.target.files?.[0] ?? null)}
                            />
                            <InputError className="mt-1" message={form.errors.identity_card} />
                            {identityCardUrl && (
                                <a href={identityCardUrl} target="_blank" rel="noreferrer" className="text-xs text-primary underline underline-offset-4">
                                    Lihat file identitas saat ini
                                </a>
                            )}
                        </div>
                    </div>

                    {mustVerifyEmail && auth.user?.email_verified_at === null && (
                        <div>
                            <p className="store-copy text-sm">
                                Email Anda belum terverifikasi.{' '}
                                <Link
                                    href={send()}
                                    as="button"
                                    className="text-foreground underline decoration-neutral-300 underline-offset-4 transition hover:decoration-current"
                                >
                                    Kirim ulang email verifikasi.
                                </Link>
                            </p>

                            {status === 'verification-link-sent' && (
                                <div className="mt-2 text-sm font-medium text-green-600">
                                    Link verifikasi baru sudah dikirim ke email Anda.
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex items-center gap-4">
                        <Button disabled={form.processing} data-test="update-profile-button">
                            {form.processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </Button>
                    </div>
                </form>
            </div>

            <DeleteUser />
        </>
    );
}

async function fetchRegionOptions(endpoint: string): Promise<RegionOption[] | { message: string }> {
    if (regionOptionsCache.has(endpoint)) {
        return regionOptionsCache.get(endpoint) ?? [];
    }

    if (regionRequestCache.has(endpoint)) {
        return regionRequestCache.get(endpoint) as Promise<RegionOption[] | { message: string }>;
    }

    const request = fetchRegionOptionsNetwork(endpoint).finally(() => {
        regionRequestCache.delete(endpoint);
    });

    regionRequestCache.set(endpoint, request);

    return request;
}

async function fetchRegionOptionsNetwork(endpoint: string): Promise<RegionOption[] | { message: string }> {
    try {
        const response = await fetch(endpoint, {
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
            credentials: 'same-origin',
        });

        const payload = (await response.json()) as { data?: RegionOption[]; message?: string };

        if (!response.ok) {
            return { message: payload.message ?? 'Gagal mengambil data wilayah.' };
        }

        const options = payload.data ?? [];
        regionOptionsCache.set(endpoint, options);

        return options;
    } catch {
        return { message: 'Gagal terhubung ke layanan data wilayah.' };
    }
}

function primeRegionCache(endpoint: string, options: RegionOption[]): void {
    if (!endpoint.includes('//') && options.length > 0 && !regionOptionsCache.has(endpoint)) {
        regionOptionsCache.set(endpoint, options);
    }
}

function normalizePostalCode(value: string | null | undefined): string {
    const digits = (value ?? '').replace(/\D+/g, '');

    if (digits.length < 4 || digits.length > 10) {
        return '';
    }

    return digits;
}

function toDisplayName(value: string): string {
    return value
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'Profil customer',
            href: edit(),
        },
    ],
};
