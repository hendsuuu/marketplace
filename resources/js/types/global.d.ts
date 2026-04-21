import type { Auth } from '@/types/auth';

export type SharedData = {
    name: string;
    auth: Auth;
    storefront: {
        cart_count: number;
        wishlist_count: number;
        unread_notifications_count: number;
    };
    sidebarOpen: boolean;
    flash: {
        success?: string | null;
        error?: string | null;
    };
    [key: string]: unknown;
};

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: SharedData;
    }
}
