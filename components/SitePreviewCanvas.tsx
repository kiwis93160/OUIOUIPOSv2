import React from 'react';
import { ChevronLeft, ChevronRight, Clock, Edit2, Mail, MapPin, Quote, Star } from 'lucide-react';
import { EditableElementKey, EditableZoneKey, Product, SiteContent } from '../types';
import useCustomFonts from '../hooks/useCustomFonts';
import {
  createBackgroundStyle,
  createBodyTextStyle,
  createElementBackgroundStyle,
  createElementBodyTextStyle,
  createElementTextStyle,
  createHeroBackgroundStyle,
  createTextStyle,
} from '../utils/siteStyleHelpers';
import { formatCurrencyCOP } from '../utils/formatIntegerAmount';

const DEFAULT_BRAND_LOGO = '/logo-brand.svg';

export const resolveZoneFromElement = (element: EditableElementKey): EditableZoneKey => {
  if (element.startsWith('navigation.')) {
    return 'navigation';
  }
  if (element.startsWith('hero.')) {
    return 'hero';
  }
  if (element.startsWith('about.')) {
    return 'about';
  }
  if (element.startsWith('menu.')) {
    return 'menu';
  }
  if (element.startsWith('instagramReviews.')) {
    return 'instagramReviews';
  }
  if (element.startsWith('findUs.')) {
    return 'findUs';
  }
  if (element.startsWith('footer.')) {
    return 'footer';
  }

  throw new Error(`Zone introuvable pour l'élément modifiable "${element}"`);
};

interface SitePreviewCanvasProps {
  content: SiteContent;
  bestSellerProducts: Product[];
  onEdit: (
    element: EditableElementKey,
    meta: { zone: EditableZoneKey; anchor: DOMRect | DOMRectReadOnly | null },
  ) => void;
  activeZone?: EditableZoneKey | null;
  showEditButtons?: boolean;
}

interface EditableElementProps {
  id: EditableElementKey;
  onEdit: SitePreviewCanvasProps['onEdit'];
  children: React.ReactNode;
  label: string;
  className?: string;
  buttonClassName?: string;
  as?: keyof JSX.IntrinsicElements;
}

const EditButtonVisibilityContext = React.createContext(true);

interface SectionCardProps {
  children: React.ReactNode;
  className?: string;
  zone: EditableZoneKey;
  activeZone?: EditableZoneKey | null;
}

const EditableElement: React.FC<EditableElementProps> = ({
  id,
  onEdit,
  children,
  label,
  className,
  buttonClassName,
  as: Component = 'div',
}) => {
  const containerClasses = ['group relative', className].filter(Boolean).join(' ');
  const showButtons = React.useContext(EditButtonVisibilityContext);

  if (!showButtons) {
    return <Component className={containerClasses}>{children}</Component>;
  }
  const buttonClasses = [
    'absolute z-30 flex h-7 w-7 items-center justify-center rounded-full bg-brand-primary text-white shadow-sm transition-opacity duration-200',
    'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary',
    buttonClassName ?? 'right-2 top-2',
  ]
    .filter(Boolean)
    .join(' ');

  const handleEdit = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const zone = resolveZoneFromElement(id);
    const buttonRect = event.currentTarget.getBoundingClientRect();
    const anchorElement =
      (event.currentTarget.closest(`[data-zone="${zone}"]`) as HTMLElement | null) ??
      (event.currentTarget.parentElement as HTMLElement | null);
    const fallbackRect = anchorElement?.getBoundingClientRect() ?? null;
    onEdit(id, { zone, anchor: buttonRect ?? fallbackRect });
  };

  return (
    <Component className={containerClasses}>
      <button
        type="button"
        onClick={handleEdit}
        className={buttonClasses}
        aria-label={label}
        data-element-id={id}
      >
        <Edit2 className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      {children}
    </Component>
  );
};

const SectionCard: React.FC<SectionCardProps> = ({ children, className, zone, activeZone }) => {
  const isActive = activeZone === zone;
  const classes = [
    'relative overflow-hidden rounded-3xl border bg-white shadow-sm transition-all',
    isActive ? 'border-brand-primary/70 shadow-brand-primary/20 ring-2 ring-brand-primary/10' : 'border-gray-200',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} data-zone={zone}>
      {children}
    </div>
  );
};

const SitePreviewCanvas: React.FC<SitePreviewCanvasProps> = ({
  content,
  bestSellerProducts,
  onEdit,
  activeZone,
  showEditButtons = true,
}) => {
  const navigationBackgroundStyle = createBackgroundStyle(content.navigation.style);
  const navigationTextStyle = createTextStyle(content.navigation.style);
  const navigationBodyStyle = createBodyTextStyle(content.navigation.style);
  const brandLogo = content.navigation.brandLogo ?? DEFAULT_BRAND_LOGO;
  const staffTriggerLogo =
    content.navigation.staffLogo ?? content.navigation.brandLogo ?? DEFAULT_BRAND_LOGO;
  const heroBackgroundStyle = createHeroBackgroundStyle(content.hero.style, content.hero.backgroundImage);
  const heroTextStyle = createTextStyle(content.hero.style);
  const heroBodyTextStyle = createBodyTextStyle(content.hero.style);
  const aboutBackgroundStyle = createBackgroundStyle(content.about.style);
  const aboutTextStyle = createTextStyle(content.about.style);
  const aboutBodyTextStyle = createBodyTextStyle(content.about.style);
  const menuBackgroundStyle = createBackgroundStyle(content.menu.style);
  const menuTextStyle = createTextStyle(content.menu.style);
  const menuBodyTextStyle = createBodyTextStyle(content.menu.style);
  const instagramReviewsBackgroundStyle = createBackgroundStyle(content.instagramReviews.style);
  const instagramReviewsTextStyle = createTextStyle(content.instagramReviews.style);
  const findUsBackgroundStyle = createBackgroundStyle(content.findUs.style);
  const findUsTextStyle = createTextStyle(content.findUs.style);
  const footerBackgroundStyle = createBackgroundStyle(content.footer.style);
  const footerTextStyle = createBodyTextStyle(content.footer.style);

  useCustomFonts(content.assets.library);

  const elementStyles = content.elementStyles ?? {};
  const elementRichText = content.elementRichText ?? {};

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

  const zoneStyleMap: Record<EditableZoneKey, typeof content.navigation.style> = {
    navigation: content.navigation.style,
    hero: content.hero.style,
    about: content.about.style,
    menu: content.menu.style,
    instagramReviews: content.instagramReviews.style,
    findUs: content.findUs.style,
    footer: content.footer.style,
  };

  const getElementStyle = (key: EditableElementKey) => elementStyles[key];

  const getElementTextStyle = (key: EditableElementKey) => {
    const zone = resolveZoneFromElement(key);
    return createElementTextStyle(zoneStyleMap[zone], getElementStyle(key));
  };

  const getElementBodyTextStyle = (key: EditableElementKey) => {
    const zone = resolveZoneFromElement(key);
    return createElementBodyTextStyle(zoneStyleMap[zone], getElementStyle(key));
  };

  const getElementBackgroundStyle = (key: EditableElementKey) => {
    const zone = resolveZoneFromElement(key);
    return createElementBackgroundStyle(zoneStyleMap[zone], getElementStyle(key));
  };

  const findUsMapQuery = content.findUs.address.trim();
  const encodedFindUsQuery = findUsMapQuery.length > 0 ? encodeURIComponent(findUsMapQuery) : '';
  const findUsMapUrl = encodedFindUsQuery
    ? `https://www.google.com/maps?q=${encodedFindUsQuery}`
    : 'https://www.google.com/maps';
  const findUsMapEmbedUrl = encodedFindUsQuery
    ? `https://www.google.com/maps?q=${encodedFindUsQuery}&output=embed`
    : 'about:blank';

  return (
    <EditButtonVisibilityContext.Provider value={showEditButtons}>
      <div className="space-y-6 rounded-[2.5rem] border border-gray-200 bg-slate-50 p-6 shadow-inner">
      <SectionCard zone="navigation" activeZone={activeZone}>
        <EditableElement
          id="navigation.style.background"
          label="Modifier le fond de la navigation"
          onEdit={onEdit}
          className="block"
          buttonClassName="right-4 top-4"
        >
          <header className="login-header" style={navigationBackgroundStyle}>
            <div className="layout-container login-header__inner" style={navigationTextStyle}>
              <div className="login-brand" style={navigationTextStyle}>
                <EditableElement
                  id="navigation.brandLogo"
                  label="Modifier le logo principal"
                  onEdit={onEdit}
                  as="span"
                  className="inline-flex items-center"
                >
                  <img
                    src={brandLogo}
                    alt={`Logo ${content.navigation.brand}`}
                    className="login-brand__logo"
                  />
                </EditableElement>
                <EditableElement
                  id="navigation.brand"
                  label="Modifier le nom de la marque"
                  onEdit={onEdit}
                  as="span"
                  className="ml-3 inline-flex items-center"
                  buttonClassName="-right-3 -top-3"
                >
                  {renderRichTextElement(
                    'navigation.brand',
                    'span',
                    {
                      className: 'login-brand__name',
                      style: getElementTextStyle('navigation.brand'),
                    },
                    content.navigation.brand,
                  )}
                </EditableElement>
              </div>
              <nav className="login-nav" aria-label="Navigation principale">
                <EditableElement
                  id="navigation.links.home"
                  label="Modifier le lien Accueil"
                  onEdit={onEdit}
                  as="span"
                  className="inline-flex"
                  buttonClassName="-right-2 -top-2"
                >
                  {renderRichTextElement(
                    'navigation.links.home',
                    'span',
                    {
                      className: 'login-nav__link',
                      style: getElementBodyTextStyle('navigation.links.home'),
                    },
                    content.navigation.links.home,
                  )}
                </EditableElement>
                <EditableElement
                  id="navigation.links.about"
                  label="Modifier le lien À propos"
                  onEdit={onEdit}
                  as="span"
                  className="inline-flex"
                  buttonClassName="-right-2 -top-2"
                >
                  {renderRichTextElement(
                    'navigation.links.about',
                    'span',
                    {
                      className: 'login-nav__link',
                      style: getElementBodyTextStyle('navigation.links.about'),
                    },
                    content.navigation.links.about,
                  )}
                </EditableElement>
                <EditableElement
                  id="navigation.links.menu"
                  label="Modifier le lien Menu"
                  onEdit={onEdit}
                  as="span"
                  className="inline-flex"
                  buttonClassName="-right-2 -top-2"
                >
                  {renderRichTextElement(
                    'navigation.links.menu',
                    'span',
                    {
                      className: 'login-nav__link',
                      style: getElementBodyTextStyle('navigation.links.menu'),
                    },
                    content.navigation.links.menu,
                  )}
                </EditableElement>
                <EditableElement
                  id="navigation.links.loginCta"
                  label="Modifier le bouton personnel"
                  onEdit={onEdit}
                  as="span"
                  className="inline-flex"
                  buttonClassName="-right-2 -top-2"
                >
                  <div
                    className="login-nav__staff-btn"
                    aria-label={content.navigation.links.loginCta}
                    role="img"
                  >
                    <EditableElement
                      id="navigation.staffLogo"
                      label="Modifier le logo d'accès staff"
                      onEdit={onEdit}
                      as="span"
                      className="inline-flex"
                      buttonClassName="-right-2 -top-2"
                    >
                      <img src={staffTriggerLogo} alt="" className="login-brand__logo" aria-hidden="true" />
                    </EditableElement>
                  </div>
                </EditableElement>
              </nav>
            </div>
          </header>
        </EditableElement>
      </SectionCard>

      <SectionCard zone="hero" activeZone={activeZone}>
        <EditableElement
          id="hero.backgroundImage"
          label="Modifier le visuel de fond du hero"
          onEdit={onEdit}
          className="block"
          buttonClassName="right-4 top-4"
        >
          <section className="section section-hero" style={{ ...heroBackgroundStyle, ...heroTextStyle }}>
            <div className="section-hero__inner">
              <div className="hero-content" style={heroTextStyle}>
                <EditableElement
                  id="hero.title"
                  label="Modifier le titre du hero"
                  onEdit={onEdit}
                  className="block"
                  buttonClassName="right-0 -top-3"
                >
                  {renderRichTextElement(
                    'hero.title',
                    'h2',
                    {
                      className: 'hero-title',
                      style: getElementTextStyle('hero.title'),
                    },
                    content.hero.title,
                  )}
                </EditableElement>
                <EditableElement
                  id="hero.subtitle"
                  label="Modifier le sous-titre du hero"
                  onEdit={onEdit}
                  className="mt-4 block"
                  buttonClassName="right-0 -top-3"
                >
                  {renderRichTextElement(
                    'hero.subtitle',
                    'p',
                    {
                      className: 'hero-subtitle',
                      style: getElementBodyTextStyle('hero.subtitle'),
                    },
                    content.hero.subtitle,
                  )}
                </EditableElement>
                <EditableElement
                  id="hero.ctaLabel"
                  label="Modifier le texte du bouton principal"
                  onEdit={onEdit}
                  className="mt-6 inline-flex"
                  buttonClassName="-right-3 -top-3"
                >
                  <button
                    type="button"
                    className="ui-btn ui-btn-accent hero-cta"
                    style={{
                      ...getElementBodyTextStyle('hero.ctaLabel'),
                      ...getElementBackgroundStyle('hero.ctaLabel'),
                    }}
                    disabled
                  >
                    {renderRichTextElement(
                      'hero.ctaLabel',
                      'span',
                      {
                        className: 'inline-flex items-center justify-center',
                        style: getElementBodyTextStyle('hero.ctaLabel'),
                      },
                      content.hero.ctaLabel,
                    )}
                  </button>
                </EditableElement>
                <div className="hero-history mt-6">
                <EditableElement
                  id="hero.historyTitle"
                  label="Modifier le titre de l'historique"
                  onEdit={onEdit}
                  className="block"
                  buttonClassName="right-0 -top-3"
                >
                  {renderRichTextElement(
                    'hero.historyTitle',
                    'p',
                    {
                      className: 'hero-history__title',
                      style: getElementBodyTextStyle('hero.historyTitle'),
                    },
                    content.hero.historyTitle,
                  )}
                </EditableElement>
                <EditableElement
                  id="hero.reorderCtaLabel"
                  label="Modifier le bouton de réassort"
                  onEdit={onEdit}
                  className="hero-history__list"
                  buttonClassName="right-2 top-2"
                >
                  <>
                    {[0, 1, 2].map(index => (
                      <div key={index} className="hero-history__item">
                        <div className="hero-history__meta">
                          <p className="hero-history__date" style={heroBodyTextStyle}>
                            Pedido del 12/03/2024
                          </p>
                          <p className="hero-history__details" style={heroBodyTextStyle}>
                            2 article(s) • {formatCurrencyCOP(32000)}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="hero-history__cta"
                          style={{
                            ...getElementBodyTextStyle('hero.reorderCtaLabel'),
                            ...getElementBackgroundStyle('hero.reorderCtaLabel'),
                          }}
                          disabled
                        >
                          {renderRichTextElement(
                            'hero.reorderCtaLabel',
                            'span',
                            {
                              className: 'inline-flex items-center justify-center',
                              style: getElementBodyTextStyle('hero.reorderCtaLabel'),
                            },
                            content.hero.reorderCtaLabel,
                          )}
                        </button>
                      </div>
                    ))}
                  </>
                </EditableElement>
                </div>
              </div>
            </div>
          </section>
        </EditableElement>
      </SectionCard>

      <SectionCard zone="about" activeZone={activeZone}>
        <EditableElement
          id="about.style.background"
          label="Modifier le fond de la section À propos"
          onEdit={onEdit}
          className="block"
          buttonClassName="right-4 top-4"
        >
          <section className="section section-surface" style={{ ...aboutBackgroundStyle, ...aboutTextStyle }}>
            <div className="section-inner section-inner--center" style={aboutTextStyle}>
              <EditableElement
                id="about.title"
                label="Modifier le titre À propos"
                onEdit={onEdit}
                className="block"
                buttonClassName="right-0 -top-3"
              >
                {renderRichTextElement(
                  'about.title',
                  'h2',
                  {
                    className: 'section-title',
                    style: getElementTextStyle('about.title'),
                  },
                  content.about.title,
                )}
              </EditableElement>
              <EditableElement
                id="about.description"
                label="Modifier la description À propos"
                onEdit={onEdit}
                className="mt-4 block"
                buttonClassName="right-0 -top-3"
              >
                {renderRichTextElement(
                  'about.description',
                  'p',
                  {
                    className: 'section-text section-text--muted',
                    style: getElementBodyTextStyle('about.description'),
                  },
                  content.about.description,
                )}
              </EditableElement>
              {content.about.image && (
                <EditableElement
                  id="about.image"
                  label="Modifier l'image À propos"
                  onEdit={onEdit}
                  className="mt-6 block"
                  buttonClassName="right-4 top-4"
                >
                  <img
                    src={content.about.image}
                    alt={content.about.title}
                    className="h-64 w-full rounded-xl object-cover shadow-lg"
                  />
                </EditableElement>
              )}
            </div>
          </section>
        </EditableElement>
      </SectionCard>

      <SectionCard zone="menu" activeZone={activeZone}>
        <EditableElement
          id="menu.style.background"
          label="Modifier le fond de la section Menu"
          onEdit={onEdit}
          className="block"
          buttonClassName="right-4 top-4"
        >
          <section className="section section-muted" style={{ ...menuBackgroundStyle, ...menuTextStyle }}>
            <div className="section-inner section-inner--wide section-inner--center" style={menuTextStyle}>
              <EditableElement
                id="menu.title"
                label="Modifier le titre du menu"
                onEdit={onEdit}
                className="block"
                buttonClassName="right-0 -top-3"
              >
                {renderRichTextElement(
                  'menu.title',
                  'h2',
                  {
                    className: 'section-title',
                    style: getElementTextStyle('menu.title'),
                  },
                  content.menu.title,
                )}
              </EditableElement>
              {content.menu.image && (
                <EditableElement
                  id="menu.image"
                  label="Modifier l'image du menu"
                  onEdit={onEdit}
                  className="mb-8 block"
                  buttonClassName="right-4 top-4"
                >
                  <img
                    src={content.menu.image}
                    alt={content.menu.title}
                    className="h-64 w-full rounded-xl object-cover shadow-lg"
                  />
                </EditableElement>
              )}
              <div className="menu-grid">
                {bestSellerProducts.length > 0 ? (
                  bestSellerProducts.map(product => {
                    const hasImage = Boolean(product.image);
                    return (
                      <article key={product.id} className="ui-card menu-card">
                        {hasImage ? (
                          <img
                            src={product.image}
                            alt={product.nom_produit}
                            className="h-40 w-full rounded-t-xl object-cover"
                          />
                        ) : (
                          <div className="h-40 w-full rounded-t-xl bg-gradient-to-br from-orange-200 via-amber-100 to-orange-50" />
                        )}
                        <div className="menu-card__body">
                          <h3 className="menu-card__title" style={menuTextStyle}>
                            {product.nom_produit}
                          </h3>
                          {product.description && (
                            <p className="menu-card__description" style={menuBodyTextStyle}>
                              {product.description}
                            </p>
                          )}
                          <p className="menu-card__price" style={menuBodyTextStyle}>
                            {formatCurrencyCOP(product.prix_vente)}
                          </p>
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white/70 p-6 text-center">
                    <p className="text-sm text-slate-500" style={menuBodyTextStyle}>
                      Aucun best seller sélectionné pour le moment.
                    </p>
                  </div>
                )}
              </div>
              <EditableElement
                id="menu.ctaLabel"
                label="Modifier le bouton de commande"
                onEdit={onEdit}
                className="section-actions mt-8"
                buttonClassName="right-2 top-2"
              >
                <div className="section-actions">
                  <button
                    type="button"
                    className="ui-btn ui-btn-primary hero-cta"
                    style={{
                      ...getElementBodyTextStyle('menu.ctaLabel'),
                      ...getElementBackgroundStyle('menu.ctaLabel'),
                    }}
                    disabled
                  >
                    {renderRichTextElement(
                      'menu.ctaLabel',
                      'span',
                      {
                        className: 'inline-flex items-center justify-center',
                        style: getElementBodyTextStyle('menu.ctaLabel'),
                      },
                      content.menu.ctaLabel,
                    )}
                  </button>
                  <EditableElement
                    id="menu.loadingLabel"
                    label="Modifier le texte de chargement"
                    onEdit={onEdit}
                    className="ml-4 inline-flex"
                    buttonClassName="-right-3 -top-3"
                    as="span"
                  >
                    {renderRichTextElement(
                      'menu.loadingLabel',
                      'p',
                      {
                        className: 'section-text section-text--muted',
                        style: getElementBodyTextStyle('menu.loadingLabel'),
                      },
                      content.menu.loadingLabel,
                    )}
                  </EditableElement>
                </div>
              </EditableElement>
            </div>
          </section>
        </EditableElement>
      </SectionCard>

      <SectionCard zone="instagramReviews" activeZone={activeZone}>
        <EditableElement
          id="instagramReviews.style.background"
          label="Modifier le fond de la section Avis Instagram"
          onEdit={onEdit}
          className="block"
          buttonClassName="right-4 top-4"
        >
          <section
            className="section section-reviews"
            style={{ ...instagramReviewsBackgroundStyle, ...instagramReviewsTextStyle }}
          >
            <div className="section-inner section-inner--wide">
              <div className="reviews-heading">
                <EditableElement
                  id="instagramReviews.title"
                  label="Modifier le titre des avis"
                  onEdit={onEdit}
                  className="block"
                  buttonClassName="right-0 -top-3"
                >
                  {renderRichTextElement(
                    'instagramReviews.title',
                    'h2',
                    {
                      className: 'section-title',
                      style: getElementTextStyle('instagramReviews.title'),
                    },
                    content.instagramReviews.title,
                  )}
                </EditableElement>
                <EditableElement
                  id="instagramReviews.subtitle"
                  label="Modifier le sous-titre des avis"
                  onEdit={onEdit}
                  className="mt-3 block"
                  buttonClassName="right-0 -top-3"
                >
                  {renderRichTextElement(
                    'instagramReviews.subtitle',
                    'p',
                    {
                      className: 'reviews-subtitle',
                      style: getElementBodyTextStyle('instagramReviews.subtitle'),
                    },
                    content.instagramReviews.subtitle,
                  )}
                </EditableElement>
              </div>
              <div className="reviews-carousel">
                <div className="reviews-track">
                  <article className="review-card" aria-hidden={false}>
                    <div className="review-card__content">
                      <header className="review-card__header">
                        <span className="review-card__avatar" aria-hidden="true">
                          <img src="https://i.pravatar.cc/96?img=12" alt="" />
                        </span>
                        <div className="review-card__meta">
                          <p className="review-card__name">Camila G.</p>
                          <p className="review-card__handle">@camilafoodie • il y a 2 jours</p>
                        </div>
                        <span className="review-card__badge">Instagram</span>
                      </header>
                      <div className="review-card__stars" aria-label="Note 5 sur 5">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star key={index} aria-hidden="true" />
                        ))}
                      </div>
                      <blockquote className="review-card__quote">
                        <Quote aria-hidden="true" className="review-card__quote-icon" />
                        <p>
                          "Des portions généreuses et des sauces incroyables. On sent que tout est préparé avec passion, vivement la prochaine commande !"
                        </p>
                      </blockquote>
                      <div className="review-card__footer">
                        <div className="review-card__highlight">
                          <span className="review-card__story-ring" aria-hidden="true">
                            <img
                              src={content.instagramReviews.image ?? 'https://picsum.photos/seed/reviewpreview/160/160'}
                              alt=""
                            />
                          </span>
                          <div>
                            <p className="review-card__highlight-title">Story highlight</p>
                            <p className="review-card__highlight-caption">5 étoiles assurées ✨</p>
                          </div>
                        </div>
                        <p className="review-card__location">Bogotá, CO</p>
                      </div>
                    </div>
                    <div className="review-card__media">
                      <span className="review-card__media-frame">
                        <img
                          src={content.instagramReviews.image ?? 'https://picsum.photos/seed/reviewpreview/320/320'}
                          alt={content.instagramReviews.title}
                        />
                      </span>
                    </div>
                  </article>
                </div>
                <div className="reviews-controls" aria-hidden="true">
                  <button type="button" className="reviews-control" disabled>
                    <ChevronLeft aria-hidden="true" />
                  </button>
                  <button type="button" className="reviews-control" disabled>
                    <ChevronRight aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </section>
        </EditableElement>
      </SectionCard>

      <SectionCard zone="findUs" activeZone={activeZone}>
        <EditableElement
          id="findUs.style.background"
          label="Modifier le fond de la section Encuéntranos"
          onEdit={onEdit}
          className="block"
          buttonClassName="right-4 top-4"
        >
          <section className="section section-surface" style={{ ...findUsBackgroundStyle, ...findUsTextStyle }}>
            <div className="find-us-grid" style={findUsTextStyle}>
              <div className="find-us-panel" style={findUsTextStyle}>
                <EditableElement
                  id="findUs.title"
                  label="Modifier le titre Encuéntranos"
                  onEdit={onEdit}
                  className="block"
                  buttonClassName="right-0 -top-3"
                >
                  {renderRichTextElement(
                    'findUs.title',
                    'h2',
                    {
                      className: 'section-title',
                      style: getElementTextStyle('findUs.title'),
                    },
                    content.findUs.title,
                  )}
                </EditableElement>
                <div className="find-us-details">
                  <div className="find-us-detail" style={findUsTextStyle}>
                    <MapPin className="find-us-detail__icon" aria-hidden="true" />
                    <div>
                      <EditableElement
                        id="findUs.addressLabel"
                        label="Modifier le libellé de l'adresse"
                        onEdit={onEdit}
                        className="block"
                        buttonClassName="right-0 -top-3"
                      >
                        {renderRichTextElement(
                          'findUs.addressLabel',
                          'h3',
                          {
                            className: 'find-us-detail__title',
                            style: getElementTextStyle('findUs.addressLabel'),
                          },
                          content.findUs.addressLabel,
                        )}
                      </EditableElement>
                      <EditableElement
                        id="findUs.address"
                        label="Modifier l'adresse"
                        onEdit={onEdit}
                        className="mt-1 block"
                        buttonClassName="right-0 -top-3"
                      >
                        {renderRichTextElement(
                          'findUs.address',
                          'p',
                          {
                            className: 'find-us-detail__text',
                            style: getElementBodyTextStyle('findUs.address'),
                          },
                          content.findUs.address,
                        )}
                      </EditableElement>
                    </div>
                  </div>
                <div className="find-us-detail" style={findUsTextStyle}>
                  <Clock className="find-us-detail__icon" aria-hidden="true" />
                  <div>
                    <EditableElement
                      id="findUs.hoursLabel"
                      label="Modifier le libellé des horaires"
                      onEdit={onEdit}
                      className="block"
                      buttonClassName="right-0 -top-3"
                    >
                      {renderRichTextElement(
                        'findUs.hoursLabel',
                        'h3',
                        {
                          className: 'find-us-detail__title',
                          style: getElementTextStyle('findUs.hoursLabel'),
                        },
                        content.findUs.hoursLabel,
                      )}
                    </EditableElement>
                    <EditableElement
                      id="findUs.hours"
                      label="Modifier les horaires"
                      onEdit={onEdit}
                      className="mt-1 block"
                      buttonClassName="right-0 -top-3"
                    >
                      {renderRichTextElement(
                        'findUs.hours',
                        'p',
                        {
                          className: 'find-us-detail__text',
                          style: getElementBodyTextStyle('findUs.hours'),
                        },
                        content.findUs.hours,
                      )}
                    </EditableElement>
                  </div>
                </div>
                <div className="find-us-detail" style={findUsTextStyle}>
                  <Mail className="find-us-detail__icon" aria-hidden="true" />
                  <div>
                    <EditableElement
                      id="findUs.cityLabel"
                      label="Modifier le libellé de l'email"
                      onEdit={onEdit}
                      className="block"
                      buttonClassName="right-0 -top-3"
                    >
                      {renderRichTextElement(
                        'findUs.cityLabel',
                        'h3',
                        {
                          className: 'find-us-detail__title',
                          style: getElementTextStyle('findUs.cityLabel'),
                        },
                        content.findUs.cityLabel,
                      )}
                    </EditableElement>
                    <EditableElement
                      id="findUs.city"
                      label="Modifier l'email"
                      onEdit={onEdit}
                      className="mt-1 block"
                      buttonClassName="right-0 -top-3"
                    >
                      {renderRichTextElement(
                        'findUs.city',
                        'p',
                        {
                          className: 'find-us-detail__text',
                          style: getElementBodyTextStyle('findUs.city'),
                        },
                        content.findUs.city,
                      )}
                    </EditableElement>
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
                      <EditableElement
                        id="findUs.mapLabel"
                        label="Modifier le libellé du lien Google Maps"
                        onEdit={onEdit}
                        className="inline-flex"
                        buttonClassName="-right-3 -top-3"
                        as="span"
                      >
                        {renderRichTextElement(
                          'findUs.mapLabel',
                          'span',
                          {
                            className: 'find-us-map__label',
                            style: getElementBodyTextStyle('findUs.mapLabel'),
                          },
                          content.findUs.mapLabel,
                        )}
                      </EditableElement>
                    </a>
                  </div>
                ) : (
                  <div className="find-us-map__placeholder">
                    <EditableElement
                      id="findUs.mapLabel"
                      label="Modifier le libellé du lien Google Maps"
                      onEdit={onEdit}
                      className="inline-flex"
                      buttonClassName="-right-3 -top-3"
                      as="span"
                    >
                      {renderRichTextElement(
                        'findUs.mapLabel',
                        'span',
                        {
                          className: 'find-us-map__label',
                          style: getElementBodyTextStyle('findUs.mapLabel'),
                        },
                        content.findUs.mapLabel,
                      )}
                    </EditableElement>
                  </div>
                )}
              </div>
            </div>
          </section>
        </EditableElement>
      </SectionCard>

      <SectionCard zone="footer" activeZone={activeZone}>
        <EditableElement
          id="footer.style.background"
          label="Modifier le fond du pied de page"
          onEdit={onEdit}
          className="block"
          buttonClassName="right-4 top-4"
        >
          <footer className="site-footer" style={{ ...footerBackgroundStyle, ...footerTextStyle }}>
            <div className="layout-container site-footer__inner" style={footerTextStyle}>
              <EditableElement
                id="footer.text"
                label="Modifier le texte du pied de page"
                onEdit={onEdit}
                className="block"
                buttonClassName="right-0 -top-3"
              >
                <p style={getElementBodyTextStyle('footer.text')}>
                  &copy; {new Date().getFullYear()} {content.navigation.brand}.{' '}
                  {renderRichTextElement(
                    'footer.text',
                    'span',
                    {
                      style: getElementBodyTextStyle('footer.text'),
                    },
                    content.footer.text,
                  )}
                </p>
              </EditableElement>
            </div>
          </footer>
        </EditableElement>
      </SectionCard>
      </div>
    </EditButtonVisibilityContext.Provider>
  );
};

export default SitePreviewCanvas;
