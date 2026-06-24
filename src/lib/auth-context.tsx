"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCartStore } from "@/lib/store";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const prevUserIdRef = useRef<string | null | undefined>(undefined); // undefined = not yet initialised

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      prevUserIdRef.current = session?.user?.id ?? null;
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const newUserId  = session?.user?.id ?? null;
      const prevUserId = prevUserIdRef.current;

      if (event === "SIGNED_OUT") {
        // Always wipe the cart and saved delivery info on explicit sign-out.
        useCartStore.getState().clearCart();
        localStorage.removeItem("manqousha-delivery-info");
      } else if (
        event === "SIGNED_IN" &&
        prevUserId !== undefined && // initial session already resolved
        prevUserId !== null &&       // there was a previously logged-in user (not a guest)
        prevUserId !== newUserId     // and it's a different account
      ) {
        // Account switch without an explicit sign-out in between.
        useCartStore.getState().clearCart();
        localStorage.removeItem("manqousha-delivery-info");
      }
      // If prevUserId was null (guest → login), preserve cart and delivery info intentionally.

      prevUserIdRef.current = newUserId;
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
