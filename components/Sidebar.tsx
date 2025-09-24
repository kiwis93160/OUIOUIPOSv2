import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, ChevronsLeft, ChevronsRight, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { NAV_LINKS } from '../constants';
import { NotificationCounts } from '../types';

interface SidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  notifications: NotificationCounts | null;
  onReportClick: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, toggleSidebar, notifications, onReportClick }) => {
  const { role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleNavLinks = NAV_LINKS.filter(link => role?.permissions[link.permissionKey] && role?.permissions[link.permissionKey] !== 'none');

  return (
    <aside className={`flex flex-col bg-brand-secondary text-white transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className={`flex items-center p-4 border-b border-gray-700 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && <span className="text-2xl font-bold text-brand-primary">OUIOUI</span>}
        <button onClick={toggleSidebar} className="p-2 rounded-full hover:bg-gray-700">
          {isCollapsed ? <ChevronsRight size={20} /> : <ChevronsLeft size={20} />}
        </button>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-2">
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
                className={({ isActive }) => 
                  `flex items-center p-3 rounded-lg transition-colors duration-200 ${isCollapsed ? 'justify-center' : ''} ${isActive ? 'bg-brand-primary text-brand-secondary' : 'hover:bg-gray-700'}`
                }
                title={isCollapsed ? link.name : ''}
              >
                <link.icon size={24} />
                {!isCollapsed && <span className="ml-4 font-semibold">{link.name}</span>}
                {!isCollapsed && notificationContent && <span className="ml-auto">{notificationContent}</span>}
              </NavLink>
            );
        })}
      </nav>

      <div className="px-2 py-4 border-t border-gray-700 space-y-2">
         {/* Notifications can be added here */}
         <button onClick={onReportClick} className={`flex items-center w-full p-3 rounded-lg text-left hover:bg-gray-700 ${isCollapsed ? 'justify-center' : ''}`}>
           <FileText size={24} />
           {!isCollapsed && <span className="ml-4 font-semibold">Rapport</span>}
         </button>
        <button onClick={handleLogout} className={`flex items-center w-full p-3 rounded-lg text-left text-red-400 hover:bg-red-500 hover:text-white ${isCollapsed ? 'justify-center' : ''}`}>
          <LogOut size={24} />
          {!isCollapsed && <span className="ml-4 font-semibold">Déconnexion</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;