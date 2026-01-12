import React, { useEffect, useMemo, useRef, useState } from "react";
import { MenuItem } from "../../MenuSection";
import { Edit, Trash2, CheckSquare, Square } from "lucide-react";

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

export default function MenuItemsTable({
    items,
    selectedIds,
    onToggleSelect,
    onEdit,
    onDelete,
    sortKey,
    sortDir,
    onSort,
    onSetSort,
    onResetSort,
}: {
    items: MenuItem[];
    selectedIds: Set<string>;
    onToggleSelect: (id: string) => void;
    onEdit: (it: MenuItem) => void;
    onDelete: (id: string) => void;

    sortKey: "product_name" | "collection" | "price" | "size" | "collection_order" | null;
    sortDir: "asc" | "desc" | null;
    onSort: (key: "product_name" | "collection" | "price" | "size" | "collection_order") => void;

    onSetSort: (key: "product_name" | "collection" | "price", dir: "asc" | "desc") => void;
    onResetSort: () => void;
}) {


    const isMobile = useMediaQuery("(max-width: 768px)");
    const [selectMode, setSelectMode] = useState(false);


    const arrow = (key: string) =>
        sortKey !== key ? "" : sortDir === "asc" ? " ▲" : sortDir === "desc" ? " ▼" : "";


    // auto-exit selectMode kad nema selekcije
    useEffect(() => {
        if (!isMobile) {
            setSelectMode(false);
            return;
        }
        if (selectedIds.size === 0) setSelectMode(false);
    }, [selectedIds.size, isMobile]);

    // ---------- MOBILE: cards ----------
    if (isMobile) {
        return (
            <div className="space-y-3">
                {/* small helper */}
                <div className="text-xs text-gray-500 px-1">
                    {selectMode
                        ? "Bulk mode: dodirni kartice za odabir."
                        : "Tip: long-press na karticu za bulk odabir."}
                </div>

                <div className="flex gap-2 items-center px-1">
                    <label className="text-xs text-gray-500">Sort:</label>
                    <select
                        className="flex-1 border rounded-lg px-3 py-2 text-[16px]"
                        value={!sortKey || !sortDir ? "none" : `${sortKey}:${sortDir}`}
                        onChange={(e) => {
                            const v = e.target.value;

                            if (v === "none") {
                                onResetSort();
                                return;
                            }

                            const [k, d] = v.split(":") as ["product_name" | "collection" | "price", "asc" | "desc"];
                            onSetSort(k, d);
                        }}

                    >
                        <option value="none">Originalno</option>
                        <option value="product_name:asc">Artikl (A→Z)</option>
                        <option value="product_name:desc">Artikl (Z→A)</option>
                        <option value="collection:asc">Kategorija (A→Z)</option>
                        <option value="collection:desc">Kategorija (Z→A)</option>
                        <option value="price:asc">Cijena (manja→veća)</option>
                        <option value="price:desc">Cijena (veća→manja)</option>
                    </select>
                </div>


                {items.length === 0 ? (
                    <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-gray-500">
                        Nema rezultata
                    </div>
                ) : (
                    items.map((it) => (
                        <MobileCard
                            key={it.external_id}
                            it={it}
                            isSelected={selectedIds.has(it.external_id)}
                            selectMode={selectMode}
                            onEnterSelectMode={() => setSelectMode(true)}
                            onToggleSelect={() => onToggleSelect(it.external_id)}
                            onEdit={() => onEdit(it)}
                            onDelete={() => onDelete(it.external_id)}
                        />
                    ))
                )}
            </div>
        );
    }

    // ---------- DESKTOP: table ----------
    return (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                            <th className="border-b px-4 py-3 text-left text-xs uppercase text-gray-500 w-12"></th>
                            <th
                                className="border-b px-4 py-3 text-left text-xs uppercase text-gray-500 cursor-pointer hover:text-black"
                                onClick={() => onSort("product_name")}
                            >
                                Artikl{arrow("product_name")}
                            </th>

                            <th
                                className="border-b px-4 py-3 text-left text-xs uppercase text-gray-500 cursor-pointer hover:text-black"
                                onClick={() => onSort("collection")}
                            >
                                Kategorija{arrow("collection")}
                            </th>

                            <th
                                className="border-b px-4 py-3 text-left text-xs uppercase text-gray-500 cursor-pointer hover:text-black"
                                onClick={() => onSort("price")}
                            >
                                Cijena{arrow("price")}
                            </th>

                            <th
                                className="border-b px-4 py-3 text-left text-xs uppercase text-gray-500 cursor-pointer hover:text-black"
                                onClick={() => onSort("size")}
                            >
                                Veličina{arrow("size")}
                            </th>

                            <th className="border-b px-4 py-3 text-right text-xs uppercase text-gray-500">
                                Akcije
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-200">
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                                    Nema rezultata
                                </td>
                            </tr>
                        ) : (
                            items.map((it) => (
                                <tr key={it.external_id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(it.external_id)}
                                            onChange={() => onToggleSelect(it.external_id)}
                                            className="h-4 w-4"
                                        />
                                    </td>

                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            {it.image ? (
                                                <img
                                                    src={it.image}
                                                    alt=""
                                                    className="h-10 w-10 rounded-md object-cover border"
                                                    onError={(e) =>
                                                    (((e.target as HTMLImageElement).style.display =
                                                        "none"),
                                                        undefined)
                                                    }
                                                />
                                            ) : (
                                                <div className="h-10 w-10 rounded-md bg-gray-200" />
                                            )}

                                            <div className="min-w-0">
                                                <div className="font-medium text-gray-900 truncate">
                                                    {it.product_name}
                                                </div>
                                                <div className="text-sm text-gray-500 truncate max-w-[60vw] md:max-w-[40vw]">
                                                    {it.description_hr}
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-4 py-3">
                                        <span className="rounded-full bg-[#C41E3A]/10 px-2 py-1 text-xs font-medium text-[#C41E3A]">
                                            {it.collection}
                                        </span>
                                    </td>

                                    <td className="px-4 py-3 font-medium">
                                        {Number(it.price).toFixed(2)} €
                                    </td>
                                    <td className="px-4 py-3">{it.size || "-"}</td>

                                    <td className="px-4 py-3 text-right">
                                        <button
                                            className="inline-flex items-center justify-center rounded-lg p-2 hover:bg-blue-50 text-blue-700"
                                            onClick={() => onEdit(it)}
                                            title="Uredi"
                                        >
                                            <Edit className="h-5 w-5" />
                                        </button>
                                        <button
                                            className="inline-flex items-center justify-center rounded-lg p-2 hover:bg-red-50 text-red-700"
                                            onClick={() => onDelete(it.external_id)}
                                            title="Obriši"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function MobileCard({
    it,
    isSelected,
    selectMode,
    onEnterSelectMode,
    onToggleSelect,
    onEdit,
    onDelete,
}: {
    it: MenuItem;
    isSelected: boolean;
    selectMode: boolean;
    onEnterSelectMode: () => void;
    onToggleSelect: () => void;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const pressTimer = useRef<number | null>(null);

    const startPress = () => {
        // long press -> enter select mode and select
        pressTimer.current = window.setTimeout(() => {
            onEnterSelectMode();
            if (!isSelected) onToggleSelect();
        }, 450);
    };

    const endPress = () => {
        if (pressTimer.current) {
            window.clearTimeout(pressTimer.current);
            pressTimer.current = null;
        }
    };

    const onCardTap = () => {
        if (selectMode) onToggleSelect();
        else onEdit();
    };

    const price = useMemo(() => Number(it.price).toFixed(2), [it.price]);

    return (
        <div
            className={`rounded-xl border bg-white shadow-sm overflow-hidden ${isSelected ? "border-[#C41E3A]" : "border-gray-200"
                }`}
            onTouchStart={startPress}
            onTouchEnd={endPress}
            onTouchMove={endPress}
            onMouseDown={startPress}
            onMouseUp={endPress}
            onMouseLeave={endPress}
        >
            <button
                type="button"
                className="w-full text-left p-4"
                onClick={onCardTap}
            >
                <div className="flex items-start gap-3">
                    {/* checkbox / select icon */}
                    <div className="mt-0.5 shrink-0">
                        {selectMode ? (
                            <div className="h-8 w-8 rounded-lg grid place-items-center border">
                                {isSelected ? (
                                    <CheckSquare className="h-5 w-5 text-[#C41E3A]" />
                                ) : (
                                    <Square className="h-5 w-5 text-gray-400" />
                                )}
                            </div>
                        ) : (
                            <div className="h-14 w-14 rounded-lg bg-gray-100 border overflow-hidden grid place-items-center">
                                {it.image ? (
                                    <img
                                        src={it.image}
                                        alt=""
                                        className="h-full w-full object-cover"
                                        onError={(e) =>
                                        (((e.target as HTMLImageElement).style.display = "none"),
                                            undefined)
                                        }
                                    />
                                ) : (
                                    <div className="h-8 w-8 rounded-md bg-gray-200" />
                                )}
                            </div>
                        )}
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="font-semibold text-gray-900 truncate">
                                    {it.product_name || "(bez naziva)"}
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                    {it.size || "-"} • {it.collection}
                                </div>
                            </div>

                            <div className="shrink-0 text-right">
                                <div className="text-lg font-bold text-gray-900">{price} €</div>
                            </div>
                        </div>

                        {it.description_hr ? (
                            <div className="text-sm text-gray-600 mt-2 line-clamp-2">
                                {it.description_hr}
                            </div>
                        ) : (
                            <div className="text-sm text-gray-400 mt-2 italic">
                                (bez opisa)
                            </div>
                        )}
                    </div>
                </div>
            </button>

            {/* actions */}
            <div className="border-t px-3 py-2 flex items-center justify-end gap-2">
                <button
                    type="button"
                    className="px-3 py-2 rounded-lg border hover:bg-gray-50 text-sm flex items-center gap-2"
                    onClick={onEdit}
                >
                    <Edit className="h-4 w-4" />
                    Uredi
                </button>

                <button
                    type="button"
                    className="px-3 py-2 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 text-sm flex items-center gap-2"
                    onClick={onDelete}
                >
                    <Trash2 className="h-4 w-4" />
                    Obriši
                </button>
            </div>
        </div>
    );
}
