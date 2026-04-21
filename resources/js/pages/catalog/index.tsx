import { Head, Link, router } from '@inertiajs/react';
import { ChevronDown, ChevronUp, SlidersHorizontal, X } from 'lucide-react';
import { useState  } from 'react';
import type {ReactNode} from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { resolveMediaUrl } from '@/lib/media';
import { catalog } from '@/routes';

type ProductCard = {
    id: number;
    name: string;
    slug: string;
    code: string;
    price: number;
    deposit_price: number | null;
    image: string | null;
    category_name: string | null;
    brand_name: string | null;
    sizes: string[];
    colors: { name: string; hex: string | null }[];
    is_hijab_friendly: boolean;
    is_maternity_friendly: boolean;
    is_big_size_friendly: boolean;
};

type Category = {
    id: number;
    name: string;
    slug: string;
    type: string;
    children: Category[];
};

type Size = { id: number; name: string; label: string };

type Paginator<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
};

type Filters = {
    category?: string;
    brand?: string;
    color?: string;
    size?: string;
    search?: string;
    sort?: string;
    hijab_friendly?: string;
    maternity_friendly?: string;
    big_size_friendly?: string;
};

export default function CatalogIndex({
    products,
    categories,
    sizes,
    filters,
}: {
    products: Paginator<ProductCard>;
    categories: Category[];
    sizes: Size[];
    filters: Filters;
}) {
    const [mobileOpen, setMobileOpen] = useState(false);

    function applyFilter(patch: Partial<Filters>) {
        router.get(catalog(), { ...filters, ...patch, page: undefined }, { preserveScroll: true, replace: true });
    }

    function clearFilter(key: keyof Filters) {
        const next = { ...filters };
        delete next[key];
        router.get(catalog(), next, { replace: true, preserveScroll: true });
    }

    const activeFilters = Object.entries(filters).filter(([, value]) => value && value !== 'newest' && value !== '');

    return (
        <>
            <Head title="Katalog" />

            <section className="border-b border-border bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(246,236,226,0.88))]">
                <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
                    <p className="text-sm uppercase tracking-[0.35em] text-primary">Curated Rental Wardrobe</p>
                    <h1 className="mt-3 max-w-2xl text-4xl font-semibold text-foreground sm:text-5xl">Katalog fashion rental yang rapi, premium, dan siap dipakai.</h1>
                    <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                        Filter kategori, ukuran, dan kebutuhan styling dengan cepat untuk menemukan koleksi yang paling pas.
                    </p>
                </div>
            </section>

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-secondary-foreground">{products.total} produk ditemukan</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setMobileOpen((value) => !value)} className="flex gap-2 lg:hidden">
                        <SlidersHorizontal className="size-4" />
                        Filter
                    </Button>
                </div>

                {activeFilters.length > 0 && (
                    <div className="mb-5 flex flex-wrap gap-2">
                        {activeFilters.map(([key, value]) => (
                            <Badge key={key} variant="secondary" className="flex gap-1 rounded-full border border-primary/15 bg-white text-secondary-foreground shadow-sm">
                                {key.replaceAll('_', ' ')}: {value}
                                <button onClick={() => clearFilter(key as keyof Filters)}>
                                    <X className="size-3" />
                                </button>
                            </Badge>
                        ))}
                        <button onClick={() => router.get(catalog())} className="text-xs font-medium text-[#6a5140] underline underline-offset-4 hover:text-primary">
                            Reset semua
                        </button>
                    </div>
                )}

                <div className="flex gap-8">
                    <aside className={`basis-64 shrink-0 flex-col gap-6 ${mobileOpen ? 'flex' : 'hidden'} lg:flex`}>
                        <FilterSection title="Cari">
                            <input
                                type="search"
                                defaultValue={filters.search}
                                placeholder="Nama, kode, atau brand"
                                className="select-field"
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        applyFilter({ search: (event.target as HTMLInputElement).value });
                                    }
                                }}
                            />
                        </FilterSection>

                        <FilterSection title="Urutkan">
                            <select value={filters.sort ?? 'newest'} onChange={(event) => applyFilter({ sort: event.target.value })} className="select-field">
                                <option value="newest">Terbaru</option>
                                <option value="featured">Unggulan</option>
                                <option value="price_asc">Harga: Rendah ke Tinggi</option>
                                <option value="price_desc">Harga: Tinggi ke Rendah</option>
                                <option value="size_asc">Ukuran: Kecil ke Besar</option>
                                <option value="size_desc">Ukuran: Besar ke Kecil</option>
                            </select>
                        </FilterSection>

                        <FilterSection title="Kategori">
                            <div className="flex flex-col gap-1">
                                <button onClick={() => clearFilter('category')} className={`rounded-lg px-2 py-1 text-left text-sm transition hover:bg-secondary ${!filters.category ? 'font-semibold text-primary' : 'font-medium text-[#4a3225]'}`}>
                                    Semua
                                </button>
                                {categories.map((category) => (
                                    <div key={category.id}>
                                        <button
                                            onClick={() => applyFilter({ category: category.slug })}
                                            className={`rounded-lg px-2 py-1 text-left text-sm transition hover:bg-secondary ${filters.category === category.slug ? 'font-semibold text-primary' : 'font-medium text-[#4a3225]'}`}
                                        >
                                            {category.name}
                                        </button>
                                        {category.children?.map((child) => (
                                            <button
                                                key={child.id}
                                                onClick={() => applyFilter({ category: child.slug })}
                                                className={`ml-3 block rounded-lg px-2 py-1 text-left text-xs transition hover:bg-secondary ${filters.category === child.slug ? 'font-semibold text-primary' : 'font-medium text-[#5a4030] hover:text-[#3f2a1f]'}`}
                                            >
                                                {child.name}
                                            </button>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </FilterSection>

                        <FilterSection title="Ukuran">
                            <div className="flex flex-wrap gap-2">
                                {sizes.map((size) => (
                                    <button
                                        key={size.id}
                                        onClick={() => applyFilter({ size: filters.size === size.name ? undefined : size.name })}
                                        className={`rounded-full border px-3 py-1 text-xs font-medium transition ${filters.size === size.name ? 'border-primary bg-primary/12 text-primary shadow-sm' : 'border-border bg-white text-secondary-foreground hover:border-primary hover:text-primary'}`}
                                    >
                                        {size.name}
                                    </button>
                                ))}
                            </div>
                        </FilterSection>

                        <FilterSection title="Kebutuhan Khusus">
                            {[
                                ['hijab_friendly', 'Hijab Friendly'],
                                ['maternity_friendly', 'Bumil Friendly'],
                                ['big_size_friendly', 'Big Size Friendly'],
                            ].map(([key, label]) => (
                                <label key={key} className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[#4a3225]">
                                    <input
                                        type="checkbox"
                                        checked={filters[key as keyof Filters] === '1'}
                                        onChange={(event) => applyFilter({ [key]: event.target.checked ? '1' : undefined } as Partial<Filters>)}
                                    />
                                    {label}
                                </label>
                            ))}
                        </FilterSection>
                    </aside>

                    <main className="flex-1">
                        {products.data.length === 0 ? (
                            <div className="rounded-[1.2rem] border border-dashed border-border bg-secondary/20 px-6 py-20 text-center text-muted-foreground">
                                Tidak ada produk yang sesuai dengan filter saat ini.
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                                {products.data.map((product) => (
                                    <ProductCardItem key={product.id} product={product} />
                                ))}
                            </div>
                        )}

                        {products.last_page > 1 && (
                            <div className="mt-8 flex flex-wrap justify-center gap-2">
                                {products.links.map((link, index) => (
                                    <Button
                                        key={`${link.label}-${index}`}
                                        size="sm"
                                        variant={link.active ? 'default' : 'outline'}
                                        disabled={!link.url}
                                        onClick={() => link.url && router.visit(link.url)}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </>
    );
}

function ProductCardItem({ product }: { product: ProductCard }) {
    const imageUrl = resolveMediaUrl(product.image);

    return (
        <Link href={`/products/${product.slug}`} className="group flex flex-col overflow-hidden rounded-[1rem] border border-border bg-card transition hover:-translate-y-1 hover:shadow-xl">
            <div className="relative aspect-[3/4] overflow-hidden bg-secondary/40">
                {imageUrl ? (
                    <img src={imageUrl} alt={product.name} className="size-full object-cover transition duration-500 group-hover:scale-105" />
                ) : (
                    <div className="size-full bg-secondary/60" />
                )}

                <div className="absolute left-3 top-3 flex flex-wrap gap-1">
                    {product.is_hijab_friendly && <span className="rounded-full bg-primary px-2 py-1 text-[10px] font-semibold text-primary-foreground">Hijab</span>}
                    {product.is_maternity_friendly && <span className="rounded-full bg-rose-400 px-2 py-1 text-[10px] font-semibold text-white">Bumil</span>}
                    {product.is_big_size_friendly && <span className="rounded-full bg-stone-700 px-2 py-1 text-[10px] font-semibold text-white">Big Size</span>}
                </div>
            </div>

            <div className="flex flex-1 flex-col gap-2 p-4">
                {product.brand_name && <p className="text-[11px] uppercase tracking-[0.25em] text-secondary-foreground">{product.brand_name}</p>}
                <p className="line-clamp-2 text-base font-semibold leading-snug">{product.name}</p>
                <p className="text-sm text-secondary-foreground">{product.category_name}</p>
                <p className="mt-auto text-base font-semibold text-primary">
                    {formatIDR(product.price)}
                    <span className="text-xs font-normal text-secondary-foreground"> / sewa</span>
                </p>

                {product.sizes.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {product.sizes.slice(0, 4).map((size) => (
                            <span key={size} className="rounded-full border border-border bg-white px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
                                {size}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </Link>
    );
}

function FilterSection({ title, children }: { title: string; children: ReactNode }) {
    const [open, setOpen] = useState(true);

    return (
        <div className="rounded-[1rem] border border-[rgba(131,98,70,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(249,243,237,0.98))] p-4 shadow-[0_14px_34px_rgba(88,62,43,0.08)]">
            <button onClick={() => setOpen((value) => !value)} className="mb-2 flex w-full items-center justify-between text-sm font-semibold text-[#4a3225]">
                {title}
                {open ? <ChevronUp className="size-4 text-secondary-foreground" /> : <ChevronDown className="size-4 text-secondary-foreground" />}
            </button>
            {open && <div className="flex flex-col gap-3">{children}</div>}
        </div>
    );
}

function formatIDR(amount: number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
}
