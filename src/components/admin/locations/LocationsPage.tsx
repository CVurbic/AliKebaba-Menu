
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../supabaseClient";
import { Plus } from "lucide-react";
import LocationsTable, { LocationRow } from "./LocationsTable";
import LocationDrawer, { LocationDraft } from "./LocationDrawer";

export default function LocationsPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [locations, setLocations] = useState<LocationRow[]>([]);
    const [search, setSearch] = useState("");

    type SortKey = "lokacija" | "adresa" | "active" | null;
    type SortDir = "asc" | "desc" | null;

    const [sortKey, setSortKey] = useState<SortKey>(null);
    const [sortDir, setSortDir] = useState<SortDir>(null);

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [mode, setMode] = useState<"create" | "edit">("create");
    const [active, setActive] = useState<LocationRow | null>(null);

    useEffect(() => {
        const fetchLocations = async () => {
            setLoading(true);
            setError("");

            const { data, error } = await supabase.from("lokacije").select("*").order("id");
            if (error) {
                setError(error.message);
                setLoading(false);
                return;
            }
            console.log("locations", data);
            setLocations((data || []) as any);
            setLoading(false);
        };

        fetchLocations();
    }, []);

    const filtered = useMemo(() => {
        let data = [...locations];

        const t = search.trim().toLowerCase();
        if (t) {
            data = data.filter((l) =>
                `${l.lokacija} ${l.adresa}`.toLowerCase().includes(t)
            );
        }

        if (sortKey && sortDir) {
            const dir = sortDir === "asc" ? 1 : -1;

            const toStr = (v: any) => (v ?? "").toString().toLowerCase();
            const toBool = (v: any) => (v ? 1 : 0);

            data.sort((a, b) => {
                if (sortKey === "active") {
                    return (toBool(a.active) - toBool(b.active)) * dir;
                }

                const av = toStr((a as any)[sortKey]);
                const bv = toStr((b as any)[sortKey]);

                return av.localeCompare(bv, "hr") * dir;
            });
        }



        return data;
    }, [locations, search, sortKey, sortDir]);


    const openCreate = () => {
        setMode("create");
        setActive(null);
        setDrawerOpen(true);
    };

    const openEdit = (row: LocationRow) => {
        setMode("edit");
        setActive(row);
        setDrawerOpen(true);
    };

    const toggleSort = (key: SortKey) => {
        if (sortKey !== key) {
            setSortKey(key);
            setSortDir("asc");
            return;
        }

        if (sortDir === "asc") {
            setSortDir("desc");
            return;
        }

        if (sortDir === "desc") {
            setSortKey(null);
            setSortDir(null);
            return;
        }

        setSortDir("asc");
    };

    const save = async (draft: LocationDraft) => {
        setError("");

        if (!draft.lokacija?.trim()) {
            setError("Naziv lokacije je obavezan.");
            return;
        }

        if (mode === "create") {
            const { data, error } = await supabase
                .from("lokacije")
                .insert({
                    lokacija: draft.lokacija,
                    adresa: draft.adresa,
                    active: !!draft.active,
                    radno_vrijeme: draft.radno_vrijeme,
                })
                .select("*")
                .single();

            if (error) {
                setError(error.message);
                return;
            }

            setLocations((prev) => [...prev, data as any]);
            setDrawerOpen(false);
        } else {
            if (!active) return;

            const { data, error } = await supabase
                .from("lokacije")
                .update({
                    lokacija: draft.lokacija,
                    adresa: draft.adresa,
                    active: !!draft.active,
                    radno_vrijeme: draft.radno_vrijeme,
                })
                .eq("id", active.id)
                .select("*")
                .single();

            if (error) {
                setError(error.message);
                return;
            }

            setLocations((prev) => prev.map((x) => (x.id === active.id ? (data as any) : x)));
            setDrawerOpen(false);
        }
    };

    const remove = async (row: LocationRow) => {
        if (!confirm(`Obrisati lokaciju "${row.lokacija}"?`)) return;

        const { error } = await supabase.from("lokacije").delete().eq("id", row.id);
        if (error) {
            setError(error.message);
            return;
        }

        setLocations((prev) => prev.filter((x) => x.id !== row.id));
    };

    const toggleActive = async (row: LocationRow) => {
        console.log("toggleActive", row);
        const { data, error } = await supabase
            .from("lokacije")
            .update({ active: !row.active })
            .eq("id", row.id)
            .select("*")
            .single();

        if (error) {
            setError(error.message);
            return;
        }

        setLocations((prev) => prev.map((x) => (x.id === row.id ? (data as any) : x)));
    };

    if (loading) return <div className="p-6">Loading...</div>;

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex gap-2">
                    <button
                        onClick={openCreate}
                        className="bg-[#C41E3A] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#a01930]"
                    >
                        <Plus className="h-5 w-5" />
                        Nova lokacija
                    </button>
                </div>

                <input
                    className="w-full md:w-96 border rounded-lg px-3 py-2"
                    placeholder="Search lokacije..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}

            <LocationsTable
                locations={filtered}
                onEdit={openEdit}
                onDelete={remove}
                onToggleActive={toggleActive}
                onSort={toggleSort}
                sortKey={sortKey}
                sortDir={sortDir}
            />


            <LocationDrawer
                open={drawerOpen}
                mode={mode}
                initial={active}
                onClose={() => setDrawerOpen(false)}
                onSave={save}
            />
        </div>
    );
}
