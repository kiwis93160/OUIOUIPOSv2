import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { uploadPaymentReceipt } from '../services/cloudinary';
import { Order, Product, Category, OrderItem, Ingredient } from '../types';
import { PlusCircle, MinusCircle, Send, DollarSign, AlertTriangle, Check, ArrowLeft, MessageSquare } from 'lucide-react';
import OrderTimer from '../components/OrderTimer';
import PaymentModal from '../components/PaymentModal';
import Modal from '../components/Modal';

const isPersistedItemId = (value?: string) =>
    !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

const cloneOrder = (order: Order): Order => JSON.parse(JSON.stringify(order));

const generateTempId = (() => {
    let counter = 0;
    return () => {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return `tmp-${crypto.randomUUID()}`;
        }

        counter += 1;
        return `tmp-${Date.now()}-${counter}`;
    };
})();

const normalizeComment = (value?: string | null) => (value ?? '').trim();

const haveSameExcludedIngredients = (a: string[] = [], b: string[] = []) => {
    if (a.length !== b.length) {
        return false;
    }

    const sortedA = [...a].sort();
    const sortedB = [...b].sort();

    return sortedA.every((value, index) => value === sortedB[index]);
};

const Commande: React.FC = () => {
    const { tableId } = useParams<{ tableId: string }>();
    const navigate = useNavigate();
    
    const [order, setOrder] = useState<Order | null>(null);
    const [originalOrder, setOriginalOrder] = useState<Order | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [activeCategoryId, setActiveCategoryId] = useState<string>('all');
    const [loading, setLoading] = useState(true);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isExitConfirmOpen, setExitConfirmOpen] = useState(false);
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [isSendingToKitchen, setIsSendingToKitchen] = useState(false);

    const orderRef = useRef<Order | null>(order);
    const originalOrderRef = useRef<Order | null>(originalOrder);
    const serverOrderRef = useRef<Order | null>(null);
    const pendingServerOrderRef = useRef<Order | null>(null);
    const itemsSyncTimeoutRef = useRef<number | null>(null);
    const syncQueueRef = useRef<Promise<void>>(Promise.resolve());

    useEffect(() => {
        orderRef.current = order;
    }, [order]);

    useEffect(() => {
        originalOrderRef.current = originalOrder;
    }, [originalOrder]);

    const isOrderSynced = useCallback((comparisonOrder?: Order | null) => {
        const currentOrder = orderRef.current;
        if (!currentOrder) return true;
        const referenceOrder = comparisonOrder ?? originalOrderRef.current;
        if (!referenceOrder) return true;
        return JSON.stringify(referenceOrder.items) === JSON.stringify(currentOrder.items);
    }, []);

    const applyPendingServerSnapshot = useCallback(() => {
        const pendingOrder = pendingServerOrderRef.current;
        if (!pendingOrder) return;

        serverOrderRef.current = cloneOrder(pendingOrder);

        const currentOrder = orderRef.current;
        if (currentOrder && JSON.stringify(currentOrder) === JSON.stringify(pendingOrder)) {
            pendingServerOrderRef.current = null;
            return;
        }

        pendingServerOrderRef.current = null;
        orderRef.current = pendingOrder;
        setOrder(pendingOrder);

        const originalSnapshot = cloneOrder(pendingOrder);
        originalOrderRef.current = originalSnapshot;
        setOriginalOrder(originalSnapshot);
    }, []);

    const fetchOrderData = useCallback(async (isRefresh = false) => {
        if (!tableId) return;
        try {
            if (!isRefresh) setLoading(true);

            if (isRefresh) {
                const orderData = await api.createOrGetOrderByTableId(tableId);
                const serverSnapshot = cloneOrder(orderData);
                serverOrderRef.current = serverSnapshot;
                const shouldSyncState = isOrderSynced();

                if (shouldSyncState) {
                    pendingServerOrderRef.current = null;
                    setOrder(orderData);
                    orderRef.current = orderData;

                    const originalSnapshot = cloneOrder(orderData);
                    originalOrderRef.current = originalSnapshot;
                    setOriginalOrder(originalSnapshot);
                } else {
                    const confirmedOrder = originalOrderRef.current;
                    if (confirmedOrder && JSON.stringify(confirmedOrder) === JSON.stringify(orderData)) {
                        pendingServerOrderRef.current = null;
                    } else {
                        pendingServerOrderRef.current = serverSnapshot;
                    }
                }
                return;
            }

            const [orderData, productsData, categoriesData, ingredientsData] = await Promise.all([
                api.createOrGetOrderByTableId(tableId),
                api.getProducts(),
                api.getCategories(),
                api.getIngredients(),
            ]);
            serverOrderRef.current = cloneOrder(orderData);
            setOrder(orderData);
            orderRef.current = orderData;
            const originalSnapshot = cloneOrder(orderData);
            setOriginalOrder(originalSnapshot);
            originalOrderRef.current = originalSnapshot;
            setProducts(productsData);
            setCategories(categoriesData);
            setIngredients(ingredientsData);
            pendingServerOrderRef.current = null;
        } catch (error) {
            console.error("Failed to load order data", error);
            navigate('/ventes');
        } finally {
            if (!isRefresh) setLoading(false);
        }
    }, [tableId, navigate, isOrderSynced]);

    useEffect(() => {
        fetchOrderData();
        const interval = setInterval(() => fetchOrderData(true), 5000);
        return () => clearInterval(interval);
    }, [fetchOrderData]);

    useEffect(() => {
        if (isOrderSynced()) {
            applyPendingServerSnapshot();
        }
    }, [applyPendingServerSnapshot, isOrderSynced, order, originalOrder]);

    useEffect(() => {
        const unsubscribe = api.notifications.subscribe('orders_updated', () => fetchOrderData(true));
        return () => unsubscribe();
    }, [fetchOrderData]);
    
    const hasUnsentChanges = useMemo(() => !isOrderSynced(), [isOrderSynced, order, originalOrder]);

    const productQuantitiesInCart = useMemo(() => {
        if (!order) return {};
        return order.items.reduce((acc, item) => {
            if (item.estado !== 'en_attente') {
                return acc;
            }

            acc[item.produitRef] = (acc[item.produitRef] || 0) + item.quantite;
            return acc;
        }, {} as { [key: string]: number });
    }, [order]);


    const isProductAvailable = useCallback((product: Product): boolean => {
        if (!product.recipe || product.recipe.length === 0) return true;

        for (const recipeItem of product.recipe) {
            const ingredient = ingredients.find(i => i.id === recipeItem.ingredient_id);
            if (!ingredient) return false;

            if (ingredient.stock_actuel <= ingredient.stock_minimum) {
                return false;
            }
        }
        return true;
    }, [ingredients]);
    
    type OrderItemsUpdater = OrderItem[] | ((items: OrderItem[]) => OrderItem[]);

    useEffect(() => () => {
        if (itemsSyncTimeoutRef.current !== null) {
            window.clearTimeout(itemsSyncTimeoutRef.current);
            itemsSyncTimeoutRef.current = null;
        }
    }, []);

    const updateOrderItems = useCallback(async (
        updater: OrderItemsUpdater,
        options?: { isLocalUpdate?: boolean; removalSourceItems?: OrderItem[] }
    ) => {
        const currentOrder = orderRef.current;
        if (!currentOrder) return;

        const computeItems = (items: OrderItem[]) => typeof updater === 'function'
            ? (updater as (prevItems: OrderItem[]) => OrderItem[])(items)
            : updater;

        const optimisticSourceItemsBase = options?.isLocalUpdate
            ? currentOrder.items
            : options?.removalSourceItems ?? currentOrder.items;
        const optimisticSourceItems = optimisticSourceItemsBase.map(item => ({ ...item }));
        const optimisticItems = computeItems(optimisticSourceItems);
        const optimisticOrder: Order = {
            ...currentOrder,
            items: optimisticItems,
            total: optimisticItems.reduce((acc, item) => acc + item.quantite * item.prix_unitaire, 0),
        };

        setOrder(optimisticOrder);
        orderRef.current = optimisticOrder;

        if (options?.isLocalUpdate) return;

        const runServerSync = async () => {
            try {
                let baseOrder = pendingServerOrderRef.current ?? serverOrderRef.current ?? null;

                if (!baseOrder) {
                    const latestOrder = await api.getOrderById(currentOrder.id);
                    if (latestOrder) {
                        baseOrder = latestOrder;
                        serverOrderRef.current = cloneOrder(latestOrder);
                    } else {
                        baseOrder = currentOrder;
                    }
                }

                if (!baseOrder) {
                    return;
                }

                const baseItemsForComputation = baseOrder.items.map(item => ({ ...item }));
                const removalSourceItems = options?.removalSourceItems ?? currentOrder.items;

                const finalItems = computeItems(baseItemsForComputation);
                const removedItemIds = removalSourceItems
                    .filter(item => isPersistedItemId(item.id) && !finalItems.some(finalItem => finalItem.id === item.id))
                    .map(item => item.id);

                const updatedOrder = await api.updateOrder(
                    currentOrder.id,
                    {
                        items: finalItems,
                        removedItemIds,
                    },
                    { includeNotifications: false },
                );
                const ingredientsData = await api.getIngredients();

                setOrder(updatedOrder);
                orderRef.current = updatedOrder;
                const updatedOriginalSnapshot = cloneOrder(updatedOrder);
                setOriginalOrder(updatedOriginalSnapshot);
                originalOrderRef.current = updatedOriginalSnapshot;
                serverOrderRef.current = cloneOrder(updatedOrder);
                setIngredients(ingredientsData);
                applyPendingServerSnapshot();
            } catch (error) {
                console.error("Failed to update order:", error);
                alert("Une erreur est survenue lors de la mise à jour de la commande.");
                fetchOrderData(true);
            }
        };

        syncQueueRef.current = syncQueueRef.current.then(runServerSync, runServerSync);
        await syncQueueRef.current;
    }, [applyPendingServerSnapshot, fetchOrderData]);

    const scheduleItemsSync = useCallback((delay = 100) => {
        if (itemsSyncTimeoutRef.current !== null) {
            window.clearTimeout(itemsSyncTimeoutRef.current);
        }

        const effectiveDelay = delay > 0 ? delay : 1;

        itemsSyncTimeoutRef.current = window.setTimeout(() => {
            itemsSyncTimeoutRef.current = null;
            if (!orderRef.current) return;

            const snapshotItems = orderRef.current.items.map(item => ({ ...item }));
            const removalSourceItems = serverOrderRef.current
                ? serverOrderRef.current.items.map(item => ({ ...item }))
                : snapshotItems.map(item => ({ ...item }));

            void updateOrderItems(snapshotItems, { removalSourceItems });
        }, effectiveDelay);
    }, [updateOrderItems]);

    const applyLocalItemsUpdate = useCallback((updater: OrderItemsUpdater) => {
        const currentOrder = orderRef.current;
        if (!currentOrder) return;

        updateOrderItems(updater, { isLocalUpdate: true });
        scheduleItemsSync();
    }, [scheduleItemsSync, updateOrderItems]);

    const addProductToOrder = (product: Product) => {
        const defaultComment = normalizeComment('');
        const defaultExcludedIngredients: string[] = [];

        applyLocalItemsUpdate(items => {
            const existingItemIndex = items.findIndex(
                item => item.produitRef === product.id
                    && item.estado === 'en_attente'
                    && normalizeComment(item.commentaire) === defaultComment
                    && haveSameExcludedIngredients(item.excluded_ingredients ?? [], defaultExcludedIngredients)
            );

            if (existingItemIndex > -1) {
                return items.map((item, index) => (
                    index === existingItemIndex
                        ? { ...item, quantite: item.quantite + 1 }
                        : item
                ));
            }

            const newItem: OrderItem = {
                id: generateTempId(),
                produitRef: product.id,
                nom_produit: product.nom_produit,
                prix_unitaire: product.prix_vente,
                quantite: 1,
                excluded_ingredients: [...defaultExcludedIngredients],
                commentaire: defaultComment,
                estado: 'en_attente',
            };

            return [...items, newItem];
        });
    };

    const handleQuantityChange = (itemIndex: number, change: number) => {
        applyLocalItemsUpdate(items => {
            if (!items[itemIndex]) return items;
            const updatedItems = items.map(item => ({ ...item }));
            const newQuantity = updatedItems[itemIndex].quantite + change;

            if (newQuantity <= 0) {
                updatedItems.splice(itemIndex, 1);
            } else {
                updatedItems[itemIndex].quantite = newQuantity;
            }

            return updatedItems;
        });
    };

    const handleCommentChange = (itemIndex: number, newComment: string) => {
        updateOrderItems(items => {
            if (!items[itemIndex]) return items;
            const updatedItems = items.map(item => ({ ...item }));
            const itemToUpdate = updatedItems[itemIndex];

            if (itemToUpdate.quantite > 1 && !itemToUpdate.commentaire && newComment) {
                itemToUpdate.quantite -= 1;
                const newItemWithComment = {
                    ...itemToUpdate,
                    id: generateTempId(),
                    quantite: 1,
                    commentaire: newComment,
                };
                updatedItems.push(newItemWithComment);
                setEditingCommentId(newItemWithComment.id);
            } else {
                itemToUpdate.commentaire = newComment;
            }

            return updatedItems;
        }, { isLocalUpdate: true });
    };

    const persistCommentChange = (itemIndex: number) => {
        if (!orderRef.current) return;
        updateOrderItems(orderRef.current.items.map(item => ({ ...item })));
        setEditingCommentId(null);
    }

    const handleSendToKitchen = async () => {
        if (!orderRef.current) return;

        setIsSendingToKitchen(true);

        try {
            let latestOrder = orderRef.current;

            while (latestOrder && latestOrder.items.some(item => item.estado === 'en_attente' && !isPersistedItemId(item.id))) {
                await updateOrderItems(latestOrder.items.map(item => ({ ...item })));
                latestOrder = orderRef.current;
            }

            latestOrder = orderRef.current;
            if (!latestOrder) return;

            const pendingItems = latestOrder.items.filter(item => item.estado === 'en_attente');
            if (pendingItems.length === 0) return;

            const nonPersistedItems = pendingItems.filter(item => !isPersistedItemId(item.id));
            if (nonPersistedItems.length > 0) {
                console.warn('Des articles non persistés subsistent après synchronisation, envoi annulé.');
                return;
            }

            const itemsToSend = pendingItems.map(item => item.id);

            const updatedOrder = await api.sendOrderToKitchen(latestOrder.id, itemsToSend);
            setOrder(updatedOrder);
            setOriginalOrder(JSON.parse(JSON.stringify(updatedOrder)));
            navigate('/ventes');
        } catch (error) {
            console.error("Failed to send order to kitchen", error);
            alert("Erreur lors de l'envoi en cuisine.");
        } finally {
            setIsSendingToKitchen(false);
        }
    };

    const handleServeOrder = async () => {
        if (!order) return;
        try {
            const updatedOrder = await api.markOrderAsServed(order.id);
            setOrder(updatedOrder);
        } catch (error) {
            console.error("Failed to mark order as served", error);
        }
    };
    
    const handleFinalizeOrder = async (paymentMethod: Order['payment_method'], receiptFile?: File | null) => {
        if (!order) return;
        try {
            let receiptUrl = order.payment_receipt_url ?? undefined;
            if (receiptFile) {
                receiptUrl = await uploadPaymentReceipt(receiptFile, { orderId: order.id });
            }
            await api.finalizeOrder(order.id, paymentMethod, receiptUrl);
            navigate('/ventes');
        } catch (error) {
            console.error("Failed to finalize order", error);
            alert("Erreur lors de la finalisation ou du téléversement du justificatif.");
        }
    };
    
    const handleExitAttempt = () => {
        if (order && order.estado_cocina === 'no_enviado' && order.items.length > 0) {
            setExitConfirmOpen(true);
            return;
        }

        if (hasUnsentChanges) {
            setExitConfirmOpen(true);
        } else {
            navigate('/ventes');
        }
    };

    const handleConfirmExit = async () => {
        try {
            if (order && order.estado_cocina === 'no_enviado') {
                await api.cancelUnsentTableOrder(order.id);
            } else if (originalOrder && !isOrderSynced(originalOrder)) {
                await updateOrderItems(originalOrder.items);
            }
        } catch (error) {
            console.error('Failed to cancel unsent order before exiting', error);
        } finally {
            setExitConfirmOpen(false);
            navigate('/ventes');
        }
    };

    const filteredProducts = activeCategoryId === 'all'
        ? products
        : products.filter(p => p.categoria_id === activeCategoryId);

    const orderItems = order?.items ?? [];

    const categorizedItems = useMemo(() => {
        return orderItems.reduce<{ pending: { item: OrderItem; index: number }[]; sent: { item: OrderItem; index: number }[] }>((acc, item, index) => {
            if (item.estado === 'en_attente') {
                acc.pending.push({ item, index });
            } else {
                acc.sent.push({ item, index });
            }
            return acc;
        }, { pending: [], sent: [] });
    }, [orderItems]);

    const handleProductPointerDown = useCallback((product: Product) => (event: React.PointerEvent<HTMLButtonElement>) => {
        event.preventDefault();
        addProductToOrder(product);
    }, [addProductToOrder]);

    const handleProductKeyDown = useCallback((product: Product) => (event: React.KeyboardEvent<HTMLButtonElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            addProductToOrder(product);
        }
    }, [addProductToOrder]);

    const hasPendingItems = categorizedItems.pending.length > 0;

    if (loading) return <div className="text-center p-10 text-gray-800">Chargement de la commande...</div>;
    if (!order) return <div className="text-center p-10 text-red-500">Commande non trouvée.</div>;

    return (
        <>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-10rem)]">
            {/* Menu Section */}
            <div className="lg:col-span-2 ui-card flex flex-col">
            <div className="p-4 border-b">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                            <button onClick={handleExitAttempt} className="ui-btn-dark" title="Retour au plan de salle">
                                <ArrowLeft size={20} />
                                <span className="hidden sm:inline">Plan de Salle</span>
                            </button>
                        </div>
                        <div className="flex flex-col gap-2">
                            <h2 className="text-2xl font-semibold text-white">Table {order.table_nom}</h2>
                            {order.date_envoi_cuisine && (
                                <OrderTimer startTime={order.date_envoi_cuisine} className="w-full justify-center sm:w-auto sm:self-start" />
                            )}
                        </div>
                    </div>
                    <div className="flex space-x-2 mt-4 overflow-x-auto pb-2">
                        <button onClick={() => setActiveCategoryId('all')}
                            className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap ${activeCategoryId === 'all' ? 'bg-brand-primary text-brand-secondary' : 'bg-gray-200 text-gray-700'}`}>
                            Tous
                        </button>
                        {categories.map(cat => (
                            <button key={cat.id} onClick={() => setActiveCategoryId(cat.id)}
                                className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap ${activeCategoryId === cat.id ? 'bg-brand-primary text-brand-secondary' : 'bg-gray-200 text-gray-700'}`}>
                                {cat.nom}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="p-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 overflow-y-auto">
                    {filteredProducts.map(product => {
                        const isLowStock = !isProductAvailable(product);
                        const quantityInCart = productQuantitiesInCart[product.id] || 0;
                        return (
                            <button
                                key={product.id}
                                type="button"
                                onPointerDown={handleProductPointerDown(product)}
                                onKeyDown={handleProductKeyDown(product)}
                                className={`border rounded-lg p-2 flex flex-col items-center justify-between text-center cursor-pointer hover:shadow-lg transition-all relative focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-gray-900 ${isLowStock ? 'border-yellow-500 border-2' : ''}`}
                            >
                                {quantityInCart > 0 && (
                                    <div className="absolute top-1 left-1 bg-brand-accent text-white rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold">
                                        {quantityInCart}
                                    </div>
                                )}
                                {isLowStock && (
                                    <div className="absolute top-1 right-1 bg-yellow-500 text-white rounded-full p-1" title="Stock bas">
                                        <AlertTriangle size={16} />
                                    </div>
                                )}
                                <img src={product.image} alt={product.nom_produit} className="w-24 h-24 object-cover rounded-md mb-2" />
                                <p className="font-semibold text-sm text-gray-800">{product.nom_produit}</p>
                                <p className="text-xs text-gray-600 px-1 h-10 overflow-hidden flex-grow">{product.description}</p>
                                <p className="font-bold text-brand-primary mt-1">{product.prix_vente.toFixed(2)} €</p>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Order Summary Section */}
            <div className="ui-card flex flex-col">
                <div className="p-4 border-b">
                    <h2 className="text-2xl font-semibold text-brand-secondary">Commande</h2>
                </div>
                <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                    {order.items.length === 0 ? (
                        <p className="text-gray-500">La commande est vide.</p>
                    ) : (
                        <>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-brand-secondary">Articles à envoyer</h3>
                                    <span className="text-sm text-gray-500">{categorizedItems.pending.length}</span>
                                </div>
                                {categorizedItems.pending.length === 0 ? (
                                    <p className="text-sm text-gray-500">Aucun article en attente.</p>
                                ) : (
                                    categorizedItems.pending.map(({ item, index }) => (
                                        <div key={item.id} className="p-3 rounded-lg bg-yellow-100">
                                            <div className="flex justify-between items-start">
                                                <p className="font-bold text-gray-900 flex-1">{item.quantite}x {item.nom_produit}</p>
                                                <p className="font-bold text-gray-900">{(item.quantite * item.prix_unitaire).toFixed(2)}€</p>
                                            </div>
                                            <div className="flex justify-between items-center mt-2">
                                                <p className="text-sm text-gray-700">{item.prix_unitaire.toFixed(2)} € /u</p>
                                                <div className="flex items-center space-x-2 text-gray-800">
                                                    <button onClick={() => handleQuantityChange(index, -1)} className="p-1"><MinusCircle size={20} /></button>
                                                    <span className="font-bold w-6 text-center">{item.quantite}</span>
                                                    <button onClick={() => handleQuantityChange(index, 1)} className="p-1"><PlusCircle size={20} /></button>
                                                </div>
                                            </div>
                                            {(editingCommentId === item.id || item.commentaire) ? (
                                                <input
                                                    type="text"
                                                    placeholder="Ajouter un commentaire..."
                                                    value={item.commentaire}
                                                    onChange={(e) => handleCommentChange(index, e.target.value)}
                                                    onBlur={() => persistCommentChange(index)}
                                                    autoFocus={editingCommentId === item.id}
                                                    className="mt-2 ui-input text-sm"
                                                />
                                            ) : (
                                                <button onClick={() => setEditingCommentId(item.id)} className="mt-2 text-xs text-blue-600 hover:underline flex items-center gap-1">
                                                    <MessageSquare size={12}/> Ajouter un commentaire
                                                </button>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>

                            {categorizedItems.sent.length > 0 && (
                                <div className="space-y-3 pt-6 border-t border-gray-700">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold text-brand-secondary">Envoyés en cuisine</h3>
                                        <span className="text-sm text-gray-500">{categorizedItems.sent.length}</span>
                                    </div>
                                    {categorizedItems.sent.map(({ item }) => (
                                        <div key={item.id} className="p-3 rounded-lg bg-green-100">
                                            <div className="flex justify-between items-start">
                                                <p className="font-bold text-gray-900 flex-1">{item.quantite}x {item.nom_produit}</p>
                                                <p className="font-bold text-gray-900">{(item.quantite * item.prix_unitaire).toFixed(2)}€</p>
                                            </div>
                                            <p className="text-sm text-gray-700 mt-2">{item.prix_unitaire.toFixed(2)} € /u</p>
                                            {item.commentaire && (
                                                <p className="mt-2 text-sm italic text-gray-600 pl-2">"{item.commentaire}"</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
                <div className="p-4 border-t space-y-4">
                    <div className="flex justify-between text-2xl font-semibold text-brand-secondary">
                        <span>Total</span>
                        <span>{order.total.toFixed(2)} €</span>
                    </div>

                    {order.estado_cocina === 'listo' && (
                        <button onClick={handleServeOrder} className="w-full ui-btn-info justify-center py-3">
                            <Check size={20} /><span>Entregada</span>
                        </button>
                    )}

                    <div className="flex space-x-2">
                        <button onClick={handleSendToKitchen}
                            disabled={isSendingToKitchen || !hasPendingItems}
                            className="flex-1 ui-btn-accent justify-center py-3 disabled:opacity-60">
                            <Send size={20} />
                            <span>{isSendingToKitchen ? 'Synchronisation…' : 'Envoyer en Cuisine'}</span>
                        </button>
                        <button onClick={() => setIsPaymentModalOpen(true)}
                                disabled={order.estado_cocina !== 'servido'}
                                className="flex-1 ui-btn-success justify-center py-3 disabled:opacity-60">
                            <DollarSign size={20} /><span>Finaliser</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <PaymentModal 
            isOpen={isPaymentModalOpen}
            onClose={() => setIsPaymentModalOpen(false)}
            order={order}
            onFinalize={handleFinalizeOrder}
        />
        <Modal
            isOpen={isExitConfirmOpen}
            onClose={() => setExitConfirmOpen(false)}
            title="Quitter sans envoyer ?"
        >
            <p className="text-gray-700">Vous avez des articles non envoyés en cuisine. Si vous quittez, ils seront annulés. Voulez-vous continuer ?</p>
            <div className="flex justify-end gap-4 mt-6">
                <button onClick={() => setExitConfirmOpen(false)} className="ui-btn-secondary">
                    Non, rester
                </button>
                <button onClick={handleConfirmExit} className="ui-btn-danger">
                    Oui, quitter
                </button>
            </div>
        </Modal>
        </>
    );
};

export default Commande;