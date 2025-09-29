import React, { useEffect, useMemo, useState } from 'react';
import useSiteContent from '../hooks/useSiteContent';
import { SiteContent } from '../types';
import { normalizeCloudinaryImageUrl, uploadProductImage } from '../services/cloudinary';
import { resolveSiteContent } from '../utils/siteContent';
import SitePreviewCanvas, { EditableZoneKey } from '../components/SitePreviewCanvas';
import Modal from '../components/Modal';

const imageWarning = "L'URL doit provenir de Cloudinary (https://*.cloudinary.com).";

type ImageFieldKey = 'hero.backgroundImage' | 'about.image' | 'menu.image' | 'contact.image';
type HeroFieldKey = Exclude<keyof SiteContent['hero'], 'backgroundImage'>;
type MenuFieldKey = Exclude<keyof SiteContent['menu'], 'image'>;
type ContactFieldKey = Exclude<keyof SiteContent['contact'], 'image'>;
type NavigationFieldKey = keyof SiteContent['navigation']['links'];

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
  imageErrors: Record<ImageFieldKey, string | null>;
  isUploading: (field: ImageFieldKey) => boolean;
};

const IMAGE_FIELD_LABELS: Record<ImageFieldKey, string> = {
  'hero.backgroundImage': 'Visuel de fond (hero)',
  'about.image': 'Image de la section À propos',
  'menu.image': 'Image de la section Menu',
  'contact.image': 'Image de la section Contact',
};

const INITIAL_IMAGE_ERRORS: Record<ImageFieldKey, string | null> = {
  'hero.backgroundImage': null,
  'about.image': null,
  'menu.image': null,
  'contact.image': null,
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

  const mutateDraft = (updater: (prev: SiteContent) => SiteContent) => {
    setDraft(prev => updater(prev));
    setIsDirty(true);
    setStatusMessage(null);
    setFormError(null);
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

  const setImageField = (field: ImageFieldKey, value: string | null) => {
    mutateDraft(prev => {
      if (field === 'hero.backgroundImage') {
        return {
          ...prev,
          hero: {
            ...prev.hero,
            backgroundImage: value,
          },
        };
      }
      if (field === 'about.image') {
        return {
          ...prev,
          about: {
            ...prev.about,
            image: value,
          },
        };
      }
      if (field === 'menu.image') {
        return {
          ...prev,
          menu: {
            ...prev.menu,
            image: value,
          },
        };
      }
      return {
        ...prev,
        contact: {
          ...prev.contact,
          image: value,
        },
      };
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
  imageErrors,
  isUploading,
}) => (
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
      </div>
    </Modal>

    <Modal isOpen={activeZone === 'menu'} onClose={onClose} title="Modifier la section menu" size="lg">
      <div className="space-y-5">
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
          <label htmlFor="menu-cta" className="block text-sm font-medium text-gray-700">Texte du bouton</label>
          <input
            id="menu-cta"
            className="ui-input mt-1"
            value={draft.menu.ctaLabel}
            onChange={handleMenuFieldChange('ctaLabel')}
          />
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
      </div>
    </Modal>
  </>
);

export default SiteCustomization;
