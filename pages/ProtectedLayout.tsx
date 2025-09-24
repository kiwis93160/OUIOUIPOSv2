import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { NotificationCounts } from '../types';
import ReportModal from '../components/ReportModal';
import { Menu } from 'lucide-react';

const ProtectedLayout: React.FC = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { role } = useAuth();
  const [notifications, setNotifications] = useState<NotificationCounts | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const openSidebar = () => setSidebarOpen(true);
  const closeSidebar = () => setSidebarOpen(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const counts = await api.getNotificationCounts();
        setNotifications(counts);
      } catch (error) {
        console.error("Failed to fetch notifications", error);
      }
    };

    // Initial fetch
    fetchNotifications();

    // Subscribe to real-time updates
    const unsubscribe = api.notifications.subscribe('notifications_updated', fetchNotifications);

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <div className="flex min-h-[100dvh] bg-gray-100">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={closeSidebar}
          notifications={notifications}
          onReportClick={() => setIsReportModalOpen(true)}
        />
        <div className="flex min-h-[100dvh] flex-1 flex-col overflow-hidden">
          <header className="flex items-center justify-between gap-4 border-b border-gray-200 bg-white px-4 py-3 shadow-md md:px-6 md:py-4">
            <button
              type="button"
              onClick={openSidebar}
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-primary md:hidden"
              aria-label="Ouvrir le menu"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-bold text-gray-800 md:text-2xl">Bienvenue, {role?.name}</h1>
            <div className="h-8 w-8 md:hidden" aria-hidden="true" />
            {/* Add other header elements like user menu here */}
          </header>
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </>
  );
};

export default ProtectedLayout;