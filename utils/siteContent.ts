import { SectionStyle, SiteContent } from '../types';
import { normalizeCloudinaryImageUrl } from '../services/cloudinary';

const trimOrEmpty = (value: string): string => value.trim();

const isNonEmptyString = (value: string | null | undefined): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const resolveFontFamily = (value: string | null | undefined, fallback: string): string =>
  isNonEmptyString(value) ? value.trim() : fallback;

const resolveFontSize = (value: string | null | undefined, fallback: string): string =>
  isNonEmptyString(value) ? value.trim() : fallback;

const resolveColor = (value: string | null | undefined, fallback: string): string =>
  isNonEmptyString(value) ? value.trim() : fallback;

const resolveString = (value: string | null | undefined, fallback: string): string => {
  if (typeof value !== 'string') {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
};

const resolveImage = (value: string | null | undefined, fallback: string | null): string | null => {
  if (value === undefined) {
    return fallback ?? null;
  }

  if (value === null) {
    return null;
  }

  const normalized = normalizeCloudinaryImageUrl(value);
  return normalized ?? fallback ?? null;
};

const sanitizeImage = (value: string | null | undefined): string | null => {
  const normalized = normalizeCloudinaryImageUrl(value);
  return normalized ?? null;
};

const DEFAULT_NAVIGATION_STYLE: SectionStyle = {
  background: {
    type: 'color',
    color: '#0f172a',
    image: null,
  },
  fontFamily: 'Inter',
  fontSize: '16px',
  textColor: '#f1f5f9',
};

const DEFAULT_HERO_STYLE: SectionStyle = {
  background: {
    type: 'image',
    color: '#0f172a',
    image: 'https://picsum.photos/seed/tacosbg/1920/1080',
  },
  fontFamily: 'Inter',
  fontSize: '18px',
  textColor: '#f8fafc',
};

const DEFAULT_ABOUT_STYLE: SectionStyle = {
  background: {
    type: 'color',
    color: '#ffffff',
    image: null,
  },
  fontFamily: 'Inter',
  fontSize: '16px',
  textColor: '#0f172a',
};

const DEFAULT_MENU_STYLE: SectionStyle = {
  background: {
    type: 'color',
    color: '#f8fafc',
    image: null,
  },
  fontFamily: 'Inter',
  fontSize: '16px',
  textColor: '#111827',
};

const DEFAULT_CONTACT_STYLE: SectionStyle = {
  background: {
    type: 'color',
    color: '#ffffff',
    image: null,
  },
  fontFamily: 'Inter',
  fontSize: '16px',
  textColor: '#111827',
};

const DEFAULT_FOOTER_STYLE: SectionStyle = {
  background: {
    type: 'color',
    color: '#0f172a',
    image: null,
  },
  fontFamily: 'Inter',
  fontSize: '14px',
  textColor: '#e2e8f0',
};

const resolveSectionStyle = (style: Partial<SectionStyle> | undefined, fallback: SectionStyle): SectionStyle => {
  const backgroundType = style?.background?.type === 'image' ? 'image' : 'color';
  const backgroundColor = resolveColor(style?.background?.color, fallback.background.color);
  const backgroundImage =
    backgroundType === 'image'
      ? resolveImage(style?.background?.image ?? undefined, fallback.background.image)
      : null;

  return {
    background: {
      type: backgroundType,
      color: backgroundType === 'color' ? backgroundColor : resolveColor(style?.background?.color, fallback.background.color),
      image: backgroundType === 'image' ? backgroundImage : null,
    },
    fontFamily: resolveFontFamily(style?.fontFamily ?? null, fallback.fontFamily),
    fontSize: resolveFontSize(style?.fontSize ?? null, fallback.fontSize),
    textColor: resolveColor(style?.textColor ?? null, fallback.textColor),
  };
};

const sanitizeSectionStyle = (style: SectionStyle | undefined, fallback: SectionStyle): SectionStyle => {
  const backgroundType = style?.background?.type === 'image' ? 'image' : 'color';
  const sanitizedColor = resolveColor(style?.background?.color ?? null, fallback.background.color);
  const sanitizedImage = backgroundType === 'image' ? sanitizeImage(style?.background?.image ?? null) : null;

  return {
    background: {
      type: backgroundType,
      color: sanitizedColor,
      image: backgroundType === 'image' ? sanitizedImage : null,
    },
    fontFamily: resolveFontFamily(style?.fontFamily ?? null, fallback.fontFamily),
    fontSize: resolveFontSize(style?.fontSize ?? null, fallback.fontSize),
    textColor: resolveColor(style?.textColor ?? null, fallback.textColor),
  };
};

export const DEFAULT_SITE_CONTENT: SiteContent = {
  navigation: {
    brand: 'OUIOUITACOS',
    links: {
      home: 'Accueil',
      about: 'À propos',
      menu: 'Menu',
      contact: 'Contact',
      loginCta: 'Staff Login',
    },
    style: DEFAULT_NAVIGATION_STYLE,
  },
  hero: {
    title: 'Le Goût Authentique du Mexique',
    subtitle:
      "Des tacos préparés avec passion, des ingrédients frais et une touche de tradition pour un voyage gustatif inoubliable.",
    ctaLabel: 'Commander en ligne',
    backgroundImage: 'https://picsum.photos/seed/tacosbg/1920/1080',
    historyTitle: 'Vos dernières commandes',
    reorderCtaLabel: 'Commander à nouveau',
    style: DEFAULT_HERO_STYLE,
  },
  about: {
    title: 'Notre Histoire',
    description:
      "Fondé par des passionnés de la cuisine mexicaine, OUIOUITACOS est né d'un désir simple : partager le goût authentique des tacos faits maison. Chaque recette est un héritage familial, chaque ingrédient est choisi avec soin, et chaque plat est préparé avec le cœur. Venez découvrir une explosion de saveurs qui vous transportera directement dans les rues de Mexico.",
    image: null,
    style: DEFAULT_ABOUT_STYLE,
  },
  menu: {
    title: 'Nos Best-sellers',
    ctaLabel: 'Voir le menu complet & Commander',
    loadingLabel: 'Chargement du menu...',
    image: null,
    style: DEFAULT_MENU_STYLE,
  },
  contact: {
    title: 'Contactez-nous',
    addressLabel: 'Adresse',
    address: '123 Rue du Taco, 75000 Paris',
    phoneLabel: 'Téléphone',
    phone: '01 23 45 67 89',
    emailLabel: 'Email',
    email: 'contact@ouiouitacos.fr',
    image: null,
    style: DEFAULT_CONTACT_STYLE,
  },
  footer: {
    text: 'Tous droits réservés.',
    style: DEFAULT_FOOTER_STYLE,
  },
};

export const resolveSiteContent = (content?: Partial<SiteContent> | null): SiteContent => {
  const base = DEFAULT_SITE_CONTENT;
  return {
    navigation: {
      brand: resolveString(content?.navigation?.brand, base.navigation.brand),
      links: {
        home: resolveString(content?.navigation?.links?.home, base.navigation.links.home),
        about: resolveString(content?.navigation?.links?.about, base.navigation.links.about),
        menu: resolveString(content?.navigation?.links?.menu, base.navigation.links.menu),
        contact: resolveString(content?.navigation?.links?.contact, base.navigation.links.contact),
        loginCta: resolveString(content?.navigation?.links?.loginCta, base.navigation.links.loginCta),
      },
      style: resolveSectionStyle(content?.navigation?.style, base.navigation.style),
    },
    hero: {
      title: resolveString(content?.hero?.title, base.hero.title),
      subtitle: resolveString(content?.hero?.subtitle, base.hero.subtitle),
      ctaLabel: resolveString(content?.hero?.ctaLabel, base.hero.ctaLabel),
      backgroundImage: resolveImage(content?.hero?.backgroundImage, base.hero.backgroundImage),
      historyTitle: resolveString(content?.hero?.historyTitle, base.hero.historyTitle),
      reorderCtaLabel: resolveString(content?.hero?.reorderCtaLabel, base.hero.reorderCtaLabel),
      style: resolveSectionStyle(content?.hero?.style, base.hero.style),
    },
    about: {
      title: resolveString(content?.about?.title, base.about.title),
      description: resolveString(content?.about?.description, base.about.description),
      image: resolveImage(content?.about?.image, base.about.image),
      style: resolveSectionStyle(content?.about?.style, base.about.style),
    },
    menu: {
      title: resolveString(content?.menu?.title, base.menu.title),
      ctaLabel: resolveString(content?.menu?.ctaLabel, base.menu.ctaLabel),
      loadingLabel: resolveString(content?.menu?.loadingLabel, base.menu.loadingLabel),
      image: resolveImage(content?.menu?.image, base.menu.image),
      style: resolveSectionStyle(content?.menu?.style, base.menu.style),
    },
    contact: {
      title: resolveString(content?.contact?.title, base.contact.title),
      addressLabel: resolveString(content?.contact?.addressLabel, base.contact.addressLabel),
      address: resolveString(content?.contact?.address, base.contact.address),
      phoneLabel: resolveString(content?.contact?.phoneLabel, base.contact.phoneLabel),
      phone: resolveString(content?.contact?.phone, base.contact.phone),
      emailLabel: resolveString(content?.contact?.emailLabel, base.contact.emailLabel),
      email: resolveString(content?.contact?.email, base.contact.email),
      image: resolveImage(content?.contact?.image, base.contact.image),
      style: resolveSectionStyle(content?.contact?.style, base.contact.style),
    },
    footer: {
      text: resolveString(content?.footer?.text, base.footer.text),
      style: resolveSectionStyle(content?.footer?.style, base.footer.style),
    },
  };
};

export const sanitizeSiteContentInput = (content: SiteContent): SiteContent => ({
  navigation: {
    brand: trimOrEmpty(content.navigation.brand),
    links: {
      home: trimOrEmpty(content.navigation.links.home),
      about: trimOrEmpty(content.navigation.links.about),
      menu: trimOrEmpty(content.navigation.links.menu),
      contact: trimOrEmpty(content.navigation.links.contact),
      loginCta: trimOrEmpty(content.navigation.links.loginCta),
    },
    style: sanitizeSectionStyle(content.navigation.style, DEFAULT_NAVIGATION_STYLE),
  },
  hero: {
    title: trimOrEmpty(content.hero.title),
    subtitle: trimOrEmpty(content.hero.subtitle),
    ctaLabel: trimOrEmpty(content.hero.ctaLabel),
    backgroundImage: sanitizeImage(content.hero.backgroundImage),
    historyTitle: trimOrEmpty(content.hero.historyTitle),
    reorderCtaLabel: trimOrEmpty(content.hero.reorderCtaLabel),
    style: sanitizeSectionStyle(content.hero.style, DEFAULT_HERO_STYLE),
  },
  about: {
    title: trimOrEmpty(content.about.title),
    description: trimOrEmpty(content.about.description),
    image: sanitizeImage(content.about.image),
    style: sanitizeSectionStyle(content.about.style, DEFAULT_ABOUT_STYLE),
  },
  menu: {
    title: trimOrEmpty(content.menu.title),
    ctaLabel: trimOrEmpty(content.menu.ctaLabel),
    loadingLabel: trimOrEmpty(content.menu.loadingLabel),
    image: sanitizeImage(content.menu.image),
    style: sanitizeSectionStyle(content.menu.style, DEFAULT_MENU_STYLE),
  },
  contact: {
    title: trimOrEmpty(content.contact.title),
    addressLabel: trimOrEmpty(content.contact.addressLabel),
    address: trimOrEmpty(content.contact.address),
    phoneLabel: trimOrEmpty(content.contact.phoneLabel),
    phone: trimOrEmpty(content.contact.phone),
    emailLabel: trimOrEmpty(content.contact.emailLabel),
    email: trimOrEmpty(content.contact.email),
    image: sanitizeImage(content.contact.image),
    style: sanitizeSectionStyle(content.contact.style, DEFAULT_CONTACT_STYLE),
  },
  footer: {
    text: trimOrEmpty(content.footer.text),
    style: sanitizeSectionStyle(content.footer.style, DEFAULT_FOOTER_STYLE),
  },
});
