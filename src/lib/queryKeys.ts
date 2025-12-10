// Centralized query keys for consistent data syncing across admin panel
export const queryKeys = {
  // Products
  products: ['products'] as const,
  adminProducts: ['admin-products'] as const,
  
  // Categories
  categories: ['categories'] as const,
  adminCategories: ['admin-categories'] as const,
  
  // Ingredients/Inventory
  ingredients: ['ingredients'] as const,
  adminIngredients: ['admin-ingredients'] as const,
  
  // Orders
  orders: ['orders'] as const,
  adminOrders: (status?: string) => ['admin-orders', status] as const,
  orderItems: (orderId?: string) => ['order-items', orderId] as const,
  
  // Stock movements
  stockMovements: ['stock-movements'] as const,
  
  // Inventory counts
  inventoryCounts: ['inventory-counts'] as const,
  
  // Reports
  usageReport: (period: string) => ['usage-report', period] as const,
  wasteReport: (period: string) => ['waste-report', period] as const,
  costReport: ['cost-report'] as const,
  priceHistory: (period: string) => ['price-history', period] as const,
  
  // Suppliers
  suppliers: ['suppliers'] as const,
  
  // Users
  users: ['users'] as const,
  userRoles: ['user-roles'] as const,
  
  // Site settings
  siteSettings: ['site-settings'] as const,
  
  // About content
  teamMembers: ['team-members'] as const,
  faqItems: ['faq-items'] as const,
  awards: ['awards'] as const,
  
  // Dashboard stats
  dashboardStats: ['dashboard-stats'] as const,
};

// Invalidation groups - when one changes, invalidate related queries
export const invalidationGroups = {
  // When categories change, also refresh products (they depend on categories)
  categories: [queryKeys.categories, queryKeys.adminCategories, queryKeys.adminProducts, queryKeys.products],
  
  // When products change
  products: [queryKeys.products, queryKeys.adminProducts, queryKeys.dashboardStats],
  
  // When ingredients change, also refresh products and dashboard
  ingredients: [queryKeys.ingredients, queryKeys.adminIngredients, queryKeys.dashboardStats],
  
  // When orders change, refresh ingredients (for stock deduction) and dashboard
  orders: [queryKeys.orders, queryKeys.adminOrders(), queryKeys.adminIngredients, queryKeys.stockMovements, queryKeys.dashboardStats],
  
  // When stock movements change
  stockMovements: [queryKeys.stockMovements, queryKeys.adminIngredients, queryKeys.dashboardStats, queryKeys.inventoryCounts],
  
  // When suppliers change
  suppliers: [queryKeys.suppliers],
  
  // When couriers change
  couriers: [['couriers'], ['dashboard-couriers'], ['dashboard-courier-orders'], ['couriers-available']],
  
  // When site settings change
  siteSettings: [queryKeys.siteSettings],
};
