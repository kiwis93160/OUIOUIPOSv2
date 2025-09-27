import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { Order } from '../types';
import { Download, ChevronDown, ChevronRight, User, ShoppingBag } from 'lucide-react';
import { formatIntegerAmount } from '../utils/formatIntegerAmount';

const ResumeVentes: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        paymentMethod: 'all',
    });

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const ordersData = await api.getFinalizedOrders();
                setOrders([...ordersData].sort((a, b) => b.date_creation - a.date_creation));
            } catch (error) {
                console.error("Failed to fetch finalized orders", error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            const orderDate = new Date(order.date_creation);
            const startDate = filters.startDate ? new Date(filters.startDate) : null;
            const endDate = filters.endDate ? new Date(filters.endDate) : null;
            
            if (startDate) startDate.setHours(0, 0, 0, 0);
            if (endDate) endDate.setHours(23, 59, 59, 999);

            const isAfterStartDate = startDate ? orderDate >= startDate : true;
            const isBeforeEndDate = endDate ? orderDate <= endDate : true;
            const matchesPaymentMethod = filters.paymentMethod === 'all' || order.payment_method === filters.paymentMethod;
            
            return isAfterStartDate && isBeforeEndDate && matchesPaymentMethod;
        });
    }, [orders, filters]);
    
    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const exportToCSV = () => {
        const headers = ['Date', 'Type', 'Table/Client', 'Couverts', 'Total Vente (€)', 'Bénéfice (€)', 'Méthode Paiement'];
        const csvRows = [
            headers.join(','),
            ...filteredOrders.map(order => [
                new Date(order.date_creation).toLocaleString('fr-FR'),
                order.type === 'sur_place' ? 'Sur Place' : 'À Emporter',
                `"${order.type === 'sur_place' ? (order.table_nom || 'N/A') : (order.clientInfo?.nom || 'N/A')}"`,
                order.couverts,
                formatIntegerAmount(order.total),
                formatIntegerAmount(order.profit || 0),
                order.payment_method || 'N/A'
            ].join(','))
        ];

        const csvString = csvRows.join('\n');
        const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `resume_commandes_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    
    const totals = useMemo(() => {
        return filteredOrders.reduce((acc, order) => {
            acc.totalSales += order.total;
            acc.totalProfit += (order.profit || 0);
            return acc;
        }, { totalSales: 0, totalProfit: 0 });
    }, [filteredOrders]);

    if (loading) return <div className="text-gray-800">Chargement du résumé des ventes...</div>;

    return (
        <div className="space-y-6">
            <div className="mt-6 space-y-4 rounded-xl bg-white p-4 shadow-md">
                 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                     <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700">Date de début</label>
                        <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary text-gray-900"/>
                    </div>
                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700">Date de fin</label>
                        <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary text-gray-900"/>
                    </div>
                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700">Méthode de paiement</label>
                        <select name="paymentMethod" value={filters.paymentMethod} onChange={handleFilterChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary text-gray-900">
                            <option value="all">Toutes</option>
                            <option value="efectivo">Efectivo</option>
                            <option value="transferencia">Transferencia</option>
                            <option value="tarjeta">Tarjeta</option>
                        </select>
                    </div>
                    <button onClick={exportToCSV} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-green-700 transition h-12 sm:h-full sm:self-end">
                        <Download size={18} /> Export CSV
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-md">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b">
                            <tr>
                                <th className="p-3"></th>
                                <th className="p-3 text-sm font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="p-3 text-sm font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="p-3 text-sm font-medium text-gray-500 uppercase tracking-wider">Table/Client</th>
                                <th className="p-3 text-sm font-medium text-gray-500 uppercase tracking-wider text-right">Ventes</th>
                                <th className="p-3 text-sm font-medium text-gray-500 uppercase tracking-wider text-right">Bénéfice</th>
                                <th className="p-3 text-sm font-medium text-gray-500 uppercase tracking-wider">Paiement</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map(order => (
                                <React.Fragment key={order.id}>
                                    <tr onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)} className="border-b hover:bg-gray-50 cursor-pointer">
                                        <td className="p-3">
                                            {expandedOrderId === order.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                        </td>
                                        <td className="p-3 text-sm text-gray-700 whitespace-nowrap">{new Date(order.date_creation).toLocaleString('fr-FR')}</td>
                                        <td className="p-3 text-sm">
                                            {order.type === 'sur_place' ? (
                                                <span className="inline-flex items-center gap-1.5 py-1 px-2 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><User size={12}/> Sur Place</span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 py-1 px-2 rounded-full text-xs font-medium bg-purple-100 text-purple-800"><ShoppingBag size={12}/> À Emporter</span>
                                            )}
                                        </td>
                                        <td className="p-3 font-semibold text-gray-900">{order.type === 'sur_place' ? (order.table_nom || 'N/A') : (order.clientInfo?.nom || 'N/A')}</td>
                                        <td className="p-3 text-gray-800 font-bold text-right">{formatIntegerAmount(order.total)} €</td>
                                        <td className="p-3 font-semibold text-green-600 text-right">{formatIntegerAmount(order.profit || 0)} €</td>
                                        <td className="p-3 text-gray-700 capitalize">{order.payment_method || 'N/A'}</td>
                                    </tr>
                                    {expandedOrderId === order.id && (
                                        <tr className="bg-gray-50">
                                            <td colSpan={7} className="p-4">
                                                <div className="p-2 bg-white rounded-md border">
                                                    <h4 className="font-semibold mb-2 text-gray-800">Détail des articles :</h4>
                                                    <ul className="list-disc list-inside pl-2 text-gray-700">
                                                    {order.items.map(item => (
                                                        <li key={item.id}>{item.quantite}x {item.nom_produit} - <span className="font-semibold">{formatIntegerAmount(item.prix_unitaire * item.quantite)}€</span></li>
                                                    ))}
                                                    </ul>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                         <tfoot className="border-t-2 border-gray-300">
                            <tr className="font-bold text-gray-900">
                                <td colSpan={4} className="p-3 text-right">TOTAUX</td>
                                <td className="p-3 text-right">{formatIntegerAmount(totals.totalSales)} €</td>
                                <td className="p-3 text-right text-green-700">{formatIntegerAmount(totals.totalProfit)} €</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                 {filteredOrders.length === 0 && <p className="text-center p-8 text-gray-500">Aucune commande finalisée ne correspond à vos filtres.</p>}
            </div>
        </div>
    );
};

export default ResumeVentes;