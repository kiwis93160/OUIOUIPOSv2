import React from 'react';
import { Edit2, Mail, MapPin, Phone } from 'lucide-react';
import { SiteContent } from '../types';
import {
  createBackgroundStyle,
  createBodyTextStyle,
  createHeroBackgroundStyle,
  createTextStyle,
} from '../utils/siteStyleHelpers';
import { formatCurrencyCOP } from '../utils/formatIntegerAmount';

const brandLogo = '/logo-brand.svg';
const staffLogo = '/logo-staff.svg';

export type EditableZoneKey = 'navigation' | 'hero' | 'about' | 'menu' | 'contact' | 'footer';

export type EditableElementKey =
  | 'navigation.brand'
  | 'navigation.links.home'
  | 'navigation.links.about'
  | 'navigation.links.menu'
  | 'navigation.links.contact'
  | 'navigation.links.loginCta'
  | 'navigation.style.background'
  | 'hero.title'
  | 'hero.subtitle'
  | 'hero.ctaLabel'
  | 'hero.historyTitle'
  | 'hero.reorderCtaLabel'
  | 'hero.backgroundImage'
  | 'about.title'
  | 'about.description'
  | 'about.image'
  | 'about.style.background'
  | 'menu.title'
  | 'menu.ctaLabel'
  | 'menu.loadingLabel'
  | 'menu.image'
  | 'menu.style.background'
  | 'contact.title'
  | 'contact.addressLabel'
  | 'contact.address'
  | 'contact.phoneLabel'
  | 'contact.phone'
  | 'contact.emailLabel'
  | 'contact.email'
  | 'contact.image'
  | 'contact.style.background'
  | 'footer.text'
  | 'footer.style.background';

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
    const anchorElement =
      (event.currentTarget.closest(`[data-zone="${zone}"]`) as HTMLElement | null) ??
      (event.currentTarget.parentElement as HTMLElement | null);
    const rect = anchorElement?.getBoundingClientRect() ?? null;
    onEdit(id, { zone, anchor: rect });
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

const placeholderProducts = [
  {
    id: '1',
    name: 'Taco al Pastor',
    description: 'Porc mariné, ananas rôti et coriandre fraîche.',
    price: formatCurrencyCOP(12900),
  },
  {
    id: '2',
    name: 'Burrito Barbacoa',
    description: 'Bœuf effiloché, haricots noirs et pico de gallo.',
    price: formatCurrencyCOP(14500),
  },
  {
    id: '3',
    name: 'Quesadilla Verde',
    description: 'Fromage fondant, courgettes grillées et salsa verde.',
    price: formatCurrencyCOP(11400),
  },
];

const SitePreviewCanvas: React.FC<SitePreviewCanvasProps> = ({ content, onEdit, activeZone }) => {
  const navigationBackgroundStyle = createBackgroundStyle(content.navigation.style);
  const navigationTextStyle = createTextStyle(content.navigation.style);
  const navigationBodyStyle = createBodyTextStyle(content.navigation.style);
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
                  <span className="login-brand__name">{content.navigation.brand}</span>
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
                  <span className="login-nav__link" style={navigationBodyStyle}>
                    {content.navigation.links.home}
                  </span>
                </EditableElement>
                <EditableElement
                  id="navigation.links.about"
                  label="Modifier le lien À propos"
                  onEdit={onEdit}
                  as="span"
                  className="inline-flex"
                  buttonClassName="-right-2 -top-2"
                >
                  <span className="login-nav__link" style={navigationBodyStyle}>
                    {content.navigation.links.about}
                  </span>
                </EditableElement>
                <EditableElement
                  id="navigation.links.menu"
                  label="Modifier le lien Menu"
                  onEdit={onEdit}
                  as="span"
                  className="inline-flex"
                  buttonClassName="-right-2 -top-2"
                >
                  <span className="login-nav__link" style={navigationBodyStyle}>
                    {content.navigation.links.menu}
                  </span>
                </EditableElement>
                <EditableElement
                  id="navigation.links.contact"
                  label="Modifier le lien Contact"
                  onEdit={onEdit}
                  as="span"
                  className="inline-flex"
                  buttonClassName="-right-2 -top-2"
                >
                  <span className="login-nav__link" style={navigationBodyStyle}>
                    {content.navigation.links.contact}
                  </span>
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
                    style={{ fontFamily: content.navigation.style.fontFamily }}
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
                  <h2 className="hero-title" style={heroTextStyle}>
                    {content.hero.title}
                  </h2>
                </EditableElement>
                <EditableElement
                  id="hero.subtitle"
                  label="Modifier le sous-titre du hero"
                  onEdit={onEdit}
                  className="mt-4 block"
                  buttonClassName="right-0 -top-3"
                >
                  <p className="hero-subtitle" style={heroBodyTextStyle}>
                    {content.hero.subtitle}
                  </p>
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
                    style={{ fontFamily: content.hero.style.fontFamily }}
                    disabled
                  >
                    {content.hero.ctaLabel}
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
                    <p className="hero-history__title" style={heroBodyTextStyle}>
                      {content.hero.historyTitle}
                    </p>
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
                              Commande du 12/03/2024
                            </p>
                            <p className="hero-history__details" style={heroBodyTextStyle}>
                              2 article(s) • {formatCurrencyCOP(32000)}
                            </p>
                          </div>
                          <button
                            type="button"
                            className="hero-history__cta"
                            style={{ fontFamily: content.hero.style.fontFamily }}
                            disabled
                          >
                            {content.hero.reorderCtaLabel}
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
                <h2 className="section-title" style={aboutTextStyle}>
                  {content.about.title}
                </h2>
              </EditableElement>
              <EditableElement
                id="about.description"
                label="Modifier la description À propos"
                onEdit={onEdit}
                className="mt-4 block"
                buttonClassName="right-0 -top-3"
              >
                <p className="section-text section-text--muted" style={aboutBodyTextStyle}>
                  {content.about.description}
                </p>
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
                <h2 className="section-title" style={menuTextStyle}>
                  {content.menu.title}
                </h2>
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
                {placeholderProducts.map(product => (
                  <article key={product.id} className="ui-card menu-card">
                    <div className="h-40 w-full rounded-t-xl bg-gradient-to-br from-orange-200 via-amber-100 to-orange-50" />
                    <div className="menu-card__body">
                      <h3 className="menu-card__title" style={menuTextStyle}>
                        {product.name}
                      </h3>
                      <p className="menu-card__description" style={menuBodyTextStyle}>
                        {product.description}
                      </p>
                      <p className="menu-card__price" style={menuBodyTextStyle}>
                        {product.price}
                      </p>
                    </div>
                  </article>
                ))}
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
                    style={{ fontFamily: content.menu.style.fontFamily }}
                    disabled
                  >
                    {content.menu.ctaLabel}
                  </button>
                  <EditableElement
                    id="menu.loadingLabel"
                    label="Modifier le texte de chargement"
                    onEdit={onEdit}
                    className="ml-4 inline-flex"
                    buttonClassName="-right-3 -top-3"
                    as="span"
                  >
                    <p className="section-text section-text--muted" style={menuBodyTextStyle}>
                      {content.menu.loadingLabel}
                    </p>
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
                <h2 className="section-title" style={contactTextStyle}>
                  {content.contact.title}
                </h2>
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
                    <h3 className="contact-card__title" style={contactTextStyle}>
                      {content.contact.addressLabel}
                    </h3>
                  </EditableElement>
                  <EditableElement
                    id="contact.address"
                    label="Modifier l'adresse"
                    onEdit={onEdit}
                    className="mt-1 block"
                    buttonClassName="right-0 -top-3"
                  >
                    <p className="contact-card__text" style={contactBodyTextStyle}>
                      {content.contact.address}
                    </p>
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
                    <h3 className="contact-card__title" style={contactTextStyle}>
                      {content.contact.phoneLabel}
                    </h3>
                  </EditableElement>
                  <EditableElement
                    id="contact.phone"
                    label="Modifier le numéro de téléphone"
                    onEdit={onEdit}
                    className="mt-1 block"
                    buttonClassName="right-0 -top-3"
                  >
                    <p className="contact-card__text" style={contactBodyTextStyle}>
                      {content.contact.phone}
                    </p>
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
                    <h3 className="contact-card__title" style={contactTextStyle}>
                      {content.contact.emailLabel}
                    </h3>
                  </EditableElement>
                  <EditableElement
                    id="contact.email"
                    label="Modifier l'adresse email"
                    onEdit={onEdit}
                    className="mt-1 block"
                    buttonClassName="right-0 -top-3"
                  >
                    <p className="contact-card__text" style={contactBodyTextStyle}>
                      {content.contact.email}
                    </p>
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
                <p style={footerTextStyle}>
                  &copy; {new Date().getFullYear()} {content.navigation.brand}. {content.footer.text}
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
