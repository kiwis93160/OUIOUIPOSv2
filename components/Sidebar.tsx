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
        className={`app-sidebar fixed inset-y-0 left-0 z-50 flex w-72 flex-col transition-transform duration-300 ease-in-out md:static md:z-auto md:w-64 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        aria-label="Navigation principale"
      >
        <div className="app-sidebar__header">
          <span className="app-sidebar__brand">OUIOUI</span>
          <button onClick={onClose} className="app-sidebar__close md:hidden" aria-label="Fermer le menu">
            <X size={20} />
          </button>
        </div>

        <div className="app-sidebar__content">
          <div className="app-sidebar__scroll-region">
            <nav className="app-sidebar__nav">
              {visibleNavLinks.map(link => {
                let notificationContent: React.ReactNode = null;

                if (notifications) {
                  if (link.href === '/para-llevar' && (notifications.pendingTakeaway > 0 || notifications.readyTakeaway > 0)) {
                    notificationContent = (
                      <span className="app-sidebar__badge-group">
                        {notifications.pendingTakeaway > 0 && (
                          <span
                            className="app-sidebar__badge app-sidebar__badge--info"
                            title={`${notifications.pendingTakeaway} à valider`}
                          >
                            {notifications.pendingTakeaway}
                          </span>
                        )}
                        {notifications.readyTakeaway > 0 && (
                          <span
                            className="app-sidebar__badge app-sidebar__badge--success"
                            title={`${notifications.readyTakeaway} prête(s)`}
                          >
                            {notifications.readyTakeaway}
                          </span>
                        )}
                      </span>
                    );
                  } else if (link.href === '/ventes' && notifications.readyForService > 0) {
                    notificationContent = (
                      <span className="app-sidebar__badge-group">
                        <span
                          className="app-sidebar__badge app-sidebar__badge--info"
                          title={`${notifications.readyForService} commande(s) prête(s)`}
                        >
                          {notifications.readyForService}
                        </span>
                      </span>
                    );
                  } else if (link.href === '/cocina' && notifications.kitchenOrders > 0) {
                    notificationContent = (
                      <span className="app-sidebar__badge-group">
                        <span className="app-sidebar__badge app-sidebar__badge--danger">
                          {notifications.kitchenOrders}
                        </span>
                      </span>
                    );
                  } else if (link.href === '/ingredients' && notifications.lowStockIngredients > 0) {
                    notificationContent = (
                      <span className="app-sidebar__badge-group">
                        <span className="app-sidebar__badge app-sidebar__badge--warning">
                          {notifications.lowStockIngredients}
                        </span>
                      </span>
                    );
                  }
                }

                return (
                  <NavLink
                    key={link.name}
                    to={link.href}
                    onClick={handleNavLinkClick}
                    className={({ isActive }) => `app-sidebar__nav-link${isActive ? ' is-active' : ''}`}
                  >
                    <link.icon size={22} />
                    <span>{link.name}</span>
                    {notificationContent}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          <div className="app-sidebar__section">
            <button
              onClick={() => {
                onReportClick();
                handleNavLinkClick();
              }}
              className="app-sidebar__action"
            >
              <FileText size={22} />
              <span className="font-semibold">Rapport</span>
            </button>
            <button onClick={handleLogout} className="app-sidebar__action app-sidebar__action--logout">
              <LogOut size={22} />
              <span className="font-semibold">Déconnexion</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
