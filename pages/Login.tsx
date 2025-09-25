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
    <div className="pin-input" aria-label="Clavier numérique">
      <div className="pin-indicator" role="presentation">
        {Array.from({ length: pinLength }).map((_, index) => (
          <div key={index} className="pin-indicator__slot" aria-hidden="true">
            {pin[index] ? '•' : ''}
          </div>
        ))}
      </div>
      <div className="pin-pad">
        {[...Array(9)].map((_, index) => (
          <button
            type="button"
            key={index + 1}
            onClick={() => handleKeyClick(String(index + 1))}
            className="pin-pad__button"
          >
            {index + 1}
          </button>
        ))}
        <div aria-hidden="true" />
        <button type="button" onClick={() => handleKeyClick('0')} className="pin-pad__button">
          0
        </button>
        <button type="button" onClick={handleDelete} className="pin-pad__button pin-pad__button--muted">
          DEL
        </button>
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
    <div className="login-page">
      <header className="login-header">
        <div className="layout-container login-header__inner">
          <a href="#accueil" className="login-brand">OUIOUITACOS</a>
          <nav className="login-nav" aria-label="Navigation principale">
            <a href="#accueil" className="login-nav__link">Accueil</a>
            <a href="#apropos" className="login-nav__link">À propos</a>
            <a href="#menu" className="login-nav__link">Menu</a>
            <a href="#contact" className="login-nav__link">Contact</a>
            <button type="button" onClick={() => setIsModalOpen(true)} className="ui-btn ui-btn-accent login-nav__cta">
              Staff Login
            </button>
          </nav>
          <button type="button" onClick={() => setMobileMenuOpen(true)} className="login-header__menu" aria-label="Ouvrir le menu">
            <Menu size={24} />
          </button>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="login-menu-overlay" role="dialog" aria-modal="true">
          <button type="button" onClick={() => setMobileMenuOpen(false)} className="login-menu-overlay__close" aria-label="Fermer le menu">
            <X size={28} />
          </button>
          <nav className="login-menu-overlay__nav" aria-label="Navigation mobile">
            <a href="#accueil" onClick={() => setMobileMenuOpen(false)} className="login-menu-overlay__link">Accueil</a>
            <a href="#apropos" onClick={() => setMobileMenuOpen(false)} className="login-menu-overlay__link">À propos</a>
            <a href="#menu" onClick={() => setMobileMenuOpen(false)} className="login-menu-overlay__link">Menu</a>
            <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="login-menu-overlay__link">Contact</a>
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(true);
                setMobileMenuOpen(false);
              }}
              className="ui-btn ui-btn-accent hero-cta"
            >
              Staff Login
            </button>
          </nav>
        </div>
      )}

      <main>
        <section
          id="accueil"
          className="section section-hero"
          style={{ backgroundImage: "url('https://picsum.photos/seed/tacosbg/1920/1080')" }}
        >
          <div className="section-hero__inner">
            {activeOrderId ? (
              <CustomerOrderTracker orderId={activeOrderId} onNewOrderClick={handleNewOrder} variant="hero" />
            ) : (
              <div className="hero-content">
                <h2 className="hero-title">Le Goût Authentique du Mexique</h2>
                <p className="hero-subtitle">
                  Des tacos préparés avec passion, des ingrédients frais et une touche de tradition pour un voyage gustatif inoubliable.
                </p>
                <button onClick={() => navigate('/commande-client')} className="ui-btn ui-btn-accent hero-cta">
                  Commander en ligne
                </button>
              </div>
            )}
          </div>
        </section>

        <section id="apropos" className="section section-surface">
          <div className="section-inner section-inner--center">
            <h2 className="section-title">Notre Histoire</h2>
            <p className="section-text section-text--muted">
              Fondé par des passionnés de la cuisine mexicaine, OUIOUITACOS est né d'un désir simple : partager le goût authentique des tacos faits maison.
              Chaque recette est un héritage familial, chaque ingrédient est choisi avec soin, et chaque plat est préparé avec le cœur. Venez découvrir une explosion de saveurs qui vous transportera directement dans les rues de Mexico.
            </p>
          </div>
        </section>

        <section id="menu" className="section section-muted">
          <div className="section-inner section-inner--wide section-inner--center">
            <h2 className="section-title">Nos Best-sellers</h2>
            {menuLoading ? (
              <p className="section-text section-text--muted">Chargement du menu...</p>
            ) : (
              <div className="menu-grid">
                {products.map(product => (
                  <article key={product.id} className="ui-card menu-card">
                    <img src={product.image} alt={product.nom_produit} className="menu-card__media" />
                    <div className="menu-card__body">
                      <h3 className="menu-card__title">{product.nom_produit}</h3>
                      <p className="menu-card__description">{product.description}</p>
                      <p className="menu-card__price">{product.prix_vente.toFixed(2)} €</p>
                    </div>
                  </article>
                ))}
              </div>
            )}
            <div className="section-actions">
              <button onClick={() => navigate('/commande-client')} className="ui-btn ui-btn-primary hero-cta">
                Voir le menu complet & Commander
              </button>
            </div>
          </div>
        </section>

        <section id="contact" className="section section-surface">
          <div className="section-inner section-inner--wide section-inner--center">
            <h2 className="section-title">Contactez-nous</h2>
            <div className="contact-grid">
              <div className="contact-card">
                <MapPin className="contact-card__icon" />
                <h3 className="contact-card__title">Adresse</h3>
                <p className="contact-card__text">123 Rue du Taco, 75000 Paris</p>
              </div>
              <div className="contact-card">
                <Phone className="contact-card__icon" />
                <h3 className="contact-card__title">Téléphone</h3>
                <p className="contact-card__text">01 23 45 67 89</p>
              </div>
              <div className="contact-card">
                <Mail className="contact-card__icon" />
                <h3 className="contact-card__title">Email</h3>
                <p className="contact-card__text">contact@ouiouitacos.fr</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="layout-container site-footer__inner">
          <p>&copy; {new Date().getFullYear()} OUIOUITACOS. Tous droits réservés.</p>
        </div>
      </footer>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setPin(''); setError(''); }} title="Entrez votre PIN">
        <form onSubmit={handleFormSubmit} className="modal-form">
          <PinInput pin={pin} onPinChange={setPin} pinLength={6} />
          <p className="modal-form__error" role="alert" aria-live="assertive">{error}</p>
          <button type="submit" disabled={loading || pin.length !== 6} className="ui-btn ui-btn-primary ui-btn--block" data-state={loading ? 'loading' : 'idle'}>
            {loading ? 'Connexion...' : 'Valider'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Login;