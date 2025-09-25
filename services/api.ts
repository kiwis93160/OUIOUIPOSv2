import { supabase } from './supabaseClient';
import { normalizeCloudinaryImageUrl, resolveProductImageUrl } from './cloudinary';

import {
  Role,
  Table,
  Order,
  KitchenTicket,
  Product,
  Category,
  Ingredient,
  OrderItem,
  RecipeItem,
  DashboardStats,
  SalesDataPoint,
  NotificationCounts,
  DailyReport,
  SoldProduct,
  Sale,
  RoleLogin,
} from '../types';
import { ROLE_HOME_PAGE_META_KEY } from '../constants';

type SupabasePermissions = Role['permissions'] & {
  [key in typeof ROLE_HOME_PAGE_META_KEY]?: string;
};

type SupabaseRoleRow = {
  id: string;
  name: string;
  pin?: string | null;
  permissions: SupabasePermissions | null;

};

type SupabaseTableRow = {
  id: string;
  nom: string;
  capacite: number;
  statut: Table['statut'];
  commande_id: string | null;
  couverts: number | null;
};

type SupabaseRecipeRow = {
  ingredient_id: string;
  qte_utilisee: number;
};

type SupabaseProductRow = {
  id: string;
  nom_produit: string;
  description: string | null;
  prix_vente: number;
  categoria_id: string;
  estado: Product['estado'];
  image: string | null;
  product_recipes: SupabaseRecipeRow[] | null;
};

type SupabaseIngredientRow = {
  id: string;
  nom: string;
  unite: Ingredient['unite'];
  stock_minimum: number;
  stock_actuel: number;
  prix_unitaire: number;
};

type SupabaseCategoryRow = {
  id: string;
  nom: string;
};

type SupabaseOrderItemRow = {
  id: string;
  order_id: string;
  produit_id: string;
  nom_produit: string;
  prix_unitaire: number;
  quantite: number;
  excluded_ingredients: string[] | null;
  commentaire: string | null;
  estado: OrderItem['estado'];
  date_envoi: string | null;
};

type SupabaseOrderRow = {
  id: string;
  type: Order['type'];
  table_id: string | null;
  table_nom: string | null;
  couverts: number | null;
  statut: Order['statut'];
  estado_cocina: Order['estado_cocina'];
  date_creation: string;
  date_envoi_cuisine: string | null;
  date_listo_cuisine: string | null;
  date_servido: string | null;
  payment_status: Order['payment_status'];
  total: number | null;
  profit: number | null;
  payment_method: Order['payment_method'] | null;
  payment_receipt_url: string | null;
  client_nom: string | null;
  client_telephone: string | null;
  client_adresse: string | null;
  receipt_url: string | null;
  order_items: SupabaseOrderItemRow[] | null;
};

type SupabaseSaleRow = {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  category_id: string;
  category_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  unit_cost: number;
  total_cost: number;
  profit: number;
  payment_method: Order['payment_method'] | null;
  sale_date: string;
};

type SupabaseRoleLoginRow = {
  id: string;
  role_id: string;
  login_at: string;
  roles?: { id: string; name: string } | null;
};

type SupabaseResponse<T> = {
  data: T;
  error: { message: string } | null;
  status?: number;
};

type EventCallback = () => void;

const eventListeners: Record<string, EventCallback[]> = {};

const publishEvent = (event: string) => {
  if (eventListeners[event]) {
    eventListeners[event].forEach(callback => callback());
  }
};

let ordersRealtimeChannel: ReturnType<typeof supabase.channel> | null = null;

const ensureOrdersRealtimeSubscription = () => {
  if (ordersRealtimeChannel || typeof (supabase as { channel?: unknown }).channel !== 'function') {
    return;
  }

  try {
    ordersRealtimeChannel = supabase
      .channel('orders-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => publishEvent('orders_updated'))
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_items' },
        () => publishEvent('orders_updated'),
      )
      .subscribe(status => {
        if (status === 'CHANNEL_ERROR' || status === 'CLOSED' || status === 'TIMED_OUT') {
          ordersRealtimeChannel = null;
        }
      });
  } catch (error) {
    console.warn('Failed to subscribe to real-time order updates', error);
  }
};

const unwrap = <T>(response: SupabaseResponse<T>): T => {
  if (response.error) {
    throw new Error(response.error.message);
  }
  return response.data;
};

const unwrapMaybe = <T>(response: SupabaseResponse<T | null>): T | null => {
  if (response.error && response.status !== 406) {
    throw new Error(response.error.message);
  }
  return response.data ?? null;
};

const toTimestamp = (value?: string | null): number | undefined => {
  if (!value) {
    return undefined;
  }
  return new Date(value).getTime();
};

const toNumber = (value: number | string | null | undefined): number | undefined => {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === 'number') {
    return value;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const toIsoString = (value: number | undefined | null): string | null | undefined => {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  return new Date(value).toISOString();
};

const calculateCost = (recipe: RecipeItem[], ingredientMap: Map<string, Ingredient>): number => {
  return recipe.reduce((total, item) => {
    const ingredient = ingredientMap.get(item.ingredient_id);
    if (!ingredient) {
      return total;
    }

    let unitPrice = ingredient.prix_unitaire;
    if (ingredient.unite === 'kg' || ingredient.unite === 'L') {
      unitPrice = unitPrice / 1000;
    }

    return total + unitPrice * item.qte_utilisee;
  }, 0);
};

const extractPermissions = (
  permissions: SupabaseRoleRow['permissions'],
): { permissions: Role['permissions']; homePage?: string } => {
  if (!permissions) {
    return { permissions: {}, homePage: undefined };
  }

  const { [ROLE_HOME_PAGE_META_KEY]: homePage, ...permissionLevels } = permissions;

  return {
    permissions: permissionLevels as Role['permissions'],
    homePage: typeof homePage === 'string' ? homePage : undefined,
  };
};

const mergeHomePageIntoPermissions = (
  permissions: Role['permissions'],
  homePage?: string,
): SupabasePermissions => {
  const payload: SupabasePermissions = { ...permissions };

  if (homePage) {
    payload[ROLE_HOME_PAGE_META_KEY] = homePage;
  } else {
    delete payload[ROLE_HOME_PAGE_META_KEY];
  }

  return payload;
};

const mapRoleRow = (row: SupabaseRoleRow, includePin: boolean): Role => {
  const { permissions, homePage } = extractPermissions(row.permissions);
  const role: Role = {
    id: row.id,
    name: row.name,
    homePage,
    permissions,

  };

  if (includePin && row.pin) {
    role.pin = row.pin;
  }

  return role;
};

const mapIngredientRow = (row: SupabaseIngredientRow): Ingredient => ({
  id: row.id,
  nom: row.nom,
  unite: row.unite,
  stock_minimum: row.stock_minimum,
  stock_actuel: row.stock_actuel,
  prix_unitaire: row.prix_unitaire,
});

const mapCategoryRow = (row: SupabaseCategoryRow): Category => ({
  id: row.id,
  nom: row.nom,
});

const mapRecipeRow = (row: SupabaseRecipeRow): RecipeItem => ({
  ingredient_id: row.ingredient_id,
  qte_utilisee: row.qte_utilisee,
});

const mapProductRow = (row: SupabaseProductRow, ingredientMap?: Map<string, Ingredient>): Product => {
  const recipe = (row.product_recipes ?? []).map(mapRecipeRow);
  const product: Product = {
    id: row.id,
    nom_produit: row.nom_produit,
    description: row.description ?? undefined,
    prix_vente: row.prix_vente,
    categoria_id: row.categoria_id,
    estado: row.estado,
    image: resolveProductImageUrl(row.image),
    recipe,
  };

  if (ingredientMap) {
    product.cout_revient = calculateCost(recipe, ingredientMap);
  }

  return product;
};

const isUuid = (value?: string | null): value is string =>
  !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

const mapOrderItemRow = (row: SupabaseOrderItemRow): OrderItem => ({
  id: row.id,
  produitRef: row.produit_id,
  nom_produit: row.nom_produit,
  prix_unitaire: toNumber(row.prix_unitaire) ?? 0,
  quantite: row.quantite,
  excluded_ingredients: row.excluded_ingredients ?? [],
  commentaire: row.commentaire ?? '',
  estado: row.estado,
  date_envoi: toTimestamp(row.date_envoi),
});

const areArraysEqual = (a: string[], b: string[]): boolean => {
  if (a.length !== b.length) {
    return false;
  }

  return a.every((value, index) => value === b[index]);
};

const areOrderItemsEquivalent = (a: OrderItem, b: OrderItem): boolean => {
  if (
    a.produitRef !== b.produitRef ||
    a.nom_produit !== b.nom_produit ||
    a.prix_unitaire !== b.prix_unitaire ||
    a.quantite !== b.quantite ||
    a.commentaire !== b.commentaire ||
    a.estado !== b.estado
  ) {
    return false;
  }

  const excludedIngredientsA = [...a.excluded_ingredients].sort();
  const excludedIngredientsB = [...b.excluded_ingredients].sort();

  return areArraysEqual(excludedIngredientsA, excludedIngredientsB);
};

const reorderOrderItems = (referenceItems: OrderItem[], itemsToReorder: OrderItem[]): OrderItem[] => {
  const remaining = [...itemsToReorder];
  const ordered: OrderItem[] = [];

  referenceItems.forEach(referenceItem => {
    const matchIndex = remaining.findIndex(item => areOrderItemsEquivalent(item, referenceItem));
    if (matchIndex !== -1) {
      ordered.push(remaining.splice(matchIndex, 1)[0]);
    }
  });

  return [...ordered, ...remaining];
};

const mapOrderRow = (row: SupabaseOrderRow): Order => {
  const items = (row.order_items ?? []).map(mapOrderItemRow);
  const total = toNumber(row.total);
  const profit = toNumber(row.profit);
  const order: Order = {
    id: row.id,
    type: row.type,
    table_id: row.table_id ?? undefined,
    table_nom: row.table_nom ?? undefined,
    couverts: row.couverts ?? 0,
    statut: row.statut,
    estado_cocina: row.estado_cocina,
    date_creation: toTimestamp(row.date_creation) ?? Date.now(),
    date_envoi_cuisine: toTimestamp(row.date_envoi_cuisine),
    date_listo_cuisine: toTimestamp(row.date_listo_cuisine),
    date_servido: toTimestamp(row.date_servido),
    payment_status: row.payment_status,
    items,
    total: total ?? items.reduce((sum, item) => sum + item.prix_unitaire * item.quantite, 0),
    profit: profit,
    payment_method: row.payment_method ?? undefined,
    payment_receipt_url: row.payment_receipt_url ?? undefined,
    receipt_url: row.receipt_url ?? undefined,
  };

  if (row.client_nom || row.client_telephone || row.client_adresse) {
    order.clientInfo = {
      nom: row.client_nom ?? '',
      telephone: row.client_telephone ?? '',
      adresse: row.client_adresse ?? undefined,
    };
  }

  return order;
};

const mapSaleRow = (row: SupabaseSaleRow): Sale => ({
  id: row.id,
  orderId: row.order_id,
  productId: row.product_id,
  productName: row.product_name,
  categoryId: row.category_id,
  categoryName: row.category_name,
  quantity: row.quantity,
  unitPrice: row.unit_price,
  totalPrice: row.total_price,
  unitCost: row.unit_cost,
  totalCost: row.total_cost,
  profit: row.profit,
  paymentMethod: row.payment_method ?? undefined,
  saleDate: toTimestamp(row.sale_date) ?? Date.now(),
});

const mapTableRow = (
  row: SupabaseTableRow,
  orderMeta: Map<string, { estado_cocina?: Order['estado_cocina']; date_envoi_cuisine?: number }>,
): Table => {
  const table: Table = {
    id: row.id,
    nom: row.nom,
    capacite: row.capacite,
    statut: row.statut,
    commandeId: row.commande_id ?? undefined,
    couverts: row.couverts ?? undefined,
  };

  if (table.commandeId) {
    const meta = orderMeta.get(table.commandeId);
    if (meta) {
      table.estado_cocina = meta.estado_cocina;
      table.date_envoi_cuisine = meta.date_envoi_cuisine;
    }
  }

  return table;
};

const selectOrdersQuery = () =>
  supabase
    .from('orders')
    .select(
      `
        id,
        type,
        table_id,
        table_nom,
        couverts,
        statut,
        estado_cocina,
        date_creation,
        date_envoi_cuisine,
        date_listo_cuisine,
        date_servido,
        payment_status,
        total,
        profit,
        payment_method,
        payment_receipt_url,
        client_nom,
        client_telephone,
        client_adresse,
        receipt_url,
        order_items (
          id,
          order_id,
          produit_id,
          nom_produit,
          prix_unitaire,
          quantite,
          excluded_ingredients,
          commentaire,
          estado,
          date_envoi
        )
      `,
    )
    .order('date_creation', { ascending: false });

const selectProductsQuery = () =>
  supabase
    .from('products')
    .select(
      `
        id,
        nom_produit,
        description,
        prix_vente,
        categoria_id,
        estado,
        image,
        product_recipes (
          ingredient_id,
          qte_utilisee
        )
      `,
    )
    .order('nom_produit');

const fetchOrderById = async (orderId: string): Promise<Order | null> => {
  const response = await selectOrdersQuery().eq('id', orderId).maybeSingle();
  const row = unwrapMaybe<SupabaseOrderRow>(response as SupabaseResponse<SupabaseOrderRow | null>);
  return row ? mapOrderRow(row) : null;
};

const fetchIngredients = async (): Promise<Ingredient[]> => {
  const response = await supabase
    .from('ingredients')
    .select('id, nom, unite, stock_minimum, stock_actuel, prix_unitaire')
    .order('nom');
  const rows = unwrap<SupabaseIngredientRow[]>(response as SupabaseResponse<SupabaseIngredientRow[]>);
  return rows.map(mapIngredientRow);
};

const fetchCategories = async (): Promise<Category[]> => {
  const response = await supabase
    .from('categories')
    .select('id, nom')
    .order('nom');
  const rows = unwrap<SupabaseCategoryRow[]>(response as SupabaseResponse<SupabaseCategoryRow[]>);
  return rows.map(mapCategoryRow);
};

const fetchTablesWithMeta = async (): Promise<Table[]> => {
  const response = await supabase
    .from('restaurant_tables')
    .select('id, nom, capacite, statut, commande_id, couverts')
    .order('nom');

  const tableRows = unwrap<SupabaseTableRow[]>(response as SupabaseResponse<SupabaseTableRow[]>);
  const activeOrderIds = tableRows
    .map(row => row.commande_id)
    .filter((value): value is string => Boolean(value));

  let orderMeta = new Map<string, { estado_cocina?: Order['estado_cocina']; date_envoi_cuisine?: number }>();
  if (activeOrderIds.length > 0) {
    const ordersResponse = await selectOrdersQuery().in('id', activeOrderIds);
    const orderRows = unwrap<SupabaseOrderRow[]>(ordersResponse as SupabaseResponse<SupabaseOrderRow[]>);
    const orders = orderRows.map(mapOrderRow);
    orderMeta = new Map(
      orders.map(order => [order.id, { estado_cocina: order.estado_cocina, date_envoi_cuisine: order.date_envoi_cuisine }]),
    );
  }

  return tableRows.map(row => mapTableRow(row, orderMeta));
};

const fetchRoleLoginsSince = async (startIso: string): Promise<RoleLogin[]> => {
  const [loginsResponse, rolesResponse] = await Promise.all([
    supabase
      .from('role_logins')
      .select('id, role_id, login_at')
      .gte('login_at', startIso)
      .order('login_at', { ascending: true }),
    supabase.from('roles').select('id, name, permissions'),
  ]);

  const loginRows = unwrap<SupabaseRoleLoginRow[]>(loginsResponse as SupabaseResponse<SupabaseRoleLoginRow[]>);
  const roleRows = unwrap<SupabaseRoleRow[]>(rolesResponse as SupabaseResponse<SupabaseRoleRow[]>);
  const roleNameMap = new Map(roleRows.map(role => [role.id, role.name]));

  return loginRows.map(row => ({
    roleId: row.role_id,
    roleName: roleNameMap.get(row.role_id) ?? 'Rôle inconnu',
    loginAt: row.login_at,
  }));
};

const getBusinessDayStart = (now: Date = new Date()): Date => {
  const startTime = new Date(now);
  startTime.setHours(5, 0, 0, 0);

  if (now < startTime) {
    startTime.setDate(startTime.getDate() - 1);
  }

  return startTime;
};

const createSalesEntriesForOrder = async (order: Order) => {
  if (!order.items.length) {
    return;
  }

  const productIds = Array.from(new Set(order.items.map(item => item.produitRef)));
  const [categories, ingredients, productsResponse] = await Promise.all([
    fetchCategories(),
    fetchIngredients(),
    productIds.length > 0 ? selectProductsQuery().in('id', productIds) : selectProductsQuery().limit(0),
  ]);

  const ingredientMap = new Map(ingredients.map(ingredient => [ingredient.id, ingredient]));
  const categoryMap = new Map(categories.map(category => [category.id, category.nom]));

  let productRows: SupabaseProductRow[] = [];
  if (productIds.length > 0) {
    productRows = unwrap<SupabaseProductRow[]>(productsResponse as SupabaseResponse<SupabaseProductRow[]>);
  }

  const productMap = new Map(
    productRows.map(row => {
      const product = mapProductRow(row, ingredientMap);
      return [product.id, product] as const;
    }),
  );

  await supabase.from('sales').delete().eq('order_id', order.id);

  if (!order.items.length) {
    return;
  }

  const saleDateIso = toIsoString(order.date_servido) ?? new Date().toISOString();
  await supabase.from('sales').insert(
    order.items.map(item => {
      const product = productMap.get(item.produitRef);
      const cost = product ? calculateCost(product.recipe, ingredientMap) : 0;
      const categoryId = product?.categoria_id ?? 'unknown';
      const categoryName = product ? categoryMap.get(categoryId) ?? 'Sans catégorie' : 'Sans catégorie';

      return {
        order_id: order.id,
        product_id: item.produitRef,
        product_name: item.nom_produit,
        category_id: categoryId,
        category_name: categoryName,
        quantity: item.quantite,
        unit_price: item.prix_unitaire,
        total_price: item.prix_unitaire * item.quantite,
        unit_cost: cost,
        total_cost: cost * item.quantite,
        profit: (item.prix_unitaire - cost) * item.quantite,
        payment_method: order.payment_method ?? null,
        sale_date: saleDateIso,
      };
    }),
  );
};

const notificationsService = {
  subscribe: (event: string, callback: EventCallback): (() => void) => {
    if (!eventListeners[event]) {
      eventListeners[event] = [];
    }
    eventListeners[event].push(callback);

    if (event === 'orders_updated') {
      ensureOrdersRealtimeSubscription();
    }

    return () => {
      eventListeners[event] = (eventListeners[event] ?? []).filter(cb => cb !== callback);

      if (event === 'orders_updated' && eventListeners[event]?.length === 0 && ordersRealtimeChannel) {
        if (typeof (supabase as { removeChannel?: (channel: unknown) => void }).removeChannel === 'function') {
          supabase.removeChannel(ordersRealtimeChannel);
        }
        ordersRealtimeChannel = null;
      }
    };
  },
  publish: (event: string) => {
    publishEvent(event);
  },
};

const publishOrderChange = () => {
  notificationsService.publish('notifications_updated');
  notificationsService.publish('orders_updated');
};

export const api = {
  notifications: notificationsService,

  getRoles: async (): Promise<Role[]> => {
    const response = await supabase.from('roles').select('id, name, pin, permissions').order('name');

    const rows = unwrap<SupabaseRoleRow[]>(response as SupabaseResponse<SupabaseRoleRow[]>);
    return rows.map(row => mapRoleRow(row, true));
  },

  getRoleById: async (roleId: string): Promise<Role | null> => {
    const response = await supabase
      .from('roles')
      .select('id, name, permissions')
      .eq('id', roleId)
      .maybeSingle();
    const row = unwrapMaybe<SupabaseRoleRow>(response as SupabaseResponse<SupabaseRoleRow | null>);
    return row ? mapRoleRow(row, false) : null;
  },

  createRole: async (payload: Omit<Role, 'id'>): Promise<Role> => {
    const response = await supabase
      .from('roles')
      .insert({
        name: payload.name,
        pin: payload.pin,
        permissions: mergeHomePageIntoPermissions(payload.permissions, payload.homePage),

      })
      .select('id, name, pin, permissions')
      .single();
    const row = unwrap<SupabaseRoleRow>(response as SupabaseResponse<SupabaseRoleRow>);
    notificationsService.publish('notifications_updated');
    return mapRoleRow(row, true);
  },

  updateRole: async (roleId: string, updates: Omit<Role, 'id'>): Promise<Role> => {
    const response = await supabase
      .from('roles')
      .update({
        name: updates.name,
        pin: updates.pin,
        permissions: mergeHomePageIntoPermissions(updates.permissions, updates.homePage),

      })
      .eq('id', roleId)
      .select('id, name, pin, permissions')
      .single();
    const row = unwrap<SupabaseRoleRow>(response as SupabaseResponse<SupabaseRoleRow>);
    notificationsService.publish('notifications_updated');
    return mapRoleRow(row, true);
  },

  deleteRole: async (roleId: string): Promise<void> => {
    const response = await supabase.from('roles').delete().eq('id', roleId);
    unwrap(response as SupabaseResponse<unknown>);
    notificationsService.publish('notifications_updated');
  },

  loginWithPin: async (pin: string): Promise<Role | null> => {
    const response = await supabase
      .from('roles')
      .select('id, name, permissions')
      .eq('pin', pin)
      .maybeSingle();
    const row = unwrapMaybe<SupabaseRoleRow>(response as SupabaseResponse<SupabaseRoleRow | null>);
    if (!row) {
      return null;
    }

    const role = mapRoleRow(row, false);

    try {
      await supabase.from('role_logins').insert({ role_id: role.id, login_at: new Date().toISOString() });
    } catch (error) {
      console.warn('Failed to enregistrer la connexion du rôle', error);
    }

    return role;
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    const businessDayStart = getBusinessDayStart();
    const businessDayIso = businessDayStart.toISOString();

    const [tables, ingredients, categories, productRowsResponse, ordersResponse, weekOrdersResponse] = await Promise.all([
      fetchTablesWithMeta(),
      fetchIngredients(),
      fetchCategories(),
      selectProductsQuery(),
      selectOrdersQuery().eq('statut', 'finalisee').gte('date_creation', businessDayIso),
      selectOrdersQuery().eq('statut', 'finalisee').gte('date_creation', (() => {
        const start = new Date(businessDayStart);
        start.setDate(start.getDate() - 13);
        return start.toISOString();
      })()),
    ]);

    const todaysOrderRows = unwrap<SupabaseOrderRow[]>(ordersResponse as SupabaseResponse<SupabaseOrderRow[]>);
    const todaysOrders = todaysOrderRows.map(mapOrderRow);

    const weekOrderRows = unwrap<SupabaseOrderRow[]>(weekOrdersResponse as SupabaseResponse<SupabaseOrderRow[]>);
    const weekOrders = weekOrderRows.map(mapOrderRow);

    const ingredientMap = new Map(ingredients.map(ing => [ing.id, ing]));
    const productRows = unwrap<SupabaseProductRow[]>(productRowsResponse as SupabaseResponse<SupabaseProductRow[]>);
    const productMap = new Map(
      productRows.map(row => {
        const product = mapProductRow(row, ingredientMap);
        return [product.id, product] as const;
      }),
    );

    const ventesAujourdhui = todaysOrders.reduce((sum, order) => sum + order.total, 0);
    const beneficeAujourdhui = todaysOrders.reduce((profit, order) => {
      return (
        profit +
        order.items.reduce((acc, item) => {
          const product = productMap.get(item.produitRef);
          const cost = product ? calculateCost(product.recipe, ingredientMap) : 0;
          return acc + (item.prix_unitaire - cost) * item.quantite;
        }, 0)
      );
    }, 0);

    const clientsAujourdhui = todaysOrders.reduce((sum, order) => sum + order.couverts, 0);
    const panierMoyen = todaysOrders.length > 0 ? ventesAujourdhui / todaysOrders.length : 0;

    const categoryMap = new Map(categories.map(category => [category.id, category.nom]));

    const ventesParCategorieMap = new Map<string, number>();
    todaysOrders.forEach(order => {
      order.items.forEach(item => {
        const product = productMap.get(item.produitRef);
        const categoryName = product ? categoryMap.get(product.categoria_id) ?? 'Sans catégorie' : 'Sans catégorie';
        ventesParCategorieMap.set(
          categoryName,
          (ventesParCategorieMap.get(categoryName) ?? 0) + item.prix_unitaire * item.quantite,
        );
      });
    });

    const ventesParCategorie: SalesDataPoint[] = Array.from(ventesParCategorieMap.entries()).map(([name, value]) => ({
      name,
      value,
    }));

    const tablesOccupees = tables.filter(table => table.statut !== 'libre').length;
    const clientsActuels = tables.reduce((sum, table) => sum + (table.couverts ?? 0), 0);
    const commandesEnCuisine = todaysOrders.filter(order => order.estado_cocina === 'recibido').length;
    const ingredientsStockBas = ingredients.filter(ingredient => ingredient.stock_actuel <= ingredient.stock_minimum);

    const ventes7Jours = Array.from({ length: 7 }).map((_, index) => {
      const dayStart = new Date(businessDayStart);
      dayStart.setDate(dayStart.getDate() - (6 - index));
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayTotal = weekOrders
        .filter(order => order.date_creation >= dayStart.getTime() && order.date_creation < dayEnd.getTime())
        .reduce((sum, order) => sum + order.total, 0);

      const previousWeekStart = new Date(dayStart);
      previousWeekStart.setDate(previousWeekStart.getDate() - 7);
      const previousWeekEnd = new Date(previousWeekStart);
      previousWeekEnd.setDate(previousWeekEnd.getDate() + 1);

      const previousWeekTotal = weekOrders
        .filter(
          order =>
            order.date_creation >= previousWeekStart.getTime() && order.date_creation < previousWeekEnd.getTime(),
        )
        .reduce((sum, order) => sum + order.total, 0);

      return {
        name: index === 6 ? 'Auj' : `J-${6 - index}`,
        ventes: dayTotal,
        ventesSemainePrecedente: previousWeekTotal,
      };
    });

    return {
      ventesAujourdhui,
      beneficeAujourdhui,
      clientsAujourdhui,
      panierMoyen,
      tablesOccupees,
      clientsActuels,
      commandesEnCuisine,
      ingredientsStockBas,
      ventes7Jours,
      ventesParCategorie,
    };
  },

  getSalesByProduct: async (): Promise<SalesDataPoint[]> => {
    const response = await supabase
      .from('sales')
      .select('product_id, product_name, total_price');
    const rows = unwrap<{ product_id: string; product_name: string; total_price: number }[]>(
      response as SupabaseResponse<{ product_id: string; product_name: string; total_price: number }[]>,
    );

    const totals = new Map<string, { name: string; value: number }>();
    rows.forEach(row => {
      const current = totals.get(row.product_id) ?? { name: row.product_name, value: 0 };
      current.value += row.total_price;
      totals.set(row.product_id, current);
    });

    const sorted = Array.from(totals.values()).sort((a, b) => b.value - a.value);
    if (sorted.length > 6) {
      const top6 = sorted.slice(0, 6);
      const others = sorted.slice(6).reduce((sum, item) => sum + item.value, 0);
      return [...top6, { name: 'Autres', value: others }];
    }
    return sorted;
  },

  getTables: async (): Promise<Table[]> => {
    return fetchTablesWithMeta();
  },

  getIngredients: async (): Promise<Ingredient[]> => {
    return fetchIngredients();
  },

  getProducts: async (): Promise<Product[]> => {
    const [productRows, ingredients] = await Promise.all([
      selectProductsQuery().neq('estado', 'archive'),
      fetchIngredients(),
    ]);
    const rows = unwrap<SupabaseProductRow[]>(productRows as SupabaseResponse<SupabaseProductRow[]>);
    const ingredientMap = new Map(ingredients.map(ingredient => [ingredient.id, ingredient]));
    return rows.map(row => mapProductRow(row, ingredientMap));
  },

  getTopSellingProducts: async (): Promise<Product[]> => {
    const targetCategories = ['Tacos', 'Quesadillas', 'Entradas'];
    const salesResponse = await supabase
      .from('sales')
      .select('product_id, product_name, category_name, total_price, quantity');
    const salesRows = unwrap<{
      product_id: string;
      product_name: string;
      category_name: string;
      total_price: number;
      quantity: number;
    }[]>(salesResponse as SupabaseResponse<{
      product_id: string;
      product_name: string;
      category_name: string;
      total_price: number;
      quantity: number;
    }[]>);

    const filtered = salesRows.filter(row => targetCategories.includes(row.category_name));
    const aggregated = new Map<string, { quantity: number }>();

    filtered.forEach(row => {
      const current = aggregated.get(row.product_id) ?? { quantity: 0 };
      current.quantity += row.quantity;
      aggregated.set(row.product_id, current);
    });

    const topIds = Array.from(aggregated.entries())
      .sort((a, b) => b[1].quantity - a[1].quantity)
      .slice(0, 6)
      .map(([productId]) => productId);

    if (topIds.length === 0) {
      return [];
    }

    const productsResponse = await selectProductsQuery().in('id', topIds);
    const productRows = unwrap<SupabaseProductRow[]>(productsResponse as SupabaseResponse<SupabaseProductRow[]>);
    const ingredients = await fetchIngredients();
    const ingredientMap = new Map(ingredients.map(ingredient => [ingredient.id, ingredient]));

    return productRows
      .filter(row => row.estado !== 'archive')
      .map(row => mapProductRow(row, ingredientMap));
  },

  getCategories: async (): Promise<Category[]> => {
    return fetchCategories();
  },

  getKitchenOrders: async (): Promise<KitchenTicket[]> => {
    const response = await selectOrdersQuery()
      .eq('estado_cocina', 'recibido')
      .or('statut.eq.en_cours,type.eq.a_emporter');
    const rows = unwrap<SupabaseOrderRow[]>(response as SupabaseResponse<SupabaseOrderRow[]>);
    const orders = rows.map(mapOrderRow);

    const tickets: KitchenTicket[] = [];

    orders.forEach(order => {
      const sentItems = order.items.filter(item => item.estado === 'enviado');
      if (sentItems.length === 0) {
        return;
      }

      const groups = sentItems.reduce((acc, item) => {
        const key = item.date_envoi ?? order.date_envoi_cuisine ?? order.date_creation;
        const group = acc.get(key) ?? [];
        group.push(item);
        acc.set(key, group);
        return acc;
      }, new Map<number, OrderItem[]>());

      groups.forEach((items, key) => {
        tickets.push({
          ...order,
          items,
          date_envoi_cuisine: key,
          ticketKey: `${order.id}-${key}`,
        });
      });
    });

    return tickets.sort((a, b) => {
      const aTime = a.date_envoi_cuisine ?? a.date_creation;
      const bTime = b.date_envoi_cuisine ?? b.date_creation;
      return aTime - bTime;
    });
  },

  getTakeawayOrders: async (): Promise<{ pending: Order[]; ready: Order[] }> => {
    const response = await selectOrdersQuery().eq('type', 'a_emporter');
    const rows = unwrap<SupabaseOrderRow[]>(response as SupabaseResponse<SupabaseOrderRow[]>);
    const orders = rows.map(mapOrderRow);
    return {
      pending: orders.filter(order => order.statut === 'pendiente_validacion'),
      ready: orders.filter(order => order.estado_cocina === 'listo'),
    };
  },

  getOrderById: async (orderId: string): Promise<Order | undefined> => {
    const order = await fetchOrderById(orderId);
    return order ?? undefined;
  },

  createOrGetOrderByTableId: async (tableId: string): Promise<Order> => {
    const tableResponse = await supabase
      .from('restaurant_tables')
      .select('id, nom, capacite, statut, commande_id, couverts')
      .eq('id', tableId)
      .maybeSingle();
    const tableRow = unwrapMaybe<SupabaseTableRow>(tableResponse as SupabaseResponse<SupabaseTableRow | null>);

    if (!tableRow) {
      throw new Error('Table not found');
    }

    if (tableRow.commande_id) {
      const existingOrder = await fetchOrderById(tableRow.commande_id);
      if (existingOrder) {
        return existingOrder;
      }
    }

    const nowIso = new Date().toISOString();
    const insertResponse = await supabase
      .from('orders')
      .insert({
        type: 'sur_place',
        table_id: tableRow.id,
        table_nom: tableRow.nom,
        couverts: tableRow.couverts ?? tableRow.capacite,
        statut: 'en_cours',
        estado_cocina: 'no_enviado',
        date_creation: nowIso,
        payment_status: 'unpaid',
        total: 0,
      })
      .select('*')
      .single();
    const insertedRow = unwrap<SupabaseOrderRow>(insertResponse as SupabaseResponse<SupabaseOrderRow>);

    await supabase
      .from('restaurant_tables')
      .update({
        statut: 'occupee',
        commande_id: insertedRow.id,
        couverts: tableRow.couverts ?? tableRow.capacite,
      })
      .eq('id', tableId);

    publishOrderChange();
    return mapOrderRow(insertedRow);
  },

  cancelUnsentTableOrder: async (orderId: string): Promise<void> => {
    const existingOrder = await fetchOrderById(orderId);
    if (!existingOrder) {
      return;
    }

    const hasBeenSent = existingOrder.estado_cocina !== 'no_enviado'
      || existingOrder.items.some(item => item.estado !== 'en_attente');

    if (hasBeenSent) {
      return;
    }

    await supabase.from('order_items').delete().eq('order_id', orderId);
    await supabase.from('orders').delete().eq('id', orderId);

    if (existingOrder.table_id) {
      await supabase
        .from('restaurant_tables')
        .update({ statut: 'libre', commande_id: null, couverts: null })
        .eq('id', existingOrder.table_id);
    }

    publishOrderChange();
  },

  updateOrder: async (orderId: string, updates: Partial<Order> & { removedItemIds?: string[] }): Promise<Order> => {
    const existingOrder = await fetchOrderById(orderId);
    if (!existingOrder) {
      throw new Error('Order not found');
    }

    let items = existingOrder.items;
    if (updates.items) {
      const payload = updates.items.map(item => {
        const payloadItem: Record<string, unknown> = {
          order_id: orderId,
          produit_id: item.produitRef,
          nom_produit: item.nom_produit,
          prix_unitaire: item.prix_unitaire,
          quantite: item.quantite,
          excluded_ingredients: item.excluded_ingredients,
          commentaire: item.commentaire,
          estado: item.estado,
          date_envoi: toIsoString(item.date_envoi) ?? null,
        };

        if (isUuid(item.id)) {
          payloadItem.id = item.id;
        }

        return payloadItem;
      });

      if (payload.length > 0) {
        await supabase.from('order_items').upsert(payload, { defaultToNull: false });
      }
      items = updates.items;
    }

    const { items: _, clientInfo, removedItemIds = [], ...rest } = updates;
    const payload: Record<string, unknown> = {};

    if (rest.type) payload.type = rest.type;
    if (rest.table_id !== undefined) payload.table_id = rest.table_id;
    if (rest.table_nom !== undefined) payload.table_nom = rest.table_nom;
    if (rest.couverts !== undefined) payload.couverts = rest.couverts;
    if (rest.statut) payload.statut = rest.statut;
    if (rest.estado_cocina) payload.estado_cocina = rest.estado_cocina;
    if (rest.payment_status) payload.payment_status = rest.payment_status;
    if (rest.payment_method !== undefined) payload.payment_method = rest.payment_method;
    if (rest.payment_receipt_url !== undefined) payload.payment_receipt_url = rest.payment_receipt_url;
    if (rest.receipt_url !== undefined) payload.receipt_url = rest.receipt_url;
    if (rest.total !== undefined) payload.total = rest.total;
    if (rest.profit !== undefined) payload.profit = rest.profit;

    if (rest.date_creation !== undefined) payload.date_creation = toIsoString(rest.date_creation);
    if (rest.date_envoi_cuisine !== undefined) payload.date_envoi_cuisine = toIsoString(rest.date_envoi_cuisine);
    if (rest.date_listo_cuisine !== undefined) payload.date_listo_cuisine = toIsoString(rest.date_listo_cuisine);
    if (rest.date_servido !== undefined) payload.date_servido = toIsoString(rest.date_servido);

    if (updates.items) {
      payload.total = updates.items.reduce((sum, item) => sum + item.prix_unitaire * item.quantite, 0);
    }

    const persistedIdsToDelete = removedItemIds.filter(id => isUuid(id));
    if (persistedIdsToDelete.length > 0) {
      await supabase.from('order_items').delete().in('id', persistedIdsToDelete);
    }

    if (clientInfo) {
      payload.client_nom = clientInfo?.nom ?? null;
      payload.client_telephone = clientInfo?.telephone ?? null;
      payload.client_adresse = clientInfo?.adresse ?? null;
    }

    if (Object.keys(payload).length > 0) {
      await supabase.from('orders').update(payload).eq('id', orderId);
    }

    publishOrderChange();
    const updatedOrder = await fetchOrderById(orderId);
    if (!updatedOrder) {
      throw new Error('Order not found after update');
    }

    if (updates.items) {
      return {
        ...updatedOrder,
        items: reorderOrderItems(updates.items, updatedOrder.items),
      };
    }

    return updatedOrder;
  },

  sendOrderToKitchen: async (orderId: string, itemIds?: string[]): Promise<Order> => {
    const order = await fetchOrderById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const pendingItems = order.items.filter(item => item.estado === 'en_attente');

    const itemsToSend = (() => {
      if (!itemIds || itemIds.length === 0) {
        return pendingItems;
      }

      const idsToSend = new Set(itemIds);
      return pendingItems.filter(item => idsToSend.has(item.id));
    })();

    if (itemsToSend.length === 0) {
      return order;
    }

    const persistedIds = itemsToSend.filter(item => isUuid(item.id)).map(item => item.id);
    if (persistedIds.length === 0) {
      return order;
    }

    const nowIso = new Date().toISOString();
    await supabase
      .from('order_items')
      .update({ estado: 'enviado', date_envoi: nowIso })
      .in('id', persistedIds);

    await supabase
      .from('orders')
      .update({ estado_cocina: 'recibido', date_envoi_cuisine: nowIso })
      .eq('id', orderId);

    if (order.table_id) {
      await supabase
        .from('restaurant_tables')
        .update({ statut: 'occupee' })
        .eq('id', order.table_id);
    }

    publishOrderChange();
    const updatedOrder = await fetchOrderById(orderId);
    if (!updatedOrder) {
      throw new Error('Order not found after sending to kitchen');
    }
    return updatedOrder;
  },

  markOrderAsReady: async (orderId: string): Promise<Order> => {
    const nowIso = new Date().toISOString();
    await supabase
      .from('orders')
      .update({ estado_cocina: 'listo', date_listo_cuisine: nowIso })
      .eq('id', orderId);

    const order = await fetchOrderById(orderId);
    if (order?.table_id) {
      await supabase
        .from('restaurant_tables')
        .update({ statut: 'a_payer' })
        .eq('id', order.table_id);
    }

    publishOrderChange();
    const updatedOrder = await fetchOrderById(orderId);
    if (!updatedOrder) {
      throw new Error('Order not found after ready update');
    }
    return updatedOrder;
  },

  markOrderAsServed: async (orderId: string): Promise<Order> => {
    const nowIso = new Date().toISOString();
    await supabase
      .from('orders')
      .update({ estado_cocina: 'servido', date_servido: nowIso })
      .eq('id', orderId);

    publishOrderChange();
    const updatedOrder = await fetchOrderById(orderId);
    if (!updatedOrder) {
      throw new Error('Order not found after serve update');
    }
    return updatedOrder;
  },

  finalizeOrder: async (orderId: string, paymentMethod: Order['payment_method'], receiptUrl?: string): Promise<Order> => {
    const order = await fetchOrderById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const nowIso = new Date().toISOString();
    await supabase
      .from('orders')
      .update({
        statut: 'finalisee',
        payment_status: 'paid',
        payment_method: paymentMethod,
        payment_receipt_url: receiptUrl ?? null,
        date_servido: nowIso,
      })
      .eq('id', orderId);

    if (order.table_id) {
      await supabase
        .from('restaurant_tables')
        .update({ statut: 'libre', commande_id: null, couverts: null })
        .eq('id', order.table_id);
    }

    publishOrderChange();
    const updatedOrder = await fetchOrderById(orderId);
    if (!updatedOrder) {
      throw new Error('Order not found after finalization');
    }
    await createSalesEntriesForOrder(updatedOrder);
    return updatedOrder;
  },

  submitCustomerOrder: async (orderData: {
    items: OrderItem[];
    clientInfo: Order['clientInfo'];
    receipt_url?: string;
  }): Promise<Order> => {
    const now = new Date();
    const nowIso = now.toISOString();

    const insertResponse = await supabase
      .from('orders')
      .insert({
        type: 'a_emporter',
        couverts: 1,
        statut: 'pendiente_validacion',
        estado_cocina: 'no_enviado',
        date_creation: nowIso,
        payment_status: 'unpaid',
        total: orderData.items.reduce((sum, item) => sum + item.prix_unitaire * item.quantite, 0),
        client_nom: orderData.clientInfo?.nom ?? null,
        client_telephone: orderData.clientInfo?.telephone ?? null,
        client_adresse: orderData.clientInfo?.adresse ?? null,
        receipt_url: orderData.receipt_url ?? null,
      })
      .select('*')
      .single();
    const orderRow = unwrap<SupabaseOrderRow>(insertResponse as SupabaseResponse<SupabaseOrderRow>);

    if (orderData.items.length > 0) {
      await supabase.from('order_items').insert(
        orderData.items.map(item => {
          const payloadItem: Record<string, unknown> = {
            order_id: orderRow.id,
            produit_id: item.produitRef,
            nom_produit: item.nom_produit,
            prix_unitaire: item.prix_unitaire,
            quantite: item.quantite,
            excluded_ingredients: item.excluded_ingredients,
            commentaire: item.commentaire,
            estado: item.estado,
            date_envoi: item.date_envoi ? new Date(item.date_envoi).toISOString() : null,
          };

          if (isUuid(item.id)) {
            payloadItem.id = item.id;
          }

          return payloadItem;
        }),
        { defaultToNull: false },
      );
    }

    publishOrderChange();
    return mapOrderRow(orderRow);
  },

  getCustomerOrderStatus: async (orderId: string): Promise<Order | null> => {
    return fetchOrderById(orderId);
  },

  validateTakeawayOrder: async (orderId: string): Promise<Order> => {
    const nowIso = new Date().toISOString();
    await supabase
      .from('orders')
      .update({
        statut: 'en_cours',
        estado_cocina: 'recibido',
        payment_status: 'paid',
        date_envoi_cuisine: nowIso,
      })
      .eq('id', orderId);

    await supabase
      .from('order_items')
      .update({ estado: 'enviado', date_envoi: nowIso })
      .eq('order_id', orderId);

    publishOrderChange();
    const updatedOrder = await fetchOrderById(orderId);
    if (!updatedOrder) {
      throw new Error('Order not found after validation');
    }
    return updatedOrder;
  },

  markTakeawayAsDelivered: async (orderId: string): Promise<Order> => {
    await supabase
      .from('orders')
      .update({
        statut: 'finalisee',
        estado_cocina: 'servido',
        payment_method: 'transferencia',
      })
      .eq('id', orderId);

    publishOrderChange();
    const updatedOrder = await fetchOrderById(orderId);
    if (!updatedOrder) {
      throw new Error('Order not found after delivery');
    }
    await createSalesEntriesForOrder(updatedOrder);
    return updatedOrder;
  },

  getNotificationCounts: async (): Promise<NotificationCounts> => {
    const response = await selectOrdersQuery();
    const rows = unwrap<SupabaseOrderRow[]>(response as SupabaseResponse<SupabaseOrderRow[]>);
    const orders = rows.map(mapOrderRow);

    return {
      pendingTakeaway: orders.filter(order => order.type === 'a_emporter' && order.statut === 'pendiente_validacion').length,
      readyTakeaway: orders.filter(order => order.type === 'a_emporter' && order.estado_cocina === 'listo').length,
      kitchenOrders: orders.filter(order => order.estado_cocina === 'recibido').length,
      lowStockIngredients: (await fetchIngredients()).filter(
        ingredient => ingredient.stock_actuel <= ingredient.stock_minimum,
      ).length,
      readyForService: orders.filter(order => order.type === 'sur_place' && order.estado_cocina === 'listo').length,
    };
  },

  generateDailyReport: async (): Promise<DailyReport> => {
    const now = new Date();
    const start = getBusinessDayStart(now);
    const startIso = start.toISOString();

    const [ordersResponse, categories, ingredients, productRowsResponse, roleLogins] = await Promise.all([
      selectOrdersQuery()
        .eq('statut', 'finalisee')
        .gte('date_creation', startIso)
        .lte('date_creation', now.toISOString()),
      fetchCategories(),
      fetchIngredients(),
      selectProductsQuery(),
      fetchRoleLoginsSince(startIso),
    ]);
    const rows = unwrap<SupabaseOrderRow[]>(ordersResponse as SupabaseResponse<SupabaseOrderRow[]>);
    const orders = rows.map(mapOrderRow);

    const ventesDuJour = orders.reduce((sum, order) => sum + order.total, 0);
    const clientsDuJour = orders.reduce((sum, order) => sum + order.couverts, 0);
    const panierMoyen = orders.length > 0 ? ventesDuJour / orders.length : 0;

    const ingredientMap = new Map(ingredients.map(ingredient => [ingredient.id, ingredient]));
    const productRows = unwrap<SupabaseProductRow[]>(productRowsResponse as SupabaseResponse<SupabaseProductRow[]>);
    const productMap = new Map(
      productRows.map(row => {
        const product = mapProductRow(row, ingredientMap);
        return [product.id, product] as const;
      }),
    );

    const categoryMap = new Map(categories.map(category => [category.id, category.nom]));

    const soldProductsByCategory = new Map<string, { categoryName: string; products: SoldProduct[] }>();
    orders.forEach(order => {
      order.items.forEach(item => {
        const product = productMap.get(item.produitRef);
        const categoryName = product ? categoryMap.get(product.categoria_id) ?? 'Sans catégorie' : 'Sans catégorie';
        const categoryId = product ? product.categoria_id : 'unknown';
        const entry = soldProductsByCategory.get(categoryId) ?? { categoryName, products: [] };
        const existingProduct = entry.products.find(productItem => productItem.id === item.produitRef);
        if (existingProduct) {
          existingProduct.quantity += item.quantite;
          existingProduct.totalSales += item.prix_unitaire * item.quantite;
        } else {
          entry.products.push({
            id: item.produitRef,
            name: item.nom_produit,
            quantity: item.quantite,
            totalSales: item.prix_unitaire * item.quantite,
          });
        }
        soldProductsByCategory.set(categoryId, entry);
      });
    });

    soldProductsByCategory.forEach(category => {
      category.products.sort((a, b) => b.quantity - a.quantity);
    });

    const ingredientsStockBas = ingredients.filter(
      ingredient => ingredient.stock_actuel <= ingredient.stock_minimum,
    );

    return {
      generatedAt: now.toISOString(),
      startDate: start.toISOString(),
      clientsDuJour,
      panierMoyen,
      ventesDuJour,
      soldProducts: Array.from(soldProductsByCategory.values()),
      lowStockIngredients: ingredientsStockBas,
      roleLogins,
    };
  },

  getSalesHistory: async (): Promise<Sale[]> => {
    const response = await supabase.from('sales').select('*').order('sale_date', { ascending: false });
    const rows = unwrap<SupabaseSaleRow[]>(response as SupabaseResponse<SupabaseSaleRow[]>);
    return rows.map(mapSaleRow);
  },

  getFinalizedOrders: async (): Promise<Order[]> => {
    const response = await selectOrdersQuery().eq('statut', 'finalisee');
    const rows = unwrap<SupabaseOrderRow[]>(response as SupabaseResponse<SupabaseOrderRow[]>);
    return rows.map(mapOrderRow);
  },

  addIngredient: async (
    newIngredientData: Omit<Ingredient, 'id' | 'stock_actuel' | 'prix_unitaire'>,
  ): Promise<Ingredient> => {
    const response = await supabase
      .from('ingredients')
      .insert({
        nom: newIngredientData.nom,
        unite: newIngredientData.unite,
        stock_minimum: newIngredientData.stock_minimum,
        stock_actuel: 0,
        prix_unitaire: 0,
      })
      .select('id, nom, unite, stock_minimum, stock_actuel, prix_unitaire')
      .single();
    const row = unwrap<SupabaseIngredientRow>(response as SupabaseResponse<SupabaseIngredientRow>);
    notificationsService.publish('notifications_updated');
    return mapIngredientRow(row);
  },

  updateIngredient: async (
    ingredientId: string,
    updates: Partial<Omit<Ingredient, 'id'>>,
  ): Promise<Ingredient> => {
    const response = await supabase
      .from('ingredients')
      .update(updates)
      .eq('id', ingredientId)
      .select('id, nom, unite, stock_minimum, stock_actuel, prix_unitaire')
      .single();
    const row = unwrap<SupabaseIngredientRow>(response as SupabaseResponse<SupabaseIngredientRow>);
    notificationsService.publish('notifications_updated');
    return mapIngredientRow(row);
  },

  deleteIngredient: async (ingredientId: string): Promise<{ success: boolean }> => {
    await supabase.from('ingredients').delete().eq('id', ingredientId);
    notificationsService.publish('notifications_updated');
    return { success: true };
  },

  resupplyIngredient: async (ingredientId: string, quantity: number, unitPrice: number): Promise<Ingredient> => {
    const ingredientResponse = await supabase
      .from('ingredients')
      .select('id, nom, unite, stock_minimum, stock_actuel, prix_unitaire')
      .eq('id', ingredientId)
      .maybeSingle();
    const ingredientRow = unwrapMaybe<SupabaseIngredientRow>(
      ingredientResponse as SupabaseResponse<SupabaseIngredientRow | null>,
    );
    if (!ingredientRow) {
      throw new Error('Ingredient not found');
    }

    const currentStockValue = ingredientRow.prix_unitaire * ingredientRow.stock_actuel;
    const totalCost = quantity * unitPrice;
    const newStock = ingredientRow.stock_actuel + quantity;
    const newWeightedPrice = newStock > 0 ? (currentStockValue + totalCost) / newStock : 0;

    await supabase
      .from('ingredients')
      .update({
        stock_actuel: newStock,
        prix_unitaire: Number.isFinite(newWeightedPrice) ? newWeightedPrice : 0,
      })
      .eq('id', ingredientId);

    await supabase.from('purchases').insert({
      ingredient_id: ingredientId,
      quantite_achetee: quantity,
      prix_total: totalCost,
      date_achat: new Date().toISOString(),
    });

    notificationsService.publish('notifications_updated');
    const refreshedIngredient = await supabase
      .from('ingredients')
      .select('id, nom, unite, stock_minimum, stock_actuel, prix_unitaire')
      .eq('id', ingredientId)
      .single();
    const refreshedRow = unwrap<SupabaseIngredientRow>(refreshedIngredient as SupabaseResponse<SupabaseIngredientRow>);
    return mapIngredientRow(refreshedRow);
  },

  addProduct: async (product: Omit<Product, 'id'>): Promise<Product> => {
    const insertResponse = await supabase
      .from('products')
      .insert({
        nom_produit: product.nom_produit,
        description: product.description ?? null,
        prix_vente: product.prix_vente,
        categoria_id: product.categoria_id,
        estado: product.estado,
        image: normalizeCloudinaryImageUrl(product.image),

      })
      .select('id')
      .single();
    const insertedRow = unwrap<{ id: string }>(insertResponse as SupabaseResponse<{ id: string }>);

    if (product.recipe.length > 0) {
      await supabase.from('product_recipes').insert(
        product.recipe.map(item => ({
          product_id: insertedRow.id,
          ingredient_id: item.ingredient_id,
          qte_utilisee: item.qte_utilisee,
        })),
      );
    }

    notificationsService.publish('notifications_updated');
    const productsResponse = await selectProductsQuery().eq('id', insertedRow.id).single();
    const productRow = unwrap<SupabaseProductRow>(productsResponse as SupabaseResponse<SupabaseProductRow>);
    const ingredients = await fetchIngredients();
    const ingredientMap = new Map(ingredients.map(ingredient => [ingredient.id, ingredient]));
    return mapProductRow(productRow, ingredientMap);
  },

  updateProduct: async (productId: string, updates: Partial<Product>): Promise<Product> => {
    const { recipe, ...rest } = updates;

    const updatePayload: Record<string, unknown> = {};

    if (rest.nom_produit !== undefined) {
      updatePayload.nom_produit = rest.nom_produit;
    }

    if (rest.description !== undefined) {
      updatePayload.description = rest.description ?? null;
    }

    if (rest.prix_vente !== undefined) {
      updatePayload.prix_vente = rest.prix_vente;
    }

    if (rest.categoria_id !== undefined) {
      updatePayload.categoria_id = rest.categoria_id;
    }

    if (rest.estado !== undefined) {
      updatePayload.estado = rest.estado;
    }

    if (rest.image !== undefined) {
      updatePayload.image = normalizeCloudinaryImageUrl(rest.image);

    }

    if (Object.keys(updatePayload).length > 0) {
      await supabase.from('products').update(updatePayload).eq('id', productId);
    }

    if (recipe) {
      await supabase.from('product_recipes').delete().eq('product_id', productId);
      if (recipe.length > 0) {
        await supabase.from('product_recipes').insert(
          recipe.map(item => ({
            product_id: productId,
            ingredient_id: item.ingredient_id,
            qte_utilisee: item.qte_utilisee,
          })),
        );
      }
    }

    notificationsService.publish('notifications_updated');
    const productsResponse = await selectProductsQuery().eq('id', productId).single();
    const productRow = unwrap<SupabaseProductRow>(productsResponse as SupabaseResponse<SupabaseProductRow>);
    const ingredients = await fetchIngredients();
    const ingredientMap = new Map(ingredients.map(ingredient => [ingredient.id, ingredient]));
    return mapProductRow(productRow, ingredientMap);
  },

  deleteProduct: async (productId: string): Promise<void> => {
    await supabase.from('product_recipes').delete().eq('product_id', productId);
    await supabase.from('products').delete().eq('id', productId);
    notificationsService.publish('notifications_updated');
  },

  addCategory: async (name: string): Promise<Category> => {
    const response = await supabase
      .from('categories')
      .insert({ nom: name })
      .select('id, nom')
      .single();
    const row = unwrap<SupabaseCategoryRow>(response as SupabaseResponse<SupabaseCategoryRow>);
    notificationsService.publish('notifications_updated');
    return mapCategoryRow(row);
  },

  deleteCategory: async (categoryId: string): Promise<void> => {
    await supabase.from('categories').delete().eq('id', categoryId);
    notificationsService.publish('notifications_updated');
  },
};

