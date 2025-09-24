import React, { useState, FormEvent, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import { api } from '../services/api';
import { Product } from '../types';
import { Mail, MapPin, Phone, Menu, X } from 'lucide-react';
import CustomerOrderTracker from '../components/CustomerOrderTracker';

const PinInput: React.FC<{ pin: string; onPinChange: (pin: string) => void; pinLength: number }> = ({ pin, onPinChange, pinLength }) => {
    const handleKeyClick = (key: string) => {
        if (pin.length < pinLength) {
            onPinChange(pin + key);
        }
    };
    const handleDelete = () => {
        onPinChange(pin.slice(0, -1));
    };

    return (
        <div className="flex flex-col items-center">
            <div className="flex space-x-2 md:space-x-4 mb-4">
                {Array.from({ length: pinLength }).map((_, i) => (
                    <div key={i} className="w-10 h-12 md:w-12 md:h-14 bg-gray-200 rounded-md flex items-center justify-center text-2xl font-bold">
                        {pin[i] ? '•' : ''}
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-3 gap-4">
                {[...Array(9)].map((_, i) => (
                    <button type="button" key={i + 1} onClick={() => handleKeyClick(String(i + 1))} className="w-16 h-16 rounded-full bg-gray-100 text-2xl font-bold hover:bg-gray-200 transition">
                        {i + 1}
                    </button>
                ))}
                <div /> 
                <button type="button" onClick={() => handleKeyClick('0')} className="w-16 h-16 rounded-full bg-gray-100 text-2xl font-bold hover:bg-gray-200 transition">0</button>
                <button type="button" onClick={handleDelete} className="w-16 h-16 rounded-full bg-gray-100 text-xl font-bold hover:bg-gray-200 transition flex items-center justify-center">DEL</button>
            </div>
        </div>
    );
};


const Login: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(() => localStorage.getItem('active-customer-order-id'));

  const submitPin = useCallback(async (pinToSubmit: string) => {
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      await login(pinToSubmit);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'PIN invalide. Veuillez réessayer.');
      setPin('');
    } finally {
        setLoading(false);
    }
  }, [login, navigate, loading]);

  useEffect(() => {
    if (pin.length === 6) {
      const timer = setTimeout(() => submitPin(pin), 100);
      return () => clearTimeout(timer);
    }
  }, [pin, submitPin]);

  useEffect(() => {
    const fetchMenuPreview = async () => {
      try {
        setMenuLoading(true);
        const topProducts = await api.getTopSellingProducts();
        setProducts(topProducts);
      } catch (error) {
        console.error("Failed to fetch menu preview:", error);
      } finally {
        setMenuLoading(false);
      }
    };
    fetchMenuPreview();
  }, []);

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (pin.length === 6) {
      submitPin(pin);
    }
  };

  const handleNewOrder = () => {
    localStorage.removeItem('active-customer-order-id');
    setActiveOrderId(null);
  };

  return (
    <div className="bg-gray-100 text-brand-secondary">
      <header className="sticky top-0 z-50 p-4 text-white bg-brand-secondary/90 backdrop-blur-sm transition-all duration-300">
        <div className="container mx-auto flex justify-between items-center">
            <a href="#accueil" className="text-3xl font-bold text-brand-primary">OUIOUITACOS</a>
            <nav className="hidden md:flex space-x-6 items-center">
                <a href="#accueil" className="hover:text-brand-primary transition">Accueil</a>
                <a href="#apropos" className="hover:text-brand-primary transition">A Propos</a>
                <a href="#menu" className="hover:text-brand-primary transition">Menu</a>
                <a href="#contact" className="hover:text-brand-primary transition">Contact</a>
                <button onClick={() => setIsModalOpen(true)} className="bg-brand-primary text-brand-secondary font-bold py-2 px-4 rounded-full hover:bg-yellow-400 transition">
                Staff Login
                </button>
            </nav>
            <div className="md:hidden">
                <button onClick={() => setMobileMenuOpen(true)} className="p-2">
                    <Menu size={28} />
                </button>
            </div>
        </div>
      </header>
      
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-brand-secondary text-white flex flex-col items-center justify-center md:hidden">
            <button onClick={() => setMobileMenuOpen(false)} className="absolute top-4 right-4 p-2">
                <X size={32} />
            </button>
            <nav className="flex flex-col items-center space-y-8">
                <a href="#accueil" onClick={() => setMobileMenuOpen(false)} className="text-3xl hover:text-brand-primary transition">Accueil</a>
                <a href="#apropos" onClick={() => setMobileMenuOpen(false)} className="text-3xl hover:text-brand-primary transition">A Propos</a>
                <a href="#menu" onClick={() => setMobileMenuOpen(false)} className="text-3xl hover:text-brand-primary transition">Menu</a>
                <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="text-3xl hover:text-brand-primary transition">Contact</a>
                <button 
                    onClick={() => {
                        setIsModalOpen(true);
                        setMobileMenuOpen(false);
                    }} 
                    className="mt-8 bg-brand-primary text-brand-secondary font-bold py-3 px-6 rounded-full hover:bg-yellow-400 transition text-2xl"
                >
                    Staff Login
                </button>
            </nav>
        </div>
      )}

      <main>
        <section id="accueil" className="h-screen bg-cover bg-center flex flex-col" style={{ backgroundImage: "url('https://picsum.photos/seed/tacosbg/1920/1080')" }}>
            {activeOrderId ? (
                <CustomerOrderTracker orderId={activeOrderId} onNewOrderClick={handleNewOrder} variant="hero" />
            ) : (
                <div className="flex-1 flex flex-col justify-center items-center text-center text-white p-4 bg-black bg-opacity-60">
                    <h2 className="text-5xl md:text-6xl font-extrabold mb-4 drop-shadow-lg">Le Goût Authentique du Mexique</h2>
                    <p className="text-lg md:text-xl max-w-2xl mb-8 drop-shadow-md">Des tacos préparés avec passion, des ingrédients frais et une touche de tradition.</p>
                    <button onClick={() => navigate('/commande-client')} className="bg-brand-accent text-white font-bold py-4 px-8 rounded-full text-lg hover:bg-red-700 transition transform hover:scale-105">
                        Commander en ligne
                    </button>
                </div>
            )}
        </section>

        <section id="apropos" className="py-20 bg-white">
          <div className="container mx-auto text-center max-w-4xl px-4">
            <h2 className="text-4xl font-bold mb-4 text-brand-secondary">Notre Histoire</h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Fondé par des passionnés de la cuisine mexicaine, OUIOUITACOS est né d'un désir simple : partager le goût authentique des tacos faits maison. Chaque recette est un héritage familial, chaque ingrédient est choisi avec soin, et chaque plat est préparé avec le cœur. Venez découvrir une explosion de saveurs qui vous transportera directement dans les rues de Mexico.
            </p>
          </div>
        </section>

        <section id="menu" className="py-20 bg-gray-50">
            <div className="container mx-auto text-center px-4">
                <h2 className="text-4xl font-bold mb-8 text-brand-secondary">Nos Best-Sellers</h2>
                {menuLoading ? <p>Chargement du menu...</p> : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {products.map(product => (
                    <div key={product.id} className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
                        <img src={product.image} alt={product.nom_produit} className="w-full h-48 object-cover"/>
                        <div className="p-4 flex flex-col flex-grow">
                        <h3 className="text-xl font-bold mb-2 text-gray-900">{product.nom_produit}</h3>
                        <p className="text-gray-600 text-sm mb-4 flex-grow">{product.description}</p>
                        <p className="text-lg font-bold text-brand-primary mt-auto">{product.prix_vente.toFixed(2)} €</p>
                        </div>
                    </div>
                    ))}
                </div>
                )}
                <button onClick={() => navigate('/commande-client')} className="mt-12 bg-brand-primary text-brand-secondary font-bold py-3 px-8 rounded-full text-lg hover:bg-yellow-400 transition transform hover:scale-105">
                    Voir le Menu Complet & Commander
                </button>
            </div>
        </section>

        <section id="contact" className="py-20 bg-white">
            <div className="container mx-auto text-center max-w-4xl px-4">
                <h2 className="text-4xl font-bold mb-8 text-brand-secondary">Contactez-nous</h2>
                <div className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-16">
                    <div className="flex items-center gap-4">
                        <MapPin size={40} className="text-brand-accent"/>
                        <div>
                            <h3 className="text-xl font-semibold">Adresse</h3>
                            <p className="text-gray-600">123 Rue du Taco, 75000 Paris</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Phone size={40} className="text-brand-accent"/>
                        <div>
                            <h3 className="text-xl font-semibold">Téléphone</h3>
                            <p className="text-gray-600">01 23 45 67 89</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-4">
                        <Mail size={40} className="text-brand-accent"/>
                        <div>
                            <h3 className="text-xl font-semibold">Email</h3>
                            <p className="text-gray-600">contact@ouiouitacos.fr</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
      </main>

      <footer className="bg-brand-secondary text-white py-8">
        <div className="container mx-auto text-center">
            <p>&copy; {new Date().getFullYear()} OUIOUITACOS. Tous droits réservés.</p>
        </div>
      </footer>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setPin(''); setError(''); }} title="Entrez votre PIN">
         <form onSubmit={handleFormSubmit} className="space-y-6">
            <PinInput pin={pin} onPinChange={setPin} pinLength={6} />
            {error && <p className="text-red-500 text-center h-5">{error}</p>}
            <button type="submit" disabled={loading || pin.length !== 6} className="w-full bg-brand-primary text-brand-secondary font-bold py-3 px-4 rounded-lg hover:bg-yellow-400 transition disabled:bg-gray-300">
              {loading ? 'Connexion...' : 'Valider'}
            </button>
          </form>
      </Modal>
    </div>
  );
};

export default Login;