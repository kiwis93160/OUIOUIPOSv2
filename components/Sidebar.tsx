import React, { useEffect, useMemo, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, FileText, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { NAV_LINKS } from '../constants';
import { NotificationCounts } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationCounts | null;
  onReportClick: () => void;
}

const focusableSelectors = [
  'a[href]',
  'button:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, notifications, onReportClick }) => {
  const { role, logout } = useAuth();
  const navigate = useNavigate();
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const permissions = role?.permissions;

  const visibleNavLinks = useMemo(
    () => NAV_LINKS.filter(link => permissions?.[link.permissionKey] && permissions?.[link.permissionKey] !== 'none'),
    [permissions],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const isDesktop = typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches;
    if (isDesktop) {
      return;
    }

    previouslyFocusedElement.current = document.activeElement as HTMLElement | null;
    const sidebarElement = sidebarRef.current;
    const focusable = sidebarElement?.querySelectorAll<HTMLElement>(focusableSelectors);
    focusable?.[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }

      if (event.key === 'Tab' && focusable && focusable.length > 0) {
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey) {
          if (document.activeElement === first) {
            event.preventDefault();
            last.focus();
          }
        } else if (document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocusedElement.current?.focus?.();
    };
  }, [isOpen, onClose]);

  const handleNavLinkClick = () => {
    const isDesktop = typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches;
    if (!isDesktop) {
      onClose();
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 md:hidden ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden={!isOpen}
        onClick={onClose}
      />
      <aside
        ref={sidebarRef}
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-brand-secondary text-white shadow-xl transition-transform duration-300 ease-in-out md:static md:z-auto md:w-64 md:translate-x-0 md:shadow-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        aria-label="Navigation principale"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <span className="text-2xl font-bold text-brand-primary">OUIOUI</span>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white md:hidden"
            aria-label="Fermer le menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-4">
          {visibleNavLinks.map(link => {
            let notificationContent = null;
            if (notifications) {
                if (link.href === '/para-llevar' && (notifications.pendingTakeaway > 0 || notifications.readyTakeaway > 0)) {
                    notificationContent = (
                        <div className="flex items-center space-x-1">
                            {notifications.pendingTakeaway > 0 && <span className="bg-blue-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full" title={`${notifications.pendingTakeaway} à valider`}>{notifications.pendingTakeaway}</span>}
                            {notifications.readyTakeaway > 0 && <span className="bg-green-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full" title={`${notifications.readyTakeaway} prête(s)`}>{notifications.readyTakeaway}</span>}
                        </div>
                    );
                } else if (link.href === '/ventes' && notifications.readyForService > 0) {
                     notificationContent = <span className="bg-blue-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full" title={`${notifications.readyForService} commande(s) prête(s)`}>{notifications.readyForService}</span>;
                } else if (link.href === '/cocina' && notifications.kitchenOrders > 0) {
                    notificationContent = <span className="bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">{notifications.kitchenOrders}</span>;
                } else if (link.href === '/ingredients' && notifications.lowStockIngredients > 0) {
                    notificationContent = <span className="bg-orange-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">{notifications.lowStockIngredients}</span>;
                }
            }

            return (
              <NavLink
                key={link.name}
                to={link.href}
                onClick={handleNavLinkClick}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-4 py-3 font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/40 ${
                    isActive ? 'bg-white text-brand-secondary' : 'hover:bg-white/10'
                  }`
                }
              >
                <link.icon size={22} />
                <span>{link.name}</span>
                {notificationContent && <span className="ml-auto">{notificationContent}</span>}
              </NavLink>
            );
        })}
        </nav>

        <div className="space-y-2 border-t border-white/10 px-3 py-4">
          <button
            onClick={() => {
              onReportClick();
              handleNavLinkClick();
            }}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40"
          >
            <FileText size={22} />
            <span className="font-semibold">Rapport</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-red-300 transition hover:bg-red-500/20 hover:text-red-100 focus:outline-none focus:ring-2 focus:ring-red-200/80"
          >
            <LogOut size={22} />
            <span className="font-semibold">Déconnexion</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;