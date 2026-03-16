import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { Leaf, Settings, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { AuthProvider, LogoutButton, useAuthContext } from "./components/auth";
import { useInitialize } from "./hooks/useQueries";
import type { OrderItem } from "./hooks/useQueries";
import { AdminView } from "./views/AdminView";
import { CustomerView } from "./views/CustomerView";

type AppMode = "customer" | "admin";

function AppContent() {
  const [mode, setMode] = useState<AppMode>("customer");
  const [cartItems, setCartItems] = useState<
    (OrderItem & { inStock?: boolean })[]
  >([]);
  const [cartOpen, setCartOpen] = useState(false);
  const { isAdmin } = useAuthContext();

  useInitialize();

  const cartCount = cartItems.reduce(
    (sum, item) => sum + Number(item.quantity),
    0,
  );

  const handleAddToCart = (item: OrderItem) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === item.productId
            ? { ...i, quantity: i.quantity + 1n }
            : i,
        );
      }
      return [...prev, { ...item, quantity: 1n }];
    });
  };

  const handleClearCart = () => setCartItems([]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-primary shadow-md">
        <div className="max-w-[480px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-primary-foreground" />
            <span className="font-display text-lg font-semibold text-primary-foreground tracking-wide">
              Village Grocery
            </span>
          </div>

          <div className="flex items-center gap-2">
            {mode === "customer" && (
              <button
                type="button"
                className="relative p-2 rounded-full hover:bg-primary/80 transition-colors text-primary-foreground"
                onClick={() => setCartOpen(true)}
                data-ocid="header.cart_button"
                aria-label="Open cart"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </button>
            )}

            {mode === "customer" && !isAdmin && (
              <button
                type="button"
                className="p-2 rounded-full hover:bg-primary/80 transition-colors text-primary-foreground"
                onClick={() => setMode("admin")}
                aria-label="Admin panel"
                title="Shopkeeper Login"
              >
                <Settings className="h-5 w-5" />
              </button>
            )}

            {mode === "admin" && isAdmin && <LogoutButton label="Logout" />}

            {mode === "admin" && (
              <Button
                variant="ghost"
                size="sm"
                className="text-primary-foreground hover:bg-primary/80"
                onClick={() => setMode("customer")}
              >
                ← Shop
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[480px] mx-auto">
        {mode === "customer" ? (
          <CustomerView
            cartItems={cartItems}
            cartOpen={cartOpen}
            onCartOpenChange={setCartOpen}
            onAddToCart={handleAddToCart}
            onUpdateCart={setCartItems}
            onClearCart={handleClearCart}
          />
        ) : (
          <AdminView />
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-[480px] mx-auto px-4 py-6 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </footer>

      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
