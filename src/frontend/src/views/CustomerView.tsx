import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  type OrderItem,
  usePlaceOrder,
  useProducts,
} from "../hooks/useQueries";
import type { Product } from "../hooks/useQueries";

const CATEGORIES = [
  "All",
  "Vegetables",
  "Fruits",
  "Dairy",
  "Rice & Atta",
  "Snacks",
  "Household",
];

const CATEGORY_EMOJIS: Record<string, string> = {
  All: "🛒",
  Vegetables: "🥬",
  Fruits: "🍎",
  Dairy: "🥛",
  "Rice & Atta": "🌾",
  Snacks: "🍿",
  Household: "🏠",
};

const SKELETON_KEYS = ["sk1", "sk2", "sk3", "sk4", "sk5", "sk6"];

type CartItem = OrderItem & { inStock?: boolean };

interface CustomerViewProps {
  cartItems: CartItem[];
  cartOpen: boolean;
  onCartOpenChange: (open: boolean) => void;
  onAddToCart: (item: OrderItem) => void;
  onUpdateCart: (updater: (prev: CartItem[]) => CartItem[]) => void;
  onClearCart: () => void;
}

export function CustomerView({
  cartItems,
  cartOpen,
  onCartOpenChange,
  onAddToCart,
  onUpdateCart,
  onClearCart,
}: CustomerViewProps) {
  const { data: products, isLoading } = useProducts();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const placeOrder = usePlaceOrder();

  const filteredProducts = (products ?? []).filter((p) => {
    const matchesCategory =
      selectedCategory === "All" || p.category === selectedCategory;
    const matchesSearch =
      !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0n,
  );

  const handleQtyChange = (productId: bigint, delta: number) => {
    onUpdateCart((prev) =>
      prev
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + BigInt(delta) }
            : item,
        )
        .filter((item) => item.quantity > 0n),
    );
  };

  const handlePlaceOrder = async () => {
    if (!customerName.trim() || !phone.trim() || !address.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      await placeOrder.mutateAsync({
        customerName: customerName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        items: cartItems.map((i) => ({
          productId: i.productId,
          productName: i.productName,
          quantity: i.quantity,
          price: i.price,
        })),
        totalPrice,
      });
      toast.success("Order placed successfully! 🎉");
      onClearCart();
      setCheckoutOpen(false);
      onCartOpenChange(false);
      setCustomerName("");
      setPhone("");
      setAddress("");
    } catch {
      toast.error("Failed to place order. Please try again.");
    }
  };

  return (
    <div className="pb-6">
      {/* Search */}
      <div className="px-4 pt-4 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-9 bg-card"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-ocid="product.search_input"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            type="button"
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`flex-none flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              selectedCategory === cat
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:bg-secondary hover:text-secondary-foreground border border-border"
            }`}
            data-ocid="product.tab"
          >
            <span>{CATEGORY_EMOJIS[cat] ?? "📦"}</span>
            {cat}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="px-4 pt-2">
        {isLoading ? (
          <div
            className="grid grid-cols-2 gap-3"
            data-ocid="product.loading_state"
          >
            {SKELETON_KEYS.map((key) => (
              <Skeleton key={key} className="h-40 rounded-xl" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-16 text-muted-foreground"
            data-ocid="product.empty_state"
          >
            <ShoppingBag className="h-12 w-12 mb-3 opacity-30" />
            <p className="font-medium">No products found</p>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-2 gap-3"
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.04 } },
              hidden: {},
            }}
          >
            {filteredProducts.map((product, idx) => (
              <ProductCard
                key={product.id.toString()}
                product={product}
                onAddToCart={onAddToCart}
                index={idx + 1}
              />
            ))}
          </motion.div>
        )}
      </div>

      {/* Cart Sheet */}
      <Sheet open={cartOpen} onOpenChange={onCartOpenChange}>
        <SheetContent
          side="bottom"
          className="h-[85vh] rounded-t-2xl p-0"
          data-ocid="cart.sheet"
        >
          <SheetHeader className="px-4 pt-5 pb-3">
            <SheetTitle className="font-display text-lg">Your Cart</SheetTitle>
          </SheetHeader>
          <Separator />

          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <ShoppingBag className="h-10 w-10 mb-2 opacity-30" />
              <p>Your cart is empty</p>
            </div>
          ) : (
            <>
              <ScrollArea
                className="flex-1 px-4 py-3"
                style={{ maxHeight: "calc(85vh - 200px)" }}
              >
                <div className="space-y-3">
                  <AnimatePresence>
                    {cartItems.map((item) => (
                      <motion.div
                        key={item.productId.toString()}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex items-center justify-between gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {item.productName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ₹{item.price.toString()} each
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleQtyChange(item.productId, -1)}
                            className="h-7 w-7 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                          >
                            {item.quantity === 1n ? (
                              <Trash2 className="h-3 w-3 text-destructive" />
                            ) : (
                              <Minus className="h-3 w-3" />
                            )}
                          </button>
                          <span className="w-5 text-center text-sm font-semibold">
                            {item.quantity.toString()}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQtyChange(item.productId, 1)}
                            className="h-7 w-7 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          <span className="w-16 text-right text-sm font-semibold">
                            ₹{(item.price * item.quantity).toString()}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </ScrollArea>
              <div className="px-4 py-4 border-t border-border space-y-3">
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-primary text-lg">
                    ₹{totalPrice.toString()}
                  </span>
                </div>
                <Button
                  className="w-full"
                  onClick={() => setCheckoutOpen(true)}
                  data-ocid="cart.submit_button"
                >
                  Proceed to Checkout
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Checkout Dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">
              Complete Your Order
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="checkout-name">Your Name</Label>
              <Input
                id="checkout-name"
                placeholder="Enter your name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                data-ocid="checkout.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="checkout-phone">Phone Number</Label>
              <Input
                id="checkout-phone"
                placeholder="Enter phone number"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                data-ocid="checkout.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="checkout-address">Delivery Address</Label>
              <Input
                id="checkout-address"
                placeholder="Enter delivery address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                data-ocid="checkout.input"
              />
            </div>
            <div className="rounded-xl bg-secondary/50 p-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Items</span>
                <span>
                  {cartItems.reduce((s, i) => s + Number(i.quantity), 0)}
                </span>
              </div>
              <div className="flex justify-between font-semibold mt-1">
                <span>Total Amount</span>
                <span className="text-primary">₹{totalPrice.toString()}</span>
              </div>
            </div>
            <Button
              className="w-full"
              onClick={handlePlaceOrder}
              disabled={placeOrder.isPending}
              data-ocid="checkout.submit_button"
            >
              {placeOrder.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {placeOrder.isPending ? "Placing Order..." : "Place Order 🛒"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProductCard({
  product,
  onAddToCart,
  index,
}: {
  product: Product;
  onAddToCart: (item: OrderItem) => void;
  index: number;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 16 },
        visible: { opacity: 1, y: 0 },
      }}
      data-ocid={`product.item.${index}`}
    >
      <Card className="overflow-hidden border-border shadow-card hover:shadow-md transition-shadow">
        <CardContent className="p-3">
          <div className="mb-2 h-20 rounded-lg bg-secondary/50 flex items-center justify-center text-3xl">
            {getCategoryEmoji(product.category)}
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-sm leading-tight line-clamp-1">
              {product.name}
            </p>
            <p className="text-xs text-muted-foreground">{product.category}</p>
            <div className="flex items-center justify-between gap-1 pt-1">
              <span className="font-display text-base font-semibold text-primary">
                ₹{product.price.toString()}
              </span>
              {!product.inStock && (
                <Badge variant="destructive" className="text-xs px-1.5 py-0">
                  Out of Stock
                </Badge>
              )}
            </div>
            <Button
              size="sm"
              className="w-full mt-1 h-8 text-xs"
              disabled={!product.inStock}
              onClick={() =>
                onAddToCart({
                  productId: product.id,
                  productName: product.name,
                  quantity: 1n,
                  price: product.price,
                })
              }
            >
              <Plus className="h-3 w-3 mr-1" />
              {product.inStock ? "Add" : "Unavailable"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = {
    Vegetables: "🥬",
    Fruits: "🍎",
    Dairy: "🥛",
    "Rice & Atta": "🌾",
    Snacks: "🍿",
    Household: "🏠",
  };
  return map[category] ?? "📦";
}
