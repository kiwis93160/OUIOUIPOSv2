import { DEFAULT_PRODUCT_IMAGE } from './storage';

const SAMPLE_PRODUCT_IMAGES: Record<string, string> = {
  'churros-chocolat':
    'https://images.unsplash.com/photo-1521302080334-4bebac27646f?auto=format&fit=crop&w=800&q=80',
  churros: 'https://images.unsplash.com/photo-1521302080334-4bebac27646f?auto=format&fit=crop&w=800&q=80',
  tacos: 'https://images.unsplash.com/photo-1608033365394-7c3a1d1a1a30?auto=format&fit=crop&w=800&q=80',
  burrito: 'https://images.unsplash.com/photo-1543353071-1bf75e6e6e89?auto=format&fit=crop&w=800&q=80',
  quesadilla: 'https://images.unsplash.com/photo-1612872087720-bb876e7abcfb?auto=format&fit=crop&w=800&q=80',
  nachos: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=800&q=80',
  torta: 'https://images.unsplash.com/photo-1608033365394-7c3a1d1a1a30?auto=format&fit=crop&w=800&q=80',
  empanada: 'https://images.unsplash.com/photo-1625948968146-a7bf2324fc12?auto=format&fit=crop&w=800&q=80',
  arepa: 'https://images.unsplash.com/photo-1585942428115-91c0fe63d3cd?auto=format&fit=crop&w=800&q=80',
  ceviche: 'https://images.unsplash.com/photo-1627662169426-3812c65e4f3b?auto=format&fit=crop&w=800&q=80',
  paella: 'https://images.unsplash.com/photo-1625948968110-8e0193f1df59?auto=format&fit=crop&w=800&q=80',
  salade: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
  dessert: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
  boisson: 'https://images.unsplash.com/photo-1510626176961-4b37d0f0b1f4?auto=format&fit=crop&w=800&q=80',
  smoothie: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=800&q=80',
  cocktail: 'https://images.unsplash.com/photo-1468465236047-6aac20937e92?auto=format&fit=crop&w=800&q=80',
  cafe: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
  chocolat: 'https://images.unsplash.com/photo-1511381712327-5a9e9e5e0b02?auto=format&fit=crop&w=800&q=80',
};

const PLACEHOLDER_HOSTS = new Set(['example.com', 'localhost', '127.0.0.1']);

const removeDiacritics = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .normalize('NFC');

const slugify = (value: string): string =>
  removeDiacritics(value)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');

const findSampleImage = (productName?: string): string | undefined => {
  if (!productName) {
    return undefined;
  }
  const slug = slugify(productName);
  if (!slug) {
    return undefined;
  }
  if (SAMPLE_PRODUCT_IMAGES[slug]) {
    return SAMPLE_PRODUCT_IMAGES[slug];
  }
  const partialMatch = Object.entries(SAMPLE_PRODUCT_IMAGES).find(([key]) => slug.includes(key));
  return partialMatch?.[1];
};

export const normalizeProductImageInput = (image?: string | null): string | null => {
  const trimmed = image?.trim();
  if (!trimmed) {
    return null;
  }
  if (!/^https?:\/\//i.test(trimmed)) {
    return null;
  }
  try {
    const url = new URL(trimmed);
    if (PLACEHOLDER_HOSTS.has(url.hostname) || url.pathname.startsWith('/images/')) {
      return null;
    }
  } catch {
    return null;
  }
  return trimmed;
};

export const resolveProductImageUrl = (image?: string | null, productName?: string): string => {
  const normalized = normalizeProductImageInput(image);
  if (normalized) {
    return normalized;
  }
  const sample = findSampleImage(productName);
  if (sample) {
    return sample;
  }
  return DEFAULT_PRODUCT_IMAGE;
};

export const getSampleProductImage = (productName: string): string =>
  findSampleImage(productName) ?? DEFAULT_PRODUCT_IMAGE;

