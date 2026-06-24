export interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  image_url: string | null;
  category: string;
  available: boolean;
  created_at: string;
  sizes?: { label: string; price: number }[];
  emoji?: string;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "delivered"
  | "cancelled";

export interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  total: number;
  status: OrderStatus;
  notes: string | null;
  created_at: string;
  latitude?: number | null;
  longitude?: number | null;
  payment_method?: string | null;
  delivery_fee?: number | null;
  distance_km?: number | null;
  delivery_zone?: string | null;
  user_id?: string | null;
}

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  last_latitude: number | null;
  last_longitude: number | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  price: number;
}

export interface OrderWithItems extends Order {
  order_items: OrderItem[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: { label: string; price: number };
  doughType?: { label: string; extra: number };
  addons?: { label: string; extra: number }[];
  cartKey: string;
}

export interface UserPoints {
  user_id: string;
  points: number;
  total_earned: number;
}

export interface PointsHistoryItem {
  id: string;
  user_id: string;
  order_id: string | null;
  points: number;
  type: "earned" | "redeemed";
  note: string | null;
  created_at: string;
}

export interface RedeemableProduct {
  id: string;
  name: string;
  description: string | null;
  points_cost: number;
  image_url: string | null;
  is_available: boolean;
  created_at: string;
}

export interface OrderStreak {
  user_id: string;
  order_count: number;
  streak_start: string;
  free_delivery_used: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  is_active: boolean;
  created_at: string;
}

export interface ComboDeal {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface ComboStepOption {
  id: string;
  step_id: string;
  label: string;
  extra_cost: number;
  product_category: string | null;
}

export interface ComboStep {
  id: string;
  combo_id: string;
  title: string;
  subtitle: string | null;
  step_order: number;
  min_select: number;
  max_select: number;
  step_type: string;
  combo_step_options: ComboStepOption[];
}

export interface ComboDealWithSteps extends ComboDeal {
  combo_steps: ComboStep[];
}

export interface ComboSelection {
  stepId: string;
  stepTitle: string;
  chosen: string;
  extraCost: number;
}

export interface ComboCartItem {
  comboId: string;
  comboName: string;
  basePrice: number;
  selections: ComboSelection[];
  quantity: number;
  cartKey: string;
}

export interface ProductOffer {
  id: string;
  product_id: string;
  offer_type: "price_discount" | "free_delivery" | "free_addon";
  discount_percent: number | null;
  addon_description: string | null;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}
