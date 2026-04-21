export type User = {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    address?: string | null;
    instagram?: string | null;
    birth_date?: string | null;
    identity_card?: string | null;
    avatar?: string | null;
    shipping_province?: string | null;
    shipping_city?: string | null;
    shipping_district?: string | null;
    shipping_postal_code?: string | null;
    shipping_village_code?: number | null;
    shipping_district_id?: number | null;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Auth = {
    user: User | null;
    roles: string[];
    permissions: string[];
};

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
