import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Product, Category, Ingredient, OrderItem, Order } from '../types';
import Modal from '../components/Modal';
import { ArrowLeft, ShoppingCart, Plus, Minus, X, Upload, MessageCircle, CheckCircle, RefreshCw, History } from 'lucide-react';
import CustomerOrderTracker from '../components/CustomerOrderTracker';

// ==================================================================================
// 2. Item Customization Modal
// ==================================================================================

interface ItemCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: OrderItem) => void;
  product: Product;
  item?: OrderItem;
  ingredients: Ingredient[];
}

const ItemCustomizationModal: React.FC<ItemCustomizationModalProps> = ({ isOpen, onClose, onAddToCart, product, item }) => {
    const [quantity, setQuantity] = useState(1);
    const [comment, setComment] = useState('');

    useEffect(() => {
        // Reset modal state when it opens for a new product
        setQuantity(1);
        setComment('');
    }, [isOpen, product]);

    const handleSave = () => {
        const newItem: OrderItem = {
            id: item?.id || `oi${Date.now()}`,
            produitRef: product.id,
            nom_produit: product.nom_produit,
            prix_unitaire: product.prix_vente,
            quantite: quantity,
            excluded_ingredients: [],
            commentaire: comment.trim(),
            estado: 'en_attente',
        };
        onAddToCart(newItem);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={product.nom_produit}>
            <div className="space-y-4">
                <img src={product.image} alt={product.nom_produit} className="w-full h-48 object-cover rounded-lg" />
                <p className="text-gray-600">{product.description}</p>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Commentaire (allergies, etc.)</label>
                    <textarea value={comment} onChange={e => setComment(e.target.value)} rows={2} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary text-gray-700 bg-white" />
                </div>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="p-2 rounded-full bg-gray-200 text-gray-800"><Minus size={18}/></button>
                        <span className="font-bold text-lg w-8 text-center text-gray-800">{quantity}</span>
                        <button onClick={() => setQuantity(q => q + 1)} className="p-2 rounded-full bg-gray-200 text-gray-800"><Plus size={18}/></button>
                    </div>
                    <button onClick={handleSave} className="bg-brand-primary text-brand-secondary font-bold py-2 px-6 rounded-lg hover:bg-yellow-400 transition">
                        Ajouter ({ (product.prix_vente * quantity).toFixed(2) } €)
                    </button>
                </div>
            </div>
        </Modal>
    );
};

// ==================================================================================
// Confirmation Modal after submitting order
// ==================================================================================

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order;
    whatsAppMessage: string;
}
const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, order, whatsAppMessage }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Commande envoyée !">
            <div className="text-center space-y-4">
                <CheckCircle className="mx-auto text-green-500" size={64}/>
                <h3 className="text-xl font-bold text-gray-800">Merci pour votre commande !</h3>
                <p className="text-gray-600">
                    Votre commande #{order.id.slice(-6)} a bien été reçue. 
                    Elle est en attente de validation. Vous pouvez suivre son statut sur cette page.
                </p>
                <p className="text-gray-600">
                    Pour finaliser, veuillez nous envoyer ce récapitulatif sur WhatsApp avec votre justificatif.
                </p>
                <a 
                    href={`https://wa.me/?text=${whatsAppMessage}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={onClose}
                    className="inline-flex items-center justify-center gap-2 w-full bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 transition"
                >
                    <MessageCircle /> Envoyer sur WhatsApp
                </a>
            </div>
        </Modal>
    );
};


// ==================================================================================
// 1. Order Menu View
// ==================================================================================

const OrderMenuView: React.FC<{ onOrderSubmitted: (order: Order) => void }> = ({ onOrderSubmitted }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [activeCategoryId, setActiveCategoryId] = useState<string>('all');
    const [cart, setCart] = useState<OrderItem[]>([]);
    const [isModalOpen, setModalOpen] = useState(false);
    const [isConfirmOpen, setConfirmOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<{product: Product, item?: OrderItem} | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [clientInfo, setClientInfo] = useState({ nom: '', adresse: '', telephone: '' });
    const [paymentProof, setPaymentProof] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [submittedOrder, setSubmittedOrder] = useState<Order | null>(null);
    const [orderHistory, setOrderHistory] = useState<Order[]>([]);

    useEffect(() => {
        try {
            const historyJSON = localStorage.getItem('customer-order-history');
            if (historyJSON) {
                setOrderHistory(JSON.parse(historyJSON));
            }
        } catch (e) { console.error("Could not load order history", e); }
    }, []);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [productsData, categoriesData, ingredientsData] = await Promise.all([
                api.getProducts(),
                api.getCategories(),
                api.getIngredients()
            ]);
            setProducts(productsData);
            setCategories(categoriesData);
            setIngredients(ingredientsData);
        } catch (err) {
            setError('Impossible de charger le menu. Veuillez réessayer plus tard.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredProducts = useMemo(() => {
        if (activeCategoryId === 'all') return products;
        return products.filter(p => p.categoria_id === activeCategoryId);
    }, [products, activeCategoryId]);

    const total = useMemo(() => {
        return cart.reduce((acc, item) => acc + item.quantite * item.prix_unitaire, 0);
    }, [cart]);

    const handleProductClick = (product: Product) => {
        setSelectedProduct({product});
        setModalOpen(true);
    };

    const handleAddToCart = (item: OrderItem) => {
        let newCart = [...cart];
        if (item.commentaire) {
            newCart.push({ ...item, id: `oi${Date.now()}` });
        } else {
            const existingIndex = newCart.findIndex(cartItem => cartItem.produitRef === item.produitRef && !cartItem.commentaire);
            if (existingIndex > -1) {
                newCart[existingIndex].quantite += item.quantite;
            } else {
                newCart.push(item);
            }
        }
        setCart(newCart);
        setModalOpen(false);
    };
    
    const handleQuantityChange = (itemId: string, change: number) => {
        const itemIndex = cart.findIndex(item => item.id === itemId);
        if (itemIndex === -1) return;
        
        let newCart = [...cart];
        const newQuantity = newCart[itemIndex].quantite + change;
        if (newQuantity <= 0) {
            newCart.splice(itemIndex, 1);
        } else {
            newCart[itemIndex].quantite = newQuantity;
        }
        setCart(newCart);
    };
    
    const handleSubmitOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!clientInfo.nom || !clientInfo.telephone || !clientInfo.adresse || !paymentProof) return;
        setSubmitting(true);
        try {
            const orderData = {
                items: cart,
                clientInfo,
                receipt_url: `https://picsum.photos/seed/${Date.now()}/400/600` // Mocked URL
            };
            const newOrder = await api.submitCustomerOrder(orderData);
            setSubmittedOrder(newOrder);
            setConfirmOpen(true);
            setCart([]);
            setClientInfo({nom: '', adresse: '', telephone: ''});
            setPaymentProof(null);
        } catch (err) {
            alert("Une erreur est survenue lors de la soumission de la commande.");
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

     const handleReorder = (pastOrder: Order) => {
        setCart(pastOrder.items.map(item => ({...item, id: `oi${Date.now()}${item.produitRef}`})));
        const cartElement = document.getElementById('cart-section');
        if(cartElement) {
             cartElement.scrollIntoView({ behavior: 'smooth' });
        }
    };
    
    const generateWhatsAppMessage = (order: Order) => {
        const header = `*Nouvelle Commande OUIOUITACOS #${order.id.slice(-6)}*`;
        const items = order.items.map(item => `- ${item.quantite}x ${item.nom_produit}`).join('\n');
        const totalMsg = `*Total: ${order.total.toFixed(2)}€*`;
        const client = `Client: ${order.clientInfo?.nom} (${order.clientInfo?.telephone})\nAdresse: ${order.clientInfo?.adresse}`;
        const fullMessage = [header, items, totalMsg, client, "Justificatif de paiement ci-joint."].join('\n\n');
        return encodeURIComponent(fullMessage);
    };
    
    if (loading) return <div className="h-screen flex items-center justify-center">Chargement du menu...</div>;
    if (error) return <div className="h-screen flex items-center justify-center text-red-500">{error}</div>;

    return (
        <>
            <main className="container mx-auto p-4 lg:grid lg:grid-cols-3 lg:gap-8">
                {/* Menu Section */}
                <div className="lg:col-span-2">
                    {orderHistory.length > 0 && cart.length === 0 && (
                        <div className="bg-white p-4 rounded-xl shadow-md mb-8">
                            <h2 className="text-xl font-bold flex items-center gap-2 mb-3 text-gray-700"><History /> Repasser une commande ?</h2>
                            <div className="space-y-2">
                                {orderHistory.map(order => (
                                    <div key={order.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                                        <div>
                                            <p className="font-semibold text-gray-700">Commande du {new Date(order.date_creation).toLocaleDateString()}</p>
                                            <p className="text-sm text-gray-500">{order.items.length} article(s) - {order.total.toFixed(2)}€</p>
                                        </div>
                                        <button onClick={() => handleReorder(order)} className="bg-brand-primary text-brand-secondary font-bold py-1 px-3 rounded-lg text-sm hover:bg-yellow-400">
                                            Commander à nouveau
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="bg-white p-4 rounded-xl shadow-md">
                        <div className="flex space-x-2 overflow-x-auto pb-2 mb-4">
                             <button onClick={() => setActiveCategoryId('all')}
                                className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap transition ${activeCategoryId === 'all' ? 'bg-brand-primary text-brand-secondary' : 'bg-gray-200 text-gray-700'}`}>
                                Tous
                            </button>
                            {categories.map(cat => (
                                <button key={cat.id} onClick={() => setActiveCategoryId(cat.id)}
                                    className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap transition ${activeCategoryId === cat.id ? 'bg-brand-primary text-brand-secondary' : 'bg-gray-200 text-gray-700'}`}>
                                    {cat.nom}
                                </button>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {filteredProducts.map(product => (
                                <div key={product.id} onClick={() => product.estado === 'disponible' && handleProductClick(product)}
                                    className={`border rounded-lg p-3 flex flex-col items-center text-center transition-shadow ${product.estado === 'disponible' ? 'cursor-pointer hover:shadow-lg' : 'opacity-50'}`}>
                                    <img src={product.image} alt={product.nom_produit} className="w-28 h-28 object-cover rounded-md mb-2" />
                                    <p className="font-semibold text-sm flex-grow text-gray-700">{product.nom_produit}</p>
                                    <p className="text-xs text-gray-500 mt-1 px-1 h-10 overflow-hidden">{product.description}</p>
                                    <p className="font-bold text-gray-700 mt-1">{product.prix_vente.toFixed(2)} €</p>
                                    {product.estado !== 'disponible' && <span className="text-xs text-red-500 font-bold mt-1">Épuisé</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Cart Section */}
                <div id="cart-section" className="lg:col-span-1 mt-8 lg:mt-0 lg:sticky top-24 self-start">
                    <div className="bg-white p-4 rounded-xl shadow-md">
                        <h2 className="text-2xl font-bold flex items-center gap-2 mb-4 text-gray-700"><ShoppingCart/> Mon Panier</h2>
                        {cart.length === 0 ? <p className="text-gray-500">Votre panier est vide.</p> :
                            <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                                {cart.map(item => (
                                    <div key={item.id} className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold text-gray-700">{item.nom_produit}</p>
                                            {item.commentaire && <p className="text-xs text-gray-500 italic">"{item.commentaire}"</p>}
                                            <p className="text-sm text-gray-600 font-semibold">{(item.prix_unitaire * item.quantite).toFixed(2)} €</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => handleQuantityChange(item.id, -1)} className="p-1 rounded-full bg-gray-200"><Minus size={14}/></button>
                                            <span className="font-bold w-5 text-center text-gray-700">{item.quantite}</span>
                                            <button onClick={() => handleQuantityChange(item.id, 1)} className="p-1 rounded-full bg-gray-200"><Plus size={14}/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        }
                        <div className="border-t my-4"></div>
                        <div className="flex justify-between text-xl font-bold text-gray-700">
                            <span>Total</span>
                            <span>{total.toFixed(2)} €</span>
                        </div>

                        {cart.length > 0 && (
                            <form onSubmit={handleSubmitOrder} className="mt-6 space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Nom Complet</label>
                                    <input type="text" required value={clientInfo.nom} onChange={e => setClientInfo({...clientInfo, nom: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary text-gray-700 bg-white"/>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Adresse de livraison</label>
                                    <input type="text" required value={clientInfo.adresse} onChange={e => setClientInfo({...clientInfo, adresse: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary text-gray-700 bg-white"/>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Numéro de Téléphone</label>
                                    <input type="tel" required value={clientInfo.telephone} onChange={e => setClientInfo({...clientInfo, telephone: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary text-gray-700 bg-white"/>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Méthode de Paiement</label>
                                    <select required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-primary focus:border-brand-primary bg-white text-gray-700">
                                        <option value="transferencia">Transferencia</option>
                                        <option value="efectivo" disabled>Efectivo - non disponible</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Justificatif de virement</label>
                                    <label htmlFor="payment-proof-upload" className="mt-1 w-full border border-gray-300 p-2 rounded-md shadow-sm flex items-center gap-2 cursor-pointer bg-white text-gray-500">
                                        <Upload size={18} />
                                        <span>{paymentProof ? paymentProof.name : 'Choisir un fichier...'}</span>
                                    </label>
                                    <input id="payment-proof-upload" type="file" required accept="image/*,.pdf" onChange={e => setPaymentProof(e.target.files ? e.target.files[0] : null)} className="hidden" />
                                </div>
                                <button type="submit" disabled={!clientInfo.nom || !clientInfo.telephone || !clientInfo.adresse || !paymentProof || submitting} className="w-full bg-brand-accent text-white font-bold py-3 rounded-lg text-lg hover:bg-red-700 transition disabled:bg-gray-400">
                                    {submitting ? 'Envoi...' : `Soumettre la Commande (${total.toFixed(2)} €)`}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </main>

            {selectedProduct && (
                <ItemCustomizationModal 
                    isOpen={isModalOpen}
                    onClose={() => setModalOpen(false)}
                    onAddToCart={handleAddToCart}
                    product={selectedProduct.product}
                    item={selectedProduct.item}
                    ingredients={ingredients}
                />
            )}
            
            {submittedOrder && (
                <ConfirmationModal
                    isOpen={isConfirmOpen}
                    onClose={() => {
                        onOrderSubmitted(submittedOrder);
                        setConfirmOpen(false);
                    }}
                    order={submittedOrder}
                    whatsAppMessage={generateWhatsAppMessage(submittedOrder)}
                />
            )}
        </>
    );
};


// ==================================================================================
// 3. Main Component
// ==================================================================================

const CommandeClient: React.FC = () => {
    const navigate = useNavigate();
    const [activeOrderId, setActiveOrderId] = useState<string | null>(() => localStorage.getItem('active-customer-order-id'));

    const handleOrderSubmitted = (order: Order) => {
        localStorage.setItem('active-customer-order-id', order.id);
        setActiveOrderId(order.id);
    };

    const handleNewOrder = () => {
        localStorage.removeItem('active-customer-order-id');
        setActiveOrderId(null);
    };

    return (
        <div className="bg-gray-100 min-h-screen">
            <header className="bg-white shadow-sm p-4 sticky top-0 z-40">
                <div className="container mx-auto flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-brand-primary">OUIOUITACOS</h1>
                    <button onClick={() => navigate('/login')} className="flex items-center gap-2 text-sm text-gray-600 hover:text-brand-primary transition">
                        <ArrowLeft size={16}/> Retour à l'accueil
                    </button>
                </div>
            </header>
            
            {activeOrderId ? (
                <CustomerOrderTracker orderId={activeOrderId} onNewOrderClick={handleNewOrder} variant="page" />
            ) : (
                <OrderMenuView onOrderSubmitted={handleOrderSubmitted} />
            )}
        </div>
    );
};

export default CommandeClient;