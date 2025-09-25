import React, { useEffect, useState, useCallback } from 'react';
import { ChefHat } from 'lucide-react';
import { api } from '../services/api';
import { Order, OrderItem } from '../types';
import { useAuth } from '../contexts/AuthContext';
import OrderTimer from '../components/OrderTimer';

const KitchenTicket: React.FC<{ order: Order; onReady: (orderId: string) => void; canMarkReady: boolean }> = ({ order, onReady, canMarkReady }) => {

    const getBackgroundColor = () => {
        const minutes = (Date.now() - (order.date_envoi_cuisine || Date.now())) / 60000;
        if (minutes > 15) return 'bg-red-200 border-red-500';
        if (minutes > 8) return 'bg-yellow-200 border-yellow-500';
        return 'bg-white border-gray-300';
    };

    return (
        <div className={`rounded-lg border shadow-md flex flex-col h-full ${getBackgroundColor()}`}>
            <header className="bg-brand-secondary text-white p-3 rounded-t-lg">
                <div className="flex flex-col gap-2">
                    <h3 className="text-xl font-bold w-full">{order.table_nom || `À emporter #${order.id.slice(-4)}`}</h3>
                    <OrderTimer startTime={order.date_envoi_cuisine || Date.now()} className="w-full justify-center" />
                </div>
            </header>
            <div className="p-3 space-y-2 flex-1 overflow-y-auto">
                {order.items.filter(i => i.estado === 'enviado').map((item: OrderItem) => (
                    <div key={item.id} className="p-2 bg-gray-50 rounded">
                        <p className="font-bold text-lg text-gray-900">{item.quantite}x {item.nom_produit}</p>
                        {item.commentaire && <p className="text-sm text-gray-600 italic pl-2">- {item.commentaire}</p>}
                    </div>
                ))}
            </div>
            {canMarkReady && (
                <footer className="p-3 border-t">
                    <button onClick={() => onReady(order.id)} className="w-full bg-green-500 text-white font-bold py-3 rounded-lg text-lg flex items-center justify-center space-x-2 hover:bg-green-700 transition">
                        <ChefHat size={24}/>
                        <span>PRÊT</span>
                    </button>
                </footer>
            )}
        </div>
    );
};


const Cuisine: React.FC = () => {
    // FIX: Define state for orders and loading within the component.
    // The errors "Cannot find name 'loading'" and "Cannot find name 'setLoading'"
    // suggest these state definitions were missing or out of scope.
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const { role } = useAuth();
    
    const canMarkReady = role?.permissions['/cocina'] === 'editor';
    
    // FIX: Define fetchOrders using useCallback within the component scope.
    // The error "Cannot find name 'fetchOrders'" suggests this function
    // was missing or defined outside the component's scope.
    const fetchOrders = useCallback(async () => {
        try {
            const data = await api.getKitchenOrders();
            setOrders(data.sort((a,b) => (a.date_envoi_cuisine || 0) - (b.date_envoi_cuisine || 0)));
        // FIX: The caught exception variable in a catch block defines its scope.
        // The error "Cannot find name 'error'" suggests a mismatch, for example,
        // `catch (e)` but then using `error`. Using `catch (error)` makes the `error`
        // variable available within the block.
        } catch (error) {
            console.error("Failed to fetch kitchen orders", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 5000); // Refresh every 5 seconds
        const unsubscribe = api.notifications.subscribe('orders_updated', fetchOrders);
        return () => {
            clearInterval(interval);
            unsubscribe();
        };
    }, [fetchOrders]);

    const handleMarkAsReady = async (orderId: string) => {
        try {
            await api.markOrderAsReady(orderId);
            fetchOrders(); // Refresh immediately
        } catch (error) {
            console.error("Failed to mark order as ready", error);
        }
    };

    // FIX: Use the 'loading' state variable that is defined within the component.
    if (loading) return <div className="text-gray-800">Chargement des commandes pour la cuisine...</div>;

    return (
        <div className="h-full flex flex-col">
            <h1 className="text-3xl font-bold mb-6 text-white">Vue Cuisine</h1>
            {orders.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-2xl text-gray-700">Aucune commande en préparation.</div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 flex-1">
                    {orders.map(order => (
                        <KitchenTicket key={order.id} order={order} onReady={handleMarkAsReady} canMarkReady={canMarkReady} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Cuisine;