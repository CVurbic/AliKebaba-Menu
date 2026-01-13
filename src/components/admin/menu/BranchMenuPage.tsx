import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../supabaseClient";
import MenuItemsPage from "./MenuItemsPage";
import { CheckSquare, Square, X } from "lucide-react";

type Lokacija = { id: number; lokacija: string; active: boolean };

type JelovnikMini = {
  id: number;
  product_name: string;
  description_hr?: string | null;
  collection: string;
  collection_order?: number | null;
  price: number | string;
  image?: string | null;
};

type RawRow = {
  id: number; // lokacija_jelovnik.id
  enabled: boolean;
  price_override: number | null;
  order_override?: number | null;
  jelovnik: JelovnikMini[] | JelovnikMini | null;
};

type Row = {
  id: number;
  enabled: boolean;
  price_override: number | null;
  order_override: number | null;
  jelovnik: {
    id: number;
    product_name: string;
    description_hr?: string | null;
    collection: string;
    collection_order: number;
    price: number;
    image?: string | null;
  };
};

const normalizeRows = (data: RawRow[] | null): Row[] => {
  return (data ?? [])
    .map((r) => {
      const j = Array.isArray(r.jelovnik) ? r.jelovnik[0] : r.jelovnik;
      if (!j) return null;

      return {
        id: Number(r.id),
        enabled: !!r.enabled,
        price_override: r.price_override ?? null,
        order_override: (r as any).order_override ?? null,
        jelovnik: {
          id: Number(j.id),
          product_name: String(j.product_name ?? ""),
          description_hr: (j as any).description_hr ?? null,
          collection: String(j.collection ?? ""),
          collection_order: Number((j as any).collection_order ?? 0),
          price: Number(j.price ?? 0),
          image: (j as any).image ?? null,
        },
      } satisfies Row;
    })
    .filter(Boolean) as Row[];
};

const LS_KEY = "admin:selected_lokacija_id"; // "" => global

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

export default function BranchMenuPage() {
  const [lokacije, setLokacije] = useState<Lokacija[]>([]);
  const [lokacijaId, setLokacijaId] = useState<number | null>(() => {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null; // default: global
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [rows, setRows] = useState<Row[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<string[]>([]);

  const isGlobal = !lokacijaId;

  // --- fetch lokacije
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("lokacije")
        .select("id, lokacija, active")
        .order("lokacija");

      if (error) {
        setError(error.message);
        return;
      }

      const list = (data ?? []) as Lokacija[];
      setLokacije(list);

      // if LS had non-existing -> fallback to global
      if (lokacijaId && !list.some((l) => l.id === lokacijaId)) {
        setLokacijaId(null);
        localStorage.setItem(LS_KEY, "");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- persist selector
  useEffect(() => {
    localStorage.setItem(LS_KEY, lokacijaId ? String(lokacijaId) : "");
    setSelectedIds(new Set());
    setError("");
  }, [lokacijaId]);

  // --- fetch rows for selected branch
  useEffect(() => {
    if (!lokacijaId) {
      // global mode: no need to keep branch rows
      setRows([]);
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("lokacija_jelovnik")
        .select(
          `
            id,
            enabled,
            price_override,
            order_override,
            jelovnik:jelovnik_id (
              id, product_name, description_hr, collection, collection_order, price, image
            )
          `
        )
        .eq("lokacija_id", lokacijaId);

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      setRows(normalizeRows(data as any));
      setLoading(false);
    })();
  }, [lokacijaId]);

  const activeLokacija = useMemo(
    () => lokacije.find((x) => x.id === lokacijaId) ?? null,
    [lokacije, lokacijaId]
  );

  // hooks MUST exist regardless of mode
  const filtered = useMemo(() => {
    if (isGlobal) return [] as Row[];

    const term = search.trim().toLowerCase();

    let data = rows.filter((r) => {
      const it = r.jelovnik;
      const matchesSearch =
        !term ||
        it.product_name?.toLowerCase().includes(term) ||
        (it.description_hr ?? "").toLowerCase().includes(term) ||
        it.collection?.toLowerCase().includes(term);

      const matchesCats =
        categories.length === 0 || categories.includes(it.collection);

      return matchesSearch && matchesCats;
    });

    data = [...data].sort((a, b) => {
      const ca = a.jelovnik.collection.localeCompare(b.jelovnik.collection, "hr");
      if (ca !== 0) return ca;

      const oa =
        (a.jelovnik.collection_order ?? 0) - (b.jelovnik.collection_order ?? 0);
      if (oa !== 0) return oa;

      return a.jelovnik.product_name.localeCompare(b.jelovnik.product_name, "hr");
    });

    return data;
  }, [isGlobal, rows, search, categories]);

  const selectedRows = useMemo(() => {
    if (isGlobal) return [] as Row[];
    return rows.filter((r) => selectedIds.has(r.id));
  }, [isGlobal, rows, selectedIds]);

  const toggleSelectAllFiltered = () => {
    const ids = filtered.map((x) => x.id);
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

  const patchOne = async (
    ljId: number,
    patch: Partial<Pick<Row, "enabled" | "price_override" | "order_override">>
  ) => {
    // optimistic local
    setRows((prev) => prev.map((r) => (r.id === ljId ? { ...r, ...patch } : r)));

    const { error } = await supabase
      .from("lokacija_jelovnik")
      .update({ ...patch, updated_at: new Date().toISOString() } as any)
      .eq("id", ljId);

    if (error) {
      setError(error.message);
      if (!lokacijaId) return;

      const { data, error: e2 } = await supabase
        .from("lokacija_jelovnik")
        .select(
          `
            id,
            enabled,
            price_override,
            order_override,
            jelovnik:jelovnik_id (
              id, product_name, description_hr, collection, collection_order, price, image
            )
          `
        )
        .eq("lokacija_id", lokacijaId);

      if (!e2) setRows(normalizeRows(data as any));
    }
  };

  const bulkUpdate = async (
    patch: Partial<Pick<Row, "enabled" | "price_override" | "order_override">>
  ) => {
    if (selectedRows.length === 0) return;

    // optimistic
    setRows((prev) =>
      prev.map((r) => (selectedIds.has(r.id) ? { ...r, ...patch } : r))
    );

    const promises = selectedRows.map((r) =>
      supabase
        .from("lokacija_jelovnik")
        .update({ ...patch, updated_at: new Date().toISOString() } as any)
        .eq("id", r.id)
    );

    const results = await Promise.all(promises);
    const errs = results.filter((x) => x.error);
    if (errs.length) setError(errs[0].error?.message ?? "Bulk error");
  };

  // ---------------- RENDER ----------------

  return (
    <div className="space-y-4 pb-24 md:pb-0">
      {/* ✅ Unified header (always same page, only context changes) */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col gap-3">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm text-gray-500">Uređivanje</div>
            <div className="text-lg font-extrabold text-gray-900">Jelovnik</div>

            {isGlobal ? (
              <div className="mt-1 text-sm text-gray-600">
                <span className="font-medium">Osnovni podaci</span> (vrijedi za sve lokacije): naziv, opisi, kategorija, globalna cijena, slika.
              </div>
            ) : (
              <div className="mt-1 text-sm text-gray-600">
                <span className="font-medium">
                  Postavke za lokaciju:
                </span>{" "}
                {activeLokacija?.lokacija ?? `#${lokacijaId}`} — dostupnost i lokalna cijena (override).
              </div>
            )}
          </div>

          <select
            value={lokacijaId ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              setLokacijaId(v ? Number(v) : null);
            }}
            className="w-full md:w-80 border rounded-lg px-3 py-3 text-[16px]"
          >
            <option value="">Sve lokacije (osnovni podaci)</option>
            {lokacije.map((l) => (
              l.active && (
                <option key={l.id} value={l.id}>
                  {l.lokacija}
                </option>
              )
            ))}
          </select>
        </div>

        {!isGlobal && (
          <div className="text-sm text-gray-600">
            Savjet: ako upišeš istu cijenu kao globalnu, override se automatski briše (reset).
          </div>
        )}

        {error && <div className="text-sm text-red-600">{error}</div>}
      </div>

      {/* ✅ Global mode uses existing powerful editor */}
      {isGlobal ? (
        <MenuItemsPage />
      ) : (
        <>
          {/* Filters / bulk */}
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
                {filtered.length > 0 && filtered.every((x) => selectedIds.has(x.id)) ? (
                  <CheckSquare className="h-5 w-5" />
                ) : (
                  <Square className="h-5 w-5" />
                )}
                Select all (filtered)
              </button>
            </div>

            <div className="hidden md:flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
              <div className="text-sm">
                Odabrano: <span className="font-semibold">{selectedIds.size}</span>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  className="border rounded-lg px-3 py-2 text-sm hover:bg-gray-50"
                  onClick={() => bulkUpdate({ enabled: true })}
                  disabled={selectedIds.size === 0}
                >
                  Enable
                </button>

                <button
                  className="border rounded-lg px-3 py-2 text-sm hover:bg-gray-50"
                  onClick={() => bulkUpdate({ enabled: false })}
                  disabled={selectedIds.size === 0}
                >
                  Disable
                </button>

                <button
                  className="border rounded-lg px-3 py-2 text-sm hover:bg-gray-50"
                  onClick={() => bulkUpdate({ price_override: null })}
                  disabled={selectedIds.size === 0}
                  title="Vraća cijenu na globalnu"
                >
                  Reset cijene
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
          </div>

          {/* MOBILE: cards/list */}
          <div className="md:hidden overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            {loading ? (
              <div className="px-4 py-6 text-center text-gray-500">Učitavanje…</div>
            ) : filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-500">Nema rezultata</div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filtered.map((r) => {
                  const it = r.jelovnik;
                  const isSelected = selectedIds.has(r.id);
                  const hasOverride = r.price_override != null;

                  return (
                    <div key={r.id} className="p-3 flex gap-3">
                      <div className="pt-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() =>
                            setSelectedIds((prev) => {
                              const n = new Set(prev);
                              n.has(r.id) ? n.delete(r.id) : n.add(r.id);
                              return n;
                            })
                          }
                          className="h-5 w-5"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          {it.image ? (
                            <img
                              src={it.image}
                              alt=""
                              className="h-12 w-12 rounded-md object-cover border flex-shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-md bg-gray-200 flex-shrink-0" />
                          )}

                          <div className="min-w-0">
                            <div className="font-semibold text-gray-900 truncate">
                              {it.product_name}
                            </div>
                            <div className="text-sm text-gray-500 truncate">
                              {it.description_hr || ""}
                            </div>
                            <div className="mt-1">
                              <span className="rounded-full bg-[#C41E3A]/10 px-2 py-1 text-xs font-medium text-[#C41E3A]">
                                {it.collection}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <div className="rounded-lg border bg-gray-50 px-3 py-2">
                            <div className="text-[11px] uppercase tracking-wide text-gray-500">
                              Global
                            </div>
                            <div className="font-medium text-gray-900">
                              {Number(it.price).toFixed(2)} €
                            </div>
                          </div>

                          <div
                            className={
                              "rounded-lg border px-3 py-2 " +
                              (hasOverride ? "border-amber-300 bg-amber-50" : "bg-white")
                            }
                          >
                            <div className="text-[11px] uppercase tracking-wide text-gray-500">
                              Cijena (lok.)
                            </div>
                            <input
                              type="number"
                              step="0.01"
                              className="mt-1 w-full rounded-md border px-2 py-2 text-[16px]"
                              value={r.price_override ?? Number(it.price).toFixed(2)}
                              onChange={(e) => {
                                const v = e.target.value;
                                const num = v === "" ? null : Number(v);
                                setRows((prev) =>
                                  prev.map((x) =>
                                    x.id === r.id ? { ...x, price_override: num } : x
                                  )
                                );
                              }}
                              onBlur={(e) => {
                                const v = e.target.value;
                                const num = v === "" ? null : Number(v);
                                const final =
                                  num != null && Math.abs(num - Number(it.price)) < 0.00001
                                    ? null
                                    : num;
                                patchOne(r.id, { price_override: final });
                              }}
                            />
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={r.enabled}
                              onChange={(e) =>
                                patchOne(r.id, { enabled: e.target.checked })
                              }
                              className="h-5 w-5"
                            />
                            <span className={r.enabled ? "text-green-700 font-medium" : "text-gray-500"}>
                              {r.enabled ? "Dostupno" : "Nedostupno"}
                            </span>
                          </label>

                          {hasOverride && (
                            <button
                              className="text-sm px-3 py-2 rounded-lg border hover:bg-gray-50"
                              onClick={() => patchOne(r.id, { price_override: null })}
                              title="Vrati na globalnu cijenu"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* DESKTOP: table */}
          <div className="hidden md:block overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="border-b px-4 py-3 text-left text-xs uppercase text-gray-500 w-12"></th>
                    <th className="border-b px-4 py-3 text-left text-xs uppercase text-gray-500">
                      Artikl
                    </th>
                    <th className="border-b px-4 py-3 text-left text-xs uppercase text-gray-500">
                      Kategorija
                    </th>
                    <th className="border-b px-4 py-3 text-left text-xs uppercase text-gray-500">
                      Global
                    </th>
                    <th className="border-b px-4 py-3 text-left text-xs uppercase text-gray-500">
                      Cijena (lok.)
                    </th>
                    <th className="border-b px-4 py-3 text-left text-xs uppercase text-gray-500">
                      Dostupno
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                        Učitavanje…
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                        Nema rezultata
                      </td>
                    </tr>
                  ) : (
                    filtered.map((r) => {
                      const it = r.jelovnik;
                      const isSelected = selectedIds.has(r.id);
                      const hasOverride = r.price_override != null;

                      return (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() =>
                                setSelectedIds((prev) => {
                                  const n = new Set(prev);
                                  n.has(r.id) ? n.delete(r.id) : n.add(r.id);
                                  return n;
                                })
                              }
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
                                    (((e.target as HTMLImageElement).style.display = "none"), undefined)
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
                                  {it.description_hr || ""}
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

                          <td className="px-4 py-3">
                            <input
                              type="number"
                              step="0.01"
                              className={
                                "w-28 border rounded-lg px-3 py-2 text-[16px] " +
                                (hasOverride ? "border-amber-300 bg-amber-50" : "")
                              }
                              value={r.price_override ?? Number(it.price).toFixed(2)}
                              onChange={(e) => {
                                const v = e.target.value;
                                const num = v === "" ? null : Number(v);
                                setRows((prev) =>
                                  prev.map((x) =>
                                    x.id === r.id ? { ...x, price_override: num } : x
                                  )
                                );
                              }}
                              onBlur={(e) => {
                                const v = e.target.value;
                                const num = v === "" ? null : Number(v);
                                const final =
                                  num != null && Math.abs(num - Number(it.price)) < 0.00001
                                    ? null
                                    : num;
                                patchOne(r.id, { price_override: final });
                              }}
                              title="Ako je jednako globalnoj cijeni, override se briše."
                            />
                          </td>

                          <td className="px-4 py-3">
                            <label className="inline-flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={r.enabled}
                                onChange={(e) =>
                                  patchOne(r.id, { enabled: e.target.checked })
                                }
                                className="h-4 w-4"
                              />
                              <span className={r.enabled ? "text-green-700" : "text-gray-500"}>
                                {r.enabled ? "Da" : "Ne"}
                              </span>
                            </label>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile sticky bulk bar */}
          {selectedIds.size > 0 && (
            <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white md:hidden">
              <div className="p-3 flex items-center gap-2">
                <div className="text-sm font-medium min-w-[84px]">
                  {selectedIds.size} odabr.
                </div>

                <button
                  className="flex-1 border rounded-lg py-3 text-sm hover:bg-gray-50"
                  onClick={() => bulkUpdate({ enabled: true })}
                >
                  Enable
                </button>

                <button
                  className="flex-1 border rounded-lg py-3 text-sm hover:bg-gray-50"
                  onClick={() => bulkUpdate({ enabled: false })}
                >
                  Disable
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
        </>
      )}
    </div>
  );
}
