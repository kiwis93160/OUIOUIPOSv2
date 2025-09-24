import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { NotificationCounts } from '../types';
import ReportModal from '../components/ReportModal';

const ProtectedLayout: React.FC = () => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { role } = useAuth();
  const [notifications, setNotifications] = useState<NotificationCounts | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  
  const toggleSidebar = () => setSidebarCollapsed(!isSidebarCollapsed);

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

  return (
    <>
      <div className="flex h-screen bg-gray-100">
        <Sidebar 
          isCollapsed={isSidebarCollapsed} 
          toggleSidebar={toggleSidebar} 
          notifications={notifications}
          onReportClick={() => setIsReportModalOpen(true)}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="flex justify-between items-center p-4 bg-white shadow-md">
            <h1 className="text-2xl font-bold text-gray-800">Bienvenue, {role?.name}</h1>
            {/* Add other header elements like user menu here */}
          </header>
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 p-6">
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