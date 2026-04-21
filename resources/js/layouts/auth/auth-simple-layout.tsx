import { Link } from '@inertiajs/react';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const appName = import.meta.env.VITE_APP_NAME || 'Elegance Rental';

    return (
        <div className="flex min-h-svh">
            {/* Left panel — decorative, hidden on mobile */}
            <div
                className="hidden flex-col items-center justify-between p-12 lg:flex lg:w-1/2 xl:w-5/12"
                style={{
                    background:
                        'linear-gradient(160deg, oklch(0.25 0.06 44) 0%, oklch(0.18 0.05 40) 60%, oklch(0.12 0.04 36) 100%)',
                }}
            >
                {/* Top: logo */}
                <Link href={home()} className="self-start">
                    <span className="font-serif text-2xl font-semibold tracking-[0.25em] text-[oklch(0.88_0.06_60)] uppercase">
                        {appName}
                    </span>
                </Link>

                {/* Center: tagline */}
                <div className="text-center">
                    <p className="font-serif text-3xl leading-relaxed font-light tracking-wide text-[oklch(0.88_0.06_60)]">
                        "Tampil memukau
                        <br />
                        tanpa harus memiliki."
                    </p>
                    <p className="mt-4 text-sm tracking-widest text-[oklch(0.65_0.05_55)] uppercase">
                        Fashion Rental · Elegant · Affordable
                    </p>
                </div>

                {/* Bottom: caption */}
                <p className="text-xs text-[oklch(0.50_0.04_50)]">
                    © {new Date().getFullYear()} {appName}. All rights reserved.
                </p>
            </div>

            {/* Right panel — form */}
            <div className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-12 sm:px-10">
                {/* Mobile logo */}
                <Link href={home()} className="mb-8 lg:hidden">
                    <span className="font-serif text-2xl font-semibold tracking-[0.25em] text-primary uppercase">
                        {appName}
                    </span>
                </Link>

                <div className="w-full max-w-sm">
                    <div className="mb-8 text-center lg:text-left">
                        <h1 className="font-serif text-2xl font-semibold text-foreground">
                            {title}
                        </h1>
                        {description && (
                            <p className="mt-1.5 text-sm text-muted-foreground">
                                {description}
                            </p>
                        )}
                    </div>

                    {children}
                </div>
            </div>
        </div>
    );
}
