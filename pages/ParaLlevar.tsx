import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';
import { Order, OrderItem } from '../types';
import { Eye, User, MapPin } from 'lucide-react';
import Modal from '../components/Modal';
import OrderTimer from '../components/OrderTimer';
import { getOrderUrgencyStyles } from '../utils/orderUrgency';

const TakeawayCard: React.FC<{ order: Order, onValidate?: (orderId: string) => void, onDeliver?: (orderId: string) => void, isProcessing?: boolean }> = ({ order, onValidate, onDeliver, isProcessing }) => {
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

    const displayName = order.table_nom || `Commande #${order.id.slice(-6)}`;
    const timerStart = order.date_envoi_cuisine || order.date_creation;
    const urgencyStyles = getOrderUrgencyStyles(timerStart);

    return (
        <>
            <div className={`rounded-lg border shadow-md flex flex-col h-full overflow-hidden transition-colors duration-300 ${urgencyStyles.container}`}>
                <header className="bg-brand-secondary text-white p-3 rounded-t-lg">
                    <div className="flex flex-col gap-3">
                        <h4 className="text-xl font-bold leading-tight">{displayName}</h4>
                        <OrderTimer startTime={timerStart} className="w-full justify-center" />
                    </div>
                </header>


              <div className="p-3 space-y-3 flex-1 overflow-y-auto">

                
                    {order.clientInfo && (
                        <div className="space-y-1 text-sm text-gray-800 bg-white/90 rounded-md p-3 shadow-sm">
                            {order.clientInfo.nom && (
                                <div className="flex items-center gap-2">
                                    <User size={14} />
                                    <span className="font-medium">{order.clientInfo.nom}</span>
                                </div>
                            )}
                            {order.clientInfo.adresse && (
                                <div className="flex items-start gap-2 text-sm text-gray-700">
                                    <MapPin size={14} className="mt-0.5" />
                                    <span>{order.clientInfo.adresse}</span>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="space-y-2">
                        <h5 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">Articles</h5>
                        <ul className="space-y-1">
                            {order.items.map((item: OrderItem) => (
                                <li key={item.id} className="text-sm text-gray-700 bg-gray-50 rounded-md px-3 py-2">
                                    <span className="font-semibold text-gray-900">{item.quantite}x</span> {item.nom_produit}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="flex items-center justify-between text-gray-900 font-semibold text-lg pt-2 border-t border-gray-200">
                        <span>Total</span>
                        <span>{order.total.toFixed(2)} €</span>
                    </div>
                </div>

                <footer className={`p-4 border-t space-y-3 transition-colors duration-300 ${urgencyStyles.content}`}>
                    {order.statut === 'pendiente_validacion' && onValidate && (
                        <div className="space-y-2">
                            <button
                                onClick={() => setIsReceiptModalOpen(true)}
                                className="w-full ui-btn ui-btn-secondary"
                                type="button"
                            >
                                <Eye size={16} /> {order.receipt_url ? 'Voir le justificatif' : 'Justificatif indisponible'}
                            </button>
                            <button
                                onClick={() => onValidate(order.id)}
                                disabled={isProcessing}
                                className="w-full ui-btn ui-btn-info uppercase"
                                type="button"
                            >
                                {isProcessing ? 'Validation...' : 'Valider'}
                            </button>
                        </div>
                    )}
                    {order.estado_cocina === 'listo' && onDeliver && (
                        <button
                            onClick={() => onDeliver(order.id)}
                            disabled={isProcessing}
                            className="w-full ui-btn ui-btn-success uppercase"
                            type="button"
                        >
                            {isProcessing ? '...' : 'Entregada'}
                        </button>
                    )}
                </footer>
            </div>
            <Modal isOpen={isReceiptModalOpen} onClose={() => setIsReceiptModalOpen(false)} title="Justificatif de Paiement">
                {order.receipt_url ? (
                    <img src={order.receipt_url} alt="Justificatif" className="w-full h-auto rounded-md" />
                ) : (
                    <p>Aucun justificatif fourni.</p>
                )}
            </Modal>
        </>
    );
};


const ParaLlevar: React.FC = () => {
    const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
    const [readyOrders, setReadyOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);

    const fetchOrders = useCallback(async () => {
        // Don't set loading to true on refetches for a smoother experience
        try {
            const { pending, ready } = await api.getTakeawayOrders();
            setPendingOrders(pending.sort((a,b) => a.date_creation - b.date_creation));
            setReadyOrders(ready.sort((a,b) => (a.date_listo_cuisine || 0) - (b.date_listo_cuisine || 0)));
        } catch (error) {
            console.error("Failed to fetch takeaway orders", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        setLoading(true);
        fetchOrders();
        const interval = setInterval(fetchOrders, 10000); // Poll for new orders
        const unsubscribe = api.notifications.subscribe('orders_updated', fetchOrders);
        return () => {
            clearInterval(interval);
            unsubscribe();
        };
    }, [fetchOrders]);
    
    const handleValidate = async (orderId: string) => {
        if (processingOrderId) return; // Prevent multiple actions at once
        setProcessingOrderId(orderId);
        try {
            await api.validateTakeawayOrder(orderId);
            await fetchOrders(); // Refresh immediately after action
        } catch (error: any) {
            console.error("Failed to validate order:", error);
            alert(`Échec de la validation de la commande: ${error.message}`);
        } finally {
            setProcessingOrderId(null);
        }
    };
    
    const handleDeliver = async (orderId: string) => {
        if (processingOrderId) return; // Prevent multiple actions at once
        setProcessingOrderId(orderId);
        try {
            await api.markTakeawayAsDelivered(orderId);
            await fetchOrders(); // Refresh immediately after action
        } catch (error) {
            console.error("Failed to mark order as delivered:", error);
            alert("Une erreur est survenue lors de la finalisation de la commande.");
        } finally {
            setProcessingOrderId(null);
        }
    };

    if (loading) return <div className="text-gray-800">Chargement des commandes à emporter...</div>;

    return (
        <div>
            <h1 className="text-heading mb-6">Commandes à Emporter</h1>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                {/* Column for validation */}
                <div className="bg-gray-100 p-4 rounded-xl">
                    <h2 className="text-xl font-bold mb-4 text-center text-blue-700">En Attente de Validation ({pendingOrders.length})</h2>
                    <div className="space-y-4">
                        {pendingOrders.length > 0 ? pendingOrders.map(order => (
                            <TakeawayCard key={order.id} order={order} onValidate={handleValidate} isProcessing={processingOrderId === order.id} />
                        )) : <p className="text-center text-gray-500 py-8">Aucune commande à valider.</p>}
                    </div>
                </div>

                {/* Column for ready orders */}
                <div className="bg-gray-100 p-4 rounded-xl">
                    <h2 className="text-xl font-bold mb-4 text-center text-green-700">Commandes Prêtes ({readyOrders.length})</h2>
                    <div className="space-y-4">
                        {readyOrders.length > 0 ? readyOrders.map(order => (
                            <TakeawayCard key={order.id} order={order} onDeliver={handleDeliver} isProcessing={processingOrderId === order.id} />
                        )) : <p className="text-center text-gray-500 py-8">Aucune commande prête.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ParaLlevar;