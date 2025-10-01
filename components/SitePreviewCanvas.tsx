import React from 'react';
import { Edit2, Mail, MapPin, Phone } from 'lucide-react';
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
const DEFAULT_STAFF_LOGO = '/logo-staff.svg';

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
  if (element.startsWith('contact.')) {
    return 'contact';
  }
  if (element.startsWith('footer.')) {
    return 'footer';
  }

  throw new Error(`Zone introuvable pour l'élément modifiable "${element}"`);
};

interface SitePreviewCanvasProps {
  content: SiteContent;
  bestSellerProducts: Product[];
  onEdit: (element: EditableElementKey, meta: { zone: EditableZoneKey; anchor: DOMRect | null }) => void;
  activeZone?: EditableZoneKey | null;
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
}) => {
  const navigationBackgroundStyle = createBackgroundStyle(content.navigation.style);
  const navigationTextStyle = createTextStyle(content.navigation.style);
  const navigationBodyStyle = createBodyTextStyle(content.navigation.style);
  const brandLogo = content.navigation.brandLogo ?? DEFAULT_BRAND_LOGO;
  const staffLogo = content.navigation.staffLogo ?? DEFAULT_STAFF_LOGO;
  const heroBackgroundStyle = createHeroBackgroundStyle(content.hero.style, content.hero.backgroundImage);
  const heroTextStyle = createTextStyle(content.hero.style);
  const heroBodyTextStyle = createBodyTextStyle(content.hero.style);
  const aboutBackgroundStyle = createBackgroundStyle(content.about.style);
  const aboutTextStyle = createTextStyle(content.about.style);
  const aboutBodyTextStyle = createBodyTextStyle(content.about.style);
  const menuBackgroundStyle = createBackgroundStyle(content.menu.style);
  const menuTextStyle = createTextStyle(content.menu.style);
  const menuBodyTextStyle = createBodyTextStyle(content.menu.style);
  const contactBackgroundStyle = createBackgroundStyle(content.contact.style);
  const contactTextStyle = createTextStyle(content.contact.style);
  const contactBodyTextStyle = createBodyTextStyle(content.contact.style);
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
    contact: content.contact.style,
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

  return (
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
                <img
                  src={brandLogo}
                  alt={`Logo ${content.navigation.brand}`}
                  className="login-brand__logo"
                />
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
                  id="navigation.links.contact"
                  label="Modifier le lien Contact"
                  onEdit={onEdit}
                  as="span"
                  className="inline-flex"
                  buttonClassName="-right-2 -top-2"
                >
                  {renderRichTextElement(
                    'navigation.links.contact',
                    'span',
                    {
                      className: 'login-nav__link',
                      style: getElementBodyTextStyle('navigation.links.contact'),
                    },
                    content.navigation.links.contact,
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
                  <button
                    type="button"
                    className="login-nav__staff-btn"
                    style={{
                      ...getElementBodyTextStyle('navigation.links.loginCta'),
                      ...getElementBackgroundStyle('navigation.links.loginCta'),
                    }}
                    aria-label={content.navigation.links.loginCta}
                    disabled
                  >
                    <img src={staffLogo} alt="" className="login-nav__staff-logo" aria-hidden="true" />
                  </button>
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

      <SectionCard zone="contact" activeZone={activeZone}>
        <EditableElement
          id="contact.style.background"
          label="Modifier le fond de la section Contact"
          onEdit={onEdit}
          className="block"
          buttonClassName="right-4 top-4"
        >
          <section className="section section-surface" style={{ ...contactBackgroundStyle, ...contactTextStyle }}>
            <div className="section-inner section-inner--wide section-inner--center" style={contactTextStyle}>
              <EditableElement
                id="contact.title"
                label="Modifier le titre Contact"
                onEdit={onEdit}
                className="block"
                buttonClassName="right-0 -top-3"
              >
                {renderRichTextElement(
                  'contact.title',
                  'h2',
                  {
                    className: 'section-title',
                    style: getElementTextStyle('contact.title'),
                  },
                  content.contact.title,
                )}
              </EditableElement>
              {content.contact.image && (
                <EditableElement
                  id="contact.image"
                  label="Modifier l'image Contact"
                  onEdit={onEdit}
                  className="mb-8 block"
                  buttonClassName="right-4 top-4"
                >
                  <img
                    src={content.contact.image}
                    alt={content.contact.title}
                    className="h-64 w-full rounded-xl object-cover shadow-lg"
                  />
                </EditableElement>
              )}
              <div className="contact-grid">
                <div className="contact-card" style={contactTextStyle}>
                  <MapPin className="contact-card__icon" />
                  <EditableElement
                    id="contact.addressLabel"
                    label="Modifier le libellé de l'adresse"
                    onEdit={onEdit}
                    className="block"
                    buttonClassName="right-0 -top-3"
                  >
                    {renderRichTextElement(
                      'contact.addressLabel',
                      'h3',
                      {
                        className: 'contact-card__title',
                        style: getElementTextStyle('contact.addressLabel'),
                      },
                      content.contact.addressLabel,
                    )}
                  </EditableElement>
                  <EditableElement
                    id="contact.address"
                    label="Modifier l'adresse"
                    onEdit={onEdit}
                    className="mt-1 block"
                    buttonClassName="right-0 -top-3"
                  >
                    {renderRichTextElement(
                      'contact.address',
                      'p',
                      {
                        className: 'contact-card__text',
                        style: getElementBodyTextStyle('contact.address'),
                      },
                      content.contact.address,
                    )}
                  </EditableElement>
                </div>
                <div className="contact-card" style={contactTextStyle}>
                  <Phone className="contact-card__icon" />
                  <EditableElement
                    id="contact.phoneLabel"
                    label="Modifier le libellé du téléphone"
                    onEdit={onEdit}
                    className="block"
                    buttonClassName="right-0 -top-3"
                  >
                    {renderRichTextElement(
                      'contact.phoneLabel',
                      'h3',
                      {
                        className: 'contact-card__title',
                        style: getElementTextStyle('contact.phoneLabel'),
                      },
                      content.contact.phoneLabel,
                    )}
                  </EditableElement>
                  <EditableElement
                    id="contact.phone"
                    label="Modifier le numéro de téléphone"
                    onEdit={onEdit}
                    className="mt-1 block"
                    buttonClassName="right-0 -top-3"
                  >
                    {renderRichTextElement(
                      'contact.phone',
                      'p',
                      {
                        className: 'contact-card__text',
                        style: getElementBodyTextStyle('contact.phone'),
                      },
                      content.contact.phone,
                    )}
                  </EditableElement>
                </div>
                <div className="contact-card" style={contactTextStyle}>
                  <Mail className="contact-card__icon" />
                  <EditableElement
                    id="contact.emailLabel"
                    label="Modifier le libellé de l'email"
                    onEdit={onEdit}
                    className="block"
                    buttonClassName="right-0 -top-3"
                  >
                    {renderRichTextElement(
                      'contact.emailLabel',
                      'h3',
                      {
                        className: 'contact-card__title',
                        style: getElementTextStyle('contact.emailLabel'),
                      },
                      content.contact.emailLabel,
                    )}
                  </EditableElement>
                  <EditableElement
                    id="contact.email"
                    label="Modifier l'adresse email"
                    onEdit={onEdit}
                    className="mt-1 block"
                    buttonClassName="right-0 -top-3"
                  >
                    {renderRichTextElement(
                      'contact.email',
                      'p',
                      {
                        className: 'contact-card__text',
                        style: getElementBodyTextStyle('contact.email'),
                      },
                      content.contact.email,
                    )}
                  </EditableElement>
                </div>
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
  );
};

export default SitePreviewCanvas;
