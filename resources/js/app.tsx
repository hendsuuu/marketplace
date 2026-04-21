import { createInertiaApp } from '@inertiajs/react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';
import StoreFrontLayout from '@/layouts/storefront-layout';

const appName = import.meta.env.VITE_APP_NAME || 'Elegance Rental';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    layout: (name) => {
        // Admin + SuperAdmin → existing sidebar layout (AppLayout)
        if (name.startsWith('admin/') || name.startsWith('superadmin/')) {
            return AppLayout;
        }

        // Auth pages → minimal centered auth layout
        if (name.startsWith('auth/')) {
            return AuthLayout;
        }

        // Settings → nested layout
        if (name.startsWith('settings/')) {
            return [StoreFrontLayout, SettingsLayout];
        }

        // Customer account pages → storefront layout (authenticated)
        if (
            name.startsWith('account/') ||
            name.startsWith('cart') ||
            name.startsWith('checkout')
        ) {
            return StoreFrontLayout;
        }

        // All public storefront pages (catalog, product, pages, welcome, etc.)
        return StoreFrontLayout;
    },
    strictMode: true,
    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                {app}
                <Toaster />
            </TooltipProvider>
        );
    },
    progress: {
        color: '#a37f55',
    },
});

// This will set light / dark mode on load...
initializeTheme();
