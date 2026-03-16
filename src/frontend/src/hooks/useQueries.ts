import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Order, OrderItem, Product, TodaysStats } from "../backend.d";
import { useActor } from "./useActor";

export function useProducts() {
  const { actor, isFetching } = useActor();
  return useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getProducts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useOrders() {
  const { actor, isFetching } = useActor();
  return useQuery<Order[]>({
    queryKey: ["orders"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getOrders();
    },
    enabled: !!actor && !isFetching,
  });
}

export function usePlaceOrder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      customerName,
      phone,
      address,
      items,
      totalPrice,
    }: {
      customerName: string;
      phone: string;
      address: string;
      items: OrderItem[];
      totalPrice: bigint;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.placeOrder(customerName, phone, address, items, totalPrice);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useUpdateOrderStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      status,
    }: { orderId: bigint; status: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateOrderStatus(orderId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useAddProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      category,
      price,
    }: {
      name: string;
      category: string;
      price: bigint;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.addProduct(name, category, price);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUpdateProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      name,
      category,
      price,
      inStock,
    }: {
      id: bigint;
      name: string;
      category: string;
      price: bigint;
      inStock: boolean;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateProduct(id, name, category, price, inStock);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useDeleteProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      // deleteProduct is a new backend method; cast to any for compatibility
      return (actor as any).deleteProduct(id) as Promise<boolean>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useTodaysStats() {
  const { actor } = useActor();
  return useQuery<TodaysStats>({
    queryKey: ["todaysStats"],
    queryFn: async () => {
      if (!actor) throw new Error("Not connected");
      // getTodaysStats is a new backend method; cast to any for compatibility
      return (actor as any).getTodaysStats() as Promise<TodaysStats>;
    },
    enabled: !!actor,
    refetchInterval: 30000,
  });
}

export function useInitialize() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["init"],
    queryFn: async () => {
      if (!actor) return null;
      await actor.initializeIfEmpty();
      return true;
    },
    enabled: !!actor && !isFetching,
    staleTime: Number.POSITIVE_INFINITY,
  });
}

export type { Product, Order, OrderItem };
