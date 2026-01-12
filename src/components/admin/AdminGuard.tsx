import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { Navigate } from "react-router-dom";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true);
    const [hasSession, setHasSession] = useState(false);

    useEffect(() => {
        let alive = true;

        const init = async () => {
            const { data } = await supabase.auth.getSession();
            if (!alive) return;
            setHasSession(!!data.session);
            setLoading(false);
        };

        init();

        const { data } = supabase.auth.onAuthStateChange((_evt, session) => {
            setHasSession(!!session);
            setLoading(false);
        });

        return () => {
            alive = false;
            data.subscription.unsubscribe();
        };
    }, []);

    if (loading) return <div className="p-6">Loading...</div>;
    if (!hasSession) return <Navigate to="/admin/login" replace />;

    return <>{children}</>;
}
