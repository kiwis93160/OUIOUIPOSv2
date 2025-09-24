import { Role, Table, Order, Product, Category, Ingredient, OrderItem, Purchase, RecipeItem, DashboardStats, SalesDataPoint, NotificationCounts, DailyReport, SoldProduct, Sale } from '../types';

// ==================================================================================
// MOCK DATABASE - This simulates Firestore collections
// ==================================================================================
let MOCK_ROLES: Role[] = [
  { id: '1', name: 'admin', pin: '004789', permissions: { '/dashboard': 'editor', '/ventes': 'editor', '/cocina': 'editor', '/para-llevar': 'editor', '/produits': 'editor', '/ingredients': 'editor', '/resume-ventes': 'editor' } },
  { id: '2', name: 'cocina', pin: '2222', permissions: { '/dashboard': 'none', '/ventes': 'none', '/cocina': 'editor', '/para-llevar': 'readonly', '/produits': 'none', '/ingredients': 'none', '/resume-ventes': 'none' } },
  { id: '3', name: 'mesero', pin: '3333', permissions: { '/dashboard': 'readonly', '/ventes': 'editor', '/cocina': 'readonly', '/para-llevar': 'editor', '/produits': 'readonly', '/ingredients': 'readonly', '/resume-ventes': 'readonly' } },
];

let MOCK_TABLES: Omit<Table, 'estado_cocina' | 'date_envoi_cuisine'>[] = [
  { id: 't1', nom: 'T1', capacite: 4, statut: 'libre' },
  { id: 't2', nom: 'T2', capacite: 2, statut: 'occupee', commandeId: 'o1', couverts: 2 },
  { id: 't3', nom: 'T3', capacite: 6, statut: 'a_payer', commandeId: 'o2', couverts: 5 },
  { id: 't4', nom: 'T4', capacite: 4, statut: 'libre' },
  { id: 't5', nom: 'T5', capacite: 8, statut: 'libre' },
];

let MOCK_INGREDIENTS: Ingredient[] = [
    { id: 'i1', nom: 'Tortilla de maïs', unite: 'unite', stock_actuel: 200, stock_minimum: 50, prix_unitaire: 0.2 },
    { id: 'i2', nom: 'Viande Al Pastor', unite: 'kg', stock_actuel: 5, stock_minimum: 2, prix_unitaire: 15 },
    { id: 'i3', nom: 'Fromage Oaxaca', unite: 'kg', stock_actuel: 1.5, stock_minimum: 1, prix_unitaire: 12 },
    { id: 'i4', nom: 'Tomate', unite: 'kg', stock_actuel: 10, stock_minimum: 3, prix_unitaire: 2.5 },
    { id: 'i5', nom: 'Avocat', unite: 'unite', stock_actuel: 8, stock_minimum: 10, prix_unitaire: 0.8 },
];

let MOCK_PURCHASES: Purchase[] = [];
let MOCK_SALES: Sale[] = [];

let MOCK_CATEGORIES: Category[] = [
    { id: 'c1', nom: 'Tacos' },
    { id: 'c2', nom: 'Quesadillas' },
    { id: 'c3', nom: 'Boissons' },
    { id: 'c4', nom: 'Entradas' },
];

let MOCK_PRODUCTS: Product[] = [
  { id: 'p1', nom_produit: 'Taco Al Pastor', description: "Porc mariné aux épices achiote, ananas grillé, coriandre et oignon sur une double tortilla de maïs.", prix_vente: 3.5, categoria_id: 'c1', estado: 'disponible', image: 'https://picsum.photos/seed/taco1/400', recipe: [{ingredient_id: 'i1', qte_utilisee: 2}, {ingredient_id: 'i2', qte_utilisee: 80}, {ingredient_id: 'i4', qte_utilisee: 20 }] },
  { id: 'p2', nom_produit: 'Taco Carnitas', description: "Tendre porc confit mijoté pendant des heures, servi avec sa garniture traditionnelle.", prix_vente: 3.5, categoria_id: 'c1', estado: 'disponible', image: 'https://picsum.photos/seed/taco2/400', recipe: [{ingredient_id: 'i1', qte_utilisee: 2}] },
  { id: 'p3', nom_produit: 'Quesadilla Fromage', description: "Une grande tortilla de blé repliée sur un lit généreux de fromage Oaxaca fondant et onctueux.", prix_vente: 5, categoria_id: 'c2', estado: 'disponible', image: 'https://picsum.photos/seed/quesa1/400', recipe: [{ingredient_id: 'i1', qte_utilisee: 2}, {ingredient_id: 'i3', qte_utilisee: 100}] },
  { id: 'p4', nom_produit: 'Agua de Jamaica', description: "Boisson rafraîchissante et naturelle à base de fleurs d'hibiscus infusées, légèrement sucrée.", prix_vente: 2.5, categoria_id: 'c3', estado: 'disponible', image: 'https://picsum.photos/seed/boisson1/400', recipe: [] },
  { id: 'p5', nom_produit: 'Coca-Cola', description: "Le grand classique, servi bien frais pour accompagner vos tacos.", prix_vente: 2, categoria_id: 'c3', estado: 'agotado_temporal', image: 'https://picsum.photos/seed/boisson2/400', recipe: [] },
  { id: 'p6', nom_produit: 'Guacamole & Chips', description: "Notre guacamole maison frais, servi avec un panier de totopos croustillants.", prix_vente: 7.5, categoria_id: 'c4', estado: 'disponible', image: 'https://picsum.photos/seed/guac1/400', recipe: [{ingredient_id: 'i5', qte_utilisee: 2}, {ingredient_id: 'i4', qte_utilisee: 50}] },
  { id: 'p7', nom_produit: 'Taco Suadero', description: "Boeuf tendrement cuit à la plancha, un classique de Mexico City.", prix_vente: 4.0, categoria_id: 'c1', estado: 'disponible', image: 'https://picsum.photos/seed/taco3/400', recipe: [{ingredient_id: 'i1', qte_utilisee: 2}, {ingredient_id: 'i4', qte_utilisee: 20 }] },
  { id: 'p8', nom_produit: 'Quesadilla Champignons', description: "Fromage fondant et champignons de Paris sautés à l'ail et epazote.", prix_vente: 6.0, categoria_id: 'c2', estado: 'disponible', image: 'https://picsum.photos/seed/quesa2/400', recipe: [{ingredient_id: 'i1', qte_utilisee: 2}, {ingredient_id: 'i3', qte_utilisee: 80}] }
];

let MOCK_ORDERS: Order[] = [
  { id: 'o1', type: 'sur_place', table_id: 't2', table_nom: 'T2', couverts: 2, statut: 'en_cours', estado_cocina: 'recibido', date_creation: Date.now() - 300000, date_envoi_cuisine: Date.now() - 240000, payment_status: 'unpaid', total: 16.5, items: [
      { id: 'oi1', produitRef: 'p1', nom_produit: 'Taco Al Pastor', prix_unitaire: 3.5, quantite: 2, excluded_ingredients: [], commentaire: '', estado: 'enviado' },
      { id: 'oi2', produitRef: 'p4', nom_produit: 'Agua de Jamaica', prix_unitaire: 2.5, quantite: 1, excluded_ingredients: [], commentaire: '', estado: 'enviado' },
      { id: 'oi3', produitRef: 'p3', nom_produit: 'Quesadilla Fromage', prix_unitaire: 5, quantite: 1, excluded_ingredients: [], commentaire: 'Extra fromage', estado: 'en_attente' },
  ]},
  { id: 'o2', type: 'sur_place', table_id: 't3', table_nom: 'T3', couverts: 5, statut: 'en_cours', estado_cocina: 'listo', date_creation: Date.now() - 1200000, date_envoi_cuisine: Date.now() - 1100000, date_listo_cuisine: Date.now() - 300000, payment_status: 'unpaid', total: 35.0, items: [
      { id: 'oi4', produitRef: 'p1', nom_produit: 'Taco Al Pastor', prix_unitaire: 3.5, quantite: 10, excluded_ingredients: [], commentaire: '', estado: 'enviado' },
  ]},
  { id: 'o3', type: 'a_emporter', couverts: 1, statut: 'pendiente_validacion', estado_cocina: 'no_enviado', date_creation: Date.now() - 60000, payment_status: 'unpaid', total: 10.5, items: [{id: 'oi5', produitRef: 'p1', nom_produit: 'Taco Al Pastor', prix_unitaire: 3.5, quantite: 3, excluded_ingredients:[], commentaire: '', estado: 'en_attente'}], clientInfo: { nom: 'Jean Client', telephone: '0612345678', adresse: '123 Rue Fictive'}, receipt_url: 'https://picsum.photos/seed/receipt1/400/600'},
  { id: 'o4', type: 'a_emporter', couverts: 1, statut: 'finalisee', estado_cocina: 'servido', date_creation: Date.now() - 900000, payment_status: 'paid', total: 7.0, items: [{ id: 'oi_fix_1', produitRef: 'p1', nom_produit: 'Taco Al Pastor', prix_unitaire: 3.5, quantite: 2, excluded_ingredients: [], commentaire: '', estado: 'enviado' }], clientInfo: { nom: 'Marie Commande', telephone: '0687654321', adresse: '456 Avenue Imaginaire'}},
  { id: 'o5', type: 'sur_place', table_id: 't1', table_nom: 'T1', couverts: 4, statut: 'finalisee', estado_cocina: 'servido', date_creation: Date.now() - 86400000 * 2, payment_status: 'paid', total: 52.5, payment_method: 'tarjeta', items: [
      { id: 'oi6', produitRef: 'p1', nom_produit: 'Taco Al Pastor', prix_unitaire: 3.5, quantite: 15, excluded_ingredients: [], commentaire: '', estado: 'enviado' },
  ]},
  { id: 'o6', type: 'sur_place', table_id: 't5', table_nom: 'T5', couverts: 8, statut: 'finalisee', estado_cocina: 'servido', date_creation: Date.now() - 86400000 * 3, payment_status: 'paid', total: 50.0, payment_method: 'efectivo', items: [
      { id: 'oi7', produitRef: 'p3', nom_produit: 'Quesadilla Fromage', prix_unitaire: 5, quantite: 10, excluded_ingredients: [], commentaire: '', estado: 'enviado' },
  ]},
  { id: 'o7', type: 'sur_place', table_id: 't4', table_nom: 'T4', couverts: 2, statut: 'finalisee', estado_cocina: 'servido', date_creation: Date.now() - 86400000, payment_status: 'paid', total: 28.0, payment_method: 'tarjeta', items: [
      { id: 'oi8', produitRef: 'p2', nom_produit: 'Taco Carnitas', prix_unitaire: 3.5, quantite: 8, excluded_ingredients: [], commentaire: '', estado: 'enviado' },
  ]},
  { id: 'o8', type: 'a_emporter', couverts: 1, statut: 'finalisee', estado_cocina: 'servido', date_creation: Date.now() - 86400000, payment_status: 'paid', total: 90.0, payment_method: 'transferencia', items: [
      { id: 'oi9', produitRef: 'p6', nom_produit: 'Guacamole & Chips', prix_unitaire: 7.5, quantite: 12, excluded_ingredients: [], commentaire: '', estado: 'enviado' },
  ]},
   { id: 'o9', type: 'sur_place', table_id: 't2', table_nom: 'T2', couverts: 2, statut: 'finalisee', estado_cocina: 'servido', date_creation: Date.now() - 86400000, payment_status: 'paid', total: 21.0, payment_method: 'efectivo', items: [
      { id: 'oi10', produitRef: 'p1', nom_produit: 'Taco Al Pastor', prix_unitaire: 3.5, quantite: 6, excluded_ingredients: [], commentaire: '', estado: 'enviado' },
  ]},
  { id: 'o10', type: 'sur_place', table_id: 't1', table_nom: 'T1', couverts: 1, statut: 'finalisee', estado_cocina: 'servido', date_creation: Date.now() - 86400000 * 4, payment_status: 'paid', total: 20.0, payment_method: 'tarjeta', items: [
      { id: 'oi11', produitRef: 'p7', nom_produit: 'Taco Suadero', prix_unitaire: 4.0, quantite: 5, excluded_ingredients: [], commentaire: '', estado: 'enviado' },
  ]},
  { id: 'o11', type: 'a_emporter', couverts: 1, statut: 'finalisee', estado_cocina: 'servido', date_creation: Date.now() - 86400000 * 5, payment_status: 'paid', total: 24.0, payment_method: 'transferencia', items: [
      { id: 'oi12', produitRef: 'p8', nom_produit: 'Quesadilla Champignons', prix_unitaire: 6.0, quantite: 4, excluded_ingredients: [], commentaire: '', estado: 'enviado' },
  ]},
];


// ==================================================================================
// NOTIFICATION SERVICE (Pub/Sub)
// ==================================================================================
type EventCallback = () => void;
const eventListeners: { [key: string]: EventCallback[] } = {};

const notificationsService = {
  subscribe: (event: string, callback: EventCallback): (() => void) => {
    if (!eventListeners[event]) {
      eventListeners[event] = [];
    }
    eventListeners[event].push(callback);
    // Return an unsubscribe function
    return () => {
      eventListeners[event] = eventListeners[event].filter(cb => cb !== callback);
    };
  },
  publish: (event: string) => {
    if (eventListeners[event]) {
      eventListeners[event].forEach(callback => callback());
    }
  }
};


// ==================================================================================
// MOCK API FUNCTIONS - Simulate Cloud Functions
// ==================================================================================

// HELPER for business day calculation
const getBusinessDayStart = (now: Date = new Date()): Date => {
    let startTime = new Date(now);
    startTime.setHours(5, 0, 0, 0);

    if (now < startTime) {
        // It's before 5 AM, so the business day started at 5 AM yesterday
        startTime.setDate(startTime.getDate() - 1);
    }
    return startTime;
};

const simulateNetwork = <T,>(data: T): Promise<T> => {
    return new Promise(res => setTimeout(() => res(JSON.parse(JSON.stringify(data))), 250));
};

const calculateCost = (recipe: RecipeItem[]): number => {
    return recipe.reduce((totalCost, item) => {
        const ingredient = MOCK_INGREDIENTS.find(i => i.id === item.ingredient_id);
        if (!ingredient) return totalCost;

        let costPerBaseUnit = ingredient.prix_unitaire;
        if (ingredient.unite === 'kg' || ingredient.unite === 'L') {
            costPerBaseUnit /= 1000; // Convert price per kg/L to price per g/ml
        }
        
        return totalCost + (costPerBaseUnit * item.qte_utilisee);
    }, 0);
};

// Helper function to adjust stock for a single product based on a quantity change
const adjustIngredientStock = (productId: string, quantityChange: number) => {
  const product = MOCK_PRODUCTS.find(p => p.id === productId);
  if (!product || !product.recipe) return;

  product.recipe.forEach(recipeItem => {
    const ingredientIndex = MOCK_INGREDIENTS.findIndex(i => i.id === recipeItem.ingredient_id);
    if (ingredientIndex > -1) {
      const ingredient = MOCK_INGREDIENTS[ingredientIndex];
      // quantityChange is the number of products to add/remove.
      // amountToAdjust is the total amount of ingredient to add/remove from stock.
      let amountToAdjust = recipeItem.qte_utilisee * quantityChange;

      if (ingredient.unite === 'kg') amountToAdjust /= 1000; // Recipe in g, stock in kg
      else if (ingredient.unite === 'L') amountToAdjust /= 1000; // Recipe in ml, stock in L

      const currentStock = MOCK_INGREDIENTS[ingredientIndex].stock_actuel;
      // We subtract the amount: if quantityChange is positive (add product), we decrement stock.
      // If quantityChange is negative (remove product), we increment stock.
      const newStock = currentStock - amountToAdjust;
      MOCK_INGREDIENTS[ingredientIndex].stock_actuel = parseFloat(newStock.toFixed(3));
    }
  });
  notificationsService.publish('notifications_updated');
};

const createSaleEntriesForOrder = (order: Order) => {
    order.items.forEach(item => {
        const product = MOCK_PRODUCTS.find(p => p.id === item.produitRef);
        if (!product) return;
        
        const category = MOCK_CATEGORIES.find(c => c.id === product.categoria_id);
        const unitCost = calculateCost(product.recipe);
        const totalCost = unitCost * item.quantite;
        const totalPrice = item.prix_unitaire * item.quantite;

        const sale: Sale = {
            id: `sale_${order.id}_${item.id}`,
            orderId: order.id,
            productId: product.id,
            productName: product.nom_produit,
            categoryId: product.categoria_id,
            categoryName: category?.nom || 'N/A',
            quantity: item.quantite,
            unitPrice: item.prix_unitaire,
            totalPrice: totalPrice,
            unitCost: unitCost,
            totalCost: totalCost,
            profit: totalPrice - totalCost,
            paymentMethod: order.payment_method,
            saleDate: order.date_creation,
        };
        MOCK_SALES.push(sale);
    });
};


export const api = {
  notifications: notificationsService,

  loginWithPin: async (pin: string): Promise<Role | null> => {
    const role = MOCK_ROLES.find(r => r.pin === pin) || null;
    return simulateNetwork(role);
  },
  
  getDashboardStats: async (): Promise<DashboardStats> => {
      const businessDayStart = getBusinessDayStart();
      const businessDayStartTimestamp = businessDayStart.getTime();

      const todaysOrders = MOCK_ORDERS.filter(o => o.date_creation >= businessDayStartTimestamp && o.statut === 'finalisee');
      const ventesAujourdhui = todaysOrders.reduce((acc, o) => acc + o.total, 0);

      const productsWithCost = MOCK_PRODUCTS.map(p => ({
        ...p,
        cout_revient: calculateCost(p.recipe)
      }));

      const beneficeAujourdhui = todaysOrders.reduce((totalProfit, order) => {
          const orderProfit = order.items.reduce((itemProfit, item) => {
              const product = productsWithCost.find(p => p.id === item.produitRef);
              if (product && product.cout_revient) {
                  return itemProfit + (item.prix_unitaire - product.cout_revient) * item.quantite;
              }
              return itemProfit;
          }, 0);
          return totalProfit + orderProfit;
      }, 0);

      const clientsAujourdhui = todaysOrders.reduce((acc, o) => acc + o.couverts, 0);
      const panierMoyen = todaysOrders.length > 0 ? ventesAujourdhui / todaysOrders.length : 0;
      
      const ventesParCategorieMap: { [key: string]: number } = {};
      MOCK_ORDERS.filter(o => o.statut === 'finalisee').forEach(order => {
          order.items.forEach(item => {
              const product = MOCK_PRODUCTS.find(p => p.id === item.produitRef);
              if (product) {
                  const category = MOCK_CATEGORIES.find(c => c.id === product.categoria_id);
                  if (category) {
                      ventesParCategorieMap[category.nom] = (ventesParCategorieMap[category.nom] || 0) + (item.prix_unitaire * item.quantite);
                  }
              }
          });
      });
      const ventesParCategorie: SalesDataPoint[] = Object.entries(ventesParCategorieMap).map(([name, value]) => ({ name, value }));
      
      return simulateNetwork({
          ventesAujourdhui,
          beneficeAujourdhui,
          clientsAujourdhui,
          panierMoyen,
          tablesOccupees: MOCK_TABLES.filter(t => t.statut !== 'libre').length,
          clientsActuels: MOCK_TABLES.filter(t => t.statut !== 'libre').reduce((acc, t) => acc + (t.couverts || 0), 0),
          commandesEnCuisine: MOCK_ORDERS.filter(o => o.estado_cocina === 'recibido').length,
          ingredientsStockBas: MOCK_INGREDIENTS.filter(i => i.stock_actuel <= i.stock_minimum),
          ventes7Jours: [
            { name: 'J-6', ventes: 800, ventesSemainePrecedente: 750 }, { name: 'J-5', ventes: 1100, ventesSemainePrecedente: 1050 },
            { name: 'J-4', ventes: 950, ventesSemainePrecedente: 900 }, { name: 'J-3', ventes: 1300, ventesSemainePrecedente: 1200 },
            { name: 'J-2', ventes: 1250, ventesSemainePrecedente: 1350 }, { name: 'J-1', ventes: 1500, ventesSemainePrecedente: 1400 },
            { name: 'Auj', ventes: ventesAujourdhui, ventesSemainePrecedente: 1150 },
          ],
          ventesParCategorie,
      });
  },

  getSalesByProduct: async (): Promise<SalesDataPoint[]> => {
      const salesByProduct: { [key: string]: number } = {};
      MOCK_ORDERS.filter(o => o.statut === 'finalisee').forEach(order => {
          order.items.forEach(item => {
              const product = MOCK_PRODUCTS.find(p => p.id === item.produitRef);
              if (product) {
                  salesByProduct[product.nom_produit] = (salesByProduct[product.nom_produit] || 0) + (item.prix_unitaire * item.quantite);
              }
          });
      });
      
      const sortedSales = Object.entries(salesByProduct)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      if (sortedSales.length > 6) {
          const top6 = sortedSales.slice(0, 6);
          const othersValue = sortedSales.slice(6).reduce((acc, curr) => acc + curr.value, 0);
          return simulateNetwork([...top6, { name: 'Autres', value: othersValue }]);
      }
      return simulateNetwork(sortedSales);
  },

  getTables: async (): Promise<Table[]> => {
    const tablesWithData: Table[] = MOCK_TABLES.map(table => {
      if (table.commandeId) {
        const order = MOCK_ORDERS.find(o => o.id === table.commandeId);
        return {
          ...table,
          estado_cocina: order?.estado_cocina,
          date_envoi_cuisine: order?.date_envoi_cuisine,
        }
      }
      return table;
    });
    return simulateNetwork(tablesWithData);
  },

  getIngredients: async (): Promise<Ingredient[]> => {
    return simulateNetwork(MOCK_INGREDIENTS);
  },

  getProducts: async (): Promise<Product[]> => {
    const activeProducts = MOCK_PRODUCTS.filter(p => p.estado !== 'archive');
    const productsWithCost = activeProducts.map(p => ({
        ...p,
        cout_revient: calculateCost(p.recipe)
    }));
    return simulateNetwork(productsWithCost);
  },

  getTopSellingProducts: async (): Promise<Product[]> => {
    const targetCategoryNames = ["Tacos", "Quesadillas", "Entradas"];
    const targetCategoryIds = MOCK_CATEGORIES
      .filter(c => targetCategoryNames.includes(c.nom))
      .map(c => c.id);

    const salesCount: { [productId: string]: number } = {};

    MOCK_ORDERS
      .filter(o => o.statut === 'finalisee')
      .forEach(order => {
        order.items.forEach(item => {
          const product = MOCK_PRODUCTS.find(p => p.id === item.produitRef);
          if (product && targetCategoryIds.includes(product.categoria_id)) {
            salesCount[item.produitRef] = (salesCount[item.produitRef] || 0) + item.quantite;
          }
        });
      });
      
    const topProductIds = Object.entries(salesCount)
      .sort(([, qtyA], [, qtyB]) => qtyB - qtyA)
      .slice(0, 6)
      .map(([productId]) => productId);

    const topProducts = topProductIds.map(id => 
      MOCK_PRODUCTS.find(p => p.id === id)
    ).filter((p): p is Product => p !== undefined && p.estado !== 'archive');
    
    const productsWithCost = topProducts.map(p => ({
        ...p,
        cout_revient: calculateCost(p.recipe)
    }));

    return simulateNetwork(productsWithCost);
  },

  getCategories: async (): Promise<Category[]> => {
    return simulateNetwork(MOCK_CATEGORIES);
  },
  
  getKitchenOrders: async (): Promise<Order[]> => {
      const kitchenOrders = MOCK_ORDERS.filter(o => (o.statut === 'en_cours' || o.type === 'a_emporter') && o.estado_cocina === 'recibido');
      return simulateNetwork(kitchenOrders);
  },

  getTakeawayOrders: async () => {
      const pending = MOCK_ORDERS.filter(o => o.type === 'a_emporter' && o.statut === 'pendiente_validacion');
      const ready = MOCK_ORDERS.filter(o => o.type === 'a_emporter' && o.estado_cocina === 'listo');
      return simulateNetwork({ pending, ready });
  },

  getOrderById: async (orderId: string): Promise<Order | undefined> => {
      const order = MOCK_ORDERS.find(o => o.id === orderId);
      return simulateNetwork(order);
  },

  createOrGetOrderByTableId: async (tableId: string): Promise<Order> => {
    const table = MOCK_TABLES.find(t => t.id === tableId);
    if (!table) throw new Error("Table not found");

    if (table.commandeId) {
      const existingOrder = MOCK_ORDERS.find(o => o.id === table.commandeId);
      if (existingOrder) return simulateNetwork(existingOrder);
    }
    
    const newOrderId = `o${Date.now()}`;
    const newOrder: Order = {
      id: newOrderId,
      type: 'sur_place',
      table_id: tableId,
      table_nom: table.nom,
      couverts: table.capacite,
      statut: 'en_cours',
      estado_cocina: 'no_enviado',
      date_creation: Date.now(),
      payment_status: 'unpaid',
      items: [],
      total: 0
    };
    MOCK_ORDERS.push(newOrder);
    
    // Update table
    const tableIndex = MOCK_TABLES.findIndex(t => t.id === tableId);
    MOCK_TABLES[tableIndex] = { ...table, statut: 'occupee', commandeId: newOrderId, couverts: table.capacite };
    notificationsService.publish('notifications_updated');
    return simulateNetwork(newOrder);
  },
  
  updateOrder: async (orderId: string, updates: Partial<Order>): Promise<Order> => {
    const orderIndex = MOCK_ORDERS.findIndex(o => o.id === orderId);
    if (orderIndex === -1) throw new Error("Order not found");

    const originalOrder = MOCK_ORDERS[orderIndex];
    const newItems = updates.items;

    if (newItems) {
        const quantityChanges = new Map<string, number>();

        // Consolidate original quantities of items not yet sent to kitchen
        originalOrder.items.forEach(item => {
            if (item.estado === 'en_attente') {
                const currentChange = quantityChanges.get(item.produitRef) || 0;
                quantityChanges.set(item.produitRef, currentChange - item.quantite);
            }
        });

        // Consolidate new quantities
        newItems.forEach(item => {
            if (item.estado === 'en_attente') {
                const currentChange = quantityChanges.get(item.produitRef) || 0;
                quantityChanges.set(item.produitRef, currentChange + item.quantite);
            }
        });

        // Apply stock changes based on the net difference
        quantityChanges.forEach((change, productId) => {
            if (change !== 0) {
                adjustIngredientStock(productId, change);
            }
        });
    }

    const updatedOrderData = { ...originalOrder, ...updates };
    updatedOrderData.total = (updates.items || originalOrder.items).reduce((acc, item) => acc + (item.quantite * item.prix_unitaire), 0);
    MOCK_ORDERS[orderIndex] = updatedOrderData;
    
    // No direct notification here, as stock changes already publish.
    return simulateNetwork(updatedOrderData);
  },
  
  sendOrderToKitchen: async (orderId: string): Promise<Order> => {
    let orderIndex = MOCK_ORDERS.findIndex(o => o.id === orderId);
    if (orderIndex === -1) throw new Error("Order not found");

    const order = MOCK_ORDERS[orderIndex];
    const hasItemsToSend = order.items.some(item => item.estado === 'en_attente');

    if (hasItemsToSend) {
        order.estado_cocina = 'recibido';
        order.date_envoi_cuisine = Date.now();
        order.items.forEach(item => {
            if(item.estado === 'en_attente') {
                item.estado = 'enviado';
            }
        });
        notificationsService.publish('notifications_updated');
    }
    
    return simulateNetwork(order);
  },

  markOrderAsReady: async (orderId: string): Promise<Order> => {
      let orderIndex = MOCK_ORDERS.findIndex(o => o.id === orderId);
      if (orderIndex === -1) throw new Error("Order not found");

      const order = MOCK_ORDERS[orderIndex];
      order.estado_cocina = 'listo';
      order.date_listo_cuisine = Date.now();

      if (order.table_id) {
          const tableIndex = MOCK_TABLES.findIndex(t => t.id === order.table_id);
          if (tableIndex !== -1) {
              MOCK_TABLES[tableIndex].statut = 'a_payer';
          }
      }
      notificationsService.publish('notifications_updated');
      return simulateNetwork(order);
  },

  markOrderAsServed: async (orderId: string): Promise<Order> => {
      const orderIndex = MOCK_ORDERS.findIndex(o => o.id === orderId);
      if (orderIndex === -1) throw new Error("Order not found");
      
      const order = MOCK_ORDERS[orderIndex];
      order.estado_cocina = 'servido';
      order.date_servido = Date.now();
      notificationsService.publish('notifications_updated');
      return simulateNetwork(order);
  },

  finalizeOrder: async (orderId: string, paymentMethod: Order['payment_method'], receiptUrl?: string): Promise<Order> => {
      const orderIndex = MOCK_ORDERS.findIndex(o => o.id === orderId);
      if (orderIndex === -1) throw new Error("Order not found");
      
      const order = MOCK_ORDERS[orderIndex];
      order.statut = 'finalisee';
      order.payment_status = 'paid';
      order.payment_method = paymentMethod;
      order.payment_receipt_url = receiptUrl;
      
      const orderProfit = order.items.reduce((totalProfit, item) => {
        const product = MOCK_PRODUCTS.find(p => p.id === item.produitRef);
        if (!product) return totalProfit;
        const unitCost = calculateCost(product.recipe);
        return totalProfit + ((item.prix_unitaire - unitCost) * item.quantite);
      }, 0);
      order.profit = orderProfit;
      
      createSaleEntriesForOrder(order);

      if (order.table_id) {
          const tableIndex = MOCK_TABLES.findIndex(t => t.id === order.table_id);
          if (tableIndex !== -1) {
              MOCK_TABLES[tableIndex].statut = 'libre';
              delete MOCK_TABLES[tableIndex].commandeId;
              delete MOCK_TABLES[tableIndex].couverts;
          }
      }
      notificationsService.publish('notifications_updated');
      return simulateNetwork(order);
  },

  // --- Ingredient CRUD ---
  addIngredient: async (newIngredientData: Omit<Ingredient, 'id' | 'stock_actuel' | 'prix_unitaire'>): Promise<Ingredient> => {
    const newIngredient: Ingredient = {
      id: `ing${Date.now()}`,
      nom: newIngredientData.nom,
      unite: newIngredientData.unite,
      stock_minimum: newIngredientData.stock_minimum,
      stock_actuel: 0,
      prix_unitaire: 0,
    };
    MOCK_INGREDIENTS.push(newIngredient);
    notificationsService.publish('notifications_updated');
    return simulateNetwork(newIngredient);
  },

  updateIngredient: async (ingredientId: string, updates: Partial<Omit<Ingredient, 'id' | 'stock_actuel' | 'prix_unitaire'>>): Promise<Ingredient> => {
    const index = MOCK_INGREDIENTS.findIndex(ing => ing.id === ingredientId);
    if (index === -1) throw new Error("Ingredient not found");
    MOCK_INGREDIENTS[index] = { ...MOCK_INGREDIENTS[index], ...updates };
    notificationsService.publish('notifications_updated');
    return simulateNetwork(MOCK_INGREDIENTS[index]);
  },

  deleteIngredient: async (ingredientId: string): Promise<{ success: boolean }> => {
    const index = MOCK_INGREDIENTS.findIndex(ing => ing.id === ingredientId);
    if (index === -1) throw new Error("Ingredient not found");
    // TODO: Add check to prevent deletion if ingredient is in a recipe
    MOCK_INGREDIENTS.splice(index, 1);
    notificationsService.publish('notifications_updated');
    return simulateNetwork({ success: true });
  },

  resupplyIngredient: async (ingredientId: string, quantity: number, unitPrice: number): Promise<Ingredient> => {
    const index = MOCK_INGREDIENTS.findIndex(ing => ing.id === ingredientId);
    if (index === -1) throw new Error("Ingredient not found");
    
    const totalCost = quantity * unitPrice;
    const ingredient = MOCK_INGREDIENTS[index];
    const currentStockValue = ingredient.prix_unitaire * ingredient.stock_actuel;
    const newStock = ingredient.stock_actuel + quantity;
    
    const newWeightedPrice = newStock > 0 ? (currentStockValue + totalCost) / newStock : 0;
    
    ingredient.stock_actuel = newStock;
    ingredient.prix_unitaire = isNaN(newWeightedPrice) ? 0 : newWeightedPrice;

    const newPurchase: Purchase = {
        id: `pur${Date.now()}`,
        ingredient_id: ingredientId,
        quantite_achetee: quantity,
        prix_total: totalCost,
        date_achat: Date.now()
    };
    MOCK_PURCHASES.push(newPurchase);
    notificationsService.publish('notifications_updated');
    return simulateNetwork(ingredient);
  },
  
  // --- Product & Category CRUD ---
  addProduct: async(productData: Omit<Product, 'id'>): Promise<Product> => {
    const newProduct: Product = {
      id: `p${Date.now()}`,
      ...productData,
    };
    MOCK_PRODUCTS.push(newProduct);
    return simulateNetwork(newProduct);
  },

  updateProduct: async(productId: string, updates: Partial<Product>): Promise<Product> => {
    const index = MOCK_PRODUCTS.findIndex(p => p.id === productId);
    if (index === -1) throw new Error("Product not found");
    MOCK_PRODUCTS[index] = { ...MOCK_PRODUCTS[index], ...updates };
    return simulateNetwork(MOCK_PRODUCTS[index]);
  },

  deleteProduct: async(productId: string): Promise<{ success: boolean }> => {
    const index = MOCK_PRODUCTS.findIndex(p => p.id === productId);
    if (index === -1) throw new Error("Product not found");
    MOCK_PRODUCTS[index].estado = 'archive';
    notificationsService.publish('notifications_updated');
    return simulateNetwork({ success: true });
  },

  addCategory: async(name: string): Promise<Category> => {
    const newCategory: Category = {
      id: `c${Date.now()}`,
      nom: name,
    };
    MOCK_CATEGORIES.push(newCategory);
    return simulateNetwork(newCategory);
  },

  deleteCategory: async(categoryId: string): Promise<{ success: boolean }> => {
    // Check if any product uses this category
    const isUsed = MOCK_PRODUCTS.some(p => p.categoria_id === categoryId);
    if (isUsed) throw new Error("Cannot delete category in use by products.");

    const index = MOCK_CATEGORIES.findIndex(c => c.id === categoryId);
    if (index === -1) throw new Error("Category not found");
    MOCK_CATEGORIES.splice(index, 1);
    return simulateNetwork({ success: true });
  },

  submitCustomerOrder: async (orderData: { items: OrderItem[], clientInfo: { nom: string, telephone: string, adresse: string }, receipt_url: string }): Promise<Order> => {
    const today = new Date();
    const dateStr = `${today.getDate().toString().padStart(2, '0')}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getFullYear()}`;
    const dailyCounter = MOCK_ORDERS.filter(o => o.id.startsWith(`WEB-${dateStr}`)).length + 1;

    const newOrder: Order = {
      id: `WEB-${dateStr}-${dailyCounter.toString().padStart(4, '0')}`,
      type: 'a_emporter',
      couverts: 1,
      statut: 'pendiente_validacion',
      estado_cocina: 'no_enviado',
      date_creation: Date.now(),
      payment_status: 'unpaid',
      items: orderData.items,
      clientInfo: orderData.clientInfo,
      receipt_url: orderData.receipt_url,
      total: orderData.items.reduce((acc, item) => acc + item.quantite * item.prix_unitaire, 0),
    };
    MOCK_ORDERS.push(newOrder);
    notificationsService.publish('notifications_updated');
    return simulateNetwork(newOrder);
  },

  getCustomerOrderStatus: async (orderId: string): Promise<Order | null> => {
    const order = MOCK_ORDERS.find(o => o.id === orderId);
    return simulateNetwork(order || null);
  },

  validateTakeawayOrder: async (orderId: string): Promise<Order> => {
    const orderIndex = MOCK_ORDERS.findIndex(o => o.id === orderId);
    if (orderIndex === -1) throw new Error("Order not found");

    const order = MOCK_ORDERS[orderIndex];
    if (order.statut !== 'pendiente_validacion') throw new Error("Order cannot be validated");

    // Decrement stock
    order.items.forEach(item => {
      adjustIngredientStock(item.produitRef, item.quantite);
    });

    // Update order status
    order.statut = 'en_cours';
    order.estado_cocina = 'recibido';
    order.payment_status = 'paid'; // Payment is confirmed
    order.date_envoi_cuisine = Date.now();
    order.items.forEach(i => i.estado = 'enviado');
    notificationsService.publish('notifications_updated');
    return simulateNetwork(order);
  },

  markTakeawayAsDelivered: async (orderId: string): Promise<Order> => {
    const orderIndex = MOCK_ORDERS.findIndex(o => o.id === orderId);
    if (orderIndex === -1) throw new Error("Order not found");

    const order = MOCK_ORDERS[orderIndex];
    order.statut = 'finalisee';
    order.estado_cocina = 'servido';
    order.payment_method = 'transferencia'; // Takeaway are always transferencia
    
    const orderProfit = order.items.reduce((totalProfit, item) => {
        const product = MOCK_PRODUCTS.find(p => p.id === item.produitRef);
        if (!product) return totalProfit;
        const unitCost = calculateCost(product.recipe);
        return totalProfit + ((item.prix_unitaire - unitCost) * item.quantite);
    }, 0);
    order.profit = orderProfit;

    createSaleEntriesForOrder(order);

    notificationsService.publish('notifications_updated');
    return simulateNetwork(order);
  },

  getNotificationCounts: async (): Promise<NotificationCounts> => {
    const counts = {
        pendingTakeaway: MOCK_ORDERS.filter(o => o.type === 'a_emporter' && o.statut === 'pendiente_validacion').length,
        readyTakeaway: MOCK_ORDERS.filter(o => o.type === 'a_emporter' && o.estado_cocina === 'listo').length,
        kitchenOrders: MOCK_ORDERS.filter(o => o.estado_cocina === 'recibido').length,
        lowStockIngredients: MOCK_INGREDIENTS.filter(i => i.stock_actuel <= i.stock_minimum).length,
        readyForService: MOCK_ORDERS.filter(o => o.type === 'sur_place' && o.estado_cocina === 'listo').length,
    };
    return simulateNetwork(counts);
  },

  generateDailyReport: async (): Promise<DailyReport> => {
    const now = new Date();
    const startTime = getBusinessDayStart(now);
    const startTimeStamp = startTime.getTime();
    const endTimeStamp = now.getTime();

    const relevantOrders = MOCK_ORDERS.filter(o => 
      o.statut === 'finalisee' && 
      o.date_creation >= startTimeStamp && 
      o.date_creation <= endTimeStamp
    );

    const ventesDuJour = relevantOrders.reduce((acc, o) => acc + o.total, 0);
    const clientsDuJour = relevantOrders.reduce((acc, o) => acc + o.couverts, 0);
    const panierMoyen = relevantOrders.length > 0 ? ventesDuJour / relevantOrders.length : 0;

    const soldProductsByCategory: { [key: string]: { categoryName: string, products: SoldProduct[] } } = {};

    relevantOrders.forEach(order => {
      order.items.forEach(item => {
        const product = MOCK_PRODUCTS.find(p => p.id === item.produitRef);
        if (!product) return;

        const category = MOCK_CATEGORIES.find(c => c.id === product.categoria_id);
        const categoryId = category ? category.id : 'unknown';
        const categoryName = category ? category.nom : 'Sans catégorie';

        if (!soldProductsByCategory[categoryId]) {
          soldProductsByCategory[categoryId] = {
            categoryName: categoryName,
            products: []
          };
        }

        let productEntry = soldProductsByCategory[categoryId].products.find(p => p.id === product.id);
        if (productEntry) {
          productEntry.quantity += item.quantite;
          productEntry.totalSales += (item.quantite * item.prix_unitaire);
        } else {
          soldProductsByCategory[categoryId].products.push({
            id: product.id,
            name: product.nom_produit,
            quantity: item.quantite,
            totalSales: (item.quantite * item.prix_unitaire),
          });
        }
      });
    });
    
    Object.values(soldProductsByCategory).forEach(category => {
      category.products.sort((a, b) => b.quantity - a.quantity);
    });

    const soldProductsArray = Object.values(soldProductsByCategory);
    
    const ingredientsStockBas = MOCK_INGREDIENTS.filter(i => i.stock_actuel <= i.stock_minimum);

    const report: DailyReport = {
      generatedAt: new Date().toISOString(),
      startDate: startTime.toISOString(),
      clientsDuJour,
      panierMoyen,
      ventesDuJour,
      soldProducts: soldProductsArray,
      lowStockIngredients: ingredientsStockBas,
    };

    return simulateNetwork(report);
  },

  getSalesHistory: async (): Promise<Sale[]> => {
    return simulateNetwork(MOCK_SALES);
  },

  getFinalizedOrders: async (): Promise<Order[]> => {
    return simulateNetwork(MOCK_ORDERS.filter(o => o.statut === 'finalisee'));
  },
};

// Pre-process historical data to ensure consistency (profits, sales entries)
const preProcessHistoricalData = () => {
    const finalizedOrders = MOCK_ORDERS.filter(o => o.statut === 'finalisee');

    // 1. Calculate and add profit to historical orders if it's missing
    finalizedOrders.forEach(order => {
        if (order.profit === undefined) {
            const orderProfit = order.items.reduce((totalProfit, item) => {
                const product = MOCK_PRODUCTS.find(p => p.id === item.produitRef);
                if (!product) return totalProfit;
                const unitCost = calculateCost(product.recipe);
                return totalProfit + ((item.prix_unitaire - unitCost) * item.quantite);
            }, 0);
            order.profit = orderProfit;
        }
    });

    // 2. Pre-populate sales history from these orders if it's empty
    if (MOCK_SALES.length === 0) { // To avoid duplicates on hot reloads
        finalizedOrders.forEach(createSaleEntriesForOrder);
    }
};
preProcessHistoricalData();