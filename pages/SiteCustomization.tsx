import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import useSiteContent, { DEFAULT_SITE_CONTENT } from '../hooks/useSiteContent';
import {
  CustomizationAsset,
  CustomizationAssetType,
  Product,
  SectionStyle,
  SiteContent,
} from '../types';
import { normalizeCloudinaryImageUrl, uploadCustomizationAsset } from '../services/cloudinary';
import { resolveSiteContent } from '../utils/siteContent';
import SitePreviewCanvas, {
  EditableElementKey,
  EditableZoneKey,
} from '../components/SitePreviewCanvas';
import { api } from '../services/api';
import {
  Archive,
  CheckCircle2,
  ChevronRight,
  Circle,
  HelpCircle,
  Image as ImageIcon,
  Link as LinkIcon,
  Loader2,
  Music,
  Sparkles,
  Trash2,
  Type as TypeIcon,
  Upload,
  Video,
  X,
} from 'lucide-react';

const imageWarning = "L'URL doit provenir de Cloudinary (https://*.cloudinary.com).";

const FONT_FAMILY_SUGGESTIONS = [
  'Inter',
  'Poppins',
  'Playfair Display',
  'Roboto',
  'Montserrat',
  'Open Sans',
  'Georgia, serif',
  'Arial, sans-serif',
] as const;

const FONT_SIZE_SUGGESTIONS = [
  '14px',
  '16px',
  '18px',
  '20px',
  '24px',
  '1rem',
  '1.25rem',
  'clamp(1rem, 2vw, 1.5rem)',
] as const;

const COLOR_SUGGESTIONS = [
  '#0f172a',
  '#111827',
  '#f8fafc',
  '#ffffff',
  '#e2e8f0',
  '#f97316',
  'transparent',
  'currentColor',
] as const;

const NAVIGATION_BRAND_SUGGESTIONS = [
  'Taqueria Sol',
  'Maison Gourmet',
  'La Cantina Latina',
  'Atelier des Saveurs',
] as const;

const NAVIGATION_LINK_SUGGESTIONS: Record<string, readonly string[]> = {
  home: ['Accueil', 'Bienvenue', 'Notre univers'],
  about: ['À propos', 'Notre histoire', 'La maison'],
  menu: ['Menu', 'Carte', 'Offres du moment'],
  contact: ['Contact', 'Nous trouver', 'Réserver'],
  loginCta: ['Espace équipe', 'Connexion', 'Staff'],
};

const HERO_TITLE_SUGGESTIONS = [
  'Des tacos qui réchauffent le cœur',
  'Votre nouvelle cantina préférée',
  'Saveurs authentiques, ambiance solaire',
] as const;

const HERO_SUBTITLE_SUGGESTIONS = [
  'Une carte courte, des produits frais et un service aux petits soins.',
  'Chaque assiette est préparée minute avec des ingrédients sourcés localement.',
  'Installez-vous, on s’occupe de tout. Du premier sourire au dernier café.',
] as const;

const HERO_CTA_SUGGESTIONS = ['Commander maintenant', 'Voir la carte', 'Je réserve une table'] as const;
const HERO_REORDER_SUGGESTIONS = ['Recommander ma dernière tournée', 'Encore la même !', 'Refaire ma commande'] as const;
const HERO_HISTORY_TITLE_SUGGESTIONS = ['Commandes récentes', 'Vos dernières envies', 'Historique gourmand'] as const;

const ABOUT_TITLE_SUGGESTIONS = ['Une histoire de famille', 'Notre promesse', 'La cuisine avec le cœur'] as const;
const ABOUT_DESCRIPTION_SUGGESTIONS = [
  "Depuis 2014, nous célébrons la street food mexicaine dans une ambiance chaleureuse et conviviale.",
  "Des recettes transmises par notre abuela, revisitées avec des produits locaux et de saison.",
  "Notre équipe imagine chaque semaine des créations éphémères pour surprendre vos papilles.",
] as const;

const MENU_LOADING_SUGGESTIONS = [
  'Chargement des saveurs…',
  'Préparation de la carte…',
  'On dresse les plats…',
] as const;

const MENU_CTA_SUGGESTIONS = ['Explorer la carte complète', 'Je commande', 'Voir tous les plats'] as const;

const CONTACT_ADDRESS_SUGGESTIONS = [
  '12 rue du Soleil, Bogotá',
  '45 avenue Central, Medellín',
  '8 Calle del Sabor, Cartagena',
] as const;

const CONTACT_PHONE_SUGGESTIONS = ['+57 320 456 98 12', '+57 311 234 56 78', '+57 315 987 65 43'] as const;
const CONTACT_EMAIL_SUGGESTIONS = ['hola@ouiouipos.co', 'contact@maison-gourmet.co', 'bonjour@cantinalatina.co'] as const;

const FOOTER_TEXT_SUGGESTIONS = [
  '© 2024 Taqueria Sol — Toute la gourmandise du soleil en un clic.',
  'Avec amour depuis Bogotá. Merci de soutenir les artisans locaux.',
  'Cuisine responsable, service souriant. À très vite !',
] as const;

const ZONE_ORDER: readonly EditableZoneKey[] = ['navigation', 'hero', 'about', 'menu', 'contact', 'footer'];

const ZONE_STEPS: ReadonlyArray<{
  key: EditableZoneKey;
  label: string;
  description: string;
  helper: string;
}> = [
  {
    key: 'navigation',
    label: 'Identité',
    description: 'Définissez votre nom de marque et les entrées du menu.',
    helper: 'Vos liens doivent refléter les étapes clés du parcours visiteur. Pensez à rester concis et explicite.',
  },
  {
    key: 'hero',
    label: 'Accueil',
    description: "Rédigez l'accroche principale et vos CTA de bienvenue.",
    helper: 'Un bon hero raconte qui vous êtes, ce que vous proposez et comment agir immédiatement.',
  },
  {
    key: 'about',
    label: 'À propos',
    description: 'Partagez votre histoire et votre ADN culinaire.',
    helper: "Quelques phrases suffisent pour expliquer votre vision. Restez authentique, donnez envie de vous rencontrer.",
  },
  {
    key: 'menu',
    label: 'Menu',
    description: 'Présentez votre offre et les messages clés de commande.',
    helper: 'Un CTA clair et un message rassurant suffisent à guider vos clients vers la commande.',
  },
  {
    key: 'contact',
    label: 'Contact',
    description: 'Indiquez vos points de contact essentiels.',
    helper: 'Adresse, téléphone et email permettent à vos clients de vous joindre facilement — pensez à vérifier leur exactitude.',
  },
  {
    key: 'footer',
    label: 'Pied de page',
    description: 'Terminez avec un message de marque et vos mentions utiles.',
    helper: 'Le pied de page rassure et fidélise. Ajoutez une touche personnelle pour marquer les esprits.',
  },
];

const STYLE_BACKGROUND_FIELD_KEYS: Record<EditableZoneKey, ImageFieldKey> = {
  navigation: 'navigation.style.background',
  hero: 'hero.style.background',
  about: 'about.style.background',
  menu: 'menu.style.background',
  contact: 'contact.style.background',
  footer: 'footer.style.background',
};

const IMAGE_FIELD_LABELS: Record<ImageFieldKey, string> = {
  'hero.backgroundImage': 'Visuel de fond (hero)',
  'about.image': 'Image de la section À propos',
  'menu.image': 'Image de la section Menu',
  'contact.image': 'Image de la section Contact',
  'navigation.brandLogo': 'Logo principal (navigation)',
  'navigation.staffLogo': "Logo d'accès équipe",
  'navigation.style.background': 'Fond personnalisé (navigation)',
  'hero.style.background': 'Fond personnalisé (hero)',
  'about.style.background': 'Fond personnalisé (À propos)',
  'menu.style.background': 'Fond personnalisé (menu)',
  'contact.style.background': 'Fond personnalisé (contact)',
  'footer.style.background': 'Fond personnalisé (pied de page)',
};

const INITIAL_IMAGE_ERRORS: Record<ImageFieldKey, string | null> = {
  'hero.backgroundImage': null,
  'about.image': null,
  'menu.image': null,
  'contact.image': null,
  'navigation.brandLogo': null,
  'navigation.staffLogo': null,
  'navigation.style.background': null,
  'hero.style.background': null,
  'about.style.background': null,
  'menu.style.background': null,
  'contact.style.background': null,
  'footer.style.background': null,
};

const EDITABLE_ELEMENT_INPUT_IDS: Partial<Record<EditableElementKey, string>> = {
  'navigation.brand': 'brand-name',
  'navigation.links.home': 'nav-home',
  'navigation.links.about': 'nav-about',
  'navigation.links.menu': 'nav-menu',
  'navigation.links.contact': 'nav-contact',
  'navigation.links.loginCta': 'nav-login',
  'navigation.style.background': 'navigation-background-type',
  'hero.title': 'hero-title',
  'hero.subtitle': 'hero-subtitle',
  'hero.ctaLabel': 'hero-cta',
  'hero.historyTitle': 'hero-history',
  'hero.reorderCtaLabel': 'hero-reorder',
  'hero.backgroundImage': 'hero-image',
  'about.title': 'about-title',
  'about.description': 'about-description',
  'about.image': 'about-image',
  'about.style.background': 'about-background-type',
  'menu.title': 'menu-title',
  'menu.ctaLabel': 'menu-cta',
  'menu.loadingLabel': 'menu-loading',
  'menu.image': 'menu-image',
  'menu.style.background': 'menu-background-type',
  'contact.title': 'contact-title',
  'contact.addressLabel': 'contact-address-label',
  'contact.address': 'contact-address',
  'contact.phoneLabel': 'contact-phone-label',
  'contact.phone': 'contact-phone',
  'contact.emailLabel': 'contact-email-label',
  'contact.email': 'contact-email',
  'contact.image': 'contact-image',
  'contact.style.background': 'contact-background-type',
  'footer.text': 'footer-text',
  'footer.style.background': 'footer-background-type',
};

const ASSET_TYPE_LABELS: Record<CustomizationAssetType, string> = {
  image: 'Image',
  video: 'Vidéo',
  audio: 'Audio',
  font: 'Police',
  raw: 'Fichier',
};

type ImageFieldKey =
  | 'hero.backgroundImage'
  | 'about.image'
  | 'menu.image'
  | 'contact.image'
  | 'navigation.brandLogo'
  | 'navigation.staffLogo'
  | 'navigation.style.background'
  | 'hero.style.background'
  | 'about.style.background'
  | 'menu.style.background'
  | 'contact.style.background'
  | 'footer.style.background';

type NavigationFieldKey = keyof SiteContent['navigation']['links'];
type HeroFieldKey = Exclude<keyof SiteContent['hero'], 'backgroundImage' | 'style'>;
type MenuFieldKey = Exclude<keyof SiteContent['menu'], 'image' | 'style'>;
type ContactFieldKey = Exclude<keyof SiteContent['contact'], 'image' | 'style'>;

type NavigationChangeHandler = (
  key: NavigationFieldKey,
) => (event: React.ChangeEvent<HTMLInputElement>) => void;
type HeroChangeHandler = (
  key: HeroFieldKey,
) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
type MenuChangeHandler = (
  key: MenuFieldKey,
) => (event: React.ChangeEvent<HTMLInputElement>) => void;
type ContactChangeHandler = (
  key: ContactFieldKey,
) => (event: React.ChangeEvent<HTMLInputElement>) => void;

type ImageInputHandler = (
  field: ImageFieldKey,
) => (event: React.ChangeEvent<HTMLInputElement>) => void;
type ImageUploadHandler = (field: ImageFieldKey, file: File) => Promise<void>;
type ImageClearHandler = (field: ImageFieldKey) => void;

type AssetUploadHandler = (files: FileList | null) => Promise<void>;
type AssetRemoveHandler = (id: string) => void;
type AssetRenameHandler = (id: string, name: string) => void;
type AssetApplyHandler = (field: ImageFieldKey, asset: CustomizationAsset) => void;

type CompletionStatus = 'todo' | 'progress' | 'done';

type ChecklistItem = {
  label: string;
  done: boolean;
};

type ZoneChecklistRecord = Record<EditableZoneKey, ChecklistItem[]>;
type ZoneStatusRecord = Record<EditableZoneKey, CompletionStatus>;

const guessAssetType = (file: File): CustomizationAssetType => {
  const { type, name } = file;
  if (type.startsWith('image/')) {
    return 'image';
  }
  if (type.startsWith('video/')) {
    return 'video';
  }
  if (type.startsWith('audio/')) {
    return 'audio';
  }
  if (type.includes('font')) {
    return 'font';
  }
  const extension = name.split('.').pop()?.toLowerCase();
  if (extension && ['ttf', 'otf', 'woff', 'woff2'].includes(extension)) {
    return 'font';
  }
  return 'raw';
};

const createAssetId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `asset-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '—';
  }
  const units = ['o', 'Ko', 'Mo', 'Go'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, exponent);
  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
};

const AssetTypeIcon: React.FC<{ type: CustomizationAssetType }> = ({ type }) => {
  switch (type) {
    case 'image':
      return <ImageIcon className="h-4 w-4" aria-hidden="true" />;
    case 'video':
      return <Video className="h-4 w-4" aria-hidden="true" />;
    case 'audio':
      return <Music className="h-4 w-4" aria-hidden="true" />;
    case 'font':
      return <TypeIcon className="h-4 w-4" aria-hidden="true" />;
    default:
      return <Archive className="h-4 w-4" aria-hidden="true" />;
  }
};

const createZoneChecklist = (draft: SiteContent): ZoneChecklistRecord => ({
  navigation: [
    { label: 'Nom de la marque défini', done: draft.navigation.brand.trim().length > 0 },
    {
      label: 'Liens principaux renseignés',
      done: ['home', 'about', 'menu', 'contact'].every(key =>
        draft.navigation.links[key as NavigationFieldKey].trim().length > 0,
      ),
    },
  ],
  hero: [
    { label: 'Titre accrocheur rédigé', done: draft.hero.title.trim().length > 0 },
    { label: 'Sous-titre descriptif rempli', done: draft.hero.subtitle.trim().length > 0 },
    { label: 'CTA principal configuré', done: draft.hero.ctaLabel.trim().length > 0 },
  ],
  about: [
    { label: 'Titre À propos complété', done: draft.about.title.trim().length > 0 },
    { label: 'Texte de présentation rédigé', done: draft.about.description.trim().length > 0 },
    { label: 'Visuel illustratif sélectionné', done: Boolean(draft.about.image) },
  ],
  menu: [
    { label: 'Titre de section rempli', done: draft.menu.title.trim().length > 0 },
    { label: 'CTA du menu défini', done: draft.menu.ctaLabel.trim().length > 0 },
  ],
  contact: [
    { label: 'Titre de contact renseigné', done: draft.contact.title.trim().length > 0 },
    { label: 'Adresse complète indiquée', done: draft.contact.address.trim().length > 0 },
    { label: 'Téléphone ou email actifs', done: draft.contact.phone.trim().length > 0 && draft.contact.email.trim().length > 0 },
  ],
  footer: [
    { label: 'Message de pied de page personnalisé', done: draft.footer.text.trim().length > 0 },
  ],
});

const getZoneCompletionStatus = (items: ChecklistItem[]): CompletionStatus => {
  if (items.every(item => item.done)) {
    return 'done';
  }
  if (items.some(item => item.done)) {
    return 'progress';
  }
  return 'todo';
};


type EditorContext = {
  draft: SiteContent;
  imageErrors: Record<ImageFieldKey, string | null>;
  isUploading: (field: ImageFieldKey) => boolean;
  handleBrandChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleNavigationChange: NavigationChangeHandler;
  handleHeroFieldChange: HeroChangeHandler;
  handleAboutChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleAboutTitleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleMenuFieldChange: MenuChangeHandler;
  handleContactFieldChange: ContactChangeHandler;
  handleFooterTextChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleImageInputChange: ImageInputHandler;
  handleImageUpload: ImageUploadHandler;
  handleClearImage: ImageClearHandler;
  handleStyleFontFamilyChange: (zone: EditableZoneKey, value: string) => void;
  handleStyleFontSizeChange: (zone: EditableZoneKey, value: string) => void;
  handleStyleTextColorChange: (zone: EditableZoneKey, value: string) => void;
  handleStyleBackgroundColorChange: (zone: EditableZoneKey, value: string) => void;
  handleStyleBackgroundTypeChange: (
    zone: EditableZoneKey,
    value: SectionStyle['background']['type'],
  ) => void;
  fontOptions: readonly string[];
  fontSizeOptions: readonly string[];
  setBrandValue: (value: string) => void;
  setNavigationLinkValue: (key: NavigationFieldKey, value: string) => void;
  setHeroFieldValue: (key: HeroFieldKey, value: string) => void;
  setAboutTitleValue: (value: string) => void;
  setAboutDescriptionValue: (value: string) => void;
  setMenuFieldValue: (key: MenuFieldKey, value: string) => void;
  setContactFieldValue: (key: ContactFieldKey, value: string) => void;
  setFooterTextValue: (value: string) => void;
  bestSellerProducts: Product[];
  bestSellerLoading: boolean;
  bestSellerError: string | null;
  refreshBestSellerProducts: () => Promise<void>;
  updateProduct: (productId: string, updates: Partial<Product>) => Promise<void>;
  isBestSellerUpdating: (productId: string) => boolean;
};

type ActiveElementState = {
  element: EditableElementKey;
  anchor: DOMRect | null;
};

const SiteCustomization: React.FC = () => {
  const { content, loading, error, updateContent } = useSiteContent();
  const [draft, setDraft] = useState<SiteContent>(content);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<ImageFieldKey, string | null>>({
    ...INITIAL_IMAGE_ERRORS,
  });
  const [uploadingField, setUploadingField] = useState<ImageFieldKey | null>(null);
  const [activeElementState, setActiveElementState] = useState<ActiveElementState | null>(null);
  const [activeZone, setActiveZone] = useState<EditableZoneKey>('navigation');
  const [guidedMode, setGuidedMode] = useState(true);
  const [assetUploading, setAssetUploading] = useState(false);
  const [assetError, setAssetError] = useState<string | null>(null);
  const [assetLibraryOpen, setAssetLibraryOpen] = useState(false);
  const [pendingAssetField, setPendingAssetField] = useState<ImageFieldKey | null>(null);
  const [bestSellerProducts, setBestSellerProducts] = useState<Product[]>([]);
  const [bestSellerLoading, setBestSellerLoading] = useState(false);
  const [bestSellerError, setBestSellerError] = useState<string | null>(null);
  const [updatingProducts, setUpdatingProducts] = useState<Record<string, boolean>>({});

  const previewContainerRef = useRef<HTMLDivElement | null>(null);

  const isBestSellerUpdating = useCallback(
    (productId: string) => Boolean(updatingProducts[productId]),
    [updatingProducts],
  );

  const loadBestSellerProducts = useCallback(async () => {
    setBestSellerLoading(true);
    try {
      const products = await api.getBestSellerProducts();
      setBestSellerProducts(products);
      setBestSellerError(null);
    } catch (error) {
      console.error('Failed to fetch best seller products', error);
      setBestSellerError("Impossible de charger les best sellers. Veuillez réessayer.");
    } finally {
      setBestSellerLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBestSellerProducts();
  }, [loadBestSellerProducts]);

  const handleUpdateProduct = useCallback(
    async (productId: string, updates: Partial<Product>) => {
      setUpdatingProducts(prev => ({
        ...prev,
        [productId]: true,
      }));
      try {
        await api.updateProduct(productId, updates);
        await loadBestSellerProducts();
        setBestSellerError(null);
      } catch (error) {
        console.error('Failed to update product', error);
        setBestSellerError("Impossible de mettre à jour le produit. Veuillez réessayer.");
      } finally {
        setUpdatingProducts(prev => {
          const next = { ...prev };
          delete next[productId];
          return next;
        });
      }
    },
    [loadBestSellerProducts],
  );

  useEffect(() => {
    setDraft(content);
    setIsDirty(false);
    setStatusMessage(null);
    setFormError(null);
    setImageErrors({ ...INITIAL_IMAGE_ERRORS });
    setAssetError(null);
  }, [content]);

  const previewContent = useMemo(() => resolveSiteContent(draft), [draft]);

  const fontOptions = useMemo(() => {
    const customFonts = draft.assets.library
      .filter(asset => asset.type === 'font')
      .map(asset => `"${asset.name}"`)
      .filter((value, index, list) => list.indexOf(value) === index);
    return [...FONT_FAMILY_SUGGESTIONS, ...customFonts];
  }, [draft.assets.library]);

  const fontSizeOptions = useMemo(() => [...FONT_SIZE_SUGGESTIONS], []);

  const mutateDraft = (updater: (prev: SiteContent) => SiteContent) => {
    setDraft(prev => updater(prev));
    setIsDirty(true);
    setStatusMessage(null);
    setFormError(null);
  };

  const updateZone = <K extends EditableZoneKey>(
    zone: K,
    updater: (zoneContent: SiteContent[K]) => SiteContent[K],
  ) => {
    mutateDraft(prev => ({
      ...prev,
      [zone]: updater(prev[zone]),
    }));
  };

  const updateZoneStyle = (
    zone: EditableZoneKey,
    updater: (style: SectionStyle) => SectionStyle,
  ) => {
    updateZone(zone, zoneContent => ({
      ...zoneContent,
      style: updater(zoneContent.style),
    }));
  };

  const setBrandValue = (value: string) => {
    mutateDraft(prev => ({
      ...prev,
      navigation: {
        ...prev.navigation,
        brand: value,
      },
    }));
  };

  const setNavigationLinkValue = (key: NavigationFieldKey, value: string) => {
    mutateDraft(prev => ({
      ...prev,
      navigation: {
        ...prev.navigation,
        links: {
          ...prev.navigation.links,
          [key]: value,
        },
      },
    }));
  };

  const setHeroFieldValue = (key: HeroFieldKey, value: string) => {
    mutateDraft(prev => ({
      ...prev,
      hero: {
        ...prev.hero,
        [key]: value,
      },
    }));
  };

  const setAboutTitleValue = (value: string) => {
    mutateDraft(prev => ({
      ...prev,
      about: {
        ...prev.about,
        title: value,
      },
    }));
  };

  const setAboutDescriptionValue = (value: string) => {
    mutateDraft(prev => ({
      ...prev,
      about: {
        ...prev.about,
        description: value,
      },
    }));
  };

  const setMenuFieldValue = (key: MenuFieldKey, value: string) => {
    mutateDraft(prev => ({
      ...prev,
      menu: {
        ...prev.menu,
        [key]: value,
      },
    }));
  };

  const setContactFieldValue = (key: ContactFieldKey, value: string) => {
    mutateDraft(prev => ({
      ...prev,
      contact: {
        ...prev.contact,
        [key]: value,
      },
    }));
  };

  const setFooterTextValue = (value: string) => {
    mutateDraft(prev => ({
      ...prev,
      footer: {
        ...prev.footer,
        text: value,
      },
    }));
  };

  const handleNavigationChange: NavigationChangeHandler = key => event => {
    setNavigationLinkValue(key, event.target.value);
  };

  const handleBrandChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBrandValue(event.target.value);
  };

  const handleHeroFieldChange: HeroChangeHandler = key => event => {
    setHeroFieldValue(key, event.target.value);
  };

  const handleAboutTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAboutTitleValue(event.target.value);
  };

  const handleAboutChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAboutDescriptionValue(event.target.value);
  };

  const handleMenuFieldChange: MenuChangeHandler = key => event => {
    setMenuFieldValue(key, event.target.value);
  };

  const handleContactFieldChange: ContactChangeHandler = key => event => {
    setContactFieldValue(key, event.target.value);
  };

  const handleFooterTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFooterTextValue(event.target.value);
  };

  const setImageField = (field: ImageFieldKey, value: string | null) => {
    mutateDraft(prev => {
      switch (field) {
        case 'hero.backgroundImage':
          return {
            ...prev,
            hero: {
              ...prev.hero,
              backgroundImage: value,
            },
          };
        case 'about.image':
          return {
            ...prev,
            about: {
              ...prev.about,
              image: value,
            },
          };
        case 'menu.image':
          return {
            ...prev,
            menu: {
              ...prev.menu,
              image: value,
            },
          };
        case 'contact.image':
          return {
            ...prev,
            contact: {
              ...prev.contact,
              image: value,
            },
          };
        case 'navigation.brandLogo':
          return {
            ...prev,
            navigation: {
              ...prev.navigation,
              brandLogo: value,
            },
          };
        case 'navigation.staffLogo':
          return {
            ...prev,
            navigation: {
              ...prev.navigation,
              staffLogo: value,
            },
          };
        case 'navigation.style.background':
          return {
            ...prev,
            navigation: {
              ...prev.navigation,
              style: {
                ...prev.navigation.style,
                background: {
                  ...prev.navigation.style.background,
                  type: 'image',
                  image: value,
                },
              },
            },
          };
        case 'hero.style.background':
          return {
            ...prev,
            hero: {
              ...prev.hero,
              style: {
                ...prev.hero.style,
                background: {
                  ...prev.hero.style.background,
                  type: 'image',
                  image: value,
                },
              },
            },
          };
        case 'about.style.background':
          return {
            ...prev,
            about: {
              ...prev.about,
              style: {
                ...prev.about.style,
                background: {
                  ...prev.about.style.background,
                  type: 'image',
                  image: value,
                },
              },
            },
          };
        case 'menu.style.background':
          return {
            ...prev,
            menu: {
              ...prev.menu,
              style: {
                ...prev.menu.style,
                background: {
                  ...prev.menu.style.background,
                  type: 'image',
                  image: value,
                },
              },
            },
          };
        case 'contact.style.background':
          return {
            ...prev,
            contact: {
              ...prev.contact,
              style: {
                ...prev.contact.style,
                background: {
                  ...prev.contact.style.background,
                  type: 'image',
                  image: value,
                },
              },
            },
          };
        case 'footer.style.background':
          return {
            ...prev,
            footer: {
              ...prev.footer,
              style: {
                ...prev.footer.style,
                background: {
                  ...prev.footer.style.background,
                  type: 'image',
                  image: value,
                },
              },
            },
          };
        default:
          return prev;
      }
    });
  };

  const handleImageInputChange: ImageInputHandler = field => event => {
    const raw = event.target.value;
    const trimmed = raw.trim();
    const nextValue = trimmed.length > 0 ? trimmed : null;
    setImageField(field, nextValue);
    const isValid = !trimmed || normalizeCloudinaryImageUrl(trimmed);
    setImageErrors(prev => ({
      ...prev,
      [field]: isValid ? null : imageWarning,
    }));
  };

  const handleImageUpload: ImageUploadHandler = async (field, file) => {
    setUploadingField(field);
    setFormError(null);
    setStatusMessage(null);
    try {
      const uploadedUrl = await uploadCustomizationAsset(file, {
        tags: ['customization', field.replace(/\./g, '_')],
      });
      setImageField(field, uploadedUrl);
      setImageErrors(prev => ({
        ...prev,
        [field]: null,
      }));
    } catch (uploadError) {
      console.error('Failed to upload customization asset', uploadError);
      setFormError(
        "Impossible de téléverser l'image. Vérifiez votre connexion ou la configuration Cloudinary.",
      );
    } finally {
      setUploadingField(null);
    }
  };

  const handleClearImage: ImageClearHandler = field => {
    setImageField(field, null);
    setImageErrors(prev => ({
      ...prev,
      [field]: null,
    }));
  };

  const handleAssetUpload: AssetUploadHandler = async files => {
    if (!files || files.length === 0) {
      return;
    }

    setAssetUploading(true);
    setAssetError(null);
    try {
      const uploadedAssets: CustomizationAsset[] = [];
      for (const file of Array.from(files)) {
        const url = await uploadCustomizationAsset(file, {
          tags: ['customization', guessAssetType(file)],
        });
        uploadedAssets.push({
          id: createAssetId(),
          name: file.name.replace(/\.[^/.]+$/, '') || file.name,
          url,
          format: file.type || 'application/octet-stream',
          bytes: file.size,
          type: guessAssetType(file),
          createdAt: new Date().toISOString(),
        });
      }

      if (uploadedAssets.length > 0) {
        mutateDraft(prev => ({
          ...prev,
          assets: {
            ...prev.assets,
            library: [...prev.assets.library, ...uploadedAssets],
          },
        }));
        setStatusMessage(
          uploadedAssets.length === 1
            ? 'Nouvelle ressource ajoutée à la médiathèque personnalisée.'
            : `${uploadedAssets.length} ressources ajoutées à la médiathèque personnalisée.`,
        );
      }
    } catch (assetUploadError) {
      console.error('Failed to upload customization asset', assetUploadError);
      setAssetError("Téléversement impossible. Vérifiez vos presets Cloudinary ou réessayez.");
    } finally {
      setAssetUploading(false);
    }
  };

  const handleAssetRemove: AssetRemoveHandler = id => {
    mutateDraft(prev => ({
      ...prev,
      assets: {
        ...prev.assets,
        library: prev.assets.library.filter(asset => asset.id !== id),
      },
    }));
  };

  const handleAssetRename: AssetRenameHandler = (id, name) => {
    const trimmed = name.trim();
    mutateDraft(prev => ({
      ...prev,
      assets: {
        ...prev.assets,
        library: prev.assets.library.map(asset =>
          asset.id === id
            ? {
                ...asset,
                name: trimmed.length > 0 ? trimmed : asset.name,
              }
            : asset,
        ),
      },
    }));
  };

  const handleAssetApply: AssetApplyHandler = (field, asset) => {
    setImageField(field, asset.url);
    setImageErrors(prev => ({
      ...prev,
      [field]: null,
    }));
    setStatusMessage('Ressource appliquée à la section sélectionnée.');
    if (pendingAssetField && pendingAssetField === field) {
      setPendingAssetField(null);
      setAssetLibraryOpen(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setStatusMessage(null);
    setFormError(null);
    try {
      await updateContent(draft);
      setIsDirty(false);
      setStatusMessage('Modifications enregistrées avec succès.');
    } catch (saveError) {
      console.error('Failed to update site content', saveError);
      setFormError('Impossible de sauvegarder vos changements. Réessayez dans un instant.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setDraft(content);
    setIsDirty(false);
    setStatusMessage(null);
    setFormError(null);
    setImageErrors({ ...INITIAL_IMAGE_ERRORS });
    setActiveElementState(null);
    setActiveZone('navigation');
    setPendingAssetField(null);
    setAssetLibraryOpen(false);
  };

  const isUploading = (field: ImageFieldKey) => uploadingField === field;

  const openAssetLibrary = (field?: ImageFieldKey) => {
    setPendingAssetField(field ?? null);
    setAssetLibraryOpen(true);
  };

  const closeAssetLibrary = () => {
    setAssetLibraryOpen(false);
    setPendingAssetField(null);
  };

  const handleEditElement = (
    element: EditableElementKey,
    meta: { zone: EditableZoneKey; anchor: DOMRect | null },
  ) => {
    setActiveElementState({ element, anchor: meta.anchor ?? null });
    setActiveZone(meta.zone);
  };

  const handleSelectZone = (zone: EditableZoneKey) => {
    setActiveZone(zone);
    setActiveElementState(null);
  };

  const zoneChecklist = useMemo(() => createZoneChecklist(draft), [draft]);

  const zoneStatuses = useMemo<ZoneStatusRecord>(() => {
    return ZONE_ORDER.reduce((acc, zone) => {
      acc[zone] = getZoneCompletionStatus(zoneChecklist[zone]);
      return acc;
    }, {} as ZoneStatusRecord);
  }, [zoneChecklist]);

  const context: EditorContext = {
    draft,
    imageErrors,
    isUploading,
    handleBrandChange,
    handleNavigationChange,
    handleHeroFieldChange,
    handleAboutChange,
    handleAboutTitleChange,
    handleMenuFieldChange,
    handleContactFieldChange,
    handleFooterTextChange,
    handleImageInputChange,
    handleImageUpload,
    handleClearImage,
    bestSellerProducts,
    bestSellerLoading,
    bestSellerError,
    refreshBestSellerProducts: loadBestSellerProducts,
    updateProduct: handleUpdateProduct,
    isBestSellerUpdating,
    handleStyleFontFamilyChange: (zone, value) => {
      updateZoneStyle(zone, style => ({
        ...style,
        fontFamily: value,
      }));
    },
    handleStyleFontSizeChange: (zone, value) => {
      updateZoneStyle(zone, style => ({
        ...style,
        fontSize: value,
      }));
    },
    handleStyleTextColorChange: (zone, value) => {
      updateZoneStyle(zone, style => ({
        ...style,
        textColor: value,
      }));
    },
    handleStyleBackgroundColorChange: (zone, value) => {
      updateZoneStyle(zone, style => ({
        ...style,
        background: {
          ...style.background,
          color: value,
        },
      }));
    },
    handleStyleBackgroundTypeChange: (zone, type) => {
      const fieldKey = STYLE_BACKGROUND_FIELD_KEYS[zone];
      const defaultStyle = DEFAULT_SITE_CONTENT[zone].style;
      updateZoneStyle(zone, style => ({
        ...style,
        background: {
          ...style.background,
          type,
          color: style.background.color || defaultStyle.background.color,
          image: type === 'image' ? style.background.image ?? defaultStyle.background.image : null,
        },
      }));
      if (type === 'color') {
        setImageErrors(prev => ({
          ...prev,
          [fieldKey]: null,
        }));
      }
    },
    fontOptions,
    fontSizeOptions,
    setBrandValue,
    setNavigationLinkValue,
    setHeroFieldValue,
    setAboutTitleValue,
    setAboutDescriptionValue,
    setMenuFieldValue,
    setContactFieldValue,
    setFooterTextValue,
  };

  const assetState = {
    uploading: assetUploading,
    error: assetError,
    assets: draft.assets.library,
    onUpload: handleAssetUpload,
    onRemove: handleAssetRemove,
    onRename: handleAssetRename,
    onApply: handleAssetApply,
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Personnalisation du site</h1>
          <p className="max-w-2xl text-sm text-gray-500">
            Composez une vitrine sur mesure : contenu, styles, ressources médias et polices sont entièrement modulables. Toutes
            vos créations sont centralisées dans le dossier Cloudinary <code className="rounded bg-slate-100 px-1">Custom</code>,
            prêtes à être réutilisées ou téléchargées.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="ui-btn ui-btn-secondary"
            disabled={!isDirty || saving}
          >
            Réinitialiser
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="ui-btn ui-btn-primary"
            disabled={!isDirty || saving}
            data-state={saving ? 'loading' : 'idle'}
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>

      {(error || formError) && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {formError ?? error}
        </div>
      )}

      {statusMessage && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {statusMessage}
        </div>
      )}

      <GuidedHeader
        activeZone={activeZone}
        guidedMode={guidedMode}
        onModeChange={setGuidedMode}
        onSelect={handleSelectZone}
        steps={ZONE_STEPS}
        zoneStatuses={zoneStatuses}
      />

      <div ref={previewContainerRef} className="relative">
        {loading ? (
          <div className="flex justify-center rounded-[2.5rem] border border-slate-200 bg-slate-50 py-20">
            <Loader2 className="h-10 w-10 animate-spin text-brand-primary" aria-hidden="true" />
          </div>
        ) : (
          <>
            <SitePreviewCanvas
              content={previewContent}
              bestSellerProducts={bestSellerProducts}
              activeZone={activeZone}
              onEdit={handleEditElement}
            />
            <FloatingZoneEditor
              zone={activeZone}
              guidedMode={guidedMode}
              containerRef={previewContainerRef}
              checklist={zoneChecklist[activeZone]}
              zoneStatuses={zoneStatuses}
              onClose={() => setActiveElementState(null)}
              onNavigate={handleSelectZone}
              onOpenAssets={openAssetLibrary}
              context={context}
            />
            <ElementEditorModal
              active={activeElementState}
              context={context}
              onClose={() => setActiveElementState(null)}
              onOpenAssets={openAssetLibrary}
            />
          </>
        )}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Astuces de personnalisation avancée
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          <li>
            Utilisez des valeurs CSS complètes dans les champs de styles pour bénéficier de la pleine puissance du moteur (ex :
            <code className="mx-1 rounded bg-slate-100 px-1">clamp()</code>,<code className="mx-1 rounded bg-slate-100 px-1">rgba()</code>...).
          </li>
          <li>
            Les polices téléversées dans la médiathèque peuvent être intégrées via <code className="rounded bg-slate-100 px-1">@font-face</code>
            dans votre feuille de styles publique ou à l'aide d'un service d'injection externe.
          </li>
          <li>
            Chaque ressource envoyée est stockée dans <strong>Cloudinary / Custom</strong>. Vous pouvez les retoucher, les renommer ou les
            remplacer directement depuis votre console Cloudinary sans casser les liens.
          </li>
        </ul>
      </div>

      <AssetLibraryOverlay
        open={assetLibraryOpen}
        onClose={closeAssetLibrary}
        pendingField={pendingAssetField}
        onPendingFieldUsed={() => setPendingAssetField(null)}
        {...assetState}
      />
    </div>
  );
};

const GuidedHeader: React.FC<{
  activeZone: EditableZoneKey;
  guidedMode: boolean;
  onModeChange: (value: boolean) => void;
  onSelect: (zone: EditableZoneKey) => void;
  steps: ReadonlyArray<{ key: EditableZoneKey; label: string; description: string; helper: string }>;
  zoneStatuses: ZoneStatusRecord;
}> = ({ activeZone, guidedMode, onModeChange, onSelect, steps, zoneStatuses }) => {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {guidedMode ? 'Mode guidé activé' : 'Mode expert'}
          </p>
          <p className="text-xs text-slate-500">
            {guidedMode
              ? 'Suivez chaque étape pour construire une vitrine convaincante en quelques minutes.'
              : 'Accédez rapidement aux réglages sans étapes intermédiaires.'}
          </p>
        </div>
        <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 p-1 text-xs font-medium text-slate-600">
          <button
            type="button"
            onClick={() => onModeChange(true)}
            className={`rounded-full px-3 py-1 transition ${
              guidedMode ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
            }`}
          >
            Mode guidé
          </button>
          <button
            type="button"
            onClick={() => onModeChange(false)}
            className={`rounded-full px-3 py-1 transition ${
              guidedMode ? 'hover:text-slate-900' : 'bg-white text-slate-900 shadow-sm'
            }`}
          >
            Mode expert
          </button>
        </div>
      </div>
      <div className="mt-6 grid gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {steps.map(step => {
          const status = zoneStatuses[step.key];
          const isActive = step.key === activeZone;
          const statusClasses =
            status === 'done'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : status === 'progress'
              ? 'bg-brand-primary/5 text-brand-primary border-brand-primary/20'
              : 'bg-slate-50 text-slate-500 border-transparent';
          const icon = status === 'done' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-500" aria-hidden="true" />
          ) : status === 'progress' ? (
            <Sparkles className="h-5 w-5 text-brand-primary" aria-hidden="true" />
          ) : (
            <Circle className="h-5 w-5 text-slate-300" aria-hidden="true" />
          );

          return (
            <button
              key={step.key}
              type="button"
              onClick={() => onSelect(step.key)}
              className={`flex flex-col rounded-2xl border px-4 py-3 text-left transition ${
                isActive ? 'ring-2 ring-brand-primary/20 shadow-brand-primary/10 border-brand-primary/40 bg-white' : statusClasses
              }`}
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                {icon}
                {step.label}
              </span>
              <span className="mt-1 text-xs text-slate-500">{step.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const Checklist: React.FC<{ items: ChecklistItem[] }> = ({ items }) => (
  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Essentiels</p>
    <ul className="mt-3 space-y-2">
      {items.map((item, index) => (
        <li key={index} className="flex items-center gap-2 text-sm text-slate-600">
          {item.done ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden="true" />
          ) : (
            <Circle className="h-4 w-4 text-slate-300" aria-hidden="true" />
          )}
          <span className={item.done ? 'text-slate-400 line-through' : ''}>{item.label}</span>
        </li>
      ))}
    </ul>
  </div>
);

const FieldCard: React.FC<{
  label: string;
  htmlFor?: string;
  description?: string;
  active?: boolean;
  children: React.ReactNode;
}> = ({ label, htmlFor, description, active = false, children }) => (
  <div
    className={`rounded-2xl border p-4 shadow-sm transition ${
      active
        ? 'border-brand-primary/60 bg-brand-primary/5 ring-1 ring-brand-primary/20'
        : 'border-slate-200 bg-white'
    }`}
  >
    <label
      htmlFor={htmlFor}
      className="text-xs font-semibold uppercase tracking-wide text-slate-500"
    >
      {label}
    </label>
    <div className="mt-2 space-y-2 text-sm text-slate-700">{children}</div>
    {description && <p className="mt-2 text-xs text-slate-500">{description}</p>}
  </div>
);

const SuggestionChips: React.FC<{
  options: readonly string[];
  onSelect: (value: string) => void;
  label?: string;
}> = ({ options, onSelect, label }) => {
  if (options.length === 0) {
    return null;
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      {label && <span className="text-xs font-medium text-slate-400">{label}</span>}
      {options.map(option => (
        <button
          key={option}
          type="button"
          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-brand-primary/40 hover:bg-brand-primary/10 hover:text-brand-primary"
          onClick={() => onSelect(option)}
        >
          <Sparkles className="h-3 w-3" aria-hidden="true" />
          {option}
        </button>
      ))}
    </div>
  );
};

const ColorChip: React.FC<{ value: string; onSelect: (value: string) => void }> = ({ value, onSelect }) => (
  <button
    type="button"
    onClick={() => onSelect(value)}
    className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 shadow-sm transition hover:border-brand-primary/40 hover:text-brand-primary"
  >
    <span
      aria-hidden="true"
      className="h-4 w-4 rounded-full border border-slate-200"
      style={{ backgroundColor: value === 'transparent' ? 'white' : value }}
    />
    {value}
  </button>
);

const MediaInputField: React.FC<{
  field: ImageFieldKey;
  label: string;
  value: string | null;
  imageErrors: Record<ImageFieldKey, string | null>;
  handleImageInputChange: ImageInputHandler;
  handleImageUpload: ImageUploadHandler;
  handleClearImage: ImageClearHandler;
  isUploading: (field: ImageFieldKey) => boolean;
  onOpenAssets: (field: ImageFieldKey) => void;
}> = ({
  field,
  label,
  value,
  imageErrors,
  handleImageInputChange,
  handleImageUpload,
  handleClearImage,
  isUploading,
  onOpenAssets,
}) => (
  <FieldCard label={label} htmlFor={`${field}-input`}>
    <input
      id={`${field}-input`}
      className="ui-input w-full"
      value={value ?? ''}
      onChange={handleImageInputChange(field)}
      placeholder="https://res.cloudinary.com/..."
    />
    <p className="text-xs text-slate-500">{imageWarning}</p>
    {imageErrors[field] && <p className="text-xs text-red-600">{imageErrors[field]}</p>}
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <label className="ui-btn ui-btn-secondary cursor-pointer">
        Importer
        <input
          type="file"
          accept="image/*,video/*,audio/*,.ttf,.otf,.woff,.woff2,.svg"
          className="hidden"
          onChange={event => {
            const file = event.target.files?.[0];
            if (file) {
              void handleImageUpload(field, file);
              event.target.value = '';
            }
          }}
        />
      </label>
      <button type="button" className="ui-btn ui-btn-ghost" onClick={() => onOpenAssets(field)}>
        Médiathèque
      </button>
      <button
        type="button"
        className="ui-btn ui-btn-ghost"
        onClick={() => handleClearImage(field)}
        disabled={!value || isUploading(field)}
      >
        Retirer
      </button>
      {isUploading(field) && (
        <span className="inline-flex items-center gap-2 text-xs text-slate-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> Téléversement…
        </span>
      )}
    </div>
    {value && (
      <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
        <img src={value} alt="Prévisualisation" className="h-32 w-full object-cover" />
      </div>
    )}
  </FieldCard>
);

const ZoneStyleEditor: React.FC<{
  zone: EditableZoneKey;
  style: SectionStyle;
  fontOptions: readonly string[];
  fontSizeOptions: readonly string[];
  handleStyleFontFamilyChange: (zone: EditableZoneKey, value: string) => void;
  handleStyleFontSizeChange: (zone: EditableZoneKey, value: string) => void;
  handleStyleTextColorChange: (zone: EditableZoneKey, value: string) => void;
  handleStyleBackgroundColorChange: (zone: EditableZoneKey, value: string) => void;
  handleStyleBackgroundTypeChange: (
    zone: EditableZoneKey,
    value: SectionStyle['background']['type'],
  ) => void;
  handleImageInputChange: ImageInputHandler;
  handleImageUpload: ImageUploadHandler;
  handleClearImage: ImageClearHandler;
  imageErrors: Record<ImageFieldKey, string | null>;
  isUploading: (field: ImageFieldKey) => boolean;
  onOpenAssets: (field: ImageFieldKey) => void;
}> = ({
  zone,
  style,
  fontOptions,
  fontSizeOptions,
  handleStyleFontFamilyChange,
  handleStyleFontSizeChange,
  handleStyleTextColorChange,
  handleStyleBackgroundColorChange,
  handleStyleBackgroundTypeChange,
  handleImageInputChange,
  handleImageUpload,
  handleClearImage,
  imageErrors,
  isUploading,
  onOpenAssets,
}) => {
  const backgroundField = STYLE_BACKGROUND_FIELD_KEYS[zone];
  const isBackgroundImage = style.background.type === 'image';

  const validateCssValue = useCallback((property: string, value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return { valid: true, message: null } as const;
    }
    if (typeof window === 'undefined' || typeof window.CSS === 'undefined') {
      return { valid: true, message: null } as const;
    }
    return window.CSS.supports(property, trimmed)
      ? { valid: true, message: null }
      : { valid: false, message: 'Cette valeur ne semble pas être reconnue comme une valeur CSS valide.' };
  }, []);

  const fontFamilyValidation = validateCssValue('font-family', style.fontFamily);
  const fontSizeValidation = validateCssValue('font-size', style.fontSize);
  const textColorValidation = validateCssValue('color', style.textColor);
  const backgroundColorValidation =
    style.background.type === 'color'
      ? validateCssValue('background-color', style.background.color)
      : { valid: true, message: null };

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Styles</h3>
      <FieldCard label="Police" htmlFor={`${zone}-font-family`} active={!fontFamilyValidation.valid}>
        <input
          id={`${zone}-font-family`}
          className={`ui-input w-full ${
            fontFamilyValidation.valid ? '' : 'border-red-300 focus:border-red-500 focus:ring-red-500'
          }`}
          value={style.fontFamily}
          onChange={event => handleStyleFontFamilyChange(zone, event.target.value)}
          list={`${zone}-font-family-options`}
          placeholder="Ex: 'Open Sans', sans-serif"
        />
        <datalist id={`${zone}-font-family-options`}>
          {fontOptions.map(font => (
            <option key={font} value={font} />
          ))}
        </datalist>
        {!fontFamilyValidation.valid && (
          <p className="text-xs text-red-600">{fontFamilyValidation.message}</p>
        )}
        <SuggestionChips options={FONT_FAMILY_SUGGESTIONS} onSelect={value => handleStyleFontFamilyChange(zone, value)} />
      </FieldCard>

      <FieldCard label="Taille du texte" htmlFor={`${zone}-font-size`} active={!fontSizeValidation.valid}>
        <input
          id={`${zone}-font-size`}
          className={`ui-input w-full ${
            fontSizeValidation.valid ? '' : 'border-red-300 focus:border-red-500 focus:ring-red-500'
          }`}
          value={style.fontSize}
          onChange={event => handleStyleFontSizeChange(zone, event.target.value)}
          list={`${zone}-font-size-options`}
          placeholder="Ex: 1.125rem"
        />
        <datalist id={`${zone}-font-size-options`}>
          {fontSizeOptions.map(size => (
            <option key={size} value={size} />
          ))}
        </datalist>
        {!fontSizeValidation.valid && (
          <p className="text-xs text-red-600">{fontSizeValidation.message}</p>
        )}
        <SuggestionChips options={FONT_SIZE_SUGGESTIONS} onSelect={value => handleStyleFontSizeChange(zone, value)} />
      </FieldCard>

      <FieldCard label="Couleur du texte" htmlFor={`${zone}-text-color`} active={!textColorValidation.valid}>
        <input
          id={`${zone}-text-color`}
          className={`ui-input w-full ${
            textColorValidation.valid ? '' : 'border-red-300 focus:border-red-500 focus:ring-red-500'
          }`}
          value={style.textColor}
          onChange={event => handleStyleTextColorChange(zone, event.target.value)}
          placeholder="Ex: #0f172a"
        />
        {!textColorValidation.valid && (
          <p className="text-xs text-red-600">{textColorValidation.message}</p>
        )}
        <div className="flex flex-wrap gap-2">
          {COLOR_SUGGESTIONS.map(color => (
            <ColorChip key={color} value={color} onSelect={value => handleStyleTextColorChange(zone, value)} />
          ))}
        </div>
      </FieldCard>

      <FieldCard label="Fond" htmlFor={`${zone}-background-type`}>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            id={`${zone}-background-type`}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              style.background.type === 'color'
                ? 'border-brand-primary/60 bg-brand-primary/10 text-brand-primary'
                : 'border-slate-200 text-slate-600 hover:border-brand-primary/40 hover:text-brand-primary'
            }`}
            onClick={() => handleStyleBackgroundTypeChange(zone, 'color')}
          >
            Couleur
          </button>
          <button
            type="button"
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              style.background.type === 'image'
                ? 'border-brand-primary/60 bg-brand-primary/10 text-brand-primary'
                : 'border-slate-200 text-slate-600 hover:border-brand-primary/40 hover:text-brand-primary'
            }`}
            onClick={() => handleStyleBackgroundTypeChange(zone, 'image')}
          >
            Image
          </button>
        </div>
        {style.background.type === 'color' ? (
          <div className="mt-3 space-y-2">
            <input
              id={`${zone}-background-color`}
              className={`ui-input w-full ${
                backgroundColorValidation.valid ? '' : 'border-red-300 focus:border-red-500 focus:ring-red-500'
              }`}
              value={style.background.color}
              onChange={event => handleStyleBackgroundColorChange(zone, event.target.value)}
              placeholder="Ex: rgba(255, 255, 255, 0.85)"
            />
            {!backgroundColorValidation.valid && (
              <p className="text-xs text-red-600">{backgroundColorValidation.message}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {COLOR_SUGGESTIONS.map(color => (
                <ColorChip key={color} value={color} onSelect={value => handleStyleBackgroundColorChange(zone, value)} />
              ))}
            </div>
          </div>
        ) : (
          <MediaInputField
            field={backgroundField}
            label={IMAGE_FIELD_LABELS[backgroundField]}
            value={style.background.image}
            imageErrors={imageErrors}
            handleImageInputChange={handleImageInputChange}
            handleImageUpload={handleImageUpload}
            handleClearImage={handleClearImage}
            isUploading={isUploading}
            onOpenAssets={onOpenAssets}
          />
        )}
      </FieldCard>
    </div>
  );
};


const ZoneEditorContent: React.FC<{ zone: EditableZoneKey; context: EditorContext }> = ({
  zone,
  context,
}) => {
  const [rankDrafts, setRankDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    setRankDrafts(prev => {
      const next: Record<string, string> = {};
      context.bestSellerProducts.forEach(product => {
        next[product.id] = prev[product.id] ?? (product.best_seller_rank?.toString() ?? '');
      });
      return next;
    });
  }, [context.bestSellerProducts]);

  const handleBestSellerRankChange = useCallback((productId: string, value: string) => {
    if (/^\d*$/.test(value)) {
      setRankDrafts(prev => ({
        ...prev,
        [productId]: value,
      }));
    }
  }, []);

  const handleBestSellerRankSubmit = useCallback(
    async (productId: string) => {
      const product = context.bestSellerProducts.find(item => item.id === productId);
      const currentValue = product?.best_seller_rank?.toString() ?? '';
      const rawValue = (rankDrafts[productId] ?? currentValue).trim();
      if (rawValue === currentValue) {
        return;
      }
      const rankValue = rawValue === '' ? null : Number.parseInt(rawValue, 10);
      if (rawValue !== '' && Number.isNaN(rankValue)) {
        return;
      }
      await context.updateProduct(productId, { best_seller_rank: rankValue });
    },
    [context, rankDrafts],
  );

  const handleBestSellerToggle = useCallback(
    async (productId: string, isBestSeller: boolean) => {
      await context.updateProduct(productId, { is_best_seller: isBestSeller });
    },
    [context],
  );

  if (zone !== 'menu') {
    return null;
  }

  return (
    <div className="space-y-4">
      <FieldCard
        label="Gestion des best sellers"
        description="Ajustez l'ordre et la sélection des produits mis en avant dans la section menu."
      >
        <div className="space-y-3 text-sm">
          <p className="text-xs text-slate-500">
            Les best sellers apparaissent automatiquement dans la prévisualisation à droite.
          </p>
          {context.bestSellerError && <p className="text-xs text-red-600">{context.bestSellerError}</p>}
          {context.bestSellerLoading ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Chargement des best sellers…
            </div>
          ) : context.bestSellerProducts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
              Aucun produit best seller configuré pour le moment.
            </div>
          ) : (
            <div className="space-y-3">
              {context.bestSellerProducts.map(product => {
                const rankDraft = rankDrafts[product.id] ?? '';
                return (
                  <div
                    key={product.id}
                    className="flex flex-col gap-2 rounded-2xl border border-slate-200 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex flex-1 items-center gap-3">
                      <div className="h-12 w-12 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                            Pas d'image
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{product.name}</p>
                        <p className="text-xs text-slate-500">
                          {formatCurrencyCOP(product.price_cents / 100)} · {product.category_name ?? 'Sans catégorie'}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 sm:w-72">
                      <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Position dans la liste
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          className="ui-input w-20"
                          value={rankDraft}
                          onChange={event => handleBestSellerRankChange(product.id, event.target.value)}
                          onBlur={() => void handleBestSellerRankSubmit(product.id)}
                          onKeyDown={event => {
                            if (event.key === 'Enter') {
                              event.preventDefault();
                              void handleBestSellerRankSubmit(product.id);
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="ui-btn ui-btn-secondary"
                          onClick={() => void handleBestSellerRankSubmit(product.id)}
                          disabled={context.isBestSellerUpdating(product.id)}
                        >
                          Mettre à jour
                        </button>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Inclure dans la sélection</span>
                        <button
                          type="button"
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition ${
                            product.is_best_seller
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-600'
                              : 'border-slate-200 text-slate-500 hover:border-brand-primary/40 hover:text-brand-primary'
                          }`}
                          onClick={() => void handleBestSellerToggle(product.id, !product.is_best_seller)}
                        >
                          {product.is_best_seller ? (
                            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                          ) : (
                            <Circle className="h-3.5 w-3.5" aria-hidden="true" />
                          )}
                          {product.is_best_seller ? 'Actif' : 'Désactivé'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </FieldCard>
    </div>
  );
};


type ElementEditorConfig = {
  title: string;
  description?: string;
  content: React.ReactNode;
};

const getElementEditorConfig = (
  element: EditableElementKey,
  context: EditorContext,
  onOpenAssets: (field?: ImageFieldKey) => void,
): ElementEditorConfig | null => {
  const { draft, imageErrors } = context;

  const renderBackgroundEditor = (zone: EditableZoneKey, label?: string) => {
    const style = context.draft[zone].style;
    const backgroundField = STYLE_BACKGROUND_FIELD_KEYS[zone];
    const resolvedLabel = label ?? IMAGE_FIELD_LABELS[backgroundField];
    const validateCssValue = (property: string, value: string) => {
      const trimmed = value.trim();
      if (!trimmed) {
        return { valid: true, message: null } as const;
      }
      if (typeof window === 'undefined' || typeof window.CSS === 'undefined') {
        return { valid: true, message: null } as const;
      }
      return window.CSS.supports(property, trimmed)
        ? { valid: true, message: null }
        : { valid: false, message: 'Cette valeur ne semble pas être reconnue comme une valeur CSS valide.' };
    };

    const backgroundColorValidation =
      style.background.type === 'color'
        ? validateCssValue('background-color', style.background.color)
        : { valid: true, message: null };

    return (
      <FieldCard label={resolvedLabel} htmlFor={`${zone}-background-type`}>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            id={`${zone}-background-type`}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              style.background.type === 'color'
                ? 'border-brand-primary/60 bg-brand-primary/10 text-brand-primary'
                : 'border-slate-200 text-slate-600 hover:border-brand-primary/40 hover:text-brand-primary'
            }`}
            onClick={() => context.handleStyleBackgroundTypeChange(zone, 'color')}
          >
            Couleur
          </button>
          <button
            type="button"
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              style.background.type === 'image'
                ? 'border-brand-primary/60 bg-brand-primary/10 text-brand-primary'
                : 'border-slate-200 text-slate-600 hover:border-brand-primary/40 hover:text-brand-primary'
            }`}
            onClick={() => context.handleStyleBackgroundTypeChange(zone, 'image')}
          >
            Image
          </button>
        </div>
        {style.background.type === 'color' ? (
          <div className="mt-3 space-y-2">
            <input
              id={`${zone}-background-color`}
              className={`ui-input w-full ${
                backgroundColorValidation.valid ? '' : 'border-red-300 focus:border-red-500 focus:ring-red-500'
              }`}
              value={style.background.color}
              onChange={event => context.handleStyleBackgroundColorChange(zone, event.target.value)}
              placeholder="Ex: rgba(255, 255, 255, 0.85)"
            />
            {!backgroundColorValidation.valid && (
              <p className="text-xs text-red-600">{backgroundColorValidation.message}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {COLOR_SUGGESTIONS.map(color => (
                <ColorChip
                  key={color}
                  value={color}
                  onSelect={value => context.handleStyleBackgroundColorChange(zone, value)}
                />
              ))}
            </div>
          </div>
        ) : (
          <MediaInputField
            field={backgroundField}
            label={IMAGE_FIELD_LABELS[backgroundField]}
            value={style.background.image}
            imageErrors={imageErrors}
            handleImageInputChange={context.handleImageInputChange}
            handleImageUpload={context.handleImageUpload}
            handleClearImage={context.handleClearImage}
            isUploading={context.isUploading}
            onOpenAssets={field => onOpenAssets(field)}
          />
        )}
      </FieldCard>
    );
  };

  switch (element) {
    case 'navigation.brand':
      return {
        title: 'Nom de la marque',
        content: (
          <FieldCard label="Nom de la marque" htmlFor="brand-name">
            <input
              id="brand-name"
              className="ui-input w-full"
              value={draft.navigation.brand}
              onChange={context.handleBrandChange}
            />
            <SuggestionChips options={NAVIGATION_BRAND_SUGGESTIONS} onSelect={context.setBrandValue} />
          </FieldCard>
        ),
      };
    case 'navigation.links.home':
    case 'navigation.links.about':
    case 'navigation.links.menu':
    case 'navigation.links.contact': {
      const key = element.split('.')[2] as NavigationFieldKey;
      const label = `Lien ${NAVIGATION_LINK_SUGGESTIONS[key][0] ?? key}`;
      return {
        title: label,
        content: (
          <FieldCard label={label} htmlFor={`nav-${key}`}>
            <input
              id={`nav-${key}`}
              className="ui-input w-full"
              value={draft.navigation.links[key]}
              onChange={context.handleNavigationChange(key)}
            />
            <SuggestionChips
              options={NAVIGATION_LINK_SUGGESTIONS[key]}
              onSelect={value => context.setNavigationLinkValue(key, value)}
            />
          </FieldCard>
        ),
      };
    }
    case 'navigation.links.loginCta':
      return {
        title: "Bouton d'accès équipe",
        content: (
          <FieldCard label="Bouton d'accès équipe" htmlFor="nav-login">
            <input
              id="nav-login"
              className="ui-input w-full"
              value={draft.navigation.links.loginCta}
              onChange={context.handleNavigationChange('loginCta')}
            />
            <SuggestionChips
              options={NAVIGATION_LINK_SUGGESTIONS.loginCta}
              onSelect={value => context.setNavigationLinkValue('loginCta', value)}
            />
          </FieldCard>
        ),
      };
    case 'navigation.brandLogo':
      return {
        title: 'Logo principal',
        content: (
          <MediaInputField
            field="navigation.brandLogo"
            label={IMAGE_FIELD_LABELS['navigation.brandLogo']}
            value={draft.navigation.brandLogo}
            imageErrors={imageErrors}
            handleImageInputChange={context.handleImageInputChange}
            handleImageUpload={context.handleImageUpload}
            handleClearImage={context.handleClearImage}
            isUploading={context.isUploading}
            onOpenAssets={field => onOpenAssets(field)}
          />
        ),
      };
    case 'navigation.staffLogo':
      return {
        title: "Logo d'accès équipe",
        content: (
          <MediaInputField
            field="navigation.staffLogo"
            label={IMAGE_FIELD_LABELS['navigation.staffLogo']}
            value={draft.navigation.staffLogo}
            imageErrors={imageErrors}
            handleImageInputChange={context.handleImageInputChange}
            handleImageUpload={context.handleImageUpload}
            handleClearImage={context.handleClearImage}
            isUploading={context.isUploading}
            onOpenAssets={field => onOpenAssets(field)}
          />
        ),
      };
    case 'navigation.style.background':
      return {
        title: IMAGE_FIELD_LABELS['navigation.style.background'],
        content: renderBackgroundEditor('navigation'),
      };
    case 'hero.title':
      return {
        title: 'Titre principal',
        content: (
          <FieldCard label="Titre principal" htmlFor="hero-title">
            <input
              id="hero-title"
              className="ui-input w-full"
              value={draft.hero.title}
              onChange={context.handleHeroFieldChange('title')}
            />
            <SuggestionChips
              options={HERO_TITLE_SUGGESTIONS}
              onSelect={value => context.setHeroFieldValue('title', value)}
            />
          </FieldCard>
        ),
      };
    case 'hero.subtitle':
      return {
        title: 'Sous-titre',
        content: (
          <FieldCard label="Sous-titre" htmlFor="hero-subtitle">
            <textarea
              id="hero-subtitle"
              className="ui-textarea w-full"
              rows={3}
              value={draft.hero.subtitle}
              onChange={context.handleHeroFieldChange('subtitle')}
            />
            <SuggestionChips
              options={HERO_SUBTITLE_SUGGESTIONS}
              onSelect={value => context.setHeroFieldValue('subtitle', value)}
            />
          </FieldCard>
        ),
      };
    case 'hero.ctaLabel':
      return {
        title: 'CTA principal',
        content: (
          <FieldCard label="CTA principal" htmlFor="hero-cta">
            <input
              id="hero-cta"
              className="ui-input w-full"
              value={draft.hero.ctaLabel}
              onChange={context.handleHeroFieldChange('ctaLabel')}
            />
            <SuggestionChips
              options={HERO_CTA_SUGGESTIONS}
              onSelect={value => context.setHeroFieldValue('ctaLabel', value)}
            />
          </FieldCard>
        ),
      };
    case 'hero.reorderCtaLabel':
      return {
        title: 'CTA historique',
        content: (
          <FieldCard label="CTA historique" htmlFor="hero-reorder">
            <input
              id="hero-reorder"
              className="ui-input w-full"
              value={draft.hero.reorderCtaLabel}
              onChange={context.handleHeroFieldChange('reorderCtaLabel')}
            />
            <SuggestionChips
              options={HERO_REORDER_SUGGESTIONS}
              onSelect={value => context.setHeroFieldValue('reorderCtaLabel', value)}
            />
          </FieldCard>
        ),
      };
    case 'hero.historyTitle':
      return {
        title: 'Titre du bloc historique',
        content: (
          <FieldCard label="Titre du bloc historique" htmlFor="hero-history">
            <input
              id="hero-history"
              className="ui-input w-full"
              value={draft.hero.historyTitle}
              onChange={context.handleHeroFieldChange('historyTitle')}
            />
            <SuggestionChips
              options={HERO_HISTORY_TITLE_SUGGESTIONS}
              onSelect={value => context.setHeroFieldValue('historyTitle', value)}
            />
          </FieldCard>
        ),
      };
    case 'hero.backgroundImage':
      return {
        title: 'Visuel de fond',
        content: (
          <MediaInputField
            field="hero.backgroundImage"
            label={IMAGE_FIELD_LABELS['hero.backgroundImage']}
            value={draft.hero.backgroundImage}
            imageErrors={imageErrors}
            handleImageInputChange={context.handleImageInputChange}
            handleImageUpload={context.handleImageUpload}
            handleClearImage={context.handleClearImage}
            isUploading={context.isUploading}
            onOpenAssets={field => onOpenAssets(field)}
          />
        ),
      };
    case 'hero.style.background':
      return {
        title: IMAGE_FIELD_LABELS['hero.style.background'],
        content: renderBackgroundEditor('hero'),
      };
    case 'about.title':
      return {
        title: 'Titre',
        content: (
          <FieldCard label="Titre" htmlFor="about-title">
            <input
              id="about-title"
              className="ui-input w-full"
              value={draft.about.title}
              onChange={context.handleAboutTitleChange}
            />
            <SuggestionChips options={ABOUT_TITLE_SUGGESTIONS} onSelect={context.setAboutTitleValue} />
          </FieldCard>
        ),
      };
    case 'about.description':
      return {
        title: 'Description',
        content: (
          <FieldCard label="Description" htmlFor="about-description">
            <textarea
              id="about-description"
              className="ui-textarea w-full"
              rows={4}
              value={draft.about.description}
              onChange={context.handleAboutChange}
            />
            <SuggestionChips options={ABOUT_DESCRIPTION_SUGGESTIONS} onSelect={context.setAboutDescriptionValue} />
          </FieldCard>
        ),
      };
    case 'about.image':
      return {
        title: 'Image de section',
        content: (
          <MediaInputField
            field="about.image"
            label={IMAGE_FIELD_LABELS['about.image']}
            value={draft.about.image}
            imageErrors={imageErrors}
            handleImageInputChange={context.handleImageInputChange}
            handleImageUpload={context.handleImageUpload}
            handleClearImage={context.handleClearImage}
            isUploading={context.isUploading}
            onOpenAssets={field => onOpenAssets(field)}
          />
        ),
      };
    case 'about.style.background':
      return {
        title: IMAGE_FIELD_LABELS['about.style.background'],
        content: renderBackgroundEditor('about'),
      };
    case 'menu.title':
      return {
        title: 'Titre',
        content: (
          <FieldCard label="Titre" htmlFor="menu-title">
            <input
              id="menu-title"
              className="ui-input w-full"
              value={draft.menu.title}
              onChange={context.handleMenuFieldChange('title')}
            />
          </FieldCard>
        ),
      };
    case 'menu.ctaLabel':
      return {
        title: 'CTA',
        content: (
          <FieldCard label="CTA" htmlFor="menu-cta">
            <input
              id="menu-cta"
              className="ui-input w-full"
              value={draft.menu.ctaLabel}
              onChange={context.handleMenuFieldChange('ctaLabel')}
            />
            <SuggestionChips options={MENU_CTA_SUGGESTIONS} onSelect={value => context.setMenuFieldValue('ctaLabel', value)} />
          </FieldCard>
        ),
      };
    case 'menu.loadingLabel':
      return {
        title: 'Message de chargement',
        content: (
          <FieldCard label="Message de chargement" htmlFor="menu-loading">
            <input
              id="menu-loading"
              className="ui-input w-full"
              value={draft.menu.loadingLabel}
              onChange={context.handleMenuFieldChange('loadingLabel')}
            />
            <SuggestionChips
              options={MENU_LOADING_SUGGESTIONS}
              onSelect={value => context.setMenuFieldValue('loadingLabel', value)}
            />
          </FieldCard>
        ),
      };
    case 'menu.image':
      return {
        title: 'Visuel de la section menu',
        content: (
          <MediaInputField
            field="menu.image"
            label={IMAGE_FIELD_LABELS['menu.image']}
            value={draft.menu.image}
            imageErrors={imageErrors}
            handleImageInputChange={context.handleImageInputChange}
            handleImageUpload={context.handleImageUpload}
            handleClearImage={context.handleClearImage}
            isUploading={context.isUploading}
            onOpenAssets={field => onOpenAssets(field)}
          />
        ),
      };
    case 'menu.style.background':
      return {
        title: IMAGE_FIELD_LABELS['menu.style.background'],
        content: renderBackgroundEditor('menu'),
      };
    case 'contact.title':
      return {
        title: 'Titre',
        content: (
          <FieldCard label="Titre" htmlFor="contact-title">
            <input
              id="contact-title"
              className="ui-input w-full"
              value={draft.contact.title}
              onChange={context.handleContactFieldChange('title')}
            />
          </FieldCard>
        ),
      };
    case 'contact.addressLabel':
      return {
        title: 'Label adresse',
        content: (
          <FieldCard label="Label adresse" htmlFor="contact-address-label">
            <input
              id="contact-address-label"
              className="ui-input w-full"
              value={draft.contact.addressLabel}
              onChange={context.handleContactFieldChange('addressLabel')}
            />
          </FieldCard>
        ),
      };
    case 'contact.address':
      return {
        title: 'Adresse',
        content: (
          <FieldCard label="Adresse" htmlFor="contact-address">
            <input
              id="contact-address"
              className="ui-input w-full"
              value={draft.contact.address}
              onChange={context.handleContactFieldChange('address')}
            />
            <SuggestionChips
              options={CONTACT_ADDRESS_SUGGESTIONS}
              onSelect={value => context.setContactFieldValue('address', value)}
            />
          </FieldCard>
        ),
      };
    case 'contact.phoneLabel':
      return {
        title: 'Label téléphone',
        content: (
          <FieldCard label="Label téléphone" htmlFor="contact-phone-label">
            <input
              id="contact-phone-label"
              className="ui-input w-full"
              value={draft.contact.phoneLabel}
              onChange={context.handleContactFieldChange('phoneLabel')}
            />
          </FieldCard>
        ),
      };
    case 'contact.phone':
      return {
        title: 'Téléphone',
        content: (
          <FieldCard label="Téléphone" htmlFor="contact-phone">
            <input
              id="contact-phone"
              className="ui-input w-full"
              value={draft.contact.phone}
              onChange={context.handleContactFieldChange('phone')}
            />
            <SuggestionChips
              options={CONTACT_PHONE_SUGGESTIONS}
              onSelect={value => context.setContactFieldValue('phone', value)}
            />
          </FieldCard>
        ),
      };
    case 'contact.emailLabel':
      return {
        title: 'Label email',
        content: (
          <FieldCard label="Label email" htmlFor="contact-email-label">
            <input
              id="contact-email-label"
              className="ui-input w-full"
              value={draft.contact.emailLabel}
              onChange={context.handleContactFieldChange('emailLabel')}
            />
          </FieldCard>
        ),
      };
    case 'contact.email':
      return {
        title: 'Email',
        content: (
          <FieldCard label="Email" htmlFor="contact-email">
            <input
              id="contact-email"
              className="ui-input w-full"
              value={draft.contact.email}
              onChange={context.handleContactFieldChange('email')}
            />
            <SuggestionChips
              options={CONTACT_EMAIL_SUGGESTIONS}
              onSelect={value => context.setContactFieldValue('email', value)}
            />
          </FieldCard>
        ),
      };
    case 'contact.image':
      return {
        title: 'Visuel de la section contact',
        content: (
          <MediaInputField
            field="contact.image"
            label={IMAGE_FIELD_LABELS['contact.image']}
            value={draft.contact.image}
            imageErrors={imageErrors}
            handleImageInputChange={context.handleImageInputChange}
            handleImageUpload={context.handleImageUpload}
            handleClearImage={context.handleClearImage}
            isUploading={context.isUploading}
            onOpenAssets={field => onOpenAssets(field)}
          />
        ),
      };
    case 'contact.style.background':
      return {
        title: IMAGE_FIELD_LABELS['contact.style.background'],
        content: renderBackgroundEditor('contact'),
      };
    case 'footer.text':
      return {
        title: 'Texte de pied de page',
        content: (
          <FieldCard label="Texte" htmlFor="footer-text">
            <input
              id="footer-text"
              className="ui-input w-full"
              value={draft.footer.text}
              onChange={context.handleFooterTextChange}
            />
            <SuggestionChips options={FOOTER_TEXT_SUGGESTIONS} onSelect={context.setFooterTextValue} />
          </FieldCard>
        ),
      };
    case 'footer.style.background':
      return {
        title: IMAGE_FIELD_LABELS['footer.style.background'],
        content: renderBackgroundEditor('footer'),
      };
    default:
      return null;
  }
};

const ElementEditorModal: React.FC<{
  active: ActiveElementState | null;
  context: EditorContext;
  onClose: () => void;
  onOpenAssets: (field?: ImageFieldKey) => void;
}> = ({ active, context, onClose, onOpenAssets }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<{
    top: number | string;
    left: number | string;
    transform?: string;
    width: number;
  }>({
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 360,
  });

  useLayoutEffect(() => {
    if (!active) {
      return;
    }

    const updatePosition = () => {
      if (typeof window === 'undefined') {
        return;
      }
      const width = Math.min(420, window.innerWidth - 32);
      if (active.anchor) {
        const anchor = active.anchor;
        const left = Math.min(
          Math.max(16, anchor.left + anchor.width / 2 - width / 2),
          Math.max(16, window.innerWidth - width - 16),
        );
        const top = Math.min(Math.max(16, anchor.bottom + 12), Math.max(16, window.innerHeight - 16));
        setPosition({ top, left, width });
      } else {
        setPosition({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [active]);

  useEffect(() => {
    if (!active) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      } else if (event.key === 'Tab') {
        const container = containerRef.current;
        if (!container) {
          return;
        }
        const focusable = Array.from(
          container.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          ),
        );
        if (focusable.length === 0) {
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey) {
          if (document.activeElement === first || !container.contains(document.activeElement)) {
            last.focus();
            event.preventDefault();
          }
        } else if (document.activeElement === last) {
          first.focus();
          event.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [active, onClose]);

  useEffect(() => {
    if (!active) {
      return;
    }
    const frame = window.setTimeout(() => {
      const container = containerRef.current;
      if (!container) {
        return;
      }
      const focusTarget =
        container.querySelector<HTMLElement>(
          'input, textarea, select, button:not([data-close="true"]), [tabindex]:not([tabindex="-1"])',
        ) ?? container;
      focusTarget.focus({ preventScroll: true });
    }, 0);
    return () => window.clearTimeout(frame);
  }, [active]);

  if (!active) {
    return null;
  }

  const zone = resolveZoneFromElement(active.element);
  const zoneMetadata = ZONE_STEPS.find(step => step.key === zone);
  const config = getElementEditorConfig(active.element, context, onOpenAssets);

  if (!config) {
    return null;
  }

  const dialogStyle: React.CSSProperties = {
    position: 'absolute',
    top: position.top,
    left: position.left,
    width: position.width,
    maxWidth: 'calc(100% - 32px)',
  };

  if (position.transform) {
    dialogStyle.transform = position.transform;
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-slate-900/40" aria-hidden="true" onClick={onClose} />
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="element-editor-title"
        aria-describedby={config.description ? 'element-editor-description' : undefined}
        className="pointer-events-auto"
        style={dialogStyle}
        tabIndex={-1}
      >
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl focus:outline-none">
          <header className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              {zoneMetadata && (
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-primary">
                  {zoneMetadata.label}
                </p>
              )}
              <h2 id="element-editor-title" className="text-lg font-semibold text-slate-900">
                {config.title}
              </h2>
              {config.description && (
                <p id="element-editor-description" className="text-sm text-slate-500">
                  {config.description}
                </p>
              )}
            </div>
            <button
              type="button"
              data-close="true"
              onClick={onClose}
              className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
              aria-label="Fermer l’éditeur"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </header>
          <div className="mt-4 space-y-4">{config.content}</div>
          <footer className="mt-6 flex justify-end">
            <button type="button" className="ui-btn ui-btn-secondary" onClick={onClose}>
              Fermer
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
};

const FloatingZoneEditor: React.FC<{
  zone: EditableZoneKey;
  guidedMode: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
  checklist: ChecklistItem[];
  zoneStatuses: ZoneStatusRecord;
  onClose: () => void;
  onNavigate: (zone: EditableZoneKey) => void;
  onOpenAssets: (field?: ImageFieldKey) => void;
  context: EditorContext;
}> = ({
  zone,
  guidedMode,
  containerRef,
  checklist,
  zoneStatuses,
  onClose,
  onNavigate,
  onOpenAssets,
  context,
}) => {
  const metadata = ZONE_STEPS.find(step => step.key === zone)!;
  const currentIndex = ZONE_ORDER.indexOf(zone);
  const previousZone = currentIndex > 0 ? ZONE_ORDER[currentIndex - 1] : null;
  const nextZone = currentIndex < ZONE_ORDER.length - 1 ? ZONE_ORDER[currentIndex + 1] : null;
  const status = zoneStatuses[zone];
  const statusLabel =
    status === 'done' ? 'Complet' : status === 'progress' ? 'En cours' : 'À compléter';
  const statusClasses =
    status === 'done'
      ? 'bg-emerald-50 text-emerald-600'
      : status === 'progress'
      ? 'bg-brand-primary/10 text-brand-primary'
      : 'bg-slate-100 text-slate-500';

  const [cardStyle, setCardStyle] = useState<{ top: number; left: number; width: number }>({
    top: 24,
    left: 24,
    width: 420,
  });
  const [showHelper, setShowHelper] = useState(false);

  useEffect(() => setShowHelper(false), [zone]);

  useLayoutEffect(() => {
    const updatePosition = () => {
      const container = containerRef.current;
      if (!container) {
        return;
      }
      const containerRect = container.getBoundingClientRect();
      const width = Math.min(420, containerRect.width - 32);
      const left = Math.min(
        Math.max(16, containerRect.width / 2 - width / 2),
        Math.max(16, containerRect.width - width - 16),
      );
      const top = 24;
      setCardStyle({ top, left, width });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [containerRef, zone]);

  if (!containerRef.current) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-40">
      <div
        className="pointer-events-auto"
        style={{
          position: 'absolute',
          top: cardStyle.top,
          left: cardStyle.left,
          width: cardStyle.width,
          maxWidth: 'calc(100% - 32px)',
        }}
      >
        <div className="rounded-[28px] border border-slate-200 bg-white/95 p-6 shadow-xl backdrop-blur">
          <header className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-primary">
                <span>
                  Étape {currentIndex + 1}/{ZONE_ORDER.length}
                </span>
                <span className={`rounded-full px-3 py-1 text-[10px] font-medium ${statusClasses}`}>{statusLabel}</span>
              </div>
              <h2 className="text-lg font-semibold text-slate-900">{metadata.label}</h2>
              <p className="text-sm text-slate-500">{metadata.description}</p>
              <button
                type="button"
                className="inline-flex items-center gap-2 text-xs font-medium text-brand-primary hover:text-brand-primary/80"
                onClick={() => setShowHelper(prev => !prev)}
              >
                <HelpCircle className="h-4 w-4" aria-hidden="true" /> Aide rapide
              </button>
              {showHelper && (
                <div className="rounded-2xl border border-brand-primary/20 bg-brand-primary/5 p-3 text-xs text-brand-primary">
                  {metadata.helper}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
              aria-label="Fermer l’éditeur"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </header>

          <div className="mt-5 space-y-6">
            {guidedMode && <Checklist items={checklist} />}
            <ZoneEditorContent zone={zone} context={context} />
            <ZoneStyleEditor
              zone={zone}
              style={context.draft[zone].style}
              fontOptions={context.fontOptions}
              fontSizeOptions={context.fontSizeOptions}
              handleStyleFontFamilyChange={context.handleStyleFontFamilyChange}
              handleStyleFontSizeChange={context.handleStyleFontSizeChange}
              handleStyleTextColorChange={context.handleStyleTextColorChange}
              handleStyleBackgroundColorChange={context.handleStyleBackgroundColorChange}
              handleStyleBackgroundTypeChange={context.handleStyleBackgroundTypeChange}
              handleImageInputChange={context.handleImageInputChange}
              handleImageUpload={context.handleImageUpload}
              handleClearImage={context.handleClearImage}
              imageErrors={context.imageErrors}
              isUploading={context.isUploading}
              onOpenAssets={field => onOpenAssets(field)}
            />
          </div>

          <footer className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {previousZone ? (
              <button
                type="button"
                className="ui-btn ui-btn-ghost"
                onClick={() => onNavigate(previousZone)}
              >
                Retour
              </button>
            ) : (
              <span className="text-xs text-slate-400">Vous êtes au début du parcours guidé</span>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className="ui-btn ui-btn-secondary" onClick={() => onOpenAssets()}>
                Médiathèque
              </button>
              <button
                type="button"
                className="ui-btn ui-btn-primary inline-flex items-center gap-1"
                onClick={() => {
                  if (nextZone) {
                    onNavigate(nextZone);
                  } else {
                    onClose();
                  }
                }}
              >
                {nextZone ? 'Étape suivante' : 'Terminer'}
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

const AssetLibraryOverlay: React.FC<{
  open: boolean;
  onClose: () => void;
  assets: CustomizationAsset[];
  uploading: boolean;
  error: string | null;
  onUpload: AssetUploadHandler;
  onRemove: AssetRemoveHandler;
  onRename: AssetRenameHandler;
  onApply: AssetApplyHandler;
  pendingField: ImageFieldKey | null;
  onPendingFieldUsed: () => void;
}> = ({
  open,
  onClose,
  assets,
  uploading,
  error,
  onUpload,
  onRemove,
  onRename,
  onApply,
  pendingField,
  onPendingFieldUsed,
}) => {
  const [filter, setFilter] = useState<'all' | CustomizationAssetType>('all');
  const [selectedField, setSelectedField] = useState<Record<string, ImageFieldKey | ''>>({});
  const [multiTargets, setMultiTargets] = useState<Record<string, ImageFieldKey[]>>({});
  const [copiedAssetId, setCopiedAssetId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    setCopiedAssetId(null);
  }, [open]);

  useEffect(() => {
    if (!open || !pendingField) {
      return;
    }
    setSelectedField(prev => {
      const next = { ...prev };
      assets.forEach(asset => {
        if (!next[asset.id]) {
          next[asset.id] = pendingField;
        }
      });
      return next;
    });
  }, [open, pendingField, assets]);

  const imageFieldEntries = useMemo(
    () => (Object.entries(IMAGE_FIELD_LABELS) as [ImageFieldKey, string][]),
    [],
  );

  const filteredAssets = useMemo(
    () => (filter === 'all' ? assets : assets.filter(asset => asset.type === filter)),
    [assets, filter],
  );

  const handleCopy = async (asset: CustomizationAsset) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(asset.url);
        setCopiedAssetId(asset.id);
      }
    } catch (clipboardError) {
      console.warn('Clipboard copy failed', clipboardError);
    }
  };

  const applyAsset = (field: ImageFieldKey, asset: CustomizationAsset) => {
    onApply(field, asset);
    if (pendingField && pendingField === field) {
      onPendingFieldUsed();
    }
  };

  const applyMultiple = (asset: CustomizationAsset) => {
    const targets = multiTargets[asset.id] ?? [];
    targets.forEach(field => applyAsset(field, asset));
    setMultiTargets(prev => ({ ...prev, [asset.id]: [] }));
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="relative w-full max-w-5xl rounded-[32px] bg-white p-6 shadow-2xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Médiathèque personnalisée</h2>
            <p className="text-sm text-slate-500">
              Glissez vos visuels, vidéos, polices ou sons pour les réutiliser instantanément dans toutes les sections du site.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
            aria-label="Fermer la médiathèque"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>

        <div className="mt-6 rounded-3xl border border-dashed border-slate-200 bg-slate-50/80 p-4">
          <label className="flex cursor-pointer flex-col items-start gap-2 text-sm text-slate-600">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-medium text-brand-primary">
              <Upload className="h-3.5 w-3.5" aria-hidden="true" /> Importer depuis mon ordinateur
            </span>
            <span className="text-xs text-slate-400">
              Formats acceptés : images, vidéos, audio, polices, fichiers compressés…
            </span>
            <input
              type="file"
              className="hidden"
              multiple
              accept="image/*,video/*,audio/*,.ttf,.otf,.woff,.woff2,.zip,.svg,.json,.pdf"
              onChange={event => {
                void onUpload(event.target.files);
                event.target.value = '';
              }}
            />
          </label>
          {uploading && (
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Téléversement en cours…
            </div>
          )}
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600">
          {(['all', 'image', 'video', 'audio', 'font', 'raw'] as const).map(key => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`rounded-full border px-3 py-1 transition ${
                filter === key
                  ? 'border-brand-primary/60 bg-brand-primary/10 text-brand-primary'
                  : 'border-slate-200 text-slate-500 hover:border-brand-primary/40 hover:text-brand-primary'
              }`}
            >
              {key === 'all' ? 'Tous' : ASSET_TYPE_LABELS[key]}
            </button>
          ))}
        </div>

        {filteredAssets.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/80 p-6 text-center text-sm text-slate-500">
            {assets.length === 0
              ? 'Aucune ressource personnalisée pour le moment. Importez vos premiers fichiers pour les retrouver ici.'
              : 'Aucune ressource ne correspond à ce filtre.'}
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAssets.map(asset => {
              const isNew = Date.now() - new Date(asset.createdAt).getTime() < 1000 * 60 * 10;
              const field = selectedField[asset.id] ?? '';
              const multi = multiTargets[asset.id] ?? [];
              return (
                <div key={asset.id} className="flex h-full flex-col rounded-3xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                        <AssetTypeIcon type={asset.type} />
                      </span>
                      <div className="min-w-0">
                        <input
                          className="w-full truncate rounded-md border border-transparent px-0 text-base font-semibold text-slate-900 focus:border-slate-300 focus:px-2 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                          value={asset.name}
                          onChange={event => onRename(asset.id, event.target.value)}
                        />
                        <p className="text-xs text-slate-500">
                          {ASSET_TYPE_LABELS[asset.type]} · {formatBytes(asset.bytes)} ·{' '}
                          {new Date(asset.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {isNew && (
                      <span className="rounded-full bg-brand-primary/10 px-2 py-0.5 text-[10px] font-medium text-brand-primary">
                        Nouveau
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                    {asset.type === 'image' ? (
                      <img src={asset.url} alt={asset.name} className="h-40 w-full object-cover" />
                    ) : (
                      <div className="flex h-40 items-center justify-center text-slate-400">
                        <AssetTypeIcon type={asset.type} />
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <LinkIcon className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="truncate" title={asset.url}>
                        {asset.url}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        className="ui-select flex-1"
                        value={field}
                        onChange={event =>
                          setSelectedField(prev => ({
                            ...prev,
                            [asset.id]: event.target.value as ImageFieldKey,
                          }))
                        }
                      >
                        <option value="">Choisir une section…</option>
                        {imageFieldEntries.map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="ui-btn ui-btn-primary"
                        disabled={!field}
                        onClick={() => {
                          if (field) {
                            applyAsset(field as ImageFieldKey, asset);
                          }
                        }}
                      >
                        Utiliser
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <button
                        type="button"
                        className="ui-btn ui-btn-ghost"
                        onClick={() => handleCopy(asset)}
                      >
                        {copiedAssetId === asset.id ? 'Lien copié !' : 'Copier le lien'}
                      </button>
                      <button
                        type="button"
                        className="ui-btn ui-btn-ghost"
                        onClick={() => onRemove(asset.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Supprimer
                      </button>
                    </div>
                    <details className="group rounded-2xl border border-slate-200 p-3 text-xs text-slate-600">
                      <summary className="flex cursor-pointer items-center justify-between font-medium text-slate-700">
                        Dupliquer dans…
                      </summary>
                      <div className="mt-3 space-y-2">
                        {imageFieldEntries.map(([key, label]) => {
                          const selected = multi.includes(key);
                          return (
                            <label key={key} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                className="rounded border-slate-300 text-brand-primary focus:ring-brand-primary"
                                checked={selected}
                                onChange={() =>
                                  setMultiTargets(prev => {
                                    const current = new Set(prev[asset.id] ?? []);
                                    if (current.has(key)) {
                                      current.delete(key);
                                    } else {
                                      current.add(key);
                                    }
                                    return {
                                      ...prev,
                                      [asset.id]: Array.from(current),
                                    };
                                  })
                                }
                              />
                              <span>{label}</span>
                            </label>
                          );
                        })}
                        <button
                          type="button"
                          className="ui-btn ui-btn-secondary w-full"
                          disabled={(multiTargets[asset.id] ?? []).length === 0}
                          onClick={() => applyMultiple(asset)}
                        >
                          Appliquer aux sections sélectionnées
                        </button>
                      </div>
                    </details>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};


export default SiteCustomization;

