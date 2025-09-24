import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Order, Product, Category, OrderItem, Ingredient } from '../types';
import { PlusCircle, MinusCircle, Send, DollarSign, AlertTriangle, Check, ArrowLeft, MessageSquare } from 'lucide-react';
import OrderTimer from '../components/OrderTimer';
import PaymentModal from '../components/PaymentModal';
import Modal from '../components/Modal';

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

    const fetchOrderData = useCallback(async (isRefresh = false) => {
        if (!tableId) return;
        try {
            if (!isRefresh) setLoading(true);

            if(isRefresh) {
                 const orderData = await api.createOrGetOrderByTableId(tableId);
                 setOrder(orderData);
                 return;
            }

            const [orderData, productsData, categoriesData, ingredientsData] = await Promise.all([
                api.createOrGetOrderByTableId(tableId),
                api.getProducts(),
                api.getCategories(),
                api.getIngredients(),
            ]);
            setOrder(orderData);
            setOriginalOrder(JSON.parse(JSON.stringify(orderData)));
            setProducts(productsData);
            setCategories(categoriesData);
            setIngredients(ingredientsData);
        } catch (error) {
            console.error("Failed to load order data", error);
            navigate('/ventes');
        } finally {
            if (!isRefresh) setLoading(false);
        }
    }, [tableId, navigate]);

    useEffect(() => {
        fetchOrderData();
        const interval = setInterval(() => fetchOrderData(true), 5000);
        return () => clearInterval(interval);
    }, [fetchOrderData]);
    
    const hasUnsentChanges = useMemo(() => {
        if (!originalOrder || !order) return false;
        return JSON.stringify(originalOrder.items) !== JSON.stringify(order.items);
    }, [order, originalOrder]);

    const productQuantitiesInCart = useMemo(() => {
        if (!order) return {};
        return order.items.reduce((acc, item) => {
            acc[item.produitRef] = (acc[item.produitRef] || 0) + item.quantite;
            return acc;
        }, {} as {[key: string]: number});
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
    
    const updateOrderItems = async (newItems: OrderItem[], options?: {isLocalUpdate?: boolean}) => {
        if (!order) return;
        const tempOrder = { ...order, items: newItems, total: newItems.reduce((acc, item) => acc + item.quantite * item.prix_unitaire, 0) };
        setOrder(tempOrder);
        
        if (options?.isLocalUpdate) return;

        try {
            const updatedOrder = await api.updateOrder(order.id, { items: newItems });
            const ingredientsData = await api.getIngredients();
            
            setOrder(updatedOrder);
            setIngredients(ingredientsData);
        } catch (error) {
            console.error("Failed to update order:", error);
            alert("Une erreur est survenue lors de la mise à jour de la commande.");
            fetchOrderData(true);
        }
    };

    const addProductToOrder = (product: Product) => {
        if (!order) return;
        const existingItemIndex = order.items.findIndex(
            item => item.produitRef === product.id && item.estado === 'en_attente' && !item.commentaire
        );
        let newItems;
        if (existingItemIndex > -1) {
            newItems = JSON.parse(JSON.stringify(order.items));
            newItems[existingItemIndex].quantite += 1;
        } else {
            const newItem: OrderItem = {
                id: `oi${Date.now()}`,
                produitRef: product.id,
                nom_produit: product.nom_produit,
                prix_unitaire: product.prix_vente,
                quantite: 1,
                excluded_ingredients: [],
                commentaire: '',
                estado: 'en_attente',
            };
            newItems = [...order.items, newItem];
        }
        updateOrderItems(newItems);
    };
    
    const handleQuantityChange = (itemIndex: number, change: number) => {
        if (!order) return;
        const newItems = JSON.parse(JSON.stringify(order.items));
        const newQuantity = newItems[itemIndex].quantite + change;
        if (newQuantity <= 0) {
            newItems.splice(itemIndex, 1);
        } else {
            newItems[itemIndex].quantite = newQuantity;
        }
        updateOrderItems(newItems);
    };

    const handleCommentChange = (itemIndex: number, newComment: string) => {
        if (!order) return;
        const newItems = JSON.parse(JSON.stringify(order.items));
        const itemToUpdate = newItems[itemIndex];
    
        if (itemToUpdate.quantite > 1 && !itemToUpdate.commentaire && newComment) {
            itemToUpdate.quantite -= 1; 
            const newItemWithComment = {
                ...itemToUpdate,
                id: `oi${Date.now()}`,
                quantite: 1,
                commentaire: newComment,
            };
            newItems.push(newItemWithComment);
            setEditingCommentId(newItemWithComment.id);
        } else {
            itemToUpdate.commentaire = newComment;
        }
        updateOrderItems(newItems, { isLocalUpdate: true });
    };

    const persistCommentChange = (itemIndex: number) => {
        if (!order) return;
        updateOrderItems(order.items);
        setEditingCommentId(null);
    }

    const handleSendToKitchen = async () => {
        if (!order || !order.items.some(i => i.estado === 'en_attente')) return;
        try {
            const updatedOrder = await api.sendOrderToKitchen(order.id);
            setOrder(updatedOrder);
            setOriginalOrder(JSON.parse(JSON.stringify(updatedOrder)));
            navigate('/ventes');
        } catch (error) {
            console.error("Failed to send order to kitchen", error);
            alert("Erreur lors de l'envoi en cuisine.");
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
            const receiptUrl = receiptFile ? `https://fake-storage.com/${receiptFile.name}` : undefined;
            await api.finalizeOrder(order.id, paymentMethod, receiptUrl);
            alert("Commande finalisée avec succès !");
            navigate('/ventes');
        } catch (error) {
            console.error("Failed to finalize order", error);
            alert("Erreur lors de la finalisation.");
        }
    };
    
    const handleExitAttempt = () => {
        if (hasUnsentChanges) {
            setExitConfirmOpen(true);
        } else {
            navigate('/ventes');
        }
    };

    const handleConfirmExit = async () => {
        if (originalOrder) {
           await updateOrderItems(originalOrder.items);
        }
        setExitConfirmOpen(false);
        navigate('/ventes');
    };

    if (loading) return <div className="text-center p-10 text-gray-800">Chargement de la commande...</div>;
    if (!order) return <div className="text-center p-10 text-red-500">Commande non trouvée.</div>;

    const filteredProducts = activeCategoryId === 'all' 
        ? products 
        : products.filter(p => p.categoria_id === activeCategoryId);

    return (
        <>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-10rem)]">
            {/* Menu Section */}
            <div className="lg:col-span-2 ui-card flex flex-col">
                <div className="p-4 border-b">
                    <div className="flex justify-between items-center">
                         <div className="flex items-center gap-4">
                            <button onClick={handleExitAttempt} className="ui-btn-dark" title="Retour au plan de salle">
                                <ArrowLeft size={20} />
                                <span className="hidden sm:inline">Plan de Salle</span>
                            </button>
                            <h2 className="text-2xl font-semibold text-brand-secondary">Table {order.table_nom}</h2>
                         </div>
                         {order.date_envoi_cuisine && <OrderTimer startTime={order.date_envoi_cuisine} />}
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
                            <div key={product.id} onClick={() => addProductToOrder(product)}
                                className={`border rounded-lg p-2 flex flex-col items-center justify-between text-center cursor-pointer hover:shadow-lg transition-all relative ${isLowStock ? 'border-yellow-500 border-2' : ''}`}>
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
                            </div>
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
                    {order.items.length === 0 ? <p className="text-gray-500">La commande est vide.</p> :
                        order.items.map((item, index) => (
                        <div key={item.id} className={`p-3 rounded-lg ${item.estado === 'enviado' ? 'bg-green-100' : 'bg-yellow-100'}`}>
                            <div className="flex justify-between items-start">
                                <p className="font-bold text-gray-900 flex-1">{item.quantite}x {item.nom_produit}</p>
                                <p className="font-bold text-gray-900">{(item.quantite * item.prix_unitaire).toFixed(2)}€</p>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                                <p className="text-sm text-gray-700">{item.prix_unitaire.toFixed(2)} € /u</p>
                                <div className="flex items-center space-x-2 text-gray-800">
                                    <button onClick={() => handleQuantityChange(index, -1)} disabled={item.estado === 'enviado'} className="disabled:text-gray-400 disabled:cursor-not-allowed p-1"><MinusCircle size={20} /></button>
                                    <span className="font-bold w-6 text-center">{item.quantite}</span>
                                    <button onClick={() => handleQuantityChange(index, 1)} disabled={item.estado === 'enviado'} className="disabled:text-gray-400 disabled:cursor-not-allowed p-1"><PlusCircle size={20} /></button>
                                </div>
                            </div>
                             {item.estado === 'en_attente' && (
                                (editingCommentId === item.id || item.commentaire) ? (
                                    <input
                                        type="text"
                                        placeholder="Ajouter un commentaire..."
                                        value={item.commentaire}
                                        onChange={(e) => handleCommentChange(index, e.target.value)}
                                        onBlur={() => persistCommentChange(index)}
                                        autoFocus
                                        className="mt-2 ui-input text-sm"
                                    />
                                ) : (
                                    <button onClick={() => setEditingCommentId(item.id)} className="mt-2 text-xs text-blue-600 hover:underline flex items-center gap-1">
                                        <MessageSquare size={12}/> Ajouter un commentaire
                                    </button>
                                )
                            )}
                            {item.estado !== 'en_attente' && item.commentaire && (
                                <p className="mt-2 text-sm italic text-gray-600 pl-2">"{item.commentaire}"</p>
                            )}
                        </div>
                    ))}
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
                            disabled={!order.items.some(i => i.estado === 'en_attente')}
                            className="flex-1 ui-btn-accent justify-center py-3 disabled:opacity-60">
                            <Send size={20} /><span>Envoyer en Cuisine</span>
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