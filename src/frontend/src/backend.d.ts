import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface OrderItem {
    productId: bigint;
    productName: string;
    quantity: bigint;
    price: bigint;
}
export interface Order {
    id: bigint;
    customerName: string;
    status: string;
    createdAt: bigint;
    address: string;
    phone: string;
    items: Array<OrderItem>;
    totalPrice: bigint;
}
export interface UserProfile {
    name: string;
}
export interface Product {
    id: bigint;
    inStock: boolean;
    name: string;
    category: string;
    price: bigint;
}
export interface TodaysStats {
    totalSales: bigint;
    orderCount: bigint;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addProduct(name: string, category: string, price: bigint): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteProduct(id: bigint): Promise<boolean>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getOrders(): Promise<Array<Order>>;
    getProducts(): Promise<Array<Product>>;
    getTodaysStats(): Promise<TodaysStats>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    initializeIfEmpty(): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    placeOrder(customerName: string, phone: string, address: string, items: Array<OrderItem>, totalPrice: bigint): Promise<bigint>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setAdminPassword(newPassword: string): Promise<void>;
    updateOrderStatus(orderId: bigint, status: string): Promise<boolean>;
    updateProduct(id: bigint, name: string, category: string, price: bigint, inStock: boolean): Promise<boolean>;
    verifyAdminPassword(password: string): Promise<boolean>;
}
