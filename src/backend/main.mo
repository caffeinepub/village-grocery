import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import SortingOrder "mo:core/Order";
import Principal "mo:core/Principal";

import AccessControl "authorization/access-control";

actor {
  // Types
  type Product = {
    id : Nat;
    name : Text;
    category : Text;
    price : Nat;
    inStock : Bool;
  };

  type Order = {
    id : Nat;
    customerName : Text;
    phone : Text;
    address : Text;
    totalPrice : Nat;
    status : Text;
    createdAt : Int;
    items : [OrderItem];
  };

  type OrderItem = {
    productId : Nat;
    productName : Text;
    price : Nat;
    quantity : Nat;
  };

  public type UserProfile = {
    name : Text;
  };

  public type TodaysStats = {
    totalSales : Nat;
    orderCount : Nat;
  };

  module ProductOrder {
    public func compare(p1 : Product, p2 : Product) : SortingOrder.Order {
      Nat.compare(p1.id, p2.id);
    };
  };

  module OrderSort {
    public func compare(o1 : Order, o2 : Order) : SortingOrder.Order {
      Nat.compare(o1.id, o2.id);
    };
  };

  // State
  var nextProductId = 1;
  var nextOrderId = 1;
  var adminUsername = "admin";
  var adminPassword = "admin123";

  let products = Map.empty<Nat, Product>();
  let orders = Map.empty<Nat, Order>();

  // Legacy stable variables kept for upgrade compatibility - do not remove
  let accessControlState : AccessControl.AccessControlState = AccessControl.initState();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // Admin login check
  public query func adminLogin(username : Text, password : Text) : async Bool {
    username == adminUsername and password == adminPassword;
  };

  // Change admin credentials
  public shared func setAdminCredentials(currentPassword : Text, newUsername : Text, newPassword : Text) : async Bool {
    if (currentPassword != adminPassword) {
      return false;
    };
    adminUsername := newUsername;
    adminPassword := newPassword;
    true;
  };

  // Seed initial products
  public shared func initializeIfEmpty() : async () {
    if (products.isEmpty()) {
      ignore addProductInternal("Carrots", "Vegetables", 30);
      ignore addProductInternal("Apples", "Fruits", 20);
      ignore addProductInternal("Bananas", "Fruits", 15);
      ignore addProductInternal("Potatoes", "Vegetables", 40);
      ignore addProductInternal("Milk", "Dairy", 35);
      ignore addProductInternal("Cheese", "Dairy", 50);
    };
  };

  // Products
  public query func getProducts() : async [Product] {
    productArray().sort();
  };

  public shared func addProduct(name : Text, category : Text, price : Nat) : async Nat {
    addProductInternal(name, category, price);
  };

  func addProductInternal(name : Text, category : Text, price : Nat) : Nat {
    let id = nextProductId;
    nextProductId += 1;
    let product : Product = { id; name; category; price; inStock = true };
    products.add(id, product);
    id;
  };

  public shared func updateProduct(id : Nat, name : Text, category : Text, price : Nat, inStock : Bool) : async Bool {
    switch (products.get(id)) {
      case (null) { false };
      case (?_) {
        let updatedProduct : Product = { id; name; category; price; inStock };
        products.add(id, updatedProduct);
        true;
      };
    };
  };

  public shared func deleteProduct(id : Nat) : async Bool {
    switch (products.get(id)) {
      case (null) { false };
      case (?_) {
        ignore products.remove(id);
        true;
      };
    };
  };

  func productArray() : [Product] {
    products.values().toArray();
  };

  // Orders
  public shared func placeOrder(
    customerName : Text,
    phone : Text,
    address : Text,
    items : [OrderItem],
    totalPrice : Nat,
  ) : async Nat {
    let id = nextOrderId;
    nextOrderId += 1;
    let order : Order = {
      id;
      customerName;
      phone;
      address;
      totalPrice;
      status = "Received";
      createdAt = Time.now();
      items;
    };
    orders.add(id, order);
    id;
  };

  public query func getOrders() : async [Order] {
    orderArray().sort();
  };

  public query func getTodaysStats() : async TodaysStats {
    let now = Time.now();
    let dayNs : Int = 86_400_000_000_000;
    let startOfDay = now - (now % dayNs);
    var totalSales = 0;
    var orderCount = 0;
    for (order in orders.values()) {
      if (order.createdAt >= startOfDay) {
        orderCount += 1;
        totalSales += order.totalPrice;
      };
    };
    { totalSales; orderCount };
  };

  func orderArray() : [Order] {
    orders.values().toArray();
  };

  public shared func updateOrderStatus(orderId : Nat, status : Text) : async Bool {
    switch (orders.get(orderId)) {
      case (null) { false };
      case (?order) {
        let updatedOrder = { order with status };
        orders.add(orderId, updatedOrder);
        true;
      };
    };
  };
};
