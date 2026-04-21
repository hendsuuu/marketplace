import { Link, usePage } from '@inertiajs/react';
import { KeyRound, LayoutGrid, Layers, Package, Tag, Users } from 'lucide-react';
import * as BrandController from '@/actions/App/Http/Controllers/Admin/BrandController';
import * as CategoryController from '@/actions/App/Http/Controllers/Admin/CategoryController';
import * as ProductController from '@/actions/App/Http/Controllers/Admin/ProductController';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavItem, SharedData } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/admin/dashboard',
        icon: LayoutGrid,
    },
];

const adminNavItems: NavItem[] = [
    { title: 'Produk', href: ProductController.index().url, icon: Package },
    { title: 'Kategori', href: CategoryController.index().url, icon: Layers },
    { title: 'Brand', href: BrandController.index().url, icon: Tag },
    { title: 'Customer Password', href: '/admin/users', icon: KeyRound },
];

const superadminNavItems: NavItem[] = [
    { title: 'Pengguna & Akses', href: '/admin/users', icon: Users },
];

const footerNavItems: NavItem[] = [];

export function AppSidebar() {
    const { auth } = usePage<SharedData>().props;
    const isAdmin = auth.roles?.includes('admin') || auth.roles?.includes('superadmin');
    const isSuperAdmin = auth.roles?.includes('superadmin');

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/admin/dashboard">
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
                {isAdmin && <NavMain items={adminNavItems} />}
                {isSuperAdmin && <NavMain items={superadminNavItems} />}
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
