import React from 'react';
import { Mail, MapPin, Phone } from 'lucide-react';
import { SiteContent } from '../types';

export type EditableZoneKey = 'navigation' | 'hero' | 'about' | 'menu' | 'contact' | 'footer';

interface SitePreviewCanvasProps {
  content: SiteContent;
  onEdit: (zone: EditableZoneKey) => void;
}

interface EditableZoneFrameProps {
  zone: EditableZoneKey;
  label: string;
  onEdit: (zone: EditableZoneKey) => void;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

const EditableZoneFrame: React.FC<EditableZoneFrameProps> = ({
  zone,
  label,
  onEdit,
  children,
  className,
  contentClassName,
}) => {
  const outerClasses = [
    'relative rounded-3xl border-2 border-dashed border-brand-primary/40 bg-white shadow-sm',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  const innerClasses = ['relative z-10', contentClassName].filter(Boolean).join(' ');

  return (
    <div className={outerClasses}>
      <div className="absolute left-4 top-3 z-20">
        <span className="inline-flex items-center rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-primary">
          {label}
        </span>
      </div>
      <button
        type="button"
        onClick={() => onEdit(zone)}
        className="absolute right-4 top-3 z-20 rounded-full bg-brand-primary px-3 py-1 text-xs font-semibold text-white shadow-md transition hover:bg-brand-primary/90"
      >
        Modifier
      </button>
      <div className={innerClasses}>{children}</div>
    </div>
  );
};

const placeholderProducts = [
  {
    id: '1',
    name: 'Taco al Pastor',
    description: 'Porc mariné, ananas rôti et coriandre fraîche.',
    price: '12,90€',
  },
  {
    id: '2',
    name: 'Burrito Barbacoa',
    description: 'Bœuf effiloché, haricots noirs et pico de gallo.',
    price: '14,50€',
  },
  {
    id: '3',
    name: 'Quesadilla Verde',
    description: 'Fromage fondant, courgettes grillées et salsa verde.',
    price: '11,40€',
  },
];

const SitePreviewCanvas: React.FC<SitePreviewCanvasProps> = ({ content, onEdit }) => {
  const heroBackgroundStyle = content.hero.backgroundImage
    ? { backgroundImage: `url('${content.hero.backgroundImage}')` }
    : undefined;

  return (
    <div className="space-y-6 rounded-[2.5rem] border border-gray-200 bg-slate-50 p-6 shadow-inner">
      <EditableZoneFrame zone="navigation" label="Navigation" onEdit={onEdit} contentClassName="pt-16">
        <header className="login-header">
          <div className="layout-container login-header__inner">
            <span className="login-brand">{content.navigation.brand}</span>
            <nav className="login-nav" aria-label="Navigation principale">
              <span className="login-nav__link">{content.navigation.links.home}</span>
              <span className="login-nav__link">{content.navigation.links.about}</span>
              <span className="login-nav__link">{content.navigation.links.menu}</span>
              <span className="login-nav__link">{content.navigation.links.contact}</span>
              <button type="button" className="ui-btn ui-btn-accent login-nav__cta" disabled>
                {content.navigation.links.loginCta}
              </button>
            </nav>
          </div>
        </header>
      </EditableZoneFrame>

      <EditableZoneFrame zone="hero" label="Hero" onEdit={onEdit} className="overflow-hidden" contentClassName="pt-14">
        <section className="section section-hero" style={heroBackgroundStyle}>
          <div className="section-hero__inner">
            <div className="hero-content">
              <h2 className="hero-title">{content.hero.title}</h2>
              <p className="hero-subtitle">{content.hero.subtitle}</p>
              <button type="button" className="ui-btn ui-btn-accent hero-cta" disabled>
                {content.hero.ctaLabel}
              </button>
              <div className="hero-history mt-6">
                <p className="hero-history__title">{content.hero.historyTitle}</p>
                <div className="hero-history__list">
                  {[0, 1, 2].map(index => (
                    <div key={index} className="hero-history__item">
                      <div className="hero-history__meta">
                        <p className="hero-history__date">Commande du 12/03/2024</p>
                        <p className="hero-history__details">2 article(s) • 32€</p>
                      </div>
                      <button type="button" className="hero-history__cta" disabled>
                        {content.hero.reorderCtaLabel}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </EditableZoneFrame>

      <EditableZoneFrame zone="about" label="À propos" onEdit={onEdit} className="overflow-hidden" contentClassName="pt-14">
        <section className="section section-surface">
          <div className="section-inner section-inner--center">
            <h2 className="section-title">{content.about.title}</h2>
            <p className="section-text section-text--muted">{content.about.description}</p>
            {content.about.image && (
              <img
                src={content.about.image}
                alt={content.about.title}
                className="mt-6 h-64 w-full rounded-xl object-cover shadow-lg"
              />
            )}
          </div>
        </section>
      </EditableZoneFrame>

      <EditableZoneFrame zone="menu" label="Menu" onEdit={onEdit} className="overflow-hidden" contentClassName="pt-14">
        <section className="section section-muted">
          <div className="section-inner section-inner--wide section-inner--center">
            <h2 className="section-title">{content.menu.title}</h2>
            {content.menu.image && (
              <img
                src={content.menu.image}
                alt={content.menu.title}
                className="mb-8 h-64 w-full rounded-xl object-cover shadow-lg"
              />
            )}
            <div className="menu-grid">
              {placeholderProducts.map(product => (
                <article key={product.id} className="ui-card menu-card">
                  <div className="h-40 w-full rounded-t-xl bg-gradient-to-br from-orange-200 via-amber-100 to-orange-50" />
                  <div className="menu-card__body">
                    <h3 className="menu-card__title">{product.name}</h3>
                    <p className="menu-card__description">{product.description}</p>
                    <p className="menu-card__price">{product.price}</p>
                  </div>
                </article>
              ))}
            </div>
            <div className="section-actions">
              <button type="button" className="ui-btn ui-btn-primary hero-cta" disabled>
                {content.menu.ctaLabel}
              </button>
              <p className="section-text section-text--muted">{content.menu.loadingLabel}</p>
            </div>
          </div>
        </section>
      </EditableZoneFrame>

      <EditableZoneFrame zone="contact" label="Contact" onEdit={onEdit} className="overflow-hidden" contentClassName="pt-14">
        <section className="section section-surface">
          <div className="section-inner section-inner--wide section-inner--center">
            <h2 className="section-title">{content.contact.title}</h2>
            {content.contact.image && (
              <img
                src={content.contact.image}
                alt={content.contact.title}
                className="mb-8 h-64 w-full rounded-xl object-cover shadow-lg"
              />
            )}
            <div className="contact-grid">
              <div className="contact-card">
                <MapPin className="contact-card__icon" />
                <h3 className="contact-card__title">{content.contact.addressLabel}</h3>
                <p className="contact-card__text">{content.contact.address}</p>
              </div>
              <div className="contact-card">
                <Phone className="contact-card__icon" />
                <h3 className="contact-card__title">{content.contact.phoneLabel}</h3>
                <p className="contact-card__text">{content.contact.phone}</p>
              </div>
              <div className="contact-card">
                <Mail className="contact-card__icon" />
                <h3 className="contact-card__title">{content.contact.emailLabel}</h3>
                <p className="contact-card__text">{content.contact.email}</p>
              </div>
            </div>
          </div>
        </section>
      </EditableZoneFrame>

      <EditableZoneFrame zone="footer" label="Pied de page" onEdit={onEdit} contentClassName="pt-14">
        <footer className="site-footer">
          <div className="layout-container site-footer__inner">
            <p>
              &copy; {new Date().getFullYear()} {content.navigation.brand}. {content.footer.text}
            </p>
          </div>
        </footer>
      </EditableZoneFrame>
    </div>
  );
};

export default SitePreviewCanvas;
