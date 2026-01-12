import React, { useEffect, useMemo, useState } from "react";
import { MenuItem } from "../../MenuSection";
import { X, Save } from "lucide-react";

type Tab = "osnovno" | "hr" | "en" | "de" | "tr";

export default function MenuItemDrawer({
    open,
    mode,
    item,
    availableCollections,
    onClose,
    onSave,
}: {
    open: boolean;
    mode: "create" | "edit";
    item: MenuItem | null;
    availableCollections: string[];
    onClose: () => void;
    onSave: (value: MenuItem) => Promise<void> | void;
}) {
    const [tab, setTab] = useState<Tab>("osnovno");
    const [local, setLocal] = useState<MenuItem | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!open) return;
        setTab("osnovno");
        setError("");
        setLocal(item ? { ...item } : null);
    }, [item, open]);

    const title = useMemo(
        () => (mode === "create" ? "Novi artikl" : "Uredi artikl"),
        [mode]
    );

    if (!open || !local) return null;

    const validate = () => {
        if (!local.product_name?.trim()) return "Naziv (HR) je obavezan.";
        if (Number(local.price) <= 0) return "Cijena mora biti veća od 0.";
        if (!local.collection?.trim()) return "Kategorija je obavezna.";
        return "";
    };

    const save = async () => {
        const msg = validate();
        if (msg) {
            setError(msg);
            return;
        }
        setError("");
        await onSave(local);
    };

    const setField = (k: keyof MenuItem, v: any) => {
        setLocal((prev) => (prev ? ({ ...prev, [k]: v } as MenuItem) : prev));
    };

    const TabBtn = ({ id, label }: { id: Tab; label: string }) => (
        <button
            onClick={() => setTab(id)}
            className={`shrink-0 px-3 py-2 rounded-lg text-sm font-medium ${tab === id
                ? "bg-[#C41E3A] text-white"
                : "hover:bg-gray-100 text-gray-700"
                }`}
        >
            {label}
        </button>
    );

    const inputBase =
        "w-full border rounded-lg px-3 py-3 mt-1 text-[16px]"; // 16px => iOS Safari no-zoom
    const labelBase = "text-sm font-medium";
    const sectionTitle = "text-xs uppercase tracking-wide text-gray-500";

    return (
        <div className="fixed inset-0 z-50">
            {/* overlay */}
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />

            {/* Panel: mobile bottom-sheet; sm+ right drawer */}
            <div
                className="
          absolute
          bottom-0 left-0 right-0
          h-[92vh]
          bg-white shadow-2xl
          rounded-t-2xl
          flex flex-col
          sm:rounded-none sm:top-0 sm:bottom-auto sm:left-auto sm:right-0 sm:h-full sm:w-[540px]
        "
                role="dialog"
                aria-modal="true"
            >
                {/* Header */}
                <div className="p-4 border-b flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="text-lg font-bold text-[#C41E3A]">{title}</div>
                        <div className="text-sm text-gray-500 truncate">
                            {local.product_name || "(bez naziva)"}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 hover:bg-gray-100"
                        aria-label="Zatvori"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Tabs (scrollable on mobile) */}
                <div className="p-3 border-b">
                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                        <TabBtn id="osnovno" label="Osnovno" />
                        <TabBtn id="hr" label="HR" />
                        <TabBtn id="en" label="EN" />
                        <TabBtn id="de" label="DE" />
                        <TabBtn id="tr" label="TR" />
                    </div>
                </div>

                {/* Body */}
                <div className="p-4 overflow-y-auto flex-1 space-y-4">
                    {tab === "osnovno" && (
                        <div className="space-y-4">
                            <div>
                                <div className={sectionTitle}>Osnovni podaci</div>
                            </div>

                            <div>
                                <label className={labelBase}>Kategorija</label>
                                <select
                                    value={local.collection}
                                    onChange={(e) => setField("collection", e.target.value)}
                                    className={inputBase}
                                >
                                    {availableCollections.map((c) => (
                                        <option key={c} value={c}>
                                            {c}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={labelBase}>Veličina</label>
                                    <select
                                        value={local.size || "Veliki"}
                                        onChange={(e) => setField("size", e.target.value)}
                                        className={inputBase}
                                    >
                                        <option value="Mali">Mali</option>
                                        <option value="Veliki">Veliki</option>
                                    </select>
                                </div>

                                <div>
                                    <label className={labelBase}>Cijena (€)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={Number(local.price)}
                                        onChange={(e) =>
                                            setField("price", Number.parseFloat(e.target.value) || 0)
                                        }
                                        className={inputBase}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={labelBase}>Redoslijed</label>
                                    <input
                                        type="number"
                                        value={Number(local.collection_order || 0)}
                                        onChange={(e) =>
                                            setField(
                                                "collection_order",
                                                Number.parseInt(e.target.value || "0", 10)
                                            )
                                        }
                                        className={inputBase}
                                    />
                                </div>

                                <div>
                                    <label className={labelBase}>URL slike</label>
                                    <input
                                        type="text"
                                        value={local.image || ""}
                                        onChange={(e) => setField("image", e.target.value)}
                                        className={inputBase}
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>

                            {local.image && (
                                <div className="border rounded-lg p-3">
                                    <div className="text-xs text-gray-500 mb-2">Preview</div>
                                    <img
                                        src={local.image}
                                        alt="preview"
                                        className="h-40 w-full object-contain"
                                        onError={(e) =>
                                        (((e.target as HTMLImageElement).style.display = "none"),
                                            undefined)
                                        }
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {tab === "hr" && (
                        <div className="space-y-3">
                            <div className={sectionTitle}>Hrvatski</div>

                            <div>
                                <label className={labelBase}>Naziv (HR)</label>
                                <input
                                    value={local.product_name || ""}
                                    onChange={(e) => setField("product_name", e.target.value)}
                                    className={inputBase}
                                />
                            </div>
                            <div>
                                <label className={labelBase}>Opis (HR)</label>
                                <textarea
                                    value={local.description_hr || ""}
                                    onChange={(e) => setField("description_hr", e.target.value)}
                                    rows={6}
                                    className={`${inputBase} resize-none`}
                                />
                            </div>
                        </div>
                    )}

                    {tab === "en" && (
                        <div className="space-y-3">
                            <div className={sectionTitle}>English</div>

                            <div>
                                <label className={labelBase}>Naziv (EN)</label>
                                <input
                                    value={local.product_name_en || ""}
                                    onChange={(e) => setField("product_name_en", e.target.value)}
                                    className={inputBase}
                                />
                            </div>
                            <div>
                                <label className={labelBase}>Opis (EN)</label>
                                <textarea
                                    value={local.description_en || ""}
                                    onChange={(e) => setField("description_en", e.target.value)}
                                    rows={6}
                                    className={`${inputBase} resize-none`}
                                />
                            </div>
                        </div>
                    )}

                    {tab === "de" && (
                        <div className="space-y-3">
                            <div className={sectionTitle}>Deutsch</div>

                            <div>
                                <label className={labelBase}>Naziv (DE)</label>
                                <input
                                    value={local.product_name_de || ""}
                                    onChange={(e) => setField("product_name_de", e.target.value)}
                                    className={inputBase}
                                />
                            </div>
                            <div>
                                <label className={labelBase}>Opis (DE)</label>
                                <textarea
                                    value={local.description_de || ""}
                                    onChange={(e) => setField("description_de", e.target.value)}
                                    rows={6}
                                    className={`${inputBase} resize-none`}
                                />
                            </div>
                        </div>
                    )}

                    {tab === "tr" && (
                        <div className="space-y-3">
                            <div className={sectionTitle}>Türkçe</div>

                            <div>
                                <label className={labelBase}>Naziv (TR)</label>
                                <input
                                    value={local.product_name_tr || ""}
                                    onChange={(e) => setField("product_name_tr", e.target.value)}
                                    className={inputBase}
                                />
                            </div>
                            <div>
                                <label className={labelBase}>Opis (TR)</label>
                                <textarea
                                    value={local.description_tr || ""}
                                    onChange={(e) => setField("description_tr", e.target.value)}
                                    rows={6}
                                    className={`${inputBase} resize-none`}
                                />
                            </div>
                        </div>
                    )}

                    {error && <div className="text-sm text-red-600">{error}</div>}
                    {/* spacer to avoid content behind sticky footer */}
                    <div className="h-16 sm:h-0" />
                </div>

                {/* Sticky Footer (always visible on mobile) */}
                <div className="border-t bg-white p-4 sticky bottom-0">
                    <div className="flex items-center justify-end gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-3 rounded-lg border hover:bg-gray-50"
                        >
                            Odustani
                        </button>
                        <button
                            onClick={save}
                            className="px-4 py-3 rounded-lg bg-[#C41E3A] text-white hover:bg-[#a01930] flex items-center gap-2"
                        >
                            <Save className="h-4 w-4" />
                            Spremi
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
