import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, LogOut, Store } from "lucide-react";
import { type ReactNode, createContext, useContext, useState } from "react";
import { useActor } from "../hooks/useActor";

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123";

interface AuthContextValue {
  isAuthenticated: boolean;
  isAdmin: boolean;
  isCheckingAdmin: boolean;
  logout: () => void;
  setAdminLoggedIn: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  isAuthenticated: false,
  isAdmin: false,
  isCheckingAdmin: false,
  logout: () => {},
  setAdminLoggedIn: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const logout = () => setIsAdmin(false);
  const setAdminLoggedIn = () => setIsAdmin(true);
  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: isAdmin,
        isAdmin,
        isCheckingAdmin: false,
        logout,
        setAdminLoggedIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}

export function LoginScreen() {
  const { setAdminLoggedIn } = useAuthContext();
  const { actor } = useActor();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password.trim()) {
      setError("Please enter username and password");
      return;
    }
    setVerifying(true);
    try {
      // Simple direct credential check - no backend call needed
      if (username.trim() === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        setAdminLoggedIn();
      } else {
        // Also try backend verification as fallback
        let valid = false;
        if (actor && username.trim() === ADMIN_USERNAME) {
          try {
            valid = await (actor as any).verifyAdminPassword(password);
          } catch {
            // backend method not available, use hardcoded check only
          }
        }
        if (valid) {
          setAdminLoggedIn();
        } else {
          setError("Invalid username or password");
        }
      }
    } catch {
      setError("Login failed. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Store className="h-8 w-8 text-primary" />
          </div>
          <h2 className="font-display text-2xl font-semibold">
            Shopkeeper Login
          </h2>
          <p className="text-muted-foreground text-sm">
            Sign in to manage orders and products
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              disabled={verifying}
              data-ocid="admin.login.username_input"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={verifying}
              data-ocid="admin.login.password_input"
            />
          </div>
          {error && (
            <p
              className="text-destructive text-sm text-center font-medium"
              data-ocid="admin.login.error_state"
            >
              {error}
            </p>
          )}
          <Button
            type="submit"
            className="w-full"
            disabled={verifying}
            data-ocid="admin.login.submit_button"
          >
            {verifying ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {verifying ? "Verifying..." : "Login"}
          </Button>
        </form>
        <p className="text-center text-xs text-muted-foreground pt-2">
          Use username <strong>admin</strong> and password{" "}
          <strong>admin123</strong>
        </p>
      </div>
    </div>
  );
}

export function LogoutButton({ label = "Logout" }: { label?: string }) {
  const { logout } = useAuthContext();
  return (
    <Button
      variant="outline"
      onClick={logout}
      size="sm"
      className="text-primary-foreground border-primary-foreground/30 hover:bg-primary/80"
      data-ocid="admin.logout_button"
    >
      <LogOut className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
}
