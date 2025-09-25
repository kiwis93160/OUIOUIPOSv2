import { supabase } from './supabaseClient';

const PRODUCT_IMAGES_BUCKET = 'product-images';
const PAYMENT_RECEIPTS_BUCKET = 'payment-receipts';

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

const sanitizeSegment = (value: string | undefined, fallback: string): string => {
  if (!value) {
    return fallback;
  }
  const slug = slugify(value);
  return slug || fallback;
};

const getExtensionFromMime = (mime: string): string | undefined => {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'application/pdf': 'pdf',
  };
  return map[mime.toLowerCase()];
};

const getFileExtension = (file: File | Blob, fallback: string): string => {
  if (file instanceof File) {
    const parts = file.name.split('.');
    if (parts.length > 1) {
      const ext = parts.pop();
      if (ext) {
        return ext.toLowerCase();
      }
    }
  }

  if ('type' in file && file.type) {
    const fromMime = getExtensionFromMime(file.type);
    if (fromMime) {
      return fromMime;
    }
  }

  return fallback;
};

const generateId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
};

const uploadToBucket = async (
  bucket: string,
  path: string,
  file: File | Blob,
  contentType?: string,
): Promise<string> => {
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
    contentType: contentType ?? ('type' in file ? file.type : undefined) ?? 'application/octet-stream',
  });

  if (error) {
    throw new Error(`Échec du téléversement vers Supabase Storage : ${error.message}`);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  if (!data?.publicUrl) {
    throw new Error('Impossible de récupérer l\'URL publique du fichier téléversé.');
  }

  return data.publicUrl;
};

export const DEFAULT_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1612874470043-48a770f27b8d?auto=format&fit=crop&w=800&q=80';

export const uploadProductImage = async (
  file: File | Blob,
  productName?: string,
): Promise<string> => {
  const folder = sanitizeSegment(productName, 'produits');
  const extension = getFileExtension(file, 'jpg');
  const path = `${folder}/${generateId()}.${extension}`;
  return uploadToBucket(PRODUCT_IMAGES_BUCKET, path, file);
};

export type ReceiptUploadOptions = {
  orderId?: string;
  customerReference?: string;
};

export const uploadPaymentReceipt = async (
  file: File | Blob,
  options?: ReceiptUploadOptions,
): Promise<string> => {
  const baseFolder = options?.orderId
    ? `orders/${sanitizeSegment(options.orderId, 'commande')}`
    : options?.customerReference
    ? `customers/${sanitizeSegment(options.customerReference, 'client')}`
    : 'misc';

  const extension = getFileExtension(file, 'jpg');
  const path = `${baseFolder}/${generateId()}.${extension}`;
  return uploadToBucket(PAYMENT_RECEIPTS_BUCKET, path, file);
};
