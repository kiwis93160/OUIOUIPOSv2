import React, { memo } from 'react';
import { Check, DollarSign, MessageSquare, MinusCircle, PlusCircle, Send } from 'lucide-react';

import { Order, OrderItem } from '../../types';
import { formatIntegerAmount } from '../../utils/formatIntegerAmount';

interface CategorizedItem {
    item: OrderItem;
    index: number;
}

interface OrderSummaryProps {
    order: Order;
    pendingItems: CategorizedItem[];
    sentItems: CategorizedItem[];
    editingCommentId: string | null;
    onEditComment: (itemId: string | null) => void;
    onQuantityChange: (itemIndex: number, change: number) => void;
    onCommentChange: (itemIndex: number, newComment: string) => void;
    onCommentPersist: (itemIndex: number) => void;
    onServeOrder: () => void;
    onSendToKitchen: () => void;
    onOpenPaymentModal: () => void;
    isSendingToKitchen: boolean;
    hasPendingItems: boolean;
}

const OrderSummaryComponent: React.FC<OrderSummaryProps> = ({
    order,
    pendingItems,
    sentItems,
    editingCommentId,
    onEditComment,
    onQuantityChange,
    onCommentChange,
    onCommentPersist,
    onServeOrder,
    onSendToKitchen,
    onOpenPaymentModal,
    isSendingToKitchen,
    hasPendingItems,
}) => {
    if (order.items.length === 0) {
        return (
            <div className="ui-card flex flex-col">
                <div className="p-4 border-b">
                    <h2 className="text-2xl font-semibold text-brand-secondary">Commande</h2>
                </div>
                <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                    <p className="text-gray-500">La commande est vide.</p>
                </div>
                <div className="p-4 border-t space-y-4">
                    <div className="flex justify-between text-2xl font-semibold text-brand-secondary">
                        <span>Total</span>
                        <span>{formatIntegerAmount(order.total)} €</span>
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={onSendToKitchen}
                            disabled
                            className="flex-1 ui-btn-accent justify-center py-3 disabled:opacity-60"
                        >
                            <Send size={20} />
                            <span>Envoyer en Cuisine</span>
                        </button>
                        <button
                            onClick={onOpenPaymentModal}
                            disabled
                            className="flex-1 ui-btn-success justify-center py-3 disabled:opacity-60"
                        >
                            <DollarSign size={20} />
                            <span>Finaliser</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="ui-card flex flex-col">
            <div className="p-4 border-b">
                <h2 className="text-2xl font-semibold text-brand-secondary">Commande</h2>
            </div>
            <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-brand-secondary">Articles à envoyer</h3>
                        <span className="text-sm text-gray-500">{pendingItems.length}</span>
                    </div>
                    {pendingItems.length === 0 ? (
                        <p className="text-sm text-gray-500">Aucun article en attente.</p>
                    ) : (
                        pendingItems.map(({ item, index }) => (
                            <div key={item.id} className="p-3 rounded-lg bg-yellow-100">
                                <div className="flex justify-between items-start">
                                    <p className="font-bold text-gray-900 flex-1">{item.quantite}x {item.nom_produit}</p>
                                    <p className="font-bold text-gray-900">{formatIntegerAmount(item.quantite * item.prix_unitaire)}€</p>
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                    <p className="text-sm text-gray-700">{formatIntegerAmount(item.prix_unitaire)} € /u</p>
                                    <div className="flex items-center space-x-2 text-gray-800">
                                        <button onClick={() => onQuantityChange(index, -1)} className="p-1">
                                            <MinusCircle size={20} />
                                        </button>
                                        <span className="font-bold w-6 text-center">{item.quantite}</span>
                                        <button onClick={() => onQuantityChange(index, 1)} className="p-1">
                                            <PlusCircle size={20} />
                                        </button>
                                    </div>
                                </div>
                                {(editingCommentId === item.id || item.commentaire) ? (
                                    <input
                                        type="text"
                                        placeholder="Ajouter un commentaire..."
                                        value={item.commentaire}
                                        onChange={(event) => onCommentChange(index, event.target.value)}
                                        onBlur={() => onCommentPersist(index)}
                                        autoFocus={editingCommentId === item.id}
                                        className="mt-2 ui-input text-sm"
                                    />
                                ) : (
                                    <button
                                        onClick={() => onEditComment(item.id)}
                                        className="mt-2 text-xs text-blue-600 hover:underline flex items-center gap-1"
                                    >
                                        <MessageSquare size={12} />
                                        Ajouter un commentaire
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {sentItems.length > 0 && (
                    <div className="space-y-3 pt-6 border-t border-gray-700">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-brand-secondary">Envoyés en cuisine</h3>
                            <span className="text-sm text-gray-500">{sentItems.length}</span>
                        </div>
                        {sentItems.map(({ item }) => (
                            <div key={item.id} className="p-3 rounded-lg bg-green-100">
                                <div className="flex justify-between items-start">
                                    <p className="font-bold text-gray-900 flex-1">{item.quantite}x {item.nom_produit}</p>
                                    <p className="font-bold text-gray-900">{formatIntegerAmount(item.quantite * item.prix_unitaire)}€</p>
                                </div>
                                <p className="text-sm text-gray-700 mt-2">{formatIntegerAmount(item.prix_unitaire)}€ /u</p>
                                {item.commentaire && (
                                    <p className="mt-2 text-sm italic text-gray-600 pl-2">"{item.commentaire}"</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div className="p-4 border-t space-y-4">
                <div className="flex justify-between text-2xl font-semibold text-brand-secondary">
                    <span>Total</span>
                    <span>{formatIntegerAmount(order.total)} €</span>
                </div>

                {order.estado_cocina === 'listo' && (
                    <button onClick={onServeOrder} className="w-full ui-btn-info justify-center py-3">
                        <Check size={20} />
                        <span>Entregada</span>
                    </button>
                )}

                <div className="flex space-x-2">
                    <button
                        onClick={onSendToKitchen}
                        disabled={isSendingToKitchen || !hasPendingItems}
                        className="flex-1 ui-btn-accent justify-center py-3 disabled:opacity-60"
                    >
                        <Send size={20} />
                        <span>{isSendingToKitchen ? 'Synchronisation…' : 'Envoyer en Cuisine'}</span>
                    </button>
                    <button
                        onClick={onOpenPaymentModal}
                        disabled={order.estado_cocina !== 'servido'}
                        className="flex-1 ui-btn-success justify-center py-3 disabled:opacity-60"
                    >
                        <DollarSign size={20} />
                        <span>Finaliser</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export const OrderSummary = memo(OrderSummaryComponent);
export default OrderSummary;
