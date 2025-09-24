import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, Users, Armchair, AlertTriangle, Soup, BarChart2, PieChart as PieIcon, Shield } from 'lucide-react';
import { api } from '../services/api';
import { DashboardStats, SalesDataPoint } from '../types';
import Modal from '../components/Modal';
import RoleManager from '../components/RoleManager';

const MainStatCard: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="ui-card p-6 flex items-center space-x-4">
        <div className="p-4 bg-brand-primary/20 text-brand-primary rounded-full">
            {icon}
        </div>
        <div>
            <p className="text-sm font-semibold text-gray-500">{title}</p>
            <p className="text-3xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

const OpStatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; onClick?: () => void }> = ({ title, value, icon, onClick }) => (
    <div className={`ui-card p-4 flex items-center space-x-3 ${onClick ? 'cursor-pointer hover:bg-gray-50' : ''}`} onClick={onClick}>
        <div className="p-3 bg-gray-100 text-gray-600 rounded-lg">
            {icon}
        </div>
        <div>
            <p className="text-xs text-gray-500">{title}</p>
            <p className="text-xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);


const Dashboard: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [salesByProduct, setSalesByProduct] = useState<SalesDataPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [pieChartMode, setPieChartMode] = useState<'category' | 'product'>('category');
    const [isLowStockModalOpen, setLowStockModalOpen] = useState(false);
    const [isRoleManagerOpen, setRoleManagerOpen] = useState(false);

    useEffect(() => {
        const fetchAllStats = async () => {
            try {
                const [statsData, productSalesData] = await Promise.all([
                    api.getDashboardStats(),
                    api.getSalesByProduct()
                ]);
                setStats(statsData);
                setSalesByProduct(productSalesData);
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAllStats();
    }, []);

    if (loading) return <div className="text-gray-800">Chargement des données du dashboard...</div>;
    if (!stats) return <div className="text-red-500">Impossible de charger les données.</div>;

    const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560', '#775DD0'];
    const pieData = pieChartMode === 'category' ? stats.ventesParCategorie : salesByProduct;

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <button
                    onClick={() => setRoleManagerOpen(true)}
                    className="ui-btn-primary"
                >
                    <Shield className="mr-2 h-4 w-4" />
                    Gestion des rôles
                </button>
            </div>

            {/* Block 1: Key Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MainStatCard title="Ventes du Jour" value={`${stats.ventesAujourdhui.toFixed(2)} €`} icon={<DollarSign size={28}/>} />
                <MainStatCard title="Bénéfice du Jour" value={`${stats.beneficeAujourdhui.toFixed(2)} €`} icon={<DollarSign size={28}/>} />
                <MainStatCard title="Clients du Jour" value={stats.clientsAujourdhui.toString()} icon={<Users size={28}/>} />
                <MainStatCard title="Panier Moyen" value={`${stats.panierMoyen.toFixed(2)} €`} icon={<BarChart2 size={28}/>} />
            </div>

            {/* Block 2: Operational Status */}
             <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <OpStatCard title="Tables Occupées" value={stats.tablesOccupees} icon={<Armchair size={24}/>} />
                <OpStatCard title="Clients Actuels" value={stats.clientsActuels} icon={<Users size={24}/>} />
                <OpStatCard title="En Cuisine" value={stats.commandesEnCuisine} icon={<Soup size={24}/>} />
                <OpStatCard 
                    title="Ingrédients Bas" 
                    value={stats.ingredientsStockBas.length} 
                    icon={<AlertTriangle size={24} className={stats.ingredientsStockBas.length > 0 ? 'text-red-500' : 'text-gray-600'} />}
                    onClick={() => setLowStockModalOpen(true)}
                />
            </div>

            {/* Block 3: Weekly Sales Chart */}
            <div className="ui-card p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Ventes Hebdomadaires</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats.ventes7Jours}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="ventes" fill="#8884d8" name="Cette Semaine (€)" />
                        <Bar dataKey="ventesSemainePrecedente" fill="#d8d6f5" name="Semaine Précédente (€)" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            
            {/* Block 4: Sales Pie Chart */}
            <div className="ui-card p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Répartition des Ventes</h3>
                    <div className="flex p-1 bg-gray-200 rounded-lg">
                        <button onClick={() => setPieChartMode('category')} className={`px-3 py-1 text-sm font-semibold rounded-md ${pieChartMode === 'category' ? 'bg-white shadow' : ''}`}>Par Catégorie</button>
                        <button onClick={() => setPieChartMode('product')} className={`px-3 py-1 text-sm font-semibold rounded-md ${pieChartMode === 'product' ? 'bg-white shadow' : ''}`}>Par Produit</button>
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                     <PieChart>
                        <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                            {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(value: number) => `${value.toFixed(2)} €`} />
                        <Legend/>
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <Modal isOpen={isLowStockModalOpen} onClose={() => setLowStockModalOpen(false)} title="Ingrédients en Stock Bas">
                {stats.ingredientsStockBas.length > 0 ? (
                    <ul className="space-y-2">
                        {stats.ingredientsStockBas.map(ing => (
                            <li key={ing.id} className="flex justify-between items-center bg-red-50 p-3 rounded-lg">
                                <span className="font-semibold text-red-800">{ing.nom}</span>
                                <span className="font-bold text-red-600">{ing.stock_actuel} / {ing.stock_minimum} {ing.unite}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-600 text-center">Aucun ingrédient en stock bas pour le moment.</p>
                )}
            </Modal>

            <RoleManager isOpen={isRoleManagerOpen} onClose={() => setRoleManagerOpen(false)} />
        </div>
    );
};

export default Dashboard;
