import React, { useEffect, useState, useCallback } from 'react';
import { ChefHat } from 'lucide-react';
import { api } from '../services/api';
import { KitchenTicket as KitchenTicketOrder, OrderItem } from '../types';
import { useAuth } from '../contexts/AuthContext';
import OrderTimer from '../components/OrderTimer';
import { getOrderUrgencyStyles } from '../utils/orderUrgency';

const KitchenTicketCard: React.FC<{ order: KitchenTicketOrder; onReady: (orderId: string) => void; canMarkReady: boolean }> = ({ order, onReady, canMarkReady }) => {

    const urgencyStyles = getOrderUrgencyStyles(order.date_envoi_cuisine || Date.now());
    const urgencyLabelMap: Record<typeof urgencyStyles.level, string> = {
        normal: 'Normal',
        warning: 'À surveiller',
        critical: 'Critique',
    };

    return (
        <div className={`relative flex h-full flex-col overflow-hidden rounded-xl border bg-white text-gray-900 shadow-lg transition-shadow duration-300 hover:shadow-xl ${urgencyStyles.border}`}>
            <span aria-hidden className={`absolute inset-y-0 left-0 w-1.5 ${urgencyStyles.accent}`} />
            <header className="border-b border-gray-200 px-5 pt-5 pb-4">
                <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-gray-500">Commande</p>
                            <h3 className="text-2xl font-semibold text-gray-900">
                                {order.table_nom || `À emporter #${order.id.slice(-4)}`}
                            </h3>
                        </div>
                        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${urgencyStyles.badge}`}>
                            <span className={`h-2 w-2 rounded-full ${urgencyStyles.accent}`} />
                            <span>{urgencyLabelMap[urgencyStyles.level]}</span>
                        </span>
                    </div>
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <OrderTimer startTime={order.date_envoi_cuisine || Date.now()} className="text-base" />
                        <p className="text-xs font-medium text-gray-500 sm:text-right">
                            Envoyé {new Date(order.date_envoi_cuisine || Date.now()).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                </div>
            </header>
            <div className="flex-1 overflow-y-auto px-5 py-4">
                <ul className="space-y-3">
                    {order.items.map((item: OrderItem) => (
                        <li key={item.id} className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 shadow-sm">
                            <div className="flex items-baseline justify-between gap-3">
                                <p className="text-lg font-semibold text-gray-900">{item.nom_produit}</p>
                                <span className="text-2xl font-bold text-gray-900">{item.quantite}×</span>
                            </div>
                            {item.commentaire && (
                                <div className="mt-3 rounded-md border border-dashed border-blue-200 bg-blue-50 px-3 py-2">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700">Commentaire</p>
                                    <p className="mt-1 text-sm text-gray-900">{item.commentaire}</p>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
            {canMarkReady && (
                <footer className="border-t border-gray-200 px-5 pb-5 pt-4">
                    <button
                        onClick={() => onReady(order.id)}
                        className="group inline-flex w-full items-center justify-center gap-3 rounded-lg border-2 border-transparent bg-status-success px-4 py-3 text-lg font-semibold uppercase tracking-[0.2em] text-white shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-success/70 focus-visible:ring-offset-2 hover:bg-status-success-hover"
                    >
                        <ChefHat size={22} className="shrink-0" />
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
    const [orders, setOrders] = useState<KitchenTicketOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const { role } = useAuth();
    
    const canMarkReady = role?.permissions['/cocina'] === 'editor';
    
    // FIX: Define fetchOrders using useCallback within the component scope.
    // The error "Cannot find name 'fetchOrders'" suggests this function
    // was missing or defined outside the component's scope.
    const fetchOrders = useCallback(async () => {
        try {
            const data = await api.getKitchenOrders();
            setOrders(data);
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
    if (loading) return <div className="text-gray-700">Chargement des commandes pour la cuisine...</div>;

    return (
        <div className="h-full flex flex-col">
            <h1 className="mb-6 text-3xl font-bold text-gray-900">Vue Cuisine</h1>
            {orders.length === 0 ? (
                <div className="flex flex-1 items-center justify-center text-2xl text-gray-500">Aucune commande en préparation.</div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 flex-1">
                    {orders.map(order => (
                        <KitchenTicketCard key={order.ticketKey} order={order} onReady={handleMarkAsReady} canMarkReady={canMarkReady} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Cuisine;