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
    const urgencyLabelMap: Record<typeof urgencyStyles.level, string> = {
        normal: 'Normal',
        warning: 'À surveiller',
        critical: 'Urgent',
    };

    return (
        <>
            <div className={`relative flex h-full flex-col overflow-hidden rounded-xl border bg-brand-surface shadow-md transition-shadow duration-300 hover:shadow-lg ${urgencyStyles.border}`}>
                <span aria-hidden className={`absolute inset-y-0 left-0 w-1 ${urgencyStyles.accent}`} />
                <header className="border-b border-brand-border/60 px-5 pt-5 pb-4">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                                <h4 className="text-xl font-semibold leading-tight text-brand-heading">{displayName}</h4>
                                <p className="text-xs text-brand-text-muted">
                                    Commande envoyée {new Date(timerStart).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${urgencyStyles.badge}`}>
                                <span className={`h-2 w-2 rounded-full ${urgencyStyles.accent}`} />
                                <span>{urgencyLabelMap[urgencyStyles.level]}</span>
                            </span>
                        </div>
                        <OrderTimer startTime={timerStart} className="text-base" />
                    </div>
                </header>

                <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                    {order.clientInfo && (
                        <div className="space-y-2 rounded-lg border border-brand-border/60 bg-brand-surface-elevated p-4 shadow-sm">
                            {order.clientInfo.nom && (
                                <div className="flex items-center gap-2 text-sm text-brand-heading">
                                    <User size={16} className={urgencyStyles.icon} />
                                    <span className="font-medium">{order.clientInfo.nom}</span>
                                </div>
                            )}
                            {order.clientInfo.adresse && (
                                <div className="flex items-start gap-2 text-sm text-brand-text">
                                    <MapPin size={16} className={`mt-0.5 ${urgencyStyles.icon}`} />
                                    <span>{order.clientInfo.adresse}</span>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="space-y-3">
                        <h5 className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-text-muted">Articles</h5>
                        <ul className="space-y-2">
                            {order.items.map((item: OrderItem) => (
                                <li key={item.id} className="rounded-lg border border-brand-border/60 bg-brand-surface-elevated px-4 py-3 text-sm text-brand-heading shadow-sm">
                                    <div className="flex items-baseline justify-between gap-3">
                                        <span className="font-semibold">{item.nom_produit}</span>
                                        <span className="text-lg font-bold">{item.quantite}×</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-brand-border/60 bg-brand-surface-elevated px-4 py-3 font-semibold text-brand-heading shadow-sm">
                        <span>Total</span>
                        <span>{order.total.toFixed(2)} €</span>
                    </div>
                </div>

                <footer className="border-t border-brand-border/60 px-5 pb-5 pt-4">
                    {order.statut === 'pendiente_validacion' && onValidate && (
                        <div className="space-y-2">
                            <button
                                onClick={() => setIsReceiptModalOpen(true)}
                                className="w-full ui-btn ui-btn-secondary"
                                type="button"
                            >
                                <Eye size={16} className={urgencyStyles.icon} /> {order.receipt_url ? 'Voir le justificatif' : 'Justificatif indisponible'}
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