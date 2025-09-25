const removeDiacritics = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .normalize('NFC');

const slugify = (value: string): string =>
  removeDiacritics(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const SAMPLE_PRODUCT_IMAGES: Record<string, string> = {
  'tacos-al-pastor':
    'https://images.unsplash.com/photo-1601925260374-3854927c4c3d?auto=format&fit=crop&w=800&q=80',
  tacos: 'https://images.unsplash.com/photo-1521302080334-4bebac2760eb?auto=format&fit=crop&w=800&q=80',
  burrito:
    'https://images.unsplash.com/photo-1612874470043-48a770f27b8d?auto=format&fit=crop&w=800&q=80',
  quesadilla:
    'https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?auto=format&fit=crop&w=800&q=80',
  nachos: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
  guacamole:
    'https://images.unsplash.com/photo-1504753793650-d4a2b783c15e?auto=format&fit=crop&w=800&q=80',
  churros: 'https://images.unsplash.com/photo-1607958996333-41a7cb228326?auto=format&fit=crop&w=800&q=80',
  'churros-chocolat':
    'https://images.unsplash.com/photo-1488477304112-4944851de03d?auto=format&fit=crop&w=800&q=80',
  fajitas: 'https://images.unsplash.com/photo-1571407970349-bc81e3b5d0d5?auto=format&fit=crop&w=800&q=80',
  empanadas:
    'https://images.unsplash.com/photo-1590759668628-3b5773af8a97?auto=format&fit=crop&w=800&q=80',
  limonada:
    'https://images.unsplash.com/photo-1527169402691-feff5539e52c?auto=format&fit=crop&w=800&q=80',
  horchata:
    'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=800&q=80',
  margarita:
    'https://images.unsplash.com/photo-1604908176997-12518821c745?auto=format&fit=crop&w=800&q=80',
  ensalada:
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
};

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1612874470043-48a770f27b8d?auto=format&fit=crop&w=800&q=80';

const lookupSampleImage = (key: string | undefined): string | undefined => {
  if (!key) {
    return undefined;
  }
  const normalized = slugify(key);
  if (!normalized) {
    return undefined;
  }
  return SAMPLE_PRODUCT_IMAGES[normalized];
};

const extractFileStem = (path: string): string | undefined => {
  const filename = path.split('/').pop();
  if (!filename) {
    return undefined;
  }
  const [stem] = filename.split('.');
  return stem;
};

export const resolveProductImageUrl = (
  rawImage: string | null | undefined,
  productName?: string,
): string => {
  if (rawImage) {
    if (/^data:/i.test(rawImage) || /^https?:\/\//i.test(rawImage)) {
      return rawImage;
    }

    const stem = extractFileStem(rawImage);
    const sampleFromFile = lookupSampleImage(stem);
    if (sampleFromFile) {
      return sampleFromFile;
    }

    return FALLBACK_IMAGE;
  }

  if (productName) {
    const sampleFromName = lookupSampleImage(productName);
    if (sampleFromName) {
      return sampleFromName;
    }
  }

  return FALLBACK_IMAGE;
};

export const normalizeProductImageInput = (
  rawImage: string | null | undefined,
  productName?: string,
): string => {
  const resolved = resolveProductImageUrl(rawImage, productName);
  if (!resolved || /^\s*$/.test(resolved)) {
    return FALLBACK_IMAGE;
  }
  return resolved;
};
