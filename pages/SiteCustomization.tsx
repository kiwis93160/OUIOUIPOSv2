import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import useSiteContent, { DEFAULT_SITE_CONTENT } from '../hooks/useSiteContent';
import {
  CustomizationAsset,
  CustomizationAssetType,
  SectionStyle,
  SiteContent,
} from '../types';
import { normalizeCloudinaryImageUrl, uploadCustomizationAsset } from '../services/cloudinary';
import { resolveSiteContent } from '../utils/siteContent';
import SitePreviewCanvas, {
  EditableElementKey,
  EditableZoneKey,
} from '../components/SitePreviewCanvas';
import {
  Archive,
  Copy,
  Image as ImageIcon,
  Link as LinkIcon,
  Loader2,
  Music,
  Trash2,
  Type as TypeIcon,
  Upload,
  Video,
} from 'lucide-react';

const imageWarning = "L'URL doit provenir de Cloudinary (https://*.cloudinary.com).";

const BACKGROUND_TYPE_OPTIONS: { value: SectionStyle['background']['type']; label: string }[] = [
  { value: 'color', label: 'Couleur' },
  { value: 'image', label: 'Image' },
];

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

type StyleImageFieldKey =
  | 'navigation.style.background'
  | 'hero.style.background'
  | 'about.style.background'
  | 'menu.style.background'
  | 'contact.style.background'
  | 'footer.style.background';

type ImageFieldKey =
  | 'hero.backgroundImage'
  | 'about.image'
  | 'menu.image'
  | 'contact.image'
  | StyleImageFieldKey;

type HeroFieldKey = Exclude<keyof SiteContent['hero'], 'backgroundImage' | 'style'>;
type MenuFieldKey = Exclude<keyof SiteContent['menu'], 'image' | 'style'>;
type ContactFieldKey = Exclude<keyof SiteContent['contact'], 'image' | 'style'>;
type NavigationFieldKey = keyof SiteContent['navigation']['links'];

type PanelSectionKey = EditableZoneKey | 'assets';

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

type CustomizationPanelProps = {
  draft: SiteContent;
  activeElement: EditableElementKey | null;
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
  assetState: {
    uploading: boolean;
    error: string | null;
    assets: CustomizationAsset[];
    onUpload: AssetUploadHandler;
    onRemove: AssetRemoveHandler;
    onRename: AssetRenameHandler;
    onApply: AssetApplyHandler;
  };
};

type ImageFieldEditorProps = {
  field: ImageFieldKey;
  label: string;
  value: string | null;
  imageErrors: Record<ImageFieldKey, string | null>;
  handleImageInputChange: ImageInputHandler;
  handleImageUpload: ImageUploadHandler;
  handleClearImage: ImageClearHandler;
  isUploading: (field: ImageFieldKey) => boolean;
};

type StyleControlsProps = {
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
};

const STYLE_BACKGROUND_FIELD_KEYS: Record<EditableZoneKey, StyleImageFieldKey> = {
  navigation: 'navigation.style.background',
  hero: 'hero.style.background',
  about: 'about.style.background',
  menu: 'menu.style.background',
  contact: 'contact.style.background',
  footer: 'footer.style.background',
};

const resolveZoneFromElement = (element: EditableElementKey): EditableZoneKey => {
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

const IMAGE_FIELD_LABELS: Record<ImageFieldKey, string> = {
  'hero.backgroundImage': 'Visuel de fond (hero)',
  'about.image': 'Image de la section À propos',
  'menu.image': 'Image de la section Menu',
  'contact.image': 'Image de la section Contact',
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
  const [activeElement, setActiveElement] = useState<EditableElementKey | null>(null);
  const [assetUploading, setAssetUploading] = useState(false);
  const [assetError, setAssetError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(content);
    setIsDirty(false);
    setStatusMessage(null);
    setFormError(null);
    setImageErrors({ ...INITIAL_IMAGE_ERRORS });
    setAssetError(null);
  }, [content]);

  useEffect(() => {
    if (!activeElement) {
      return;
    }
    const targetId = EDITABLE_ELEMENT_INPUT_IDS[activeElement];
    if (!targetId) {
      return;
    }
    const element = document.getElementById(targetId);
    if (element instanceof HTMLElement) {
      element.focus({ preventScroll: true });
    }
  }, [activeElement]);

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

  const handleNavigationChange: NavigationChangeHandler = key => event => {
    const value = event.target.value;
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

  const handleBrandChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    mutateDraft(prev => ({
      ...prev,
      navigation: {
        ...prev.navigation,
        brand: value,
      },
    }));
  };

  const handleHeroFieldChange: HeroChangeHandler = key => event => {
    const value = event.target.value;
    mutateDraft(prev => ({
      ...prev,
      hero: {
        ...prev.hero,
        [key]: value,
      },
    }));
  };

  const handleAboutChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    mutateDraft(prev => ({
      ...prev,
      about: {
        ...prev.about,
        description: value,
      },
    }));
  };

  const handleAboutTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    mutateDraft(prev => ({
      ...prev,
      about: {
        ...prev.about,
        title: value,
      },
    }));
  };

  const handleMenuFieldChange: MenuChangeHandler = key => event => {
    const value = event.target.value;
    mutateDraft(prev => ({
      ...prev,
      menu: {
        ...prev.menu,
        [key]: value,
      },
    }));
  };

  const handleContactFieldChange: ContactChangeHandler = key => event => {
    const value = event.target.value;
    mutateDraft(prev => ({
      ...prev,
      contact: {
        ...prev.contact,
        [key]: value,
      },
    }));
  };

  const handleFooterTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    mutateDraft(prev => ({
      ...prev,
      footer: {
        ...prev.footer,
        text: value,
      },
    }));
  };

  const handleStyleFontFamilyChange = (zone: EditableZoneKey, value: string) => {
    updateZoneStyle(zone, style => ({
      ...style,
      fontFamily: value,
    }));
  };

  const handleStyleFontSizeChange = (zone: EditableZoneKey, value: string) => {
    updateZoneStyle(zone, style => ({
      ...style,
      fontSize: value,
    }));
  };

  const handleStyleTextColorChange = (zone: EditableZoneKey, value: string) => {
    updateZoneStyle(zone, style => ({
      ...style,
      textColor: value,
    }));
  };

  const handleStyleBackgroundColorChange = (zone: EditableZoneKey, value: string) => {
    updateZoneStyle(zone, style => ({
      ...style,
      background: {
        ...style.background,
        color: value,
      },
    }));
  };

  const handleStyleBackgroundTypeChange = (
    zone: EditableZoneKey,
    type: SectionStyle['background']['type'],
  ) => {
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
    setActiveElement(field as EditableElementKey);
    setStatusMessage('Ressource appliquée à la section sélectionnée.');
  };

  const handleSave = async () => {
    if (!isDirty) {
      return;
    }

    setSaving(true);
    setStatusMessage(null);
    setFormError(null);

    try {
      const updated = await updateContent(draft);
      setDraft(updated);
      setIsDirty(false);
      setStatusMessage('Contenu mis à jour avec succès.');
      setImageErrors({ ...INITIAL_IMAGE_ERRORS });
    } catch (saveError) {
      console.error('Failed to update site content', saveError);
      setFormError("Impossible d'enregistrer les modifications. Veuillez réessayer.");
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
    setActiveElement(null);
    setAssetError(null);
  };

  const isUploading = (field: ImageFieldKey) => uploadingField === field;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Personnalisation du site</h1>
          <p className="max-w-2xl text-sm text-gray-500">
            Composez une vitrine sur mesure : contenu, styles, ressources médias et polices sont entièrement modulables. Toutes
            vos créations sont centralisées dans le dossier Cloudinary <code className="rounded bg-slate-100 px-1">Custom</code>
            , prêtes à être réutilisées ou téléchargées.
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

      <div className="grid gap-6 xl:grid-cols-[420px,1fr]">
        <CustomizationPanel
          draft={draft}
          activeElement={activeElement}
          imageErrors={imageErrors}
          isUploading={isUploading}
          handleBrandChange={handleBrandChange}
          handleNavigationChange={handleNavigationChange}
          handleHeroFieldChange={handleHeroFieldChange}
          handleAboutChange={handleAboutChange}
          handleAboutTitleChange={handleAboutTitleChange}
          handleMenuFieldChange={handleMenuFieldChange}
          handleContactFieldChange={handleContactFieldChange}
          handleFooterTextChange={handleFooterTextChange}
          handleImageInputChange={handleImageInputChange}
          handleImageUpload={handleImageUpload}
          handleClearImage={handleClearImage}
          handleStyleFontFamilyChange={handleStyleFontFamilyChange}
          handleStyleFontSizeChange={handleStyleFontSizeChange}
          handleStyleTextColorChange={handleStyleTextColorChange}
          handleStyleBackgroundColorChange={handleStyleBackgroundColorChange}
          handleStyleBackgroundTypeChange={handleStyleBackgroundTypeChange}
          fontOptions={fontOptions}
          fontSizeOptions={fontSizeOptions}
          assetState={{
            uploading: assetUploading,
            error: assetError,
            assets: draft.assets.library,
            onUpload: handleAssetUpload,
            onRemove: handleAssetRemove,
            onRename: handleAssetRename,
            onApply: handleAssetApply,
          }}
        />
        <div className="space-y-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-brand-primary" />
            </div>
          ) : (
            <SitePreviewCanvas content={previewContent} onEdit={element => setActiveElement(element)} />
          )}
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
                Chaque ressource envoyée est stockée dans <strong>Cloudinary / Custom</strong>. Vous pouvez les retoucher, les
                renommer ou les remplacer directement depuis votre console Cloudinary sans casser les liens.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const CustomizationPanel: React.FC<CustomizationPanelProps> = ({
  draft,
  activeElement,
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
  handleStyleFontFamilyChange,
  handleStyleFontSizeChange,
  handleStyleTextColorChange,
  handleStyleBackgroundColorChange,
  handleStyleBackgroundTypeChange,
  fontOptions,
  fontSizeOptions,
  assetState,
}) => {
  const sectionRefs = useRef<Record<PanelSectionKey, HTMLDivElement | null>>({
    navigation: null,
    hero: null,
    about: null,
    menu: null,
    contact: null,
    footer: null,
    assets: null,
  });

  const [openSections, setOpenSections] = useState<Record<PanelSectionKey, boolean>>({
    navigation: true,
    hero: true,
    about: false,
    menu: false,
    contact: false,
    footer: false,
    assets: true,
  });

  const [highlightedZone, setHighlightedZone] = useState<EditableZoneKey | null>(null);

  useEffect(() => {
    if (!activeElement) {
      return;
    }
    const zone = resolveZoneFromElement(activeElement);
    setOpenSections(prev => ({
      ...prev,
      [zone]: true,
    }));
    setHighlightedZone(zone);

    const node = sectionRefs.current[zone];
    if (node) {
      node.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    const timeout = window.setTimeout(() => setHighlightedZone(null), 2400);
    return () => window.clearTimeout(timeout);
  }, [activeElement]);

  const toggleSection = (key: PanelSectionKey) => {
    setOpenSections(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const renderStyleControls = (zone: EditableZoneKey) => (
    <StyleControls
      zone={zone}
      style={draft[zone].style}
      fontOptions={fontOptions}
      fontSizeOptions={fontSizeOptions}
      handleStyleFontFamilyChange={handleStyleFontFamilyChange}
      handleStyleFontSizeChange={handleStyleFontSizeChange}
      handleStyleTextColorChange={handleStyleTextColorChange}
      handleStyleBackgroundColorChange={handleStyleBackgroundColorChange}
      handleStyleBackgroundTypeChange={handleStyleBackgroundTypeChange}
      handleImageInputChange={handleImageInputChange}
      handleImageUpload={handleImageUpload}
      handleClearImage={handleClearImage}
      imageErrors={imageErrors}
      isUploading={isUploading}
    />
  );

  return (
    <div className="flex flex-col gap-4">
      <SectionCard
        ref={element => {
          sectionRefs.current.navigation = element;
        }}
        title="Navigation & identité"
        description="Lien direct entre votre marque et le parcours utilisateur."
        open={openSections.navigation}
        onToggle={() => toggleSection('navigation')}
        highlighted={highlightedZone === 'navigation'}
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="brand-name" className="block text-sm font-medium text-gray-700">
              Nom de la marque
            </label>
            <input
              id="brand-name"
              className="ui-input mt-1"
              value={draft.navigation.brand}
              onChange={handleBrandChange}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="nav-home" className="block text-sm font-medium text-gray-700">
                Lien Accueil
              </label>
              <input
                id="nav-home"
                className="ui-input mt-1"
                value={draft.navigation.links.home}
                onChange={handleNavigationChange('home')}
              />
            </div>
            <div>
              <label htmlFor="nav-about" className="block text-sm font-medium text-gray-700">
                Lien À propos
              </label>
              <input
                id="nav-about"
                className="ui-input mt-1"
                value={draft.navigation.links.about}
                onChange={handleNavigationChange('about')}
              />
            </div>
            <div>
              <label htmlFor="nav-menu" className="block text-sm font-medium text-gray-700">
                Lien Menu
              </label>
              <input
                id="nav-menu"
                className="ui-input mt-1"
                value={draft.navigation.links.menu}
                onChange={handleNavigationChange('menu')}
              />
            </div>
            <div>
              <label htmlFor="nav-contact" className="block text-sm font-medium text-gray-700">
                Lien Contact
              </label>
              <input
                id="nav-contact"
                className="ui-input mt-1"
                value={draft.navigation.links.contact}
                onChange={handleNavigationChange('contact')}
              />
            </div>
            <div>
              <label htmlFor="nav-login" className="block text-sm font-medium text-gray-700">
                Lien Staff / CTA
              </label>
              <input
                id="nav-login"
                className="ui-input mt-1"
                value={draft.navigation.links.loginCta}
                onChange={handleNavigationChange('loginCta')}
              />
            </div>
          </div>
          {renderStyleControls('navigation')}
        </div>
      </SectionCard>

      <SectionCard
        ref={element => {
          sectionRefs.current.hero = element;
        }}
        title="Hero & Accroche"
        description="Structurez votre message principal, son visuel et ses appels à l'action."
        open={openSections.hero}
        onToggle={() => toggleSection('hero')}
        highlighted={highlightedZone === 'hero'}
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="hero-title" className="block text-sm font-medium text-gray-700">
              Titre principal
            </label>
            <input
              id="hero-title"
              className="ui-input mt-1"
              value={draft.hero.title}
              onChange={handleHeroFieldChange('title')}
            />
          </div>
          <div>
            <label htmlFor="hero-subtitle" className="block text-sm font-medium text-gray-700">
              Sous-titre
            </label>
            <textarea
              id="hero-subtitle"
              className="ui-textarea mt-1"
              value={draft.hero.subtitle}
              rows={3}
              onChange={handleHeroFieldChange('subtitle')}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="hero-cta" className="block text-sm font-medium text-gray-700">
                Label CTA principal
              </label>
              <input
                id="hero-cta"
                className="ui-input mt-1"
                value={draft.hero.ctaLabel}
                onChange={handleHeroFieldChange('ctaLabel')}
              />
            </div>
            <div>
              <label htmlFor="hero-reorder" className="block text-sm font-medium text-gray-700">
                Label CTA historique
              </label>
              <input
                id="hero-reorder"
                className="ui-input mt-1"
                value={draft.hero.reorderCtaLabel}
                onChange={handleHeroFieldChange('reorderCtaLabel')}
              />
            </div>
            <div>
              <label htmlFor="hero-history" className="block text-sm font-medium text-gray-700">
                Titre historique
              </label>
              <input
                id="hero-history"
                className="ui-input mt-1"
                value={draft.hero.historyTitle}
                onChange={handleHeroFieldChange('historyTitle')}
              />
            </div>
          </div>
          <ImageFieldEditor
            field="hero.backgroundImage"
            label={IMAGE_FIELD_LABELS['hero.backgroundImage']}
            value={draft.hero.backgroundImage}
            imageErrors={imageErrors}
            handleImageInputChange={handleImageInputChange}
            handleImageUpload={handleImageUpload}
            handleClearImage={handleClearImage}
            isUploading={isUploading}
          />
          {renderStyleControls('hero')}
        </div>
      </SectionCard>

      <SectionCard
        ref={element => {
          sectionRefs.current.about = element;
        }}
        title="Section À propos"
        description="Racontez votre histoire et accompagnez-la de visuels immersifs."
        open={openSections.about}
        onToggle={() => toggleSection('about')}
        highlighted={highlightedZone === 'about'}
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="about-title" className="block text-sm font-medium text-gray-700">
              Titre
            </label>
            <input
              id="about-title"
              className="ui-input mt-1"
              value={draft.about.title}
              onChange={handleAboutTitleChange}
            />
          </div>
          <div>
            <label htmlFor="about-description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="about-description"
              className="ui-textarea mt-1"
              value={draft.about.description}
              rows={4}
              onChange={handleAboutChange}
            />
          </div>
          <ImageFieldEditor
            field="about.image"
            label={IMAGE_FIELD_LABELS['about.image']}
            value={draft.about.image}
            imageErrors={imageErrors}
            handleImageInputChange={handleImageInputChange}
            handleImageUpload={handleImageUpload}
            handleClearImage={handleClearImage}
            isUploading={isUploading}
          />
          {renderStyleControls('about')}
        </div>
      </SectionCard>

      <SectionCard
        ref={element => {
          sectionRefs.current.menu = element;
        }}
        title="Section Menu"
        description="Exposez vos produits phares et adaptez leur mise en avant."
        open={openSections.menu}
        onToggle={() => toggleSection('menu')}
        highlighted={highlightedZone === 'menu'}
      >
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="menu-title" className="block text-sm font-medium text-gray-700">
                Titre
              </label>
              <input
                id="menu-title"
                className="ui-input mt-1"
                value={draft.menu.title}
                onChange={handleMenuFieldChange('title')}
              />
            </div>
            <div>
              <label htmlFor="menu-cta" className="block text-sm font-medium text-gray-700">
                Label CTA
              </label>
              <input
                id="menu-cta"
                className="ui-input mt-1"
                value={draft.menu.ctaLabel}
                onChange={handleMenuFieldChange('ctaLabel')}
              />
            </div>
            <div>
              <label htmlFor="menu-loading" className="block text-sm font-medium text-gray-700">
                Label de chargement
              </label>
              <input
                id="menu-loading"
                className="ui-input mt-1"
                value={draft.menu.loadingLabel}
                onChange={handleMenuFieldChange('loadingLabel')}
              />
            </div>
          </div>
          <ImageFieldEditor
            field="menu.image"
            label={IMAGE_FIELD_LABELS['menu.image']}
            value={draft.menu.image}
            imageErrors={imageErrors}
            handleImageInputChange={handleImageInputChange}
            handleImageUpload={handleImageUpload}
            handleClearImage={handleClearImage}
            isUploading={isUploading}
          />
          {renderStyleControls('menu')}
        </div>
      </SectionCard>

      <SectionCard
        ref={element => {
          sectionRefs.current.contact = element;
        }}
        title="Section Contact"
        description="Ouvrez tous vos canaux de communication avec un design à votre image."
        open={openSections.contact}
        onToggle={() => toggleSection('contact')}
        highlighted={highlightedZone === 'contact'}
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="contact-title" className="block text-sm font-medium text-gray-700">
              Titre
            </label>
            <input
              id="contact-title"
              className="ui-input mt-1"
              value={draft.contact.title}
              onChange={handleContactFieldChange('title')}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="contact-address-label" className="block text-sm font-medium text-gray-700">
                Label adresse
              </label>
              <input
                id="contact-address-label"
                className="ui-input mt-1"
                value={draft.contact.addressLabel}
                onChange={handleContactFieldChange('addressLabel')}
              />
            </div>
            <div>
              <label htmlFor="contact-address" className="block text-sm font-medium text-gray-700">
                Adresse
              </label>
              <input
                id="contact-address"
                className="ui-input mt-1"
                value={draft.contact.address}
                onChange={handleContactFieldChange('address')}
              />
            </div>
            <div>
              <label htmlFor="contact-phone-label" className="block text-sm font-medium text-gray-700">
                Label téléphone
              </label>
              <input
                id="contact-phone-label"
                className="ui-input mt-1"
                value={draft.contact.phoneLabel}
                onChange={handleContactFieldChange('phoneLabel')}
              />
            </div>
            <div>
              <label htmlFor="contact-phone" className="block text-sm font-medium text-gray-700">
                Téléphone
              </label>
              <input
                id="contact-phone"
                className="ui-input mt-1"
                value={draft.contact.phone}
                onChange={handleContactFieldChange('phone')}
              />
            </div>
            <div>
              <label htmlFor="contact-email-label" className="block text-sm font-medium text-gray-700">
                Label e-mail
              </label>
              <input
                id="contact-email-label"
                className="ui-input mt-1"
                value={draft.contact.emailLabel}
                onChange={handleContactFieldChange('emailLabel')}
              />
            </div>
            <div>
              <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700">
                E-mail
              </label>
              <input
                id="contact-email"
                className="ui-input mt-1"
                value={draft.contact.email}
                onChange={handleContactFieldChange('email')}
              />
            </div>
          </div>
          <ImageFieldEditor
            field="contact.image"
            label={IMAGE_FIELD_LABELS['contact.image']}
            value={draft.contact.image}
            imageErrors={imageErrors}
            handleImageInputChange={handleImageInputChange}
            handleImageUpload={handleImageUpload}
            handleClearImage={handleClearImage}
            isUploading={isUploading}
          />
          {renderStyleControls('contact')}
        </div>
      </SectionCard>

      <SectionCard
        ref={element => {
          sectionRefs.current.footer = element;
        }}
        title="Pied de page & mentions"
        description="Finalisez votre identité avec un message de bas de page sur-mesure."
        open={openSections.footer}
        onToggle={() => toggleSection('footer')}
        highlighted={highlightedZone === 'footer'}
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="footer-text" className="block text-sm font-medium text-gray-700">
              Texte du pied de page
            </label>
            <input
              id="footer-text"
              className="ui-input mt-1"
              value={draft.footer.text}
              onChange={handleFooterTextChange}
            />
          </div>
          {renderStyleControls('footer')}
        </div>
      </SectionCard>

      <SectionCard
        ref={element => {
          sectionRefs.current.assets = element;
        }}
        title="Médiathèque Cloudinary"
        description="Centralisez vos images, polices, vidéos ou assets bruts pour les appliquer instantanément."
        open={openSections.assets}
        onToggle={() => toggleSection('assets')}
        highlighted={false}
      >
        <AssetLibrary
          assets={assetState.assets}
          uploading={assetState.uploading}
          error={assetState.error}
          onUpload={assetState.onUpload}
          onRemove={assetState.onRemove}
          onRename={assetState.onRename}
          onApply={assetState.onApply}
        />
      </SectionCard>
    </div>
  );
};

const SectionCard = React.forwardRef<HTMLDivElement, {
  title: string;
  description?: string;
  open: boolean;
  onToggle: () => void;
  highlighted?: boolean;
  children: React.ReactNode;
}>(({ title, description, open, onToggle, highlighted = false, children }, ref) => (
  <div
    ref={ref}
    className={`rounded-3xl border bg-white shadow-sm transition-shadow ${
      highlighted ? 'border-brand-primary shadow-brand-primary/20 ring-2 ring-brand-primary/10' : 'border-slate-200'
    }`}
  >
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-start justify-between gap-4 rounded-3xl px-5 py-4 text-left"
      aria-expanded={open}
    >
      <div>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      <span
        aria-hidden="true"
        className={`mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs font-medium ${
          open ? 'border-brand-primary text-brand-primary' : 'border-slate-300 text-slate-400'
        }`}
      >
        {open ? '–' : '+'}
      </span>
    </button>
    {open && <div className="border-t border-slate-100 px-5 py-5 text-sm text-slate-700">{children}</div>}
  </div>
));
SectionCard.displayName = 'SectionCard';

const StyleControls: React.FC<StyleControlsProps> = ({
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
      : {
          valid: false,
          message: 'Cette valeur ne semble pas être reconnue comme une valeur CSS valide.',
        };
  }, []);

  const fontFamilyValidation = validateCssValue('font-family', style.fontFamily);
  const fontSizeValidation = validateCssValue('font-size', style.fontSize);
  const textColorValidation = validateCssValue('color', style.textColor);
  const backgroundColorValidation =
    style.background.type === 'color'
      ? validateCssValue('background-color', style.background.color)
      : { valid: true, message: null };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Styles</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor={`${zone}-font-family`} className="block text-sm font-medium text-gray-700">
            Police
          </label>
          <input
            id={`${zone}-font-family`}
            className={`ui-input mt-1 ${
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
            <p className="mt-1 text-xs text-red-600">{fontFamilyValidation.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">Utilisez le nom exact de la police ou une pile CSS.</p>
        </div>
        <div>
          <label htmlFor={`${zone}-font-size`} className="block text-sm font-medium text-gray-700">
            Taille du texte
          </label>
          <input
            id={`${zone}-font-size`}
            className={`ui-input mt-1 ${
              fontSizeValidation.valid ? '' : 'border-red-300 focus:border-red-500 focus:ring-red-500'
            }`}
            value={style.fontSize}
            onChange={event => handleStyleFontSizeChange(zone, event.target.value)}
            list={`${zone}-font-size-options`}
            placeholder="Ex: clamp(1rem, 2vw, 1.5rem)"
          />
          <datalist id={`${zone}-font-size-options`}>
            {fontSizeOptions.map(size => (
              <option key={size} value={size} />
            ))}
          </datalist>
          {!fontSizeValidation.valid && (
            <p className="mt-1 text-xs text-red-600">{fontSizeValidation.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">Toutes les valeurs CSS valides sont acceptées.</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor={`${zone}-text-color`} className="block text-sm font-medium text-gray-700">
            Couleur du texte
          </label>
          <div className="mt-1 flex items-center gap-3">
            <span
              aria-hidden="true"
              className="h-10 w-10 rounded-md border border-gray-200"
              style={{ backgroundColor: textColorValidation.valid ? style.textColor : 'transparent' }}
            />
            <input
              id={`${zone}-text-color`}
              className={`ui-input ${
                textColorValidation.valid ? '' : 'border-red-300 focus:border-red-500 focus:ring-red-500'
              }`}
              value={style.textColor}
              onChange={event => handleStyleTextColorChange(zone, event.target.value)}
              list={`${zone}-text-color-options`}
              placeholder="Ex: #0f172a ou rgba(15, 23, 42, 0.8)"
            />
          </div>
          <datalist id={`${zone}-text-color-options`}>
            {COLOR_SUGGESTIONS.map(color => (
              <option key={color} value={color} />
            ))}
          </datalist>
          {!textColorValidation.valid && (
            <p className="mt-1 text-xs text-red-600">{textColorValidation.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">Entrez une valeur hexadécimale, rgba(), hsl() ou un nom CSS.</p>
        </div>
        <div>
          <label htmlFor={`${zone}-background-type`} className="block text-sm font-medium text-gray-700">
            Type de fond
          </label>
          <select
            id={`${zone}-background-type`}
            className="ui-select mt-1"
            value={style.background.type}
            onChange={event =>
              handleStyleBackgroundTypeChange(zone, event.target.value as SectionStyle['background']['type'])
            }
          >
            {BACKGROUND_TYPE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {style.background.type === 'color' && (
        <div>
          <label htmlFor={`${zone}-background-color`} className="block text-sm font-medium text-gray-700">
            Couleur du fond
          </label>
          <div className="mt-1 flex items-center gap-3">
            <span
              aria-hidden="true"
              className="h-10 w-10 rounded-md border border-gray-200"
              style={{ backgroundColor: backgroundColorValidation.valid ? style.background.color : 'transparent' }}
            />
            <input
              id={`${zone}-background-color`}
              className={`ui-input ${
                backgroundColorValidation.valid
                  ? ''
                  : 'border-red-300 focus:border-red-500 focus:ring-red-500'
              }`}
              value={style.background.color}
              onChange={event => handleStyleBackgroundColorChange(zone, event.target.value)}
              list={`${zone}-background-color-options`}
              placeholder="Ex: rgba(255, 255, 255, 0.75)"
            />
          </div>
          <datalist id={`${zone}-background-color-options`}>
            {COLOR_SUGGESTIONS.map(color => (
              <option key={color} value={color} />
            ))}
          </datalist>
          {!backgroundColorValidation.valid && (
            <p className="mt-1 text-xs text-red-600">{backgroundColorValidation.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">Accepte toutes les valeurs de couleur CSS valides.</p>
        </div>
      )}
      {isBackgroundImage && (
        <ImageFieldEditor
          field={backgroundField}
          label={IMAGE_FIELD_LABELS[backgroundField]}
          value={style.background.image}
          imageErrors={imageErrors}
          handleImageInputChange={handleImageInputChange}
          handleImageUpload={handleImageUpload}
          handleClearImage={handleClearImage}
          isUploading={isUploading}
        />
      )}
    </div>
  );
};

const ImageFieldEditor: React.FC<ImageFieldEditorProps> = ({
  field,
  label,
  value,
  imageErrors,
  handleImageInputChange,
  handleImageUpload,
  handleClearImage,
  isUploading,
}) => (
  <div>
    <label htmlFor={`${field}-input`} className="block text-sm font-medium text-gray-700">
      {label}
    </label>
    <input
      id={`${field}-input`}
      className="ui-input mt-1"
      value={value ?? ''}
      onChange={handleImageInputChange(field)}
      placeholder="https://res.cloudinary.com/..."
    />
    <p className="mt-1 text-xs text-gray-500">{imageWarning}</p>
    {imageErrors[field] && <p className="mt-1 text-xs text-red-600">{imageErrors[field]}</p>}
    <div className="mt-3 flex flex-wrap gap-2">
      <label className="ui-btn ui-btn-secondary cursor-pointer">
        Importer une ressource
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
      <button
        type="button"
        className="ui-btn ui-btn-ghost"
        onClick={() => handleClearImage(field)}
        disabled={!value || isUploading(field)}
      >
        Retirer
      </button>
      {isUploading(field) && <span className="text-sm text-gray-500">Téléversement en cours…</span>}
    </div>
  </div>
);

const AssetLibrary: React.FC<{
  assets: CustomizationAsset[];
  uploading: boolean;
  error: string | null;
  onUpload: AssetUploadHandler;
  onRemove: AssetRemoveHandler;
  onRename: AssetRenameHandler;
  onApply: AssetApplyHandler;
}> = ({ assets, uploading, error, onUpload, onRemove, onRename, onApply }) => {
  const [copiedAssetId, setCopiedAssetId] = useState<string | null>(null);
  const [selectedField, setSelectedField] = useState<Record<string, ImageFieldKey>>({});

  useEffect(() => {
    if (!copiedAssetId) {
      return;
    }
    const timeout = window.setTimeout(() => setCopiedAssetId(null), 1800);
    return () => window.clearTimeout(timeout);
  }, [copiedAssetId]);

  const imageFieldEntries = useMemo(
    () =>
      (Object.entries(IMAGE_FIELD_LABELS) as [ImageFieldKey, string][]).map(([key, label]) => ({
        key,
        label,
      })),
    [],
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

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
        <p className="text-sm text-slate-600">
          Téléversez vos fichiers directement dans le dossier <strong>Custom</strong> de Cloudinary. Images HD, textures, polices,
          vidéos d'ambiance… utilisez la ressource de votre choix.
        </p>
        <label className="mt-3 inline-flex items-center gap-2 rounded-full bg-brand-primary/10 px-4 py-2 text-sm font-medium text-brand-primary">
          <Upload className="h-4 w-4" aria-hidden="true" />
          Importer depuis mon ordinateur
          <input
            type="file"
            accept="image/*,video/*,audio/*,.ttf,.otf,.woff,.woff2,.zip,.svg,.json,.pdf"
            multiple
            className="hidden"
            onChange={event => {
              void onUpload(event.target.files);
              event.target.value = '';
            }}
          />
        </label>
        {uploading && (
          <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Téléversement en cours…
          </div>
        )}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      {assets.length === 0 ? (
        <p className="text-sm text-slate-500">
          Aucun asset personnalisé pour le moment. Téléversez vos premiers fichiers pour les réutiliser partout dans la vitrine.
        </p>
      ) : (
        <div className="space-y-4">
          {assets.map(asset => (
            <div
              key={asset.id}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 md:flex-row md:items-start md:justify-between"
            >
              <div className="flex flex-1 flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                    <AssetTypeIcon type={asset.type} />
                  </span>
                  <div className="min-w-0 flex-1">
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
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <LinkIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="truncate" title={asset.url}>
                    {asset.url}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2 md:w-60">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="ui-btn ui-btn-secondary flex-1"
                    onClick={() => void handleCopy(asset)}
                  >
                    <Copy className="h-4 w-4" aria-hidden="true" />
                    {copiedAssetId === asset.id ? 'Lien copié !' : 'Copier le lien'}
                  </button>
                  <button
                    type="button"
                    className="ui-btn ui-btn-ghost"
                    onClick={() => onRemove(asset.id)}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-slate-500" htmlFor={`asset-field-${asset.id}`}>
                    Appliquer à une section
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      id={`asset-field-${asset.id}`}
                      className="ui-select flex-1"
                      value={selectedField[asset.id] ?? ''}
                      onChange={event =>
                        setSelectedField(prev => ({
                          ...prev,
                          [asset.id]: event.target.value as ImageFieldKey,
                        }))
                      }
                    >
                      <option value="" disabled>
                        Choisir…
                      </option>
                      {imageFieldEntries.map(({ key, label: optionLabel }) => (
                        <option key={key} value={key}>
                          {optionLabel}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="ui-btn ui-btn-primary"
                      disabled={!selectedField[asset.id]}
                      onClick={() => {
                        const field = selectedField[asset.id];
                        if (field) {
                          onApply(field, asset);
                        }
                      }}
                    >
                      Appliquer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SiteCustomization;

