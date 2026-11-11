export type Role = 'Customer' | 'Kitchen' | 'Manager';
export type Fulfillment = 'Pickup' | 'Delivery';
export type OrderStatus = 'Received' | 'Preparing' | 'Ready' | 'Completed' | 'Cancelled';

export interface AuthResponse { token: string; fullName: string; role: Role; }
export interface MenuItem {
  id: number; categoryId: number; category: string; name: string; description: string;
  price: number; emoji: string; calories: number | null; isAvailable: boolean;
}
export interface MenuCategory { id: number; name: string; items: MenuItem[]; }
export interface Category { id: number; name: string; sortOrder: number; }
export interface CartLine { menuItemId: number; quantity: number; }
export interface Quote {
  subtotal: number; discount: number; tax: number; deliveryFee: number; total: number; promoValid: boolean;
}
export interface OrderSummary {
  id: number; userId: number; customerName: string; fulfillmentType: Fulfillment; status: OrderStatus;
  paymentStatus: 'Paid' | 'Refunded'; subtotal: number; discount: number; tax: number; deliveryFee: number;
  total: number; promoCode: string | null; deliveryAddress: string | null; phone: string | null;
  createdAt: string; updatedAt: string; itemCount: number;
}
export interface OrderLine { name: string; unitPrice: number; quantity: number; lineTotal: number; }
export interface StatusEntry { status: OrderStatus; changedAt: string; }
export interface OrderDetail { order: OrderSummary; items: OrderLine[]; history: StatusEntry[]; }
export interface KitchenOrder { order: OrderSummary; items: OrderLine[]; }
export interface PlaceOrderRequest {
  items: CartLine[]; fulfillmentType: Fulfillment; promoCode?: string | null;
  deliveryAddress?: string | null; phone?: string | null; payment: { cardNumber: string; name: string };
}
export interface Ingredient { id: number; name: string; unit: string; stockQty: number; reorderLevel: number; }
export interface MenuItemUpsert {
  name: string; description: string; price: number; categoryId: number; emoji: string;
  calories: number | null; isAvailable: boolean;
}
export interface DailySalesReport {
  summary: {
    salesDate: string; orderCount: number; grossSales: number; refundedAmount: number;
    netSales: number; discountsGiven: number; cancelledCount: number;
  };
  topItems: { name: string; quantity: number; revenue: number }[];
  hourly: { hour: number; orders: number; sales: number }[];
}
