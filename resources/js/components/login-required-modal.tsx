import { Link } from '@inertiajs/react';
import { login, register } from '@/routes';

interface LoginRequiredModalProps {
    open: boolean;
    onClose: () => void;
    message?: string;
}

export default function LoginRequiredModal({
    open,
    onClose,
    message = 'Silakan masuk atau daftar untuk melanjutkan.',
}: LoginRequiredModalProps) {
    if (!open) {
return null;
}

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Login diperlukan"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal card */}
            <div className="relative z-10 w-full max-w-sm rounded-[0.9rem] bg-background p-8 shadow-2xl">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 rounded-sm p-1 text-muted-foreground hover:text-foreground"
                    aria-label="Tutup"
                >
                    <svg
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18 18 6M6 6l12 12"
                        />
                    </svg>
                </button>

                {/* Icon */}
                <div className="mb-5 flex justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                        <svg
                            className="h-7 w-7 text-primary"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.5}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
                            />
                        </svg>
                    </div>
                </div>

                <h2 className="mb-2 text-center font-serif text-xl font-semibold text-foreground">
                    Masuk Diperlukan
                </h2>
                <p className="mb-6 text-center text-sm text-[#6a5140]">
                    {message}
                </p>

                <div className="flex flex-col gap-3">
                    <Link
                        href={login()}
                        className="inline-flex w-full items-center justify-center rounded-sm bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                        Masuk ke Akun
                    </Link>
                    <Link
                        href={register()}
                        className="inline-flex w-full items-center justify-center rounded-sm border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                    >
                        Daftar Sekarang
                    </Link>
                </div>
            </div>
        </div>
    );
}
