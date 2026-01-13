import React, { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { ExternalLink, LogOut, Menu, X } from "lucide-react";
import { supabase } from "../../supabaseClient";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const navigate = useNavigate();

    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    const logout = async () => {
        await supabase.auth.signOut();
        navigate("/admin/login");
    };

    const linkClass = ({ isActive }: { isActive: boolean }) =>
        `px-4 py-2 rounded-lg text-sm font-medium transition ${isActive
            ? "bg-white text-[#C41E3A]"
            : "text-white/90 hover:bg-white/10"
        }`;

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="sticky top-0 z-40 bg-gradient-to-b from-[#C41E3A] to-[#A9152E] text-white shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
                <div className="max-w-7xl mx-auto px-4">
                    {/* TOP ROW */}
                    <div className="py-4 flex items-center justify-between gap-3">
                        {/* Left: title */}
                        <div className="min-w-0">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-2xl bg-white/10 ring-1 ring-white/20 flex items-center justify-center">
                                    <span className="text-sm font-extrabold tracking-wide">AK</span>
                                </div>

                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <div className="text-xl sm:text-2xl font-extrabold leading-tight truncate">
                                            Admin Panel
                                        </div>
                                        <span className="hidden sm:inline-flex text-[11px] px-2 py-1 rounded-full bg-white/10 ring-1 ring-white/20 text-white/90">
                                            v2
                                        </span>
                                    </div>
                                    <div className="text-white/80 text-xs sm:text-sm truncate">
                                        Upravljanje jelovnikom i lokacijama
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right: actions */}
                        <div className="flex items-center gap-2">
                            {/* Desktop actions */}
                            <div className="hidden sm:flex items-center gap-2">
                                <button
                                    className="rounded-xl border border-white/25 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10 active:scale-[0.99] transition"
                                    onClick={() => navigate("/")}
                                    title="Otvori public jelovnik"
                                >
                                    <span className="inline-flex items-center gap-2">
                                        Public jelovnik <ExternalLink className="h-4 w-4 opacity-90" />
                                    </span>
                                </button>

                                <button
                                    className="rounded-xl bg-white text-[#C41E3A] px-4 py-2 text-sm font-extrabold inline-flex items-center gap-2 hover:bg-white/90 active:scale-[0.99] transition"
                                    onClick={logout}
                                    title="Odjava"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Odjava
                                </button>
                            </div>

                            {/* Mobile menu toggle */}
                            <button
                                className="sm:hidden h-10 w-10 rounded-xl bg-white/10 ring-1 ring-white/20 hover:bg-white/15 transition grid place-items-center"
                                onClick={() => setMobileNavOpen((v) => !v)}
                                aria-label={mobileNavOpen ? "Zatvori izbornik" : "Otvori izbornik"}
                            >
                                {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    {/* NAV ROW (desktop) */}
                    <div className="hidden sm:flex items-center justify-between pb-4">
                        <nav className="flex gap-2">
                            <NavLink to="/admin/menu" className={linkClass}>
                                Jelovnik
                            </NavLink>
                            <NavLink to="/admin/locations" className={linkClass}>
                                Lokacije
                            </NavLink>
                  

                        </nav>

                        <div className="text-xs text-white/70">
                            Brze akcije gore desno
                        </div>
                    </div>

                    {/* NAV (mobile dropdown) */}
                    {mobileNavOpen && (
                        <div className="sm:hidden pb-4">
                            <div className="rounded-2xl bg-white/8 ring-1 ring-white/15 p-3 space-y-3">
                                <nav className="grid gap-2">
                                    <NavLink
                                        to="/admin/menu"
                                        className={(props) => linkClass(props) + " w-full"}
                                        onClick={() => setMobileNavOpen(false)}
                                    >
                                        Jelovnik
                                    </NavLink>

                                    <NavLink
                                        to="/admin/locations"
                                        className={(props) => linkClass(props) + " w-full"}
                                        onClick={() => setMobileNavOpen(false)}
                                    >
                                        Lokacije
                                    </NavLink>
                        
                                </nav>

                                <div className="grid grid-cols-2 gap-2 pt-1">
                                    <button
                                        className="rounded-xl border border-white/25 bg-white/5 px-3 py-2 text-sm font-semibold hover:bg-white/10 transition"
                                        onClick={() => {
                                            setMobileNavOpen(false);
                                            navigate("/");
                                        }}
                                    >
                                        Public
                                    </button>

                                    <button
                                        className="rounded-xl bg-white text-[#C41E3A] px-3 py-2 text-sm font-extrabold inline-flex items-center justify-center gap-2 hover:bg-white/90 transition"
                                        onClick={() => {
                                            setMobileNavOpen(false);
                                            logout();
                                        }}
                                        title="Odjava"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        Odjava
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* subtle bottom divider */}
                <div className="h-px bg-white/15" />
            </header>
            <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>

            <footer className="bg-[#7a1627] text-white py-6 mt-10">
                <div className="max-w-7xl mx-auto px-4 text-center text-sm">
                    © {new Date().getFullYear()} Ali Kebaba Admin
                </div>
            </footer>
        </div>
    );
}
