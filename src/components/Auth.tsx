// components/Auth.tsx
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Navigate } from "react-router-dom";


interface User {
}

export const login = async (email: string, password: string) => {
  const { data: { user }, error } = await supabase.auth.signInWithPassword({ email, password });
  return { user, error };
};

export const protectAdminRoute = (WrappedComponent: React.ComponentType) => {
  return () => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const getSession = async () => {
          const { data: { session } } = await supabase.auth.getSession();
          setUser(session?.user ?? null);
        };
      
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user ?? null);
        });
      
        return () => subscription?.unsubscribe();
      }, []);

   
    if (!user) return <Navigate to="/admin/login" replace />;
    return <WrappedComponent />;
  };
};