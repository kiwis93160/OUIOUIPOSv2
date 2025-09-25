import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';
import { Order, OrderItem } from '../types';
import { Eye, User, MapPin } from 'lucide-react';
import Modal from '../components/Modal';
import OrderTimer from '../components/OrderTimer';

const TakeawayCard: React.FC<{ order: Order, onValidate?: (orderId: string) => void, onDeliver?: (orderId: string) => void, isProcessing?: boolean }> = ({ order, onValidate, onDeliver, isProcessing }) => {
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

    const displayName = order.table_nom || `Commande #${order.id.slice(-6)}`;
    const timerStart = order.date_envoi_cuisine || order.date_creation;

    return (
        <>
            <div className="ui-card p-4 space-y-3">
                <div className="border-b pb-3 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                        <h4 className="font-bold text-lg text-gray-900 flex-1">{displayName}</h4>
                        <span className="text-gray-800 font-extrabold text-lg whitespace-nowrap">{order.total.toFixed(2)} €</span>
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-600">
                            <User size={14} className="mr-2"/> <span>{order.clientInfo?.nom}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                            <MapPin size={14} className="mr-2"/> <span>{order.clientInfo?.adresse}</span>
                        </div>
                        <OrderTimer startTime={timerStart} className="w-full justify-center" />
                    </div>
                </div>
                
                <div className="space-y-1">
                    <h5 className="text-sm font-semibold text-gray-800">Articles :</h5>
                    {order.items.map((item: OrderItem) => (
                        <div key={item.id} className="text-sm text-gray-600 pl-2">
                            {item.quantite}x {item.nom_produit}
                        </div>
                    ))}
                </div>
                
                <div className="pt-2 border-t mt-2 space-y-2">
                    {order.statut === 'pendiente_validacion' && onValidate && (
                        <>
                            <button onClick={() => setIsReceiptModalOpen(true)} className="w-full text-sm text-blue-600 hover:underline flex items-center justify-center"><Eye size={16} className="mr-1"/> Voir Justificatif</button>
                            <button
                                onClick={() => onValidate(order.id)}
                                disabled={isProcessing}
                                className="w-full ui-btn-info uppercase"
                            >
                                {isProcessing ? 'Validation...' : 'Valider'}
                            </button>
                        </>
                    )}
                    {order.estado_cocina === 'listo' && onDeliver && (
                         <>
                            <button
                                onClick={() => onDeliver(order.id)}
                                disabled={isProcessing}
                                className="w-full ui-btn-success uppercase"
                            >
                                {isProcessing ? '...' : 'Entregada'}
                            </button>
                         </>
                    )}
                </div>
            </div>
            <Modal isOpen={isReceiptModalOpen} onClose={() => setIsReceiptModalOpen(false)} title="Justificatif de Paiement">
                {order.receipt_url ? 
                    <img src={order.receipt_url} alt="Justificatif" className="w-full h-auto rounded-md" /> :
                    <p>Aucun justificatif fourni.</p>
                }
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