import React, { useState, FormEvent, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import { api } from '../services/api';
import { EditableElementKey, Product, Order } from '../types';
import { Clock, Mail, MapPin, Phone, Menu, X, ChevronLeft, ChevronRight, Star, Quote, ShieldCheck } from 'lucide-react';
import CustomerOrderTracker from '../components/CustomerOrderTracker';
import { clearActiveCustomerOrder, getActiveCustomerOrder } from '../services/customerOrderStorage';
import { formatCurrencyCOP } from '../utils/formatIntegerAmount';
import useSiteContent from '../hooks/useSiteContent';
import useCustomFonts from '../hooks/useCustomFonts';
import {
  createBackgroundStyle,
  createBodyTextStyle,
  createHeroBackgroundStyle,
  createTextStyle,
} from '../utils/siteStyleHelpers';

const DEFAULT_BRAND_LOGO = '/logo-brand.svg';
const DEFAULT_STAFF_LOGO = '/logo-staff.svg';

const INSTAGRAM_REVIEWS = [
  {
    id: 'review-laura',
    name: 'Laura Méndez',
    handle: '@laurita.eats',
    avatarUrl: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=320&q=80',
    postImageUrl: 'https://images.unsplash.com/photo-1521305916504-4a1121188589?auto=format&fit=crop&w=640&q=80',
    postImageAlt: "Assiette de tacos colorés garnis d'herbes fraîches.",
    message:
      'Impossible de résister à leurs tacos al pastor ! Service ultra chaleureux et vibes latinas au top. Je reviens dès la semaine prochaine ✨',
    highlight: 'Story « Taco Tuesday »',
    location: 'Bogotá · Service du soir',
    timeAgo: 'il y a 2 jours',
  },
  {
    id: 'review-camila',
    name: 'Camila Torres',
    handle: '@camigoesout',
    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=320&q=80',
    postImageUrl: 'https://images.unsplash.com/photo-1478145046317-39f10e56b5e9?auto=format&fit=crop&w=640&q=80',
    postImageAlt: 'Gros plan sur des arepas dorées et une sauce maison.',
    message:
      'Les arepas croustillantes et le guacamole maison… c’est un 10/10 ! Mention spéciale pour la playlist qui nous transporte direct à Medellín.',
    highlight: 'Reel « Brunch entre amigas »',
    location: 'Medellín · Brunch du dimanche',
    timeAgo: 'il y a 5 jours',
  },
  {
    id: 'review-sebastian',
    name: 'Sebastián Ruiz',
    handle: '@ruizhungry',
    avatarUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=320&q=80',
    postImageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=640&q=80',
    postImageAlt: 'Table conviviale avec plusieurs plats mexicains et des boissons fraîches.',
    message:
      'On a privatisé la terrasse pour un afterwork : organisation parfaite, cocktails frais et portions généreuses. La team a adoré !',
    highlight: 'Post « Team Afterwork »',
    location: 'Barranquilla · Terrasse privatisée',
    timeAgo: 'il y a 1 semaine',
  },
] as const;

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

const computeMenuGridClassName = (count: number): string => {
  if (count === 1) return 'menu-grid menu-grid--single';
  if (count === 2) return 'menu-grid menu-grid--double';
  if (count === 3) return 'menu-grid menu-grid--triple';
  if (count >= 6) return 'menu-grid menu-grid--six';
  if (count > 0) return 'menu-grid menu-grid--multi';
  return 'menu-grid';
};

const computeMenuCardClassName = (count: number): string => {
  const baseClass = 'ui-card menu-card';
  if (count === 1) return `${baseClass} menu-card--single`;
  if (count === 2) return `${baseClass} menu-card--double`;
  if (count === 3) return `${baseClass} menu-card--triple`;
  if (count >= 6) return `${baseClass} menu-card--compact`;
  return baseClass;
};


const Login: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const pinInputRef = useRef<HTMLInputElement>(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { content: siteContent } = useSiteContent();
  const { navigation, hero, about, menu: menuContent, contact, findUs, footer } = siteContent;
  useCustomFonts(siteContent.assets.library);
  const brandLogo = navigation.brandLogo ?? DEFAULT_BRAND_LOGO;
  const staffLogo = navigation.staffLogo ?? DEFAULT_STAFF_LOGO;
  const navigationBackgroundStyle = createBackgroundStyle(navigation.style);
  const navigationTextStyle = createTextStyle(navigation.style);
  const navigationBodyStyle = createBodyTextStyle(navigation.style);
  const heroBackgroundStyle = createHeroBackgroundStyle(hero.style, hero.backgroundImage);
  const heroTextStyle = createTextStyle(hero.style);
  const heroBodyTextStyle = createBodyTextStyle(hero.style);
  const aboutBackgroundStyle = createBackgroundStyle(about.style);
  const aboutTextStyle = createTextStyle(about.style);
  const aboutBodyTextStyle = createBodyTextStyle(about.style);
  const menuBackgroundStyle = createBackgroundStyle(menuContent.style);
  const menuTextStyle = createTextStyle(menuContent.style);
  const menuBodyTextStyle = createBodyTextStyle(menuContent.style);
  const contactBackgroundStyle = createBackgroundStyle(contact.style);
  const contactTextStyle = createTextStyle(contact.style);
  const contactBodyTextStyle = createBodyTextStyle(contact.style);
  const findUsBackgroundStyle = createBackgroundStyle(findUs.style);
  const findUsTextStyle = createTextStyle(findUs.style);
  const findUsBodyTextStyle = createBodyTextStyle(findUs.style);
  const footerBackgroundStyle = createBackgroundStyle(footer.style);
  const footerTextStyle = createBodyTextStyle(footer.style);

  const elementRichText = siteContent.elementRichText ?? {};

  const getRichTextHtml = (key: EditableElementKey): string | null => {
    const entry = elementRichText[key];
    const html = entry?.html?.trim();
    return html && html.length > 0 ? html : null;
  };

  const renderRichTextElement = <T extends keyof JSX.IntrinsicElements>(
    key: EditableElementKey,
    Component: T,
    props: React.ComponentPropsWithoutRef<T>,
    fallback: string,
  ) => {
    const html = getRichTextHtml(key);
    if (html) {
      return React.createElement(Component, {
        ...props,
        dangerouslySetInnerHTML: { __html: html },
      });
    }
    return React.createElement(Component, props, fallback);
  };

  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState(() => getActiveCustomerOrder());
  const [activeReviewIndex, setActiveReviewIndex] = useState(0);
  const findUsMapQuery = [findUs.address, findUs.city].filter(Boolean).join(', ').trim();
  const encodedFindUsQuery = findUsMapQuery.length > 0 ? encodeURIComponent(findUsMapQuery) : '';
  const findUsMapUrl = encodedFindUsQuery
    ? `https://www.google.com/maps?q=${encodedFindUsQuery}`
    : 'https://www.google.com/maps';
  const findUsMapEmbedUrl = encodedFindUsQuery
    ? `https://www.google.com/maps?q=${encodedFindUsQuery}&output=embed`
    : 'about:blank';
  const activeOrderId = activeOrder?.orderId ?? null;
  const bestSellersToDisplay = bestSellers.slice(0, 6);
  const bestSellerCount = bestSellersToDisplay.length;
  const menuGridClassName = computeMenuGridClassName(bestSellerCount);
  const menuCardClassName = computeMenuCardClassName(bestSellerCount);
  const instagramReviews = INSTAGRAM_REVIEWS;
  const reviewCount = instagramReviews.length;
  const isSingleReview = reviewCount <= 1;
  const hasSupportContact = Boolean(contact.phone || contact.email);
  const contactPhoneHref = contact.phone ? `tel:${contact.phone.replace(/[^+\d]/g, '')}` : null;
  const contactEmailHref = contact.email ? `mailto:${contact.email}` : null;

  const handleNextReview = useCallback(() => {
    setActiveReviewIndex(index => (index + 1) % reviewCount);
  }, [reviewCount]);

  const handlePreviousReview = useCallback(() => {
    setActiveReviewIndex(index => (index - 1 + reviewCount) % reviewCount);
  }, [reviewCount]);

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
    if (reviewCount <= 1) {
      return;
    }
    const timer = window.setInterval(() => {
      setActiveReviewIndex(index => (index + 1) % reviewCount);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [reviewCount]);

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
      <header className="login-header" style={navigationBackgroundStyle}>
        <div className="layout-container login-header__inner" style={navigationTextStyle}>
          <div className="login-brand" style={navigationTextStyle}>
            <img
              src={brandLogo}
              alt={`Logo ${navigation.brand}`}
              className="login-brand__logo"
            />
            {renderRichTextElement(
              'navigation.brand',
              'span',
              {
                className: 'login-brand__name',
                style: navigationTextStyle,
              },
              navigation.brand,
            )}
          </div>
          <nav className="login-nav" aria-label="Navigation principale">
            {renderRichTextElement(
              'navigation.links.home',
              'a',
              {
                href: '#accueil',
                className: 'login-nav__link',
                style: navigationBodyStyle,
              },
              navigation.links.home,
            )}
            {renderRichTextElement(
              'navigation.links.about',
              'a',
              {
                href: '#apropos',
                className: 'login-nav__link',
                style: navigationBodyStyle,
              },
              navigation.links.about,
            )}
            {renderRichTextElement(
              'navigation.links.menu',
              'a',
              {
                href: '#menu',
                className: 'login-nav__link',
                style: navigationBodyStyle,
              },
              navigation.links.menu,
            )}
            {renderRichTextElement(
              'navigation.links.contact',
              'a',
              {
                href: '#contact',
                className: 'login-nav__link',
                style: navigationBodyStyle,
              },
              navigation.links.contact,
            )}
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="login-nav__staff-btn"
              aria-label={navigation.links.loginCta}
              style={{ fontFamily: navigation.style.fontFamily }}
            >
              <img src={staffLogo} alt="" className="login-nav__staff-logo" aria-hidden="true" />
            </button>
          </nav>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="login-header__menu"
            aria-label="Ouvrir le menu"
          >
            <Menu size={24} />
          </button>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="login-menu-overlay" role="dialog" aria-modal="true" style={navigationBackgroundStyle}>
          <button type="button" onClick={() => setMobileMenuOpen(false)} className="login-menu-overlay__close" aria-label="Fermer le menu">
            <X size={28} />
          </button>
          <nav className="login-menu-overlay__nav" aria-label="Navigation mobile" style={navigationTextStyle}>
            {renderRichTextElement(
              'navigation.links.home',
              'a',
              {
                href: '#accueil',
                onClick: () => setMobileMenuOpen(false),
                className: 'login-menu-overlay__link',
                style: navigationBodyStyle,
              },
              navigation.links.home,
            )}
            {renderRichTextElement(
              'navigation.links.about',
              'a',
              {
                href: '#apropos',
                onClick: () => setMobileMenuOpen(false),
                className: 'login-menu-overlay__link',
                style: navigationBodyStyle,
              },
              navigation.links.about,
            )}
            {renderRichTextElement(
              'navigation.links.menu',
              'a',
              {
                href: '#menu',
                onClick: () => setMobileMenuOpen(false),
                className: 'login-menu-overlay__link',
                style: navigationBodyStyle,
              },
              navigation.links.menu,
            )}
            {renderRichTextElement(
              'navigation.links.contact',
              'a',
              {
                href: '#contact',
                onClick: () => setMobileMenuOpen(false),
                className: 'login-menu-overlay__link',
                style: navigationBodyStyle,
              },
              navigation.links.contact,
            )}
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(true);
                setMobileMenuOpen(false);
              }}
              className="login-nav__staff-btn login-menu-overlay__staff-btn"
              aria-label={navigation.links.loginCta}
              style={{ fontFamily: navigation.style.fontFamily }}
            >
              <img src={staffLogo} alt="" className="login-nav__staff-logo" aria-hidden="true" />
            </button>
          </nav>
        </div>
      )}

      <main>
        <section id="accueil" className="section section-hero" style={{ ...heroBackgroundStyle, ...heroTextStyle }}>
          <div className="section-hero__inner">
            {activeOrderId ? (
              <CustomerOrderTracker orderId={activeOrderId} onNewOrderClick={handleNewOrder} variant="hero" />
            ) : (
              <div className="hero-content" style={heroTextStyle}>
                {renderRichTextElement(
                  'hero.title',
                  'h2',
                  {
                    className: 'hero-title',
                    style: heroTextStyle,
                  },
                  hero.title,
                )}
                {renderRichTextElement(
                  'hero.subtitle',
                  'p',
                  {
                    className: 'hero-subtitle',
                    style: heroBodyTextStyle,
                  },
                  hero.subtitle,
                )}
                <button
                  onClick={() => navigate('/commande-client')}
                  className="ui-btn ui-btn-accent hero-cta"
                  style={{ fontFamily: hero.style.fontFamily }}
                >
                  {renderRichTextElement(
                    'hero.ctaLabel',
                    'span',
                    {
                      className: 'inline-flex items-center justify-center',
                      style: heroBodyTextStyle,
                    },
                    hero.ctaLabel,
                  )}
                </button>
                {orderHistory.length > 0 && (
                  <div className="hero-history">
                    {renderRichTextElement(
                      'hero.historyTitle',
                      'p',
                      {
                        className: 'hero-history__title',
                        style: heroBodyTextStyle,
                      },
                      hero.historyTitle,
                    )}
                    <div className="hero-history__list">
                      {orderHistory.slice(0, 3).map(order => (
                        <div key={order.id} className="hero-history__item">
                          <div className="hero-history__meta">
                            <p className="hero-history__date" style={heroBodyTextStyle}>
                              Pedido del {new Date(order.date_creation).toLocaleDateString()}
                            </p>
                            <p className="hero-history__details" style={heroBodyTextStyle}>
                              {order.items.length} article(s) • {formatCurrencyCOP(order.total)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleQuickReorder(order.id)}
                            className="hero-history__cta"
                            style={{ fontFamily: hero.style.fontFamily }}
                          >
                            {renderRichTextElement(
                              'hero.reorderCtaLabel',
                              'span',
                              {
                                className: 'inline-flex items-center justify-center',
                                style: heroBodyTextStyle,
                              },
                              hero.reorderCtaLabel,
                            )}
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

        <section
          aria-labelledby="instagram-reviews-title"
          className="section section-reviews"
        >
          <div className="section-inner section-inner--wide">
            <div className="reviews-heading">
              <h2 id="instagram-reviews-title" className="section-title">
                Ils nous adorent sur Instagram
              </h2>
              <p className="reviews-subtitle">
                Des foodies de toute la Colombie partagent leur coup de cœur pour notre cuisine : ambiance solaire, service
                attentionné et assiettes qui brillent autant que leurs stories.
              </p>
            </div>
            <div className="reviews-carousel">
              <div
                className="reviews-track"
                style={{ transform: `translateX(-${activeReviewIndex * 100}%)` }}
              >
                {instagramReviews.map((review, index) => (
                  <article
                    key={review.id}
                    className="review-card"
                    aria-hidden={index !== activeReviewIndex}
                  >
                    <div className="review-card__content">
                      <header className="review-card__header">
                        <span className="review-card__avatar" aria-hidden="true">
                          <img src={review.avatarUrl} alt="" />
                        </span>
                        <div className="review-card__meta">
                          <p className="review-card__name">{review.name}</p>
                          <p className="review-card__handle">{review.handle} • {review.timeAgo}</p>
                        </div>
                        <span className="review-card__badge">Instagram</span>
                      </header>
                      <div className="review-card__stars" aria-label="Note 5 sur 5">
                        {Array.from({ length: 5 }).map((_, starIndex) => (
                          <Star key={starIndex} aria-hidden="true" />
                        ))}
                      </div>
                      <blockquote className="review-card__quote">
                        <Quote aria-hidden="true" className="review-card__quote-icon" />
                        <p>{review.message}</p>
                      </blockquote>
                      <div className="review-card__footer">
                        <div className="review-card__highlight">
                          <span className="review-card__story-ring" aria-hidden="true">
                            <img src={review.postImageUrl} alt="" />
                          </span>
                          <div>
                            <p className="review-card__highlight-title">{review.highlight}</p>
                            <p className="review-card__highlight-caption">5 étoiles assurées ✨</p>
                          </div>
                        </div>
                        <p className="review-card__location">{review.location}</p>
                      </div>
                    </div>
                    <div className="review-card__media">
                      <span className="review-card__media-frame">
                        <img src={review.postImageUrl} alt={review.postImageAlt} />
                      </span>
                    </div>
                  </article>
                ))}
              </div>
              {!isSingleReview && (
                <div className="reviews-controls">
                  <button
                    type="button"
                    className="reviews-control"
                    onClick={handlePreviousReview}
                    aria-label="Voir l'avis précédent"
                  >
                    <ChevronLeft aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="reviews-control"
                    onClick={handleNextReview}
                    aria-label="Voir l'avis suivant"
                  >
                    <ChevronRight aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
            {reviewCount > 1 && (
              <div className="reviews-pagination" role="tablist" aria-label="Avis Instagram">
                {instagramReviews.map((review, index) => (
                  <button
                    key={review.id}
                    type="button"
                    className={`reviews-dot${index === activeReviewIndex ? ' reviews-dot--active' : ''}`}
                    onClick={() => setActiveReviewIndex(index)}
                    aria-label={`Afficher l'avis de ${review.name}`}
                    aria-current={index === activeReviewIndex}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <section
          id="apropos"
          className="section section-surface"
          style={{ ...aboutBackgroundStyle, ...aboutTextStyle }}
        >
          <div className="section-inner section-inner--center" style={aboutTextStyle}>
            {renderRichTextElement(
              'about.title',
              'h2',
              {
                className: 'section-title',
                style: aboutTextStyle,
              },
              about.title,
            )}
            {renderRichTextElement(
              'about.description',
              'p',
              {
                className: 'section-text section-text--muted',
                style: aboutBodyTextStyle,
              },
              about.description,
            )}
            {about.image && (
              <img
                src={about.image}
                alt={about.title}
                className="mt-6 h-64 w-full rounded-xl object-cover shadow-lg"
              />
            )}
          </div>
        </section>

        <section
          id="menu"
          className="section section-muted"
          style={{ ...menuBackgroundStyle, ...menuTextStyle }}
        >
          <div className="section-inner section-inner--wide section-inner--center" style={menuTextStyle}>
            {renderRichTextElement(
              'menu.title',
              'h2',
              {
                className: 'section-title',
                style: menuTextStyle,
              },
              menuContent.title,
            )}
            {menuContent.image && (
              <img
                src={menuContent.image}
                alt={menuContent.title}
                className="mb-8 h-64 w-full rounded-xl object-cover shadow-lg"
              />
            )}
            {menuLoading ? (
              renderRichTextElement(
                'menu.loadingLabel',
                'p',
                {
                  className: 'section-text section-text--muted',
                  style: menuBodyTextStyle,
                },
                menuContent.loadingLabel,
              )
            ) : (
              <div className={menuGridClassName}>
                {bestSellersToDisplay.map(product => (
                  <article key={product.id} className={menuCardClassName}>
                    <img src={product.image} alt={product.nom_produit} className="menu-card__media" />
                    <div className="menu-card__body">
                      <h3 className="menu-card__title" style={menuTextStyle}>
                        {product.nom_produit}
                      </h3>
                      <p className="menu-card__description" style={menuBodyTextStyle}>
                        {product.description}
                      </p>
                      <p className="menu-card__price" style={menuBodyTextStyle}>
                        {formatCurrencyCOP(product.prix_vente)}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
            <div className="section-actions">
              <button
                onClick={() => navigate('/commande-client')}
                className="ui-btn ui-btn-primary hero-cta"
                style={{ fontFamily: menuContent.style.fontFamily }}
              >
                {renderRichTextElement(
                  'menu.ctaLabel',
                  'span',
                  {
                    className: 'inline-flex items-center justify-center',
                    style: menuBodyTextStyle,
                  },
                  menuContent.ctaLabel,
                )}
              </button>
            </div>
          </div>
        </section>

        <section
          id="contact"
          className="section section-surface"
          style={{ ...contactBackgroundStyle, ...contactTextStyle }}
        >
          <div className="section-inner section-inner--wide section-inner--center" style={contactTextStyle}>
            {renderRichTextElement(
              'contact.title',
              'h2',
              {
                className: 'section-title',
                style: contactTextStyle,
              },
              contact.title,
            )}
            {contact.image && (
              <img
                src={contact.image}
                alt={contact.title}
                className="mb-8 h-64 w-full rounded-xl object-cover shadow-lg"
              />
            )}
            <div className="contact-grid">
              <div className="contact-card" style={contactTextStyle}>
                <MapPin className="contact-card__icon" />
                {renderRichTextElement(
                  'contact.addressLabel',
                  'h3',
                  {
                    className: 'contact-card__title',
                    style: contactTextStyle,
                  },
                  contact.addressLabel,
                )}
                {renderRichTextElement(
                  'contact.address',
                  'p',
                  {
                    className: 'contact-card__text',
                    style: contactBodyTextStyle,
                  },
                  contact.address,
                )}
              </div>
              <div className="contact-card" style={contactTextStyle}>
                <Phone className="contact-card__icon" />
                {renderRichTextElement(
                  'contact.phoneLabel',
                  'h3',
                  {
                    className: 'contact-card__title',
                    style: contactTextStyle,
                  },
                  contact.phoneLabel,
                )}
                {renderRichTextElement(
                  'contact.phone',
                  'p',
                  {
                    className: 'contact-card__text',
                    style: contactBodyTextStyle,
                  },
                  contact.phone,
                )}
              </div>
              <div className="contact-card" style={contactTextStyle}>
                <Mail className="contact-card__icon" />
                {renderRichTextElement(
                  'contact.emailLabel',
                  'h3',
                  {
                    className: 'contact-card__title',
                    style: contactTextStyle,
                  },
                  contact.emailLabel,
                )}
                {renderRichTextElement(
                  'contact.email',
                  'p',
                  {
                    className: 'contact-card__text',
                    style: contactBodyTextStyle,
                  },
                  contact.email,
                )}
              </div>
            </div>
          </div>
        </section>

        <section
          id="find-us"
          className="section section-surface"
          style={{ ...findUsBackgroundStyle, ...findUsTextStyle }}
        >
          <div className="section-inner section-inner--wide find-us-grid" style={findUsTextStyle}>
            <div className="find-us-panel" style={findUsTextStyle}>
              {renderRichTextElement(
                'findUs.title',
                'h2',
                {
                  className: 'section-title',
                  style: findUsTextStyle,
                },
                findUs.title,
              )}
              <div className="find-us-details">
                <div className="find-us-detail" style={findUsTextStyle}>
                  <MapPin className="find-us-detail__icon" aria-hidden="true" />
                  <div>
                    {renderRichTextElement(
                      'findUs.addressLabel',
                      'h3',
                      {
                        className: 'find-us-detail__title',
                        style: findUsTextStyle,
                      },
                      findUs.addressLabel,
                    )}
                    {renderRichTextElement(
                      'findUs.address',
                      'p',
                      {
                        className: 'find-us-detail__text',
                        style: findUsBodyTextStyle,
                      },
                      findUs.address,
                    )}
                  </div>
                </div>
                <div className="find-us-detail" style={findUsTextStyle}>
                  <MapPin className="find-us-detail__icon" aria-hidden="true" />
                  <div>
                    {renderRichTextElement(
                      'findUs.cityLabel',
                      'h3',
                      {
                        className: 'find-us-detail__title',
                        style: findUsTextStyle,
                      },
                      findUs.cityLabel,
                    )}
                    {renderRichTextElement(
                      'findUs.city',
                      'p',
                      {
                        className: 'find-us-detail__text',
                        style: findUsBodyTextStyle,
                      },
                      findUs.city,
                    )}
                  </div>
                </div>
                <div className="find-us-detail" style={findUsTextStyle}>
                  <Clock className="find-us-detail__icon" aria-hidden="true" />
                  <div>
                    {renderRichTextElement(
                      'findUs.hoursLabel',
                      'h3',
                      {
                        className: 'find-us-detail__title',
                        style: findUsTextStyle,
                      },
                      findUs.hoursLabel,
                    )}
                    {renderRichTextElement(
                      'findUs.hours',
                      'p',
                      {
                        className: 'find-us-detail__text',
                        style: findUsBodyTextStyle,
                      },
                      findUs.hours,
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="find-us-map" style={findUsTextStyle}>
              {encodedFindUsQuery ? (
                <div className="find-us-map__frame">
                  <iframe
                    title={`Carte Google Maps pour ${findUsMapQuery}`}
                    src={findUsMapEmbedUrl}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                  <a
                    className="find-us-map__link"
                    href={findUsMapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {renderRichTextElement(
                      'findUs.mapLabel',
                      'span',
                      {
                        className: 'find-us-map__label',
                        style: findUsBodyTextStyle,
                      },
                      findUs.mapLabel,
                    )}
                  </a>
                </div>
              ) : (
                <div className="find-us-map__placeholder">
                  {renderRichTextElement(
                    'findUs.mapLabel',
                    'span',
                    {
                      className: 'find-us-map__label',
                      style: findUsBodyTextStyle,
                    },
                    findUs.mapLabel,
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer" style={{ ...footerBackgroundStyle, ...footerTextStyle }}>
        <div className="layout-container site-footer__inner" style={footerTextStyle}>
          <p style={footerTextStyle}>
            &copy; {new Date().getFullYear()} {navigation.brand}.{' '}
            {renderRichTextElement(
              'footer.text',
              'span',
              {
                style: footerTextStyle,
              },
              footer.text,
            )}
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
        size="lg"
      >
        <div className="login-modal">
          <header className="login-modal__header">
            <div className="login-modal__badge" aria-hidden="true">
              <img
                src={staffLogo}
                alt={navigation.brand ? `Logo ${navigation.brand}` : 'Logo du personnel'}
                loading="lazy"
              />
            </div>
            <div className="login-modal__intro">
              <span className="login-modal__eyebrow">
                <ShieldCheck size={16} aria-hidden="true" />
                Espace sécurisé
              </span>
              <p id="staff-pin-help" className="login-modal__subtitle">
                Entrez votre code PIN à 6 chiffres pour accéder au tableau de bord du personnel.
              </p>
            </div>
          </header>
          <form
            onSubmit={handleFormSubmit}
            className="login-modal__form"
            aria-describedby={`staff-pin-help${hasSupportContact ? ' login-support-hint' : ''}`}
          >
            <div className="login-modal__panel">
              <PinInput
                ref={pinInputRef}
                pin={pin}
                onPinChange={setPin}
                pinLength={6}
                describedBy="staff-pin-help"
              />
              <p className="login-modal__error" role="alert" aria-live="assertive">
                {error}
              </p>
              <div className="login-modal__actions">
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
            {hasSupportContact && (
              <div className="login-modal__support" id="login-support-hint">
                <h4>Besoin d'aide ?</h4>
                <p>Contactez un manager pour récupérer ou réinitialiser votre code.</p>
                <ul className="login-modal__support-list">
                  {contact.phone && (
                    <li className="login-modal__support-item">
                      <span className="login-modal__support-icon" aria-hidden="true">
                        <Phone size={18} />
                      </span>
                      <div>
                        <p className="login-modal__support-label">{contact.phoneLabel}</p>
                        <a href={contactPhoneHref ?? undefined} className="login-modal__support-link">
                          {contact.phone}
                        </a>
                      </div>
                    </li>
                  )}
                  {contact.email && (
                    <li className="login-modal__support-item">
                      <span className="login-modal__support-icon" aria-hidden="true">
                        <Mail size={18} />
                      </span>
                      <div>
                        <p className="login-modal__support-label">{contact.emailLabel}</p>
                        <a href={contactEmailHref ?? undefined} className="login-modal__support-link">
                          {contact.email}
                        </a>
                      </div>
                    </li>
                  )}
                </ul>
              </div>
            )}
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default Login;