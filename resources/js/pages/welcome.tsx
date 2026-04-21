import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { catalog, dashboard, login, register } from '@/routes';

const brandName = import.meta.env.VITE_APP_NAME || 'Elegance Rental';

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage().props as { auth: { user?: unknown } };

    return (
        <>
            <Head title={brandName} />

            <section className="relative overflow-hidden bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(247,239,230,0.92),rgba(239,224,208,0.82))] dark:bg-[linear-gradient(135deg,rgba(34,27,23,0.98),rgba(53,40,33,0.96),rgba(73,55,45,0.94))]">
                <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(163,127,85,0.14),transparent_65%)]" />

                <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-8 sm:px-6 lg:px-8">
                    <header className="flex items-center justify-between">
                        <Link href={catalog()} className="font-serif text-xl font-semibold uppercase tracking-[0.3em] text-primary sm:text-2xl">
                            {brandName}
                        </Link>

                        <nav className="flex items-center gap-2">
                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="store-ink rounded-md border border-border bg-white/90 px-4 py-2 text-sm font-medium transition hover:border-primary/30 hover:bg-secondary dark:bg-card"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        className="store-ink rounded-md border border-transparent px-4 py-2 text-sm font-medium transition hover:border-primary/20 hover:bg-white/80 dark:hover:bg-card"
                                    >
                                        Masuk
                                    </Link>
                                    {canRegister && (
                                        <Link
                                            href={register()}
                                            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                                        >
                                            Daftar
                                        </Link>
                                    )}
                                </>
                            )}
                        </nav>
                    </header>

                    <div className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:py-16">
                        <div className="max-w-3xl">
                            <div className="inline-flex items-center gap-2 rounded-md border border-primary/15 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-primary dark:bg-card/85">
                                <Sparkles className="size-4" />
                                Fashion Rental Premium
                            </div>

                            <h1 className="store-ink mt-6 max-w-3xl text-5xl font-semibold leading-tight sm:text-6xl">
                                Tampil anggun untuk setiap momen tanpa harus memiliki semuanya.
                            </h1>

                            <p className="store-copy mt-5 max-w-2xl text-base leading-7 sm:text-lg">
                                {brandName} menghadirkan koleksi dress, clutch, dan aksesoris pilihan dengan nuansa simple, classy, dan elegan untuk pesta, fitting, dan momen spesial.
                            </p>

                            <div className="mt-8 flex flex-wrap gap-3">
                                <Link
                                    href={catalog()}
                                    className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                                >
                                    Lihat Katalog
                                    <ArrowRight className="size-4" />
                                </Link>
                                {!auth.user && (
                                    <Link
                                        href={register()}
                                        className="store-ink inline-flex items-center gap-2 rounded-md border border-border bg-white/90 px-6 py-3 text-sm font-semibold transition hover:border-primary/30 hover:bg-secondary dark:bg-card"
                                    >
                                        Buat Akun
                                    </Link>
                                )}
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            {[
                                {
                                    title: '700+ koleksi',
                                    description: 'Kurasi produk siap sewa dengan stok yang rapi dan detail ukuran yang jelas.',
                                },
                                {
                                    title: 'Styling fleksibel',
                                    description: 'Lengkapi look dengan clutch dan aksesoris yang selaras untuk satu pesanan.',
                                },
                                {
                                    title: 'Checkout praktis',
                                    description: 'Pilih tanggal sewa, cek ongkir, dan lanjut ke pembayaran dalam satu alur.',
                                },
                                {
                                    title: 'Support personal',
                                    description: 'WhatsApp customer service selalu siap membantu fitting dan kebutuhan order.',
                                },
                            ].map((item) => (
                                <div key={item.title} className="store-panel p-6 backdrop-blur">
                                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
                                        Elegance Edit
                                    </p>
                                    <h2 className="store-ink mt-3 text-2xl font-semibold">{item.title}</h2>
                                    <p className="store-copy mt-2 text-sm leading-6">{item.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
