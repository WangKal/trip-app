import { createContext, ReactNode, useContext } from "react";
import { useQuery, useMutation, UseMutationResult } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, RegisterData>;
};

type User = { id: number; username: string; email?: string };
type LoginData = { username: string; password: string };
type RegisterData = LoginData;

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();

  const { data: user, error, isLoading } = useQuery<User | undefined, Error>({
  queryKey: ["/api/user"],
  queryFn: async () => {
    const access = localStorage.getItem("access");
    if (!access) throw new Error("Access token is missing.");

    return apiRequest("GET", "/api/user/", undefined, {
      Authorization: `Bearer ${access}`, // Include the access token
    }).then((res) => res.json());
  },
});


  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login/", credentials);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Login failed");

      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);
      return data.user;
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
    },
    onError: (error: Error) => {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterData) => {
      const res = await apiRequest("POST", "/api/register/", credentials);
      if (!res.ok) throw new Error("Registration failed");
      return res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
    },
    onError: (error: Error) => {
      toast({ title: "Registration failed", description: error.message, variant: "destructive" });
    },
  });

  const logoutMutation = useMutation({
  mutationFn: async () => {
    const access = localStorage.getItem("access");
    const refresh = localStorage.getItem("refresh");

    if (!access || !refresh) {
      throw new Error("Missing access or refresh token.");
    }

    const data = { refresh };

    await apiRequest("POST", "/api/logout/", data, {
      Authorization: `Bearer ${access}`, // Properly merged now
    });

    // Clear tokens after successful logout
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
  },
  onSuccess: () => {
    queryClient.setQueryData(["/api/user"], null);
    toast({ title: "Logout successful", variant: "success" });
  },
  onError: (error: Error) => {
    toast({ title: "Logout failed", description: error.message, variant: "destructive" });
  },
});



  return (
    <AuthContext.Provider value={{ user: user ?? null, isLoading, error, loginMutation, logoutMutation, registerMutation }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
