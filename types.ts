export enum View {
  DASHBOARD = 'DASHBOARD',
  SALES_ORDER = 'SALES_ORDER',
  ACCOUNTING = 'ACCOUNTING',
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  warehouse: string;
  minStock: number;
}

export interface Customer {
  id: string;
  name: string;
  company: string;
  email: string;
  creditLimit: number;
  currentBalance: number;
  dso: number; // Days Sales Outstanding
  status: 'VIP' | 'Regular' | 'Risk';
  lastOrderDate: string;
}

export interface LineItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number; // Percentage
  total: number;
  stockStatus: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

export interface OrderSummary {
  subtotal: number;
  tax: number;
  shipping: number;
  discountTotal: number;
  grandTotal: number;
}