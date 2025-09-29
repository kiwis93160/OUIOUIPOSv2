import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { uploadPaymentReceipt } from '../services/cloudinary';
import { Order, Product, Category, OrderItem, Ingredient } from '../types';
import { ArrowLeft } from 'lucide-react';
import PaymentModal from '../components/PaymentModal';
import Modal from '../components/Modal';
import ProductGrid from '../components/commande/ProductGrid';
import OrderSummary from '../components/commande/OrderSummary';

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
                setOrder(updatedOrder);
                orderRef.current = updatedOrder;
                const updatedOriginalSnapshot = cloneOrder(updatedOrder);
                setOriginalOrder(updatedOriginalSnapshot);
                originalOrderRef.current = updatedOriginalSnapshot;
                serverOrderRef.current = cloneOrder(updatedOrder);

                void api.getIngredients()
                    .then(setIngredients)
                    .catch(error => {
                        console.error("Failed to refresh ingredients", error);
                    });
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

    const addProductToOrder = useCallback((product: Product) => {
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
    }, [applyLocalItemsUpdate]);

    const handleQuantityChange = useCallback((itemIndex: number, change: number) => {
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
    }, [applyLocalItemsUpdate]);

    const handleCommentChange = useCallback((itemIndex: number, newComment: string) => {
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
    }, [updateOrderItems]);

    const persistCommentChange = useCallback((itemIndex: number) => {
        if (!orderRef.current) return;
        updateOrderItems(orderRef.current.items.map(item => ({ ...item })));
        setEditingCommentId(null);
    }, [updateOrderItems]);

    const handleSendToKitchen = useCallback(async () => {
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
    }, [navigate, updateOrderItems]);

    const handleServeOrder = useCallback(async () => {
        if (!order) return;
        try {
            const updatedOrder = await api.markOrderAsServed(order.id);
            setOrder(updatedOrder);
        } catch (error) {
            console.error("Failed to mark order as served", error);
        }
    }, [order]);

    const handleFinalizeOrder = useCallback(async (paymentMethod: Order['payment_method'], receiptFile?: File | null) => {
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
    }, [navigate, order]);

    const handleExitAttempt = useCallback(() => {
        if (order && order.estado_cocina === 'no_enviado' && order.items.length > 0) {
            setExitConfirmOpen(true);
            return;
        }

        if (hasUnsentChanges) {
            setExitConfirmOpen(true);
        } else {
            navigate('/ventes');
        }
    }, [hasUnsentChanges, navigate, order]);

    const handleConfirmExit = useCallback(async () => {
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
    }, [isOrderSynced, navigate, order, originalOrder, updateOrderItems]);

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

    const hasPendingItems = categorizedItems.pending.length > 0;

    const handleCategoryChange = useCallback((categoryId: string) => {
        setActiveCategoryId(categoryId);
    }, []);

    const handleOpenPaymentModal = useCallback(() => {
        setIsPaymentModalOpen(true);
    }, []);

    const handleClosePaymentModal = useCallback(() => {
        setIsPaymentModalOpen(false);
    }, []);

    const handleEditComment = useCallback((itemId: string | null) => {
        setEditingCommentId(itemId);
    }, []);

    if (loading) return <div className="text-center p-10 text-gray-800">Chargement de la commande...</div>;
    if (!order) return <div className="text-center p-10 text-red-500">Commande non trouvée.</div>;

    return (
        <>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[calc(100vh-12rem)] lg:h-[calc(100vh-10rem)]">
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
                        </div>
                    </div>
                </div>
                <ProductGrid
                    products={products}
                    categories={categories}
                    activeCategoryId={activeCategoryId}
                    onCategoryChange={handleCategoryChange}
                    quantities={productQuantitiesInCart}
                    onAdd={addProductToOrder}
                    isProductAvailable={isProductAvailable}
                />
            </div>

            {/* Order Summary Section */}
            <OrderSummary
                order={order}
                pendingItems={categorizedItems.pending}
                sentItems={categorizedItems.sent}
                editingCommentId={editingCommentId}
                onEditComment={handleEditComment}
                onQuantityChange={handleQuantityChange}
                onCommentChange={handleCommentChange}
                onCommentPersist={persistCommentChange}
                onServeOrder={handleServeOrder}
                onSendToKitchen={handleSendToKitchen}
                onOpenPaymentModal={handleOpenPaymentModal}
                isSendingToKitchen={isSendingToKitchen}
                hasPendingItems={hasPendingItems}
            />
        </div>
        <PaymentModal
            isOpen={isPaymentModalOpen}
            onClose={handleClosePaymentModal}
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