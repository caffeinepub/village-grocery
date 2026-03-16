import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ClipboardList,
  Edit2,
  Loader2,
  Package,
  Plus,
  ShoppingBag,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { LoginScreen, LogoutButton, useAuthContext } from "../components/auth";
import {
  type Order,
  type Product,
  useAddProduct,
  useDeleteProduct,
  useOrders,
  useProducts,
  useTodaysStats,
  useUpdateOrderStatus,
  useUpdateProduct,
} from "../hooks/useQueries";

const ORDER_STATUSES = ["Received", "Preparing", "Delivered"];

const STATUS_BADGE: Record<string, string> = {
  Received: "bg-yellow-100 text-yellow-800 border-yellow-200",
  Preparing: "bg-blue-100 text-blue-800 border-blue-200",
  Delivered: "bg-green-100 text-green-800 border-green-200",
};

const CATEGORIES = [
  "Vegetables",
  "Fruits",
  "Dairy",
  "Rice & Atta",
  "Snacks",
  "Household",
];

const ORDER_SKELETONS = ["os1", "os2", "os3"];
const PRODUCT_SKELETONS = ["ps1", "ps2", "ps3", "ps4"];

export function AdminView() {
  const { isAdmin } = useAuthContext();

  if (!isAdmin) {
    return <LoginScreen />;
  }

  return <AdminDashboard />;
}

function StatsBar() {
  const { data: stats, isLoading } = useTodaysStats();

  return (
    <div className="grid grid-cols-2 gap-3 mb-4" data-ocid="admin.stats.panel">
      <Card className="border-border">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground font-medium">
              Today's Sales
            </span>
          </div>
          {isLoading ? (
            <Skeleton className="h-7 w-20" />
          ) : (
            <p className="text-2xl font-bold text-primary">
              ₹{stats?.totalSales?.toString() ?? "0"}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <ShoppingBag className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground font-medium">
              Orders Today
            </span>
          </div>
          {isLoading ? (
            <Skeleton className="h-7 w-12" />
          ) : (
            <p className="text-2xl font-bold text-primary">
              {stats?.orderCount?.toString() ?? "0"}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AdminDashboard() {
  return (
    <div className="px-4 py-4">
      <StatsBar />
      <Tabs defaultValue="orders">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="orders" data-ocid="admin.orders.tab">
            <ClipboardList className="h-4 w-4 mr-1.5" />
            Orders
          </TabsTrigger>
          <TabsTrigger value="products" data-ocid="admin.products.tab">
            <Package className="h-4 w-4 mr-1.5" />
            Products
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <OrdersTab />
        </TabsContent>

        <TabsContent value="products">
          <ProductsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OrdersTab() {
  const { data: orders, isLoading } = useOrders();
  const updateStatus = useUpdateOrderStatus();

  const handleStatusChange = async (orderId: bigint, status: string) => {
    try {
      await updateStatus.mutateAsync({ orderId, status });
      toast.success(`Order status updated to ${status}`);
    } catch {
      toast.error("Failed to update order status");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3" data-ocid="order.loading_state">
        {ORDER_SKELETONS.map((key) => (
          <Skeleton key={key} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 text-muted-foreground"
        data-ocid="order.empty_state"
      >
        <ClipboardList className="h-12 w-12 mb-3 opacity-30" />
        <p className="font-medium">No orders yet</p>
      </div>
    );
  }

  const sorted = [...orders].sort(
    (a, b) => Number(b.createdAt) - Number(a.createdAt),
  );

  return (
    <div className="space-y-3">
      {sorted.map((order, idx) => (
        <OrderCard
          key={order.id.toString()}
          order={order}
          index={idx + 1}
          onStatusChange={handleStatusChange}
        />
      ))}
    </div>
  );
}

function OrderCard({
  order,
  index,
  onStatusChange,
}: {
  order: Order;
  index: number;
  onStatusChange: (id: bigint, status: string) => void;
}) {
  const badgeClass =
    STATUS_BADGE[order.status] || "bg-gray-100 text-gray-800 border-gray-200";

  return (
    <Card
      className="border-border shadow-card"
      data-ocid={`order.item.${index}`}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-sm">{order.customerName}</p>
            <p className="text-xs text-muted-foreground">{order.phone}</p>
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
              {order.address}
            </p>
          </div>
          <span
            className={`text-xs px-2 py-0.5 rounded-full border font-medium ${badgeClass}`}
          >
            {order.status}
          </span>
        </div>

        <div className="text-xs text-muted-foreground space-y-0.5">
          {order.items.map((item) => (
            <div
              key={item.productId.toString()}
              className="flex justify-between"
            >
              <span>
                {item.productName} × {item.quantity.toString()}
              </span>
              <span>₹{(item.price * item.quantity).toString()}</span>
            </div>
          ))}
        </div>

        <Separator />

        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-primary text-sm">
            Total: ₹{order.totalPrice.toString()}
          </span>
          <Select
            value={order.status}
            onValueChange={(val) => onStatusChange(order.id, val)}
          >
            <SelectTrigger
              className="w-36 h-8 text-xs"
              data-ocid={`order.status.select.${index}`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ORDER_STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="text-xs">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

function ProductsTab() {
  const { data: products, isLoading } = useProducts();
  const [addOpen, setAddOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-3" data-ocid="product.loading_state">
        {PRODUCT_SKELETONS.map((key) => (
          <Skeleton key={key} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" data-ocid="product.add_button">
              <Plus className="h-4 w-4 mr-1" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[90vw] sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-display">
                Add New Product
              </DialogTitle>
            </DialogHeader>
            <AddProductForm onSuccess={() => setAddOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {!products || products.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 text-muted-foreground"
          data-ocid="product.empty_state"
        >
          <Package className="h-12 w-12 mb-3 opacity-30" />
          <p className="font-medium">No products yet</p>
        </div>
      ) : (
        products.map((product, idx) => (
          <AdminProductCard
            key={product.id.toString()}
            product={product}
            index={idx + 1}
          />
        ))
      )}
    </div>
  );
}

function AddProductForm({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const addProduct = useAddProduct();

  const handleSubmit = async () => {
    if (!name.trim() || !category || !price) {
      toast.error("Please fill all fields");
      return;
    }
    const priceNum = Number(price);
    if (Number.isNaN(priceNum) || priceNum <= 0) {
      toast.error("Enter a valid price");
      return;
    }
    try {
      await addProduct.mutateAsync({
        name: name.trim(),
        category,
        price: BigInt(Math.round(priceNum)),
      });
      toast.success("Product added!");
      onSuccess();
    } catch {
      toast.error("Failed to add product");
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Product Name</Label>
        <Input
          placeholder="e.g. Fresh Tomatoes"
          value={name}
          onChange={(e) => setName(e.target.value)}
          data-ocid="product.input"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Category</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger data-ocid="product.select">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Price (₹)</Label>
        <Input
          type="number"
          placeholder="e.g. 50"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          data-ocid="product.input"
        />
      </div>
      <Button
        className="w-full"
        onClick={handleSubmit}
        disabled={addProduct.isPending}
        data-ocid="product.submit_button"
      >
        {addProduct.isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : null}
        {addProduct.isPending ? "Adding..." : "Add Product"}
      </Button>
    </div>
  );
}

function AdminProductCard({
  product,
  index,
}: {
  product: Product;
  index: number;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [name, setName] = useState(product.name);
  const [category, setCategory] = useState(product.category);
  const [price, setPrice] = useState(product.price.toString());
  const [inStock, setInStock] = useState(product.inStock);
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const handleSave = async () => {
    const priceNum = Number(price);
    if (Number.isNaN(priceNum) || priceNum <= 0) {
      toast.error("Enter a valid price");
      return;
    }
    try {
      await updateProduct.mutateAsync({
        id: product.id,
        name: name.trim(),
        category,
        price: BigInt(Math.round(priceNum)),
        inStock,
      });
      toast.success("Product updated!");
      setEditOpen(false);
    } catch {
      toast.error("Failed to update product");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProduct.mutateAsync(product.id);
      toast.success("Product deleted");
      setDeleteOpen(false);
    } catch {
      toast.error("Failed to delete product");
    }
  };

  return (
    <Card
      className="border-border shadow-card"
      data-ocid={`product.item.${index}`}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{product.name}</p>
            <p className="text-xs text-muted-foreground">{product.category}</p>
            <p className="text-sm font-semibold text-primary">
              ₹{product.price.toString()}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {!product.inStock && (
              <Badge variant="destructive" className="text-xs">
                Out of Stock
              </Badge>
            )}

            {/* Edit Button */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0"
                  data-ocid={`product.edit_button.${index}`}
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[90vw] sm:max-w-md rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="font-display">
                    Edit Product
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Product Name</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      data-ocid="product.input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger data-ocid="product.select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Price (₹)</Label>
                    <Input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      data-ocid="product.input"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>In Stock</Label>
                    <Switch
                      checked={inStock}
                      onCheckedChange={setInStock}
                      data-ocid="product.switch"
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleSave}
                    disabled={updateProduct.isPending}
                    data-ocid="product.save_button"
                  >
                    {updateProduct.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {updateProduct.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Delete Button with Confirm Dialog */}
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-8 w-8 p-0"
                  data-ocid={`product.delete_button.${index}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent
                className="max-w-[90vw] sm:max-w-md rounded-2xl"
                data-ocid="product.delete.dialog"
              >
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Product?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete{" "}
                    <strong>{product.name}</strong>? This action cannot be
                    undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-ocid="product.delete.cancel_button">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    data-ocid="product.delete.confirm_button"
                    disabled={deleteProduct.isPending}
                  >
                    {deleteProduct.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
