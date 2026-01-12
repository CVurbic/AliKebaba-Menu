import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../supabaseClient";
import { MenuItem } from "../../MenuSection";
import {
    Plus,
    FileSpreadsheet,
    Trash2,
    CheckSquare,
    Square,
    X,
} from "lucide-react";
import ExcelImportExport from "../../ExcelImportExport";
import MenuItemsTable from "./MenuItemsTable";
import MenuItemDrawer from "./MenuItemDrawer";
import { BulkPatch, applyBulkPatch } from "./bulk";

const availableCollections = [
    "CLASSIC KEBAB",
    "CLASSIC KEBAB MENU",
    "CHICKEN KEBAB",
    "CHICKEN KEBAB MENU",
    "STEAK KEBAB",
    "STEAK KEBAB MENU",
    "MIX KEBAB",
    "MIX KEBAB MENU",
    "NUGGETS",
    "NUGGETS MENU",
    "FALAFEL",
    "FALAFEL MENU",
    "MOZZARELLA",
    "MOZZARELLA MENU",
    "PRILOZI",
    "NAPITCI",
    "DESERT",
];

const newItemTemplate = (): MenuItem => ({
    collection: "CLASSIC KEBAB",
    external_id: `new-${Date.now()}`,
    collection_order: 0,
    product_name: "",
    product_name_en: "",
    product_name_de: "",
    product_name_tr: "",
    description_tr: "",
    description_hr: "",
    description_en: "",
    description_de: "",
    image: "",
    price: 0,
    size: "Veliki",
});

function useMediaQuery(query: string) {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia(query);
        const onChange = () => setMatches(mq.matches);
        onChange();
        mq.addEventListener?.("change", onChange);
        return () => mq.removeEventListener?.("change", onChange);
    }, [query]);

    return matches;
}

export default function MenuItemsPage() {
    const isMobile = useMediaQuery("(max-width: 768px)");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");




    const [items, setItems] = useState<MenuItem[]>([]);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
    const [activeItem, setActiveItem] = useState<MenuItem | null>(null);

    const [showExcel, setShowExcel] = useState(false);

    // selection for bulk
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // filters
    const [search, setSearch] = useState("");
    const [categories, setCategories] = useState<string[]>([]);


    type SortKey = "product_name" | "collection" | "price" | "size" | "collection_order" | null;
    type SortDir = "asc" | "desc" | null;

    const [sortKey, setSortKey] = useState<SortKey>(null);
    const [sortDir, setSortDir] = useState<SortDir>(null);

    const toggleSort = (key: Exclude<SortKey, null>) => {
        if (sortKey !== key) {
            setSortKey(key);
            setSortDir("asc");
            return;
        }
        if (sortDir === "asc") {
            setSortDir("desc");
            return;
        }
        // desc -> reset
        setSortKey(null);
        setSortDir(null);
    };

    const setSort = (key: Exclude<SortKey, null>, dir: Exclude<SortDir, null>) => {
        setSortKey(key);
        setSortDir(dir);
    };
    const resetSort = () => {
        setSortKey(null);
        setSortDir(null);
    };

    useEffect(() => {
        let sub: any;

        const fetchAll = async () => {
            setLoading(true);
            setError("");

            const { data, error } = await supabase
                .from("jelovnik")
                .select("*")
                .order("collection_order");

            if (error) {
                setError(error.message);
                setLoading(false);
                return;
            }

            setItems((data || []) as MenuItem[]);
            setLoading(false);
        };

        fetchAll();

        sub = supabase
            .channel("admin-menu-realtime")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "jelovnik" },
                (payload) => {
                    const ev = payload.eventType;
                    if (ev === "INSERT")
                        setItems((prev) => [...prev, payload.new as any]);
                    if (ev === "UPDATE")
                        setItems((prev) =>
                            prev.map((x) =>
                                x.external_id === (payload.new as any).external_id
                                    ? (payload.new as any)
                                    : x
                            )
                        );
                    if (ev === "DELETE")
                        setItems((prev) =>
                            prev.filter(
                                (x) => x.external_id !== (payload.old as any).external_id
                            )
                        );
                }
            )
            .subscribe();

        return () => {
            if (sub) supabase.removeChannel(sub);
        };
    }, []);

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();

        let data = items.filter((it) => {
            const matchesSearch =
                !term ||
                it.product_name?.toLowerCase().includes(term) ||
                it.description_hr?.toLowerCase().includes(term) ||
                it.collection?.toLowerCase().includes(term);

            const matchesCats =
                categories.length === 0 || categories.includes(it.collection);

            return matchesSearch && matchesCats;
        });

        if (sortKey && sortDir) {
            const dir = sortDir === "asc" ? 1 : -1;

            const toStr = (v: any) => (v ?? "").toString().toLowerCase();
            const toNum = (v: any) => Number(v ?? 0);

            data = [...data].sort((a, b) => {
                if (sortKey === "price" || sortKey === "collection_order") {
                    return (toNum((a as any)[sortKey]) - toNum((b as any)[sortKey])) * dir;
                }

                const av = toStr((a as any)[sortKey]);
                const bv = toStr((b as any)[sortKey]);
                return av.localeCompare(bv, "hr") * dir;
            });
        }

        return data;
    }, [items, search, categories, sortKey, sortDir]);

    const selectedItems = useMemo(
        () => items.filter((it) => selectedIds.has(it.external_id)),
        [items, selectedIds]
    );

    const openCreate = () => {
        setDrawerMode("create");
        setActiveItem(newItemTemplate());
        setDrawerOpen(true);
    };

    const openEdit = (it: MenuItem) => {
        setDrawerMode("edit");
        setActiveItem(it);
        setDrawerOpen(true);
    };

    const upsertOne = async (value: MenuItem, mode: "create" | "edit") => {
        setError("");

        // minimal validation
        if (!value.product_name?.trim()) {
            setError("Naziv (HR) je obavezan.");
            return false;
        }
        if (Number(value.price) <= 0) {
            setError("Cijena mora biti veća od 0.");
            return false;
        }

        if (mode === "create") {
            const { error } = await supabase.from("jelovnik").insert({
                ...value,
                external_id: crypto.randomUUID(),
            });
            if (error) {
                setError(error.message);
                return false;
            }
            return true;
        } else {
            const { error } = await supabase
                .from("jelovnik")
                .update(value as any)
                .eq("external_id", value.external_id);

            if (error) {
                setError(error.message);
                return false;
            }
            return true;
        }
    };

    const deleteOne = async (external_id: string) => {
        if (!confirm("Obrisati artikl?")) return;
        const { error } = await supabase
            .from("jelovnik")
            .delete()
            .eq("external_id", external_id);

        if (error) setError(error.message);

        setSelectedIds((prev) => {
            const n = new Set(prev);
            n.delete(external_id);
            return n;
        });
    };

    // BULK: apply patch locally then persist
    const bulkUpdate = async (patch: BulkPatch) => {
        if (selectedItems.length === 0) return;

        const updated = applyBulkPatch(selectedItems, patch);

        const promises = updated.map((it) =>
            supabase
                .from("jelovnik")
                .update({
                    collection: it.collection,
                    size: it.size,
                    image: it.image,
                    price: it.price,
                    collection_order: it.collection_order,
                    product_name: it.product_name,
                    product_name_en: it.product_name_en,
                    product_name_de: it.product_name_de,
                    product_name_tr: it.product_name_tr,
                    description_hr: it.description_hr,
                    description_en: it.description_en,
                    description_de: it.description_de,
                    description_tr: it.description_tr,
                } as any)
                .eq("external_id", it.external_id)
        );

        const results = await Promise.all(promises);
        const errs = results.filter((r) => r.error);

        if (errs.length) {
            setError(`Bulk update: ${errs[0].error?.message ?? "Greška"}`);
            return;
        }

        // optimistic local
        setItems((prev) => {
            const map = new Map(updated.map((x) => [x.external_id, x]));
            return prev.map((x) => map.get(x.external_id) ?? x);
        });
    };

    const bulkDelete = async () => {
        if (selectedItems.length === 0) return;
        if (!confirm(`Obrisati ${selectedItems.length} artikala?`)) return;

        const ids = selectedItems.map((x) => x.external_id);
        const { error } = await supabase.from("jelovnik").delete().in("external_id", ids);
        if (error) setError(error.message);

        setSelectedIds(new Set());
    };

    const toggleSelectAllFiltered = () => {
        const ids = filtered.map((x) => x.external_id);
        setSelectedIds((prev) => {
            const allSelected = ids.every((id) => prev.has(id));
            if (allSelected) {
                const n = new Set(prev);
                ids.forEach((id) => n.delete(id));
                return n;
            } else {
                const n = new Set(prev);
                ids.forEach((id) => n.add(id));
                return n;
            }
        });
    };

    const clearSelection = () => setSelectedIds(new Set());

    // Excel batch save hook
    const handleBatchSave = async (updatedItems: MenuItem[]) => {
        const promises = updatedItems.map((it) =>
            supabase.from("jelovnik").update(it as any).eq("external_id", it.external_id)
        );
        const results = await Promise.all(promises);
        const errs = results.filter((r) => r.error);
        if (errs.length) throw new Error(errs[0].error?.message ?? "Batch update error");

        setItems((prev) => {
            const map = new Map(updatedItems.map((x) => [x.external_id, x]));
            return prev.map((x) => map.get(x.external_id) ?? x);
        });
    };

    if (loading) return <div className="p-6">Loading.</div>;

    return (
        <div className="space-y-4 pb-24 md:pb-0">
            {/* Top actions */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex flex-col sm:flex-row gap-2">
                    <button
                        onClick={openCreate}
                        className="bg-[#C41E3A] text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-[#a01930]"
                    >
                        <Plus className="h-5 w-5" />
                        Novi artikl
                    </button>

                    <button
                        onClick={() => setShowExcel(true)}
                        className="bg-green-600 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-green-700"
                    >
                        <FileSpreadsheet className="h-5 w-5" />
                        Excel Import/Export
                    </button>
                </div>

                <div className="text-sm text-gray-600">
                    Ukupno: <span className="font-semibold">{items.length}</span> | Prikazano:{" "}
                    <span className="font-semibold">{filtered.length}</span>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col gap-3">
                <div className="flex flex-col md:flex-row gap-3 md:items-center">
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search (naziv, opis, kategorija)."
                        className="w-full md:w-80 border rounded-lg px-3 py-3 text-[16px]"
                    />

                    <select
                        className="w-full md:w-80 border rounded-lg px-3 py-3 text-[16px]"
                        value={categories[0] ?? ""}
                        onChange={(e) => {
                            const v = e.target.value;
                            setCategories(v ? [v] : []);
                        }}
                    >
                        <option value="">Sve kategorije</option>
                        {availableCollections.map((c) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </select>

                    <button
                        onClick={toggleSelectAllFiltered}
                        className="border rounded-lg px-3 py-3 flex items-center justify-center gap-2 hover:bg-gray-50"
                    >
                        {filtered.length > 0 && filtered.every((x) => selectedIds.has(x.external_id)) ? (
                            <CheckSquare className="h-5 w-5" />
                        ) : (
                            <Square className="h-5 w-5" />
                        )}
                        Select all (filtered)
                    </button>
                </div>

                {/* Bulk bar (desktop) */}
                <div className="hidden md:flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                    <div className="text-sm">
                        Odabrano: <span className="font-semibold">{selectedIds.size}</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <select
                            className="border rounded-lg px-3 py-2 text-sm"
                            defaultValue=""
                            onChange={(e) => {
                                const v = e.target.value;
                                if (!v) return;
                                bulkUpdate({ collection: v });
                                e.target.value = "";
                            }}
                            disabled={selectedIds.size === 0}
                        >
                            <option value="">Bulk: kategorija</option>
                            {availableCollections.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>

                        <select
                            className="border rounded-lg px-3 py-2 text-sm"
                            defaultValue=""
                            onChange={(e) => {
                                const v = e.target.value;
                                if (!v) return;
                                bulkUpdate({ size: v });
                                e.target.value = "";
                            }}
                            disabled={selectedIds.size === 0}
                        >
                            <option value="">Bulk: veličina</option>
                            <option value="Mali">Mali</option>
                            <option value="Veliki">Veliki</option>
                        </select>

                        <button
                            className="border rounded-lg px-3 py-2 text-sm hover:bg-gray-50"
                            onClick={() => bulkUpdate({ priceDelta: 0.3 })}
                            disabled={selectedIds.size === 0}
                        >
                            +0.30€
                        </button>
                        <button
                            className="border rounded-lg px-3 py-2 text-sm hover:bg-gray-50"
                            onClick={() => bulkUpdate({ priceDelta: -0.3 })}
                            disabled={selectedIds.size === 0}
                        >
                            -0.30€
                        </button>

                        <button
                            className="bg-red-600 text-white rounded-lg px-3 py-2 text-sm flex items-center gap-2 hover:bg-red-700"
                            onClick={bulkDelete}
                            disabled={selectedIds.size === 0}
                        >
                            <Trash2 className="h-4 w-4" />
                            Obriši odabrano
                        </button>

                        <button
                            className="border rounded-lg px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                            onClick={clearSelection}
                            disabled={selectedIds.size === 0}
                        >
                            <X className="h-4 w-4" />
                            Clear
                        </button>
                    </div>
                </div>

                {error && <div className="text-sm text-red-600">{error}</div>}
            </div>

            {/* List (table desktop, cards mobile) */}
            <MenuItemsTable
                items={filtered}
                selectedIds={selectedIds}
                onToggleSelect={(id) =>
                    setSelectedIds((prev) => {
                        const n = new Set(prev);
                        n.has(id) ? n.delete(id) : n.add(id);
                        return n;
                    })
                }
                onEdit={openEdit}
                onDelete={deleteOne}
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={toggleSort}
                onSetSort={setSort}
                onResetSort={resetSort}
            />



            {/* Drawer */}
            <MenuItemDrawer
                open={drawerOpen}
                mode={drawerMode}
                availableCollections={availableCollections}
                item={activeItem}
                onClose={() => setDrawerOpen(false)}
                onSave={async (value: any) => {
                    const ok = await upsertOne(value, drawerMode);
                    if (ok) setDrawerOpen(false);
                }}
            />

            {/* Excel */}
            {showExcel && (
                <ExcelImportExport
                    items={items}
                    onClose={() => setShowExcel(false)}
                    onUploadComplete={handleBatchSave}
                />
            )}

            {/* Mobile sticky bulk bar */}
            {isMobile && selectedIds.size > 0 && (
                <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white">
                    <div className="p-3 flex items-center gap-2">
                        <div className="text-sm font-medium min-w-[84px]">
                            {selectedIds.size} odabr.
                        </div>

                        <button
                            className="flex-1 border rounded-lg py-3 text-sm hover:bg-gray-50"
                            onClick={() => bulkUpdate({ priceDelta: 0.3 })}
                        >
                            +0.30€
                        </button>
                        <button
                            className="flex-1 border rounded-lg py-3 text-sm hover:bg-gray-50"
                            onClick={() => bulkUpdate({ priceDelta: -0.3 })}
                        >
                            -0.30€
                        </button>

                        <button
                            className="px-4 py-3 rounded-lg bg-red-600 text-white text-sm flex items-center gap-2 hover:bg-red-700"
                            onClick={bulkDelete}
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>

                        <button
                            className="px-3 py-3 rounded-lg border hover:bg-gray-50"
                            onClick={clearSelection}
                            aria-label="Clear selection"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
