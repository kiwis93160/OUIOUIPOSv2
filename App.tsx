

import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedLayout from './pages/ProtectedLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Ventes from './pages/Ventes';
import Commande from './pages/Commande';
import Cuisine from './pages/Cuisine';
import ParaLlevar from './pages/ParaLlevar';
import Ingredients from './pages/Ingredients';
import Produits from './pages/Produits';
import CommandeClient from './pages/CommandeClient';
import NotFound from './pages/NotFound';
import ResumeVentes from './pages/ResumeVentes';

const PrivateRoute: React.FC<{ children: React.ReactElement, permissionKey: string }> = ({ children, permissionKey }) => {
  const { role, loading } = useAuth();
  if (loading) {
    return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-primary"></div></div>;
  }
  const hasPermission = role?.permissions[permissionKey] && role.permissions[permissionKey] !== 'none';
  return role && hasPermission ? children : <Navigate to="/login" replace />;
};

const AppRoutes: React.FC = () => {
    const { role } = useAuth();

    const getHomeRedirect = () => {
        if (!role) return '/login';
        if (role.permissions['/dashboard'] !== 'none') return '/dashboard';
        if (role.permissions['/ventes'] !== 'none') return '/ventes';
        if (role.permissions['/cocina'] !== 'none') return '/cocina';
        return '/login';
    };

    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/commande-client" element={<CommandeClient />} />
            
            <Route path="/" element={
                <PrivateRoute permissionKey="/dashboard">
                    <ProtectedLayout />
                </PrivateRoute>
            }>
                <Route index element={<Navigate to={getHomeRedirect()} replace />} />
                <Route path="dashboard" element={<PrivateRoute permissionKey="/dashboard"><Dashboard /></PrivateRoute>} />
                <Route path="para-llevar" element={<PrivateRoute permissionKey="/para-llevar"><ParaLlevar /></PrivateRoute>} />
                <Route path="ventes" element={<PrivateRoute permissionKey="/ventes"><Ventes /></PrivateRoute>} />
                <Route path="commande/:tableId" element={<PrivateRoute permissionKey="/ventes"><Commande /></PrivateRoute>} />
                <Route path="cocina" element={<PrivateRoute permissionKey="/cocina"><Cuisine /></PrivateRoute>} />
                <Route path="resume-ventes" element={<PrivateRoute permissionKey="/resume-ventes"><ResumeVentes /></PrivateRoute>} />
                <Route path="ingredients" element={<PrivateRoute permissionKey="/ingredients"><Ingredients /></PrivateRoute>} />
                <Route path="produits" element={<PrivateRoute permissionKey="/produits"><Produits /></PrivateRoute>} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
};


const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AuthProvider>
  );
}

export default App;