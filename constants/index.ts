import { LayoutDashboard, Package, Armchair, Soup, UtensilsCrossed, ShoppingBag, AreaChart } from 'lucide-react';

export const NAV_LINKS = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permissionKey: '/dashboard' },
  { name: 'À Emporter', href: '/para-llevar', icon: ShoppingBag, permissionKey: '/para-llevar' },
  { name: 'Plan de Salle', href: '/ventes', icon: Armchair, permissionKey: '/ventes' },
  { name: 'Cuisine', href: '/cocina', icon: Soup, permissionKey: '/cocina' },
  { name: 'Résumé Ventes', href: '/resume-ventes', icon: AreaChart, permissionKey: '/resume-ventes' },
  { name: 'Produits', href: '/produits', icon: UtensilsCrossed, permissionKey: '/produits' },
  { name: 'Ingrédients', href: '/ingredients', icon: Package, permissionKey: '/ingredients' },
];

export const ROLES = {
    ADMIN: 'admin',
    COCINA: 'cocina',
    MESERO: 'mesero'
};