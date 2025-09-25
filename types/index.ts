

export interface Role {
  id: string;
  name: string;
  pin?: string;
  homePage?: string;
  permissions: {
    [key: string]: 'editor' | 'readonly' | 'none';
  };
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
}

export interface Category {
  id: string;
  nom: string;
}

export interface Table {
  id: string;
  nom: string;
  capacite: number;
  statut: 'libre' | 'occupee' | 'a_payer';
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
  estado_cocina: 'no_enviado' | 'recibido' | 'listo' | 'servido';
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

export interface WeeklySalesChartPoint {
    name: string;
    ventes: number;
    ventesSemainePrecedente: number;
}

export interface DashboardStats {
    ventesAujourdhui: number;
    beneficeAujourdhui: number;
    clientsAujourdhui: number;
    panierMoyen: number;
    tablesOccupees: number;
    clientsActuels: number;
    commandesEnCuisine: number;
    ingredientsStockBas: Ingredient[];
    ventes7Jours: WeeklySalesChartPoint[];
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