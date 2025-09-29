import React, { useState, FormEvent, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import { api } from '../services/api';
import { Product, Order } from '../types';
import { Mail, MapPin, Phone, Menu, X } from 'lucide-react';
import CustomerOrderTracker from '../components/CustomerOrderTracker';
import { clearActiveCustomerOrder, getActiveCustomerOrder } from '../services/customerOrderStorage';
import { formatIntegerAmount } from '../utils/formatIntegerAmount';
import useSiteContent from '../hooks/useSiteContent';

type PinInputProps = {
  pin: string;
  onPinChange: (pin: string) => void;
  pinLength: number;
  describedBy?: string;
};

const PinInput = React.forwardRef<HTMLInputElement, PinInputProps>(({ pin, onPinChange, pinLength, describedBy }, ref) => {
  const handleKeyClick = (key: string) => {
    if (pin.length < pinLength) {
      onPinChange(pin + key);
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      onPinChange(pin.slice(0, -1));
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = event.target.value.replace(/\D/g, '').slice(0, pinLength);
    onPinChange(sanitized);
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (/^\d$/.test(event.key)) {
      event.preventDefault();
      handleKeyClick(event.key);
      return;
    }

    if (event.key === 'Backspace') {
      event.preventDefault();
      handleDelete();
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      onPinChange('');
    }
  };

  const digitsMessage =
    pin.length === 0
      ? `Aucun chiffre saisi. Vous pouvez entrer ${pinLength} chiffres.`
      : `${pin.length} ${pin.length > 1 ? 'chiffres saisis' : 'chiffre saisi'} sur ${pinLength}.`;

  return (
    <div className="pin-input" aria-label="Clavier numérique sécurisé">
      <input
        ref={ref}
        id="staff-pin-field"
        type="password"
        inputMode="numeric"
        autoComplete="one-time-code"
        className="pin-input__field"
        value={pin}
        onChange={handleInputChange}
        onKeyDown={handleInputKeyDown}
        aria-describedby={describedBy}
        aria-label={`Code PIN à ${pinLength} chiffres`}
      />
      <div className="pin-indicator" role="presentation">
        {Array.from({ length: pinLength }).map((_, index) => (
          <div key={index} className="pin-indicator__slot" aria-hidden="true">
            {pin[index] ? '•' : ''}
          </div>
        ))}
      </div>
      <div className="pin-input__live" aria-live="polite">
        {digitsMessage}
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
});

PinInput.displayName = 'PinInput';


const Login: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const pinInputRef = useRef<HTMLInputElement>(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { content: siteContent } = useSiteContent();
  const { navigation, hero, about, menu: menuContent, contact, footer } = siteContent;
  const heroBackgroundStyle = hero.backgroundImage ? { backgroundImage: `url('${hero.backgroundImage}')` } : undefined;

  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState(() => getActiveCustomerOrder());
  const activeOrderId = activeOrder?.orderId ?? null;

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
    if (isModalOpen) {
      const timer = window.setTimeout(() => {
        pinInputRef.current?.focus();
      }, 50);
      return () => window.clearTimeout(timer);
    }
  }, [isModalOpen]);

  useEffect(() => {
    const fetchMenuPreview = async () => {
      try {
        setMenuLoading(true);
        const bestSellerProducts = await api.getBestSellerProducts();
        setBestSellers(bestSellerProducts.slice(0, 6));
      } catch (error) {
        console.error("Failed to fetch menu preview:", error);
      } finally {
        setMenuLoading(false);
      }
    };
    fetchMenuPreview();
  }, []);

  useEffect(() => {
    try {
      const historyJSON = localStorage.getItem('customer-order-history');
      if (historyJSON) {
        setOrderHistory(JSON.parse(historyJSON));
      }
    } catch (error) {
      console.error('Failed to read order history from storage', error);
    }
  }, []);

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (pin.length === 6) {
      submitPin(pin);
    }
  };

  const handleNewOrder = () => {
    clearActiveCustomerOrder();
    setActiveOrder(null);
  };

  const handleQuickReorder = (orderId: string) => {
    localStorage.setItem('customer-order-reorder-id', orderId);
    navigate('/commande-client');
  };

  return (
    <div className="login-page">
      <header className="login-header">
        <div className="layout-container login-header__inner">
          <a href="#accueil" className="login-brand">{navigation.brand}</a>
          <nav className="login-nav" aria-label="Navigation principale">
            <a href="#accueil" className="login-nav__link">{navigation.links.home}</a>
            <a href="#apropos" className="login-nav__link">{navigation.links.about}</a>
            <a href="#menu" className="login-nav__link">{navigation.links.menu}</a>
            <a href="#contact" className="login-nav__link">{navigation.links.contact}</a>
            <button type="button" onClick={() => setIsModalOpen(true)} className="ui-btn ui-btn-accent login-nav__cta">
              {navigation.links.loginCta}
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
            <a href="#accueil" onClick={() => setMobileMenuOpen(false)} className="login-menu-overlay__link">
              {navigation.links.home}
            </a>
            <a href="#apropos" onClick={() => setMobileMenuOpen(false)} className="login-menu-overlay__link">
              {navigation.links.about}
            </a>
            <a href="#menu" onClick={() => setMobileMenuOpen(false)} className="login-menu-overlay__link">
              {navigation.links.menu}
            </a>
            <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="login-menu-overlay__link">
              {navigation.links.contact}
            </a>
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(true);
                setMobileMenuOpen(false);
              }}
              className="ui-btn ui-btn-accent hero-cta"
            >
              {navigation.links.loginCta}
            </button>
          </nav>
        </div>
      )}

      <main>
        <section id="accueil" className="section section-hero" style={heroBackgroundStyle}>
          <div className="section-hero__inner">
            {activeOrderId ? (
              <CustomerOrderTracker orderId={activeOrderId} onNewOrderClick={handleNewOrder} variant="hero" />
            ) : (
                <div className="hero-content">
                  <h2 className="hero-title">{hero.title}</h2>
                  <p className="hero-subtitle">{hero.subtitle}</p>
                  <button onClick={() => navigate('/commande-client')} className="ui-btn ui-btn-accent hero-cta">
                    {hero.ctaLabel}
                  </button>
                  {orderHistory.length > 0 && (
                    <div className="hero-history">
                      <p className="hero-history__title">{hero.historyTitle}</p>
                    <div className="hero-history__list">
                      {orderHistory.slice(0, 3).map(order => (
                        <div key={order.id} className="hero-history__item">
                          <div className="hero-history__meta">
                            <p className="hero-history__date">Commande du {new Date(order.date_creation).toLocaleDateString()}</p>
                            <p className="hero-history__details">{order.items.length} article(s) • {formatIntegerAmount(order.total)}€</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleQuickReorder(order.id)}
                            className="hero-history__cta"
                          >
                            {hero.reorderCtaLabel}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <section id="apropos" className="section section-surface">
          <div className="section-inner section-inner--center">
            <h2 className="section-title">{about.title}</h2>
            <p className="section-text section-text--muted">{about.description}</p>
            {about.image && (
              <img
                src={about.image}
                alt={about.title}
                className="mt-6 h-64 w-full rounded-xl object-cover shadow-lg"
              />
            )}
          </div>
        </section>

        <section id="menu" className="section section-muted">
          <div className="section-inner section-inner--wide section-inner--center">
            <h2 className="section-title">{menuContent.title}</h2>
            {menuContent.image && (
              <img
                src={menuContent.image}
                alt={menuContent.title}
                className="mb-8 h-64 w-full rounded-xl object-cover shadow-lg"
              />
            )}
            {menuLoading ? (
              <p className="section-text section-text--muted">{menuContent.loadingLabel}</p>
            ) : (
              <div className="menu-grid">
                {bestSellers.slice(0, 6).map(product => (
                  <article key={product.id} className="ui-card menu-card">
                    <img src={product.image} alt={product.nom_produit} className="menu-card__media" />
                    <div className="menu-card__body">
                      <h3 className="menu-card__title">{product.nom_produit}</h3>
                      <p className="menu-card__description">{product.description}</p>
                      <p className="menu-card__price">{formatIntegerAmount(product.prix_vente)} €</p>
                    </div>
                  </article>
                ))}
              </div>
            )}
            <div className="section-actions">
              <button onClick={() => navigate('/commande-client')} className="ui-btn ui-btn-primary hero-cta">
                {menuContent.ctaLabel}
              </button>
            </div>
          </div>
        </section>

        <section id="contact" className="section section-surface">
          <div className="section-inner section-inner--wide section-inner--center">
            <h2 className="section-title">{contact.title}</h2>
            {contact.image && (
              <img
                src={contact.image}
                alt={contact.title}
                className="mb-8 h-64 w-full rounded-xl object-cover shadow-lg"
              />
            )}
            <div className="contact-grid">
              <div className="contact-card">
                <MapPin className="contact-card__icon" />
                <h3 className="contact-card__title">{contact.addressLabel}</h3>
                <p className="contact-card__text">{contact.address}</p>
              </div>
              <div className="contact-card">
                <Phone className="contact-card__icon" />
                <h3 className="contact-card__title">{contact.phoneLabel}</h3>
                <p className="contact-card__text">{contact.phone}</p>
              </div>
              <div className="contact-card">
                <Mail className="contact-card__icon" />
                <h3 className="contact-card__title">{contact.emailLabel}</h3>
                <p className="contact-card__text">{contact.email}</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="layout-container site-footer__inner">
          <p>
            &copy; {new Date().getFullYear()} {navigation.brand}. {footer.text}
          </p>
        </div>
      </footer>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setPin('');
          setError('');
        }}
        title="Connexion du personnel"
      >
        <form
          onSubmit={handleFormSubmit}
          className="modal-form"
          aria-describedby="staff-pin-help"
        >
          <div className="modal-form__intro">
            <p id="staff-pin-help" className="modal-form__help">
              Entrez votre code PIN à 6 chiffres pour accéder au tableau de bord du personnel.
            </p>
          </div>
          <div className="modal-form__controls">
            <PinInput
              ref={pinInputRef}
              pin={pin}
              onPinChange={setPin}
              pinLength={6}
              describedBy="staff-pin-help"
            />
            <div className="modal-form__side">
              <p className="modal-form__error" role="alert" aria-live="assertive">
                {error}
              </p>
              <div className="modal-form__actions">
                <button
                  type="submit"
                  disabled={loading || pin.length !== 6}
                  className="ui-btn ui-btn-primary ui-btn--block"
                  data-state={loading ? 'loading' : 'idle'}
                >
                  {loading ? 'Connexion...' : 'Valider'}
                </button>
                <button
                  type="button"
                  className="ui-btn ui-btn-secondary ui-btn--block"
                  onClick={() => {
                    setIsModalOpen(false);
                    setPin('');
                    setError('');
                  }}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Login;