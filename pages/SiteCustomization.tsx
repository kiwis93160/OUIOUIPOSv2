import React, { useEffect, useMemo, useState } from 'react';
import useSiteContent, { DEFAULT_SITE_CONTENT } from '../hooks/useSiteContent';
import { SectionStyle, SiteContent } from '../types';
import { normalizeCloudinaryImageUrl, uploadProductImage } from '../services/cloudinary';
import { ALLOWED_FONT_FAMILIES, ALLOWED_FONT_SIZES, resolveSiteContent } from '../utils/siteContent';
import SitePreviewCanvas, { EditableZoneKey } from '../components/SitePreviewCanvas';
import Modal from '../components/Modal';

const imageWarning = "L'URL doit provenir de Cloudinary (https://*.cloudinary.com).";

const BACKGROUND_TYPE_OPTIONS: { value: SectionStyle['background']['type']; label: string }[] = [
  { value: 'color', label: 'Couleur' },
  { value: 'image', label: 'Image' },
];

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
type HeroFieldKey = Exclude<keyof SiteContent['hero'], 'backgroundImage'>;
type MenuFieldKey = Exclude<keyof SiteContent['menu'], 'image'>;
type ContactFieldKey = Exclude<keyof SiteContent['contact'], 'image'>;
type NavigationFieldKey = keyof SiteContent['navigation']['links'];

const STYLE_BACKGROUND_FIELD_KEYS: Record<EditableZoneKey, StyleImageFieldKey> = {
  navigation: 'navigation.style.background',
  hero: 'hero.style.background',
  about: 'about.style.background',
  menu: 'menu.style.background',
  contact: 'contact.style.background',
  footer: 'footer.style.background',
};

type NavigationChangeHandler = (key: NavigationFieldKey) => (event: React.ChangeEvent<HTMLInputElement>) => void;
type HeroChangeHandler = (
  key: HeroFieldKey,
) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
type MenuChangeHandler = (key: MenuFieldKey) => (event: React.ChangeEvent<HTMLInputElement>) => void;
type ContactChangeHandler = (key: ContactFieldKey) => (event: React.ChangeEvent<HTMLInputElement>) => void;
type ImageInputHandler = (field: ImageFieldKey) => (event: React.ChangeEvent<HTMLInputElement>) => void;

type ImageUploadHandler = (field: ImageFieldKey, file: File) => Promise<void>;
type ImageClearHandler = (field: ImageFieldKey) => void;

type SiteCustomizationModalsProps = {
  activeZone: EditableZoneKey | null;
  onClose: () => void;
  draft: SiteContent;
  handleBrandChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleNavigationChange: NavigationChangeHandler;
  handleHeroFieldChange: HeroChangeHandler;
  handleAboutTitleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleAboutChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
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
  handleStyleBackgroundTypeChange: (zone: EditableZoneKey, value: SectionStyle['background']['type']) => void;
  fontOptions: readonly string[];
  fontSizeOptions: readonly string[];
  imageErrors: Record<ImageFieldKey, string | null>;
  isUploading: (field: ImageFieldKey) => boolean;
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
  const [activeZone, setActiveZone] = useState<EditableZoneKey | null>(null);

  useEffect(() => {
    setDraft(content);
    setIsDirty(false);
    setStatusMessage(null);
    setFormError(null);
    setImageErrors({ ...INITIAL_IMAGE_ERRORS });
  }, [content]);

  const previewContent = useMemo(() => resolveSiteContent(draft), [draft]);
  const fontOptions = useMemo(() => [...ALLOWED_FONT_FAMILIES], []);
  const fontSizeOptions = useMemo(() => [...ALLOWED_FONT_SIZES], []);

  const mutateDraft = (updater: (prev: SiteContent) => SiteContent) => {
    setDraft(prev => updater(prev));
    setIsDirty(true);
    setStatusMessage(null);
    setFormError(null);
  };

  const updateZone = <K extends EditableZoneKey>(zone: K, updater: (zoneContent: SiteContent[K]) => SiteContent[K]) => {
    mutateDraft(prev => ({
      ...prev,
      [zone]: updater(prev[zone]),
    }));
  };

  const updateZoneStyle = (zone: EditableZoneKey, updater: (style: SectionStyle) => SectionStyle) => {
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

  const handleStyleBackgroundTypeChange = (zone: EditableZoneKey, type: SectionStyle['background']['type']) => {
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
      const label = IMAGE_FIELD_LABELS[field];
      const uploadedUrl = await uploadProductImage(file, label);
      setImageField(field, uploadedUrl);
      setImageErrors(prev => ({
        ...prev,
        [field]: null,
      }));
    } catch (uploadError) {
      console.error('Failed to upload site image', uploadError);
      setFormError("Impossible de téléverser l'image. Vérifiez votre connexion ou la configuration Cloudinary.");
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
    setActiveZone(null);
  };

  const isUploading = (field: ImageFieldKey) => uploadingField === field;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Personnalisation du site</h1>
          <p className="text-sm text-gray-500">
            Ajustez les textes, visuels et coordonnées visibles sur la vitrine publique.
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

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-brand-primary" />
        </div>
      ) : (
        <SitePreviewCanvas content={previewContent} onEdit={zone => setActiveZone(zone)} />
      )}

      <SiteCustomizationModals
        activeZone={activeZone}
        onClose={() => setActiveZone(null)}
        draft={draft}
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
        imageErrors={imageErrors}
        isUploading={isUploading}
      />
    </div>
  );
};

const SiteCustomizationModals: React.FC<SiteCustomizationModalsProps> = ({
  activeZone,
  onClose,
  draft,
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
  imageErrors,
  isUploading,
}) => {
  const renderStyleControls = (zone: EditableZoneKey) => {
    const style = draft[zone].style;
    const backgroundField = STYLE_BACKGROUND_FIELD_KEYS[zone];
    const isBackgroundImage = style.background.type === 'image';

    return (
      <div className="space-y-4 rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Styles</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor={`${zone}-font-family`} className="block text-sm font-medium text-gray-700">
              Police
            </label>
            <select
              id={`${zone}-font-family`}
              className="ui-select mt-1"
              value={style.fontFamily}
              onChange={event => handleStyleFontFamilyChange(zone, event.target.value)}
            >
              {fontOptions.map(font => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={`${zone}-font-size`} className="block text-sm font-medium text-gray-700">
              Taille du texte
            </label>
            <select
              id={`${zone}-font-size`}
              className="ui-select mt-1"
              value={style.fontSize}
              onChange={event => handleStyleFontSizeChange(zone, event.target.value)}
            >
              {fontSizeOptions.map(size => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor={`${zone}-text-color`} className="block text-sm font-medium text-gray-700">
              Couleur du texte
            </label>
            <input
              id={`${zone}-text-color`}
              type="color"
              className="mt-1 h-10 w-full cursor-pointer rounded-md border border-gray-200 p-1"
              value={style.textColor}
              onChange={event => handleStyleTextColorChange(zone, event.target.value)}
            />
            <p className="mt-1 text-xs text-gray-500">{style.textColor}</p>
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
        <div>
          <label htmlFor={`${zone}-background-color`} className="block text-sm font-medium text-gray-700">
            Couleur de fond
          </label>
          <input
            id={`${zone}-background-color`}
            type="color"
            className="mt-1 h-10 w-full cursor-pointer rounded-md border border-gray-200 p-1"
            value={style.background.color}
            onChange={event => handleStyleBackgroundColorChange(zone, event.target.value)}
          />
          <p className="mt-1 text-xs text-gray-500">{style.background.color}</p>
        </div>
        {isBackgroundImage && (
          <div>
            <label htmlFor={`${zone}-background-image`} className="block text-sm font-medium text-gray-700">
              {IMAGE_FIELD_LABELS[backgroundField]}
            </label>
            <input
              id={`${zone}-background-image`}
              className="ui-input mt-1"
              value={style.background.image ?? ''}
              onChange={handleImageInputChange(backgroundField)}
              placeholder="https://res.cloudinary.com/..."
            />
            <p className="mt-1 text-xs text-gray-500">{imageWarning}</p>
            {imageErrors[backgroundField] && (
              <p className="mt-1 text-xs text-red-600">{imageErrors[backgroundField]}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <label className="ui-btn ui-btn-secondary cursor-pointer">
                Importer une image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={event => {
                    const file = event.target.files?.[0];
                    if (file) {
                      void handleImageUpload(backgroundField, file);
                      event.target.value = '';
                    }
                  }}
                />
              </label>
              <button
                type="button"
                className="ui-btn ui-btn-ghost"
                onClick={() => handleClearImage(backgroundField)}
                disabled={!style.background.image || isUploading(backgroundField)}
              >
                Retirer l'image
              </button>
              {isUploading(backgroundField) && (
                <span className="text-sm text-gray-500">Téléversement en cours…</span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Modal isOpen={activeZone === 'navigation'} onClose={onClose} title="Modifier la navigation" size="lg">
        <div className="space-y-5">
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
              <label htmlFor="nav-home" className="block text-sm font-medium text-gray-700">Lien Accueil</label>
              <input
                id="nav-home"
                className="ui-input mt-1"
                value={draft.navigation.links.home}
                onChange={handleNavigationChange('home')}
              />
            </div>
            <div>
              <label htmlFor="nav-about" className="block text-sm font-medium text-gray-700">Lien À propos</label>
              <input
                id="nav-about"
                className="ui-input mt-1"
                value={draft.navigation.links.about}
                onChange={handleNavigationChange('about')}
              />
            </div>
            <div>
              <label htmlFor="nav-menu" className="block text-sm font-medium text-gray-700">Lien Menu</label>
              <input
                id="nav-menu"
                className="ui-input mt-1"
                value={draft.navigation.links.menu}
                onChange={handleNavigationChange('menu')}
              />
            </div>
            <div>
              <label htmlFor="nav-contact" className="block text-sm font-medium text-gray-700">Lien Contact</label>
              <input
                id="nav-contact"
                className="ui-input mt-1"
                value={draft.navigation.links.contact}
                onChange={handleNavigationChange('contact')}
              />
            </div>
          </div>
          <div>
            <label htmlFor="nav-login" className="block text-sm font-medium text-gray-700">Bouton personnel</label>
            <input
              id="nav-login"
              className="ui-input mt-1"
              value={draft.navigation.links.loginCta}
              onChange={handleNavigationChange('loginCta')}
            />
          </div>
          {renderStyleControls('navigation')}
        </div>
      </Modal>

      <Modal isOpen={activeZone === 'hero'} onClose={onClose} title="Modifier la section hero" size="xl">
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="hero-title" className="block text-sm font-medium text-gray-700">Titre</label>
              <input
                id="hero-title"
                className="ui-input mt-1"
                value={draft.hero.title}
                onChange={handleHeroFieldChange('title')}
              />
            </div>
            <div>
              <label htmlFor="hero-cta" className="block text-sm font-medium text-gray-700">Texte du bouton</label>
              <input
                id="hero-cta"
                className="ui-input mt-1"
                value={draft.hero.ctaLabel}
                onChange={handleHeroFieldChange('ctaLabel')}
              />
            </div>
          </div>
          <div>
            <label htmlFor="hero-subtitle" className="block text-sm font-medium text-gray-700">Sous-titre</label>
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
              <label htmlFor="hero-history" className="block text-sm font-medium text-gray-700">Titre historique</label>
              <input
                id="hero-history"
                className="ui-input mt-1"
                value={draft.hero.historyTitle}
                onChange={handleHeroFieldChange('historyTitle')}
              />
            </div>
            <div>
              <label htmlFor="hero-reorder" className="block text-sm font-medium text-gray-700">Bouton de réassort</label>
              <input
                id="hero-reorder"
                className="ui-input mt-1"
                value={draft.hero.reorderCtaLabel}
                onChange={handleHeroFieldChange('reorderCtaLabel')}
              />
            </div>
          </div>
          <div>
            <label htmlFor="hero-image" className="block text-sm font-medium text-gray-700">
              {IMAGE_FIELD_LABELS['hero.backgroundImage']}
            </label>
            <input
              id="hero-image"
              className="ui-input mt-1"
              value={draft.hero.backgroundImage ?? ''}
              onChange={handleImageInputChange('hero.backgroundImage')}
              placeholder="https://res.cloudinary.com/..."
            />
            <p className="mt-1 text-xs text-gray-500">{imageWarning}</p>
            {imageErrors['hero.backgroundImage'] && (
              <p className="mt-1 text-xs text-red-600">{imageErrors['hero.backgroundImage']}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <label className="ui-btn ui-btn-secondary cursor-pointer">
                Importer une image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={event => {
                    const file = event.target.files?.[0];
                    if (file) {
                      void handleImageUpload('hero.backgroundImage', file);
                      event.target.value = '';
                    }
                  }}
                />
              </label>
              <button
                type="button"
                className="ui-btn ui-btn-ghost"
                onClick={() => handleClearImage('hero.backgroundImage')}
                disabled={!draft.hero.backgroundImage || isUploading('hero.backgroundImage')}
              >
                Retirer l'image
              </button>
              {isUploading('hero.backgroundImage') && (
                <span className="text-sm text-gray-500">Téléversement en cours…</span>
              )}
            </div>
          </div>
          {renderStyleControls('hero')}
        </div>
      </Modal>

      <Modal isOpen={activeZone === 'about'} onClose={onClose} title="Modifier la section À propos" size="lg">
        <div className="space-y-5">
          <div>
            <label htmlFor="about-title" className="block text-sm font-medium text-gray-700">Titre</label>
            <input
              id="about-title"
              className="ui-input mt-1"
              value={draft.about.title}
              onChange={handleAboutTitleChange}
            />
          </div>
          <div>
            <label htmlFor="about-description" className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              id="about-description"
              className="ui-textarea mt-1"
              value={draft.about.description}
              rows={4}
              onChange={handleAboutChange}
            />
          </div>
          <div>
            <label htmlFor="about-image" className="block text-sm font-medium text-gray-700">
              {IMAGE_FIELD_LABELS['about.image']}
            </label>
            <input
              id="about-image"
              className="ui-input mt-1"
              value={draft.about.image ?? ''}
              onChange={handleImageInputChange('about.image')}
              placeholder="https://res.cloudinary.com/..."
            />
            <p className="mt-1 text-xs text-gray-500">{imageWarning}</p>
            {imageErrors['about.image'] && (
              <p className="mt-1 text-xs text-red-600">{imageErrors['about.image']}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <label className="ui-btn ui-btn-secondary cursor-pointer">
                Importer une image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={event => {
                    const file = event.target.files?.[0];
                    if (file) {
                      void handleImageUpload('about.image', file);
                      event.target.value = '';
                    }
                  }}
                />
              </label>
              <button
                type="button"
                className="ui-btn ui-btn-ghost"
                onClick={() => handleClearImage('about.image')}
                disabled={!draft.about.image || isUploading('about.image')}
              >
                Retirer l'image
              </button>
              {isUploading('about.image') && (
                <span className="text-sm text-gray-500">Téléversement en cours…</span>
              )}
            </div>
          </div>
          {renderStyleControls('about')}
        </div>
      </Modal>

      <Modal isOpen={activeZone === 'menu'} onClose={onClose} title="Modifier la section menu" size="xl">
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="menu-title" className="block text-sm font-medium text-gray-700">Titre</label>
              <input
                id="menu-title"
                className="ui-input mt-1"
                value={draft.menu.title}
                onChange={handleMenuFieldChange('title')}
              />
            </div>
            <div>
              <label htmlFor="menu-cta" className="block text-sm font-medium text-gray-700">Bouton CTA</label>
              <input
                id="menu-cta"
                className="ui-input mt-1"
                value={draft.menu.ctaLabel}
                onChange={handleMenuFieldChange('ctaLabel')}
              />
            </div>
          </div>
          <div>
            <label htmlFor="menu-loading" className="block text-sm font-medium text-gray-700">Texte de chargement</label>
            <input
              id="menu-loading"
              className="ui-input mt-1"
              value={draft.menu.loadingLabel}
              onChange={handleMenuFieldChange('loadingLabel')}
            />
          </div>
          <div>
            <label htmlFor="menu-image" className="block text-sm font-medium text-gray-700">
              {IMAGE_FIELD_LABELS['menu.image']}
            </label>
            <input
              id="menu-image"
              className="ui-input mt-1"
              value={draft.menu.image ?? ''}
              onChange={handleImageInputChange('menu.image')}
              placeholder="https://res.cloudinary.com/..."
            />
            <p className="mt-1 text-xs text-gray-500">{imageWarning}</p>
            {imageErrors['menu.image'] && (
              <p className="mt-1 text-xs text-red-600">{imageErrors['menu.image']}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <label className="ui-btn ui-btn-secondary cursor-pointer">
                Importer une image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={event => {
                    const file = event.target.files?.[0];
                    if (file) {
                      void handleImageUpload('menu.image', file);
                      event.target.value = '';
                    }
                  }}
                />
              </label>
              <button
                type="button"
                className="ui-btn ui-btn-ghost"
                onClick={() => handleClearImage('menu.image')}
                disabled={!draft.menu.image || isUploading('menu.image')}
              >
                Retirer l'image
              </button>
              {isUploading('menu.image') && (
                <span className="text-sm text-gray-500">Téléversement en cours…</span>
              )}
            </div>
          </div>
          {renderStyleControls('menu')}
        </div>
      </Modal>

      <Modal isOpen={activeZone === 'contact'} onClose={onClose} title="Modifier la section contact" size="xl">
        <div className="space-y-5">
          <div>
            <label htmlFor="contact-title" className="block text-sm font-medium text-gray-700">Titre</label>
            <input
              id="contact-title"
              className="ui-input mt-1"
              value={draft.contact.title}
              onChange={handleContactFieldChange('title')}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="contact-address-label" className="block text-sm font-medium text-gray-700">Libellé adresse</label>
              <input
                id="contact-address-label"
                className="ui-input mt-1"
                value={draft.contact.addressLabel}
                onChange={handleContactFieldChange('addressLabel')}
              />
            </div>
            <div>
              <label htmlFor="contact-address" className="block text-sm font-medium text-gray-700">Adresse</label>
              <input
                id="contact-address"
                className="ui-input mt-1"
                value={draft.contact.address}
                onChange={handleContactFieldChange('address')}
              />
            </div>
            <div>
              <label htmlFor="contact-phone-label" className="block text-sm font-medium text-gray-700">Libellé téléphone</label>
              <input
                id="contact-phone-label"
                className="ui-input mt-1"
                value={draft.contact.phoneLabel}
                onChange={handleContactFieldChange('phoneLabel')}
              />
            </div>
            <div>
              <label htmlFor="contact-phone" className="block text-sm font-medium text-gray-700">Téléphone</label>
              <input
                id="contact-phone"
                className="ui-input mt-1"
                value={draft.contact.phone}
                onChange={handleContactFieldChange('phone')}
              />
            </div>
            <div>
              <label htmlFor="contact-email-label" className="block text-sm font-medium text-gray-700">Libellé email</label>
              <input
                id="contact-email-label"
                className="ui-input mt-1"
                value={draft.contact.emailLabel}
                onChange={handleContactFieldChange('emailLabel')}
              />
            </div>
            <div>
              <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700">Email</label>
              <input
                id="contact-email"
                className="ui-input mt-1"
                value={draft.contact.email}
                onChange={handleContactFieldChange('email')}
              />
            </div>
          </div>
          <div>
            <label htmlFor="contact-image" className="block text-sm font-medium text-gray-700">
              {IMAGE_FIELD_LABELS['contact.image']}
            </label>
            <input
              id="contact-image"
              className="ui-input mt-1"
              value={draft.contact.image ?? ''}
              onChange={handleImageInputChange('contact.image')}
              placeholder="https://res.cloudinary.com/..."
            />
            <p className="mt-1 text-xs text-gray-500">{imageWarning}</p>
            {imageErrors['contact.image'] && (
              <p className="mt-1 text-xs text-red-600">{imageErrors['contact.image']}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <label className="ui-btn ui-btn-secondary cursor-pointer">
                Importer une image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={event => {
                    const file = event.target.files?.[0];
                    if (file) {
                      void handleImageUpload('contact.image', file);
                      event.target.value = '';
                    }
                  }}
                />
              </label>
              <button
                type="button"
                className="ui-btn ui-btn-ghost"
                onClick={() => handleClearImage('contact.image')}
                disabled={!draft.contact.image || isUploading('contact.image')}
              >
                Retirer l'image
              </button>
              {isUploading('contact.image') && (
                <span className="text-sm text-gray-500">Téléversement en cours…</span>
              )}
            </div>
          </div>
          {renderStyleControls('contact')}
        </div>
      </Modal>

      <Modal isOpen={activeZone === 'footer'} onClose={onClose} title="Modifier le pied de page" size="sm">
        <div className="space-y-4">
          <div>
            <label htmlFor="footer-text" className="block text-sm font-medium text-gray-700">Texte du pied de page</label>
            <input
              id="footer-text"
              className="ui-input mt-1"
              value={draft.footer.text}
              onChange={handleFooterTextChange}
            />
          </div>
          {renderStyleControls('footer')}
        </div>
      </Modal>
    </>
  );
};


export default SiteCustomization;
