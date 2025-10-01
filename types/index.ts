

export interface Role {
  id: string;
  name: string;
  pin?: string;
  homePage?: string;
  permissions: {
    [key: string]: 'editor' | 'readonly' | 'none';
  };
}

export interface SectionBackgroundStyle {
  type: 'color' | 'image';
  color: string;
  image: string | null;
}

export interface SectionStyle {
  background: SectionBackgroundStyle;
  fontFamily: string;
  fontSize: string;
  textColor: string;
}

export const EDITABLE_ZONE_KEYS = ['navigation', 'hero', 'about', 'menu', 'instagramReviews', 'findUs', 'footer'] as const;

export type EditableZoneKey = (typeof EDITABLE_ZONE_KEYS)[number];

export const EDITABLE_ELEMENT_KEYS = [
  'navigation.brand',
  'navigation.brandLogo',
  'navigation.staffLogo',
  'navigation.links.home',
  'navigation.links.about',
  'navigation.links.menu',
  'navigation.links.contact',
  'navigation.links.loginCta',
  'navigation.style.background',
  'hero.title',
  'hero.subtitle',
  'hero.ctaLabel',
  'hero.historyTitle',
  'hero.reorderCtaLabel',
  'hero.backgroundImage',
  'about.title',
  'about.description',
  'about.image',
  'about.style.background',
  'menu.title',
  'menu.ctaLabel',
  'menu.loadingLabel',
  'menu.image',
  'menu.style.background',
  'instagramReviews.title',
  'instagramReviews.subtitle',
  'instagramReviews.image',
  'instagramReviews.style.background',
  'findUs.title',
  'findUs.addressLabel',
  'findUs.address',
  'findUs.cityLabel',
  'findUs.city',
  'findUs.hoursLabel',
  'findUs.hours',
  'findUs.mapLabel',
  'findUs.style.background',
  'footer.text',
  'footer.style.background',
] as const;

export type EditableElementKey = (typeof EDITABLE_ELEMENT_KEYS)[number];

export const STYLE_EDITABLE_ELEMENT_KEYS = EDITABLE_ELEMENT_KEYS.filter(
  key =>
    !key.endsWith('.style.background') &&
    !key.endsWith('.image') &&
    key !== 'hero.backgroundImage' &&
    key !== 'navigation.brandLogo' &&
    key !== 'navigation.staffLogo',
) as EditableElementKey[];

export interface ElementStyle {
  fontFamily?: string;
  fontSize?: string;
  textColor?: string;
  backgroundColor?: string;
}

export type ElementStyles = Partial<Record<EditableElementKey, ElementStyle>>;

export type RichTextMark = 'bold' | 'italic' | 'strikethrough';

export interface RichTextValue {
  html: string;
  plainText: string;
}

export type ElementRichText = Partial<Record<EditableElementKey, RichTextValue>>;

export type CustomizationAssetType = 'image' | 'video' | 'audio' | 'font' | 'raw';

export interface CustomizationAsset {
  id: string;
  name: string;
  url: string;
  format: string;
  bytes: number;
  type: CustomizationAssetType;
  createdAt: string;
}

export interface SiteAssets {
  library: CustomizationAsset[];
}

export interface SiteContent {
  navigation: {
    brand: string;
    brandLogo: string | null;
    staffLogo: string | null;
    links: {
      home: string;
      about: string;
      menu: string;
      contact: string;
      loginCta: string;
    };
    style: SectionStyle;
  };
  hero: {
    title: string;
    subtitle: string;
    ctaLabel: string;
    backgroundImage: string | null;
    historyTitle: string;
    reorderCtaLabel: string;
    style: SectionStyle;
  };
  about: {
    title: string;
    description: string;
    image: string | null;
    style: SectionStyle;
  };
  menu: {
    title: string;
    ctaLabel: string;
    loadingLabel: string;
    image: string | null;
    style: SectionStyle;
  };
  instagramReviews: {
    title: string;
    subtitle: string;
    image: string | null;
    style: SectionStyle;
  };
  findUs: {
    title: string;
    addressLabel: string;
    address: string;
    cityLabel: string;
    city: string;
    hoursLabel: string;
    hours: string;
    mapLabel: string;
    style: SectionStyle;
  };
  footer: {
    text: string;
    style: SectionStyle;
  };
  elementStyles: ElementStyles;
  elementRichText: ElementRichText;
  assets: SiteAssets;
}

export interface Ingredient {
  id: string;
  nom: string;
  unite: 'kg' | 'g' | 'L' | 'ml' | 'unite';
  stock_minimum: number;
  stock_actuel: number;
  prix_unitaire: number; // Prix moyen pondéré
}

export interface RecipeItem {
  ingredient_id: string;
  qte_utilisee: number; // en 'g', 'ml', ou 'unite' selon l'ingrédient
}

export interface Product {
  id: string;
  nom_produit: string;
  description?: string;
  prix_vente: number;
  categoria_id: string;
  estado: 'disponible' | 'agotado_temporal' | 'agotado_indefinido' | 'archive';
  image: string; // URL from Cloud Storage
  recipe: RecipeItem[];
  cout_revient?: number;
  is_best_seller: boolean;
  best_seller_rank: number | null;
}

export interface Category {
  id: string;
  nom: string;
}

export interface Table {
  id: string;
  nom: string;
  capacite: number;
  statut: 'libre' | 'en_cuisine' | 'para_entregar' | 'para_pagar';
  commandeId?: string;
  couverts?: number;
  estado_cocina?: Order['estado_cocina'];
  date_envoi_cuisine?: number;
}

export interface OrderItem {
  id: string;
  produitRef: string; // Product ID
  nom_produit: string; // Denormalized for display
  prix_unitaire: number; // Denormalized for display
  quantite: number;
  excluded_ingredients: string[]; // Ingredient IDs
  commentaire: string;
  estado: 'en_attente' | 'enviado' | 'annule';
  date_envoi?: number; // timestamp
}

export interface Order {
  id: string;
  type: 'sur_place' | 'a_emporter';
  table_id?: string;
  table_nom?: string;
  couverts: number;
  statut: 'en_cours' | 'finalisee' | 'pendiente_validacion';
  estado_cocina: 'no_enviado' | 'recibido' | 'listo' | 'servido' | 'entregada';
  date_creation: number; // timestamp
  date_envoi_cuisine?: number; // timestamp
  date_listo_cuisine?: number; // timestamp
  date_servido?: number; // timestamp
  payment_status: 'paid' | 'unpaid';
  items: OrderItem[];
  total: number;
  profit?: number;
  payment_method?: 'efectivo' | 'transferencia' | 'tarjeta';
  payment_receipt_url?: string;
  clientInfo?: {
    nom: string;
    telephone: string;
    adresse?: string;
  };
  receipt_url?: string;
}

export interface KitchenTicket extends Order {
  ticketKey: string;
}

export interface Purchase {
  id: string;
  ingredient_id: string;
  quantite_achetee: number;
  prix_total: number;
  date_achat: number; // timestamp
}

// New types for Dashboard
export interface SalesDataPoint {
    name: string;
    value: number;
}

export type DashboardPeriod = 'week' | 'month';

export interface PeriodSalesChartPoint {
    name: string;
    ventes: number;
    ventesPeriodePrecedente: number;
}

export interface DashboardStats {
    period: DashboardPeriod;
    periodLabel: string;
    periodStart: string;
    periodEnd: string;
    ventesPeriode: number;
    beneficePeriode: number;
    clientsPeriode: number;
    panierMoyen: number;
    tablesOccupees: number;
    clientsActuels: number;
    commandesEnCuisine: number;
    ingredientsStockBas: Ingredient[];
    ventesPeriodeSeries: PeriodSalesChartPoint[];
    ventesParCategorie: SalesDataPoint[];
}

export interface NotificationCounts {
    pendingTakeaway: number;
    readyTakeaway: number;
    kitchenOrders: number;
    lowStockIngredients: number;
    readyForService: number;
}

// New types for Report
export interface SoldProduct {
    id: string;
    name: string;
    quantity: number;
    totalSales: number;
}

export interface SoldProductsByCategory {
    categoryName: string;
    products: SoldProduct[];
}

export interface DailyReport {
    generatedAt: string;
    startDate: string;
    clientsDuJour: number;
    panierMoyen: number;
    ventesDuJour: number;
    soldProducts: SoldProductsByCategory[];
    lowStockIngredients: Ingredient[];
    roleLogins: RoleLogin[];
    roleLoginsUnavailable?: boolean;
}

export interface Sale {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  categoryId: string;
  categoryName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  unitCost: number;
  totalCost: number;
  profit: number;
  paymentMethod?: Order['payment_method'];
  saleDate: number; // timestamp
}

export interface RoleLogin {
  roleId: string;
  roleName: string;
  loginAt: string;
}