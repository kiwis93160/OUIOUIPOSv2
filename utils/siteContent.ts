import { SiteContent } from '../types';
import { normalizeCloudinaryImageUrl } from '../services/cloudinary';

const trimOrEmpty = (value: string): string => value.trim();

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
  },
  hero: {
    title: 'Le Goût Authentique du Mexique',
    subtitle:
      "Des tacos préparés avec passion, des ingrédients frais et une touche de tradition pour un voyage gustatif inoubliable.",
    ctaLabel: 'Commander en ligne',
    backgroundImage: 'https://picsum.photos/seed/tacosbg/1920/1080',
    historyTitle: 'Vos dernières commandes',
    reorderCtaLabel: 'Commander à nouveau',
  },
  about: {
    title: 'Notre Histoire',
    description:
      "Fondé par des passionnés de la cuisine mexicaine, OUIOUITACOS est né d'un désir simple : partager le goût authentique des tacos faits maison. Chaque recette est un héritage familial, chaque ingrédient est choisi avec soin, et chaque plat est préparé avec le cœur. Venez découvrir une explosion de saveurs qui vous transportera directement dans les rues de Mexico.",
    image: null,
  },
  menu: {
    title: 'Nos Best-sellers',
    ctaLabel: 'Voir le menu complet & Commander',
    loadingLabel: 'Chargement du menu...',
    image: null,
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
  },
  footer: {
    text: 'Tous droits réservés.',
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
    },
    hero: {
      title: resolveString(content?.hero?.title, base.hero.title),
      subtitle: resolveString(content?.hero?.subtitle, base.hero.subtitle),
      ctaLabel: resolveString(content?.hero?.ctaLabel, base.hero.ctaLabel),
      backgroundImage: resolveImage(content?.hero?.backgroundImage, base.hero.backgroundImage),
      historyTitle: resolveString(content?.hero?.historyTitle, base.hero.historyTitle),
      reorderCtaLabel: resolveString(content?.hero?.reorderCtaLabel, base.hero.reorderCtaLabel),
    },
    about: {
      title: resolveString(content?.about?.title, base.about.title),
      description: resolveString(content?.about?.description, base.about.description),
      image: resolveImage(content?.about?.image, base.about.image),
    },
    menu: {
      title: resolveString(content?.menu?.title, base.menu.title),
      ctaLabel: resolveString(content?.menu?.ctaLabel, base.menu.ctaLabel),
      loadingLabel: resolveString(content?.menu?.loadingLabel, base.menu.loadingLabel),
      image: resolveImage(content?.menu?.image, base.menu.image),
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
    },
    footer: {
      text: resolveString(content?.footer?.text, base.footer.text),
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
  },
  hero: {
    title: trimOrEmpty(content.hero.title),
    subtitle: trimOrEmpty(content.hero.subtitle),
    ctaLabel: trimOrEmpty(content.hero.ctaLabel),
    backgroundImage: sanitizeImage(content.hero.backgroundImage),
    historyTitle: trimOrEmpty(content.hero.historyTitle),
    reorderCtaLabel: trimOrEmpty(content.hero.reorderCtaLabel),
  },
  about: {
    title: trimOrEmpty(content.about.title),
    description: trimOrEmpty(content.about.description),
    image: sanitizeImage(content.about.image),
  },
  menu: {
    title: trimOrEmpty(content.menu.title),
    ctaLabel: trimOrEmpty(content.menu.ctaLabel),
    loadingLabel: trimOrEmpty(content.menu.loadingLabel),
    image: sanitizeImage(content.menu.image),
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
  },
  footer: {
    text: trimOrEmpty(content.footer.text),
  },
});
