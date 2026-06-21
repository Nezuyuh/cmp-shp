export enum ComponentCategory {
  CPU = 'CPU',
  Motherboard = 'Motherboard',
  RAM = 'RAM',
  GPU = 'GPU',
  Case = 'Case',
  PSU = 'PSU',
  Cooler = 'Cooler',
  Storage = 'Storage',
  Fan = 'Fan',
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  stock: number;
  sku: string;
  image_url?: string;
  specs?: Record<string, unknown>;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  label: string;
  price: number;
  stock: number;
  sku: string;
  attributes: Record<string, unknown>;
}

export interface PCBuild {
  id: string;
  user_id: string;
  name: string;
  components: Record<string, Product>;
  total_price: number;
}

export interface Order {
  id: string;
  user_id: string;
  status: string;
  total_price: number;
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id?: string;
  quantity: number;
  unit_price: number;
}

export interface CompatibilityResult {
  rule: string;
  passed: boolean;
  message: string;
}

export interface CartItem {
  product: Product;
  variant?: ProductVariant;
  quantity: number;
}

export interface AdminStats {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
}
