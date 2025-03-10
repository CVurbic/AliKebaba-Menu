// components/AdminPanel.tsx
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useLanguage } from "../context/LanguageContext";
import { MenuItem } from "./MenuSection";
import {
  BarChart2,
  ChevronDown,
  ChevronUp,
  Edit,
  Filter,
  Plus,
  Save,
  Search,
  Trash2,
  X,
  Languages,
} from "lucide-react";
import { translateMenuItem, isTranslationAvailable } from "../utils/translate";
import { motion, AnimatePresence } from "framer-motion";
import React from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { availableLanguages } from "../services/language";

export interface Subscription {
  channel: RealtimeChannel;
  status: "SUBSCRIBED" | "TIMED_OUT" | "CHANNEL_ERROR";
  subscriptionId?: string;
}
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
  "MOZZARELLA",
  "PRILOZI",
  "NAPITCI",
  "DESERT",
];

const AdminPanel = () => {
  const { t } = useLanguage();
  const [subscription, setSubscription] = useState<RealtimeChannel | null>(
    null
  );
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [editLanguage, setEditLanguage] = useState<
    "hr" | "en" | "de" | "tr" | null
  >(null);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof MenuItem | "";
    direction: "ascending" | "descending";
  }>({ key: "", direction: "ascending" });
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationAvailable, setTranslationAvailable] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const navigate = useNavigate();

  const newItemTemplate: MenuItem = {
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
    size: "Velika",
  };

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/admin/login");
        return;
      }

      // Check if user has admin role/permissions if needed
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/");
        return;
      }
    };

    checkAuth();
  }, [navigate]);

  useEffect(() => {
    // Check if LibreTranslate is available
    const checkTranslation = async () => {
      const available = await isTranslationAvailable();
      setTranslationAvailable(available);
    };

    checkTranslation();
  }, []);

  useEffect(() => {
    let result = [...menuItems];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (item) =>
          item.product_name.toLowerCase().includes(term) ||
          item.description_hr?.toLowerCase().includes(term) ||
          item.description_en?.toLowerCase().includes(term) ||
          item.description_de?.toLowerCase().includes(term) ||
          item.collection.toLowerCase().includes(term)
      );
    }

    // Apply category filter
    if (filterCategory) {
      result = result.filter((item) => item.collection === filterCategory);
    }

    // Apply sorting
    if (sortConfig.key !== "") {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof MenuItem];
        const bValue = b[sortConfig.key as keyof MenuItem];

        if (aValue! < bValue!) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aValue! > bValue!) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredItems(result);
  }, [menuItems, searchTerm, filterCategory, sortConfig]);

  // Handle sorting
  const requestSort = (key: keyof MenuItem) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  // Save edited or new item
  const saveItem = async () => {
    if (!editingItem) return;

    try {
      if (isAddingNew) {
        // For new items, just insert
        const { data, error } = await supabase
          .from("jelovnik")
          .insert(editingItem);

        if (error) throw error;
        if (data) setMenuItems([...menuItems, data[0] as MenuItem]);
      } else {
        // For existing items, update based on external_id
        const { data, error } = await supabase
          .from("jelovnik")
          .update(editingItem)
          .eq("external_id", editingItem.external_id);

        if (error) throw error;
        if (data) {
          setMenuItems(
            menuItems.map((item) =>
              item.external_id === editingItem.external_id
                ? (data[0] as MenuItem)
                : item
            )
          );
        }
      }

      setEditingItem(null);
      setExpandedRowId(null);
      setIsAddingNew(false);
    } catch (err: any) {
      setError("Greška pri spremanju: " + err.message);
    }
  };

  // Delete an item
  const deleteItem = async (id: string) => {
    if (!confirm("Jeste li sigurni?")) return;

    try {
      // Obriši iz Supabasea
      const { error } = await supabase
        .from("jelovnik")
        .delete()
        .eq("external_id", id);

      if (error) throw error;

      // Ažuriraj lokalno stanje
      setMenuItems(menuItems.filter((item) => item.external_id !== id));
    } catch (err: any) {
      setError("Greška pri brisanju: " + err.message);
    }
  };

  // Start editing an item
  const startEditing = (item: MenuItem) => {
    setEditingItem({ ...item });
    setExpandedRowId(item.external_id);
    setIsAddingNew(false);
  };

  // Start adding a new item
  const startAddingNew = () => {
    setEditingItem({ ...newItemTemplate });
    setIsAddingNew(true);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingItem(null);
    setExpandedRowId(null);
    setIsAddingNew(false);
  };

  // Update editing item field
  const updateEditingField = (field: keyof MenuItem, value: any) => {
    if (!editingItem) return;
    setEditingItem({ ...editingItem, [field]: value });
  };

  // Get sort indicator
  const getSortIndicator = (key: keyof MenuItem) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "ascending" ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  // Get stats for dashboard
  const getStats = () => {
    const totalItems = menuItems.length;
    const categoriesCount = new Set(menuItems.map((item) => item.collection))
      .size;
    const avgPrice =
      menuItems.reduce((sum, item) => sum + item.price, 0) / totalItems;

    return { totalItems, categoriesCount, avgPrice };
  };

  const stats = getStats();

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const { data, error } = await supabase
          .from("jelovnik")
          .select("*")
          .order("collection_order");

        if (error) throw error;
        setMenuItems(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading data");
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchItems();

    // Set up real-time subscription
    const channel = supabase
      .channel("schema-db-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "jelovnik" },
        (payload) => {
          handleRealtimeUpdate(payload);
        }
      )
      .subscribe();

    setSubscription(channel);

    // Cleanup function
    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, []);

  const handleRealtimeUpdate = (payload: any) => {
    switch (payload.eventType) {
      case "INSERT":
        setMenuItems((prev) => [...prev, payload.new]);
        break;
      case "UPDATE":
        setMenuItems((prev) =>
          prev.map((item) =>
            item.external_id === payload.new.external_id ? payload.new : item
          )
        );
        break;
      case "DELETE":
        setMenuItems((prev) =>
          prev.filter((item) => item.external_id !== payload.old.external_id)
        );
        break;
    }
  };

  // Handle auto-translation
  const handleTranslate = async () => {
    if (!editingItem || !translationAvailable) return;

    setIsTranslating(true);
    try {
      const translatedItem = await translateMenuItem(editingItem);
      setEditingItem(translatedItem);
    } catch (err) {
      console.error("Translation error:", err);
      setError("Translation failed. Please try again.");
    } finally {
      setIsTranslating(false);
    }
  };

  if (loading) return <div>{t("loading")}</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#C41E3A] text-white shadow-md flex justify-between items-center">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">Menu Admin</h1>
          <p className="mt-2 text-white/80">Upravljaj svojim jelovnikom</p>
        </div>
        <button
          className="flex items-center justify-center border border-gray-200 border-dashed rounded-lg bg-[#f12244] mr-4 px-4 py-2 text-white hover:bg-[#a01930] focus:outline-none focus:ring-2 focus:ring-[#C41E3A]/50"
          onClick={() => navigate("/")}
        >
          Jelovnik
        </button>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow-md">
            <div className="flex items-center">
              <div className="rounded-full bg-[#C41E3A]/10 p-3">
                <BarChart2 className="h-6 w-6 text-[#C41E3A]" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">
                  Ukupan broj artikala
                </h3>
                <p className="text-2xl font-bold">{stats.totalItems}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-md">
            <div className="flex items-center">
              <div className="rounded-full bg-[#C41E3A]/10 p-3">
                <Filter className="h-6 w-6 text-[#C41E3A]" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">
                  Kategorija
                </h3>
                <p className="text-2xl font-bold">{stats.categoriesCount}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-md">
            <div className="flex items-center">
              <div className="rounded-full bg-[#C41E3A]/10 p-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-[#C41E3A]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">
                  Prosječna cijena
                </h3>
                <p className="text-2xl font-bold">
                  {stats.avgPrice.toFixed(2)} €
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Search */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search menu items..."
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 focus:border-[#C41E3A] focus:outline-none focus:ring-2 focus:ring-[#C41E3A]/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Category filter */}
          <div className="relative">
            <button
              className="flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 focus:outline-none"
              onClick={() => setShowCategoryFilter(!showCategoryFilter)}
            >
              <span>{filterCategory || "Sve Kategorije"}</span>
              <ChevronDown className="ml-2 h-5 w-5" />
            </button>

            {showCategoryFilter && (
              <div className="absolute z-10 mt-1 max-h-60 w-64 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                <div
                  className="cursor-pointer px-4 py-2 hover:bg-gray-100"
                  onClick={() => {
                    setFilterCategory("");
                    setShowCategoryFilter(false);
                  }}
                >
                  Sve Kategorije
                </div>
                {availableCollections.map((category) => (
                  <div
                    key={category}
                    className="cursor-pointer px-4 py-2 hover:bg-gray-100"
                    onClick={() => {
                      setFilterCategory(category);
                      setShowCategoryFilter(false);
                    }}
                  >
                    {category}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add new button */}
          <button
            className="flex items-center justify-center rounded-lg bg-[#C41E3A] px-4 py-2 text-white hover:bg-[#a01930] focus:outline-none focus:ring-2 focus:ring-[#C41E3A]/50"
            onClick={startAddingNew}
          >
            <Plus className="mr-2 h-5 w-5" />
            Dodaj novi artikl
          </button>
        </div>

        {/* Add new item form */}
        {isAddingNew && (
          <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-md">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#C41E3A]">
                {isAddingNew ? "Add New Menu Item" : "Edit Menu Item"}
              </h2>
              <button
                onClick={cancelEditing}
                className="rounded-full p-1 hover:bg-gray-100"
              >
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Left column */}
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block font-medium">Kategorija</label>
                  <select
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#C41E3A] focus:outline-none focus:ring-2 focus:ring-[#C41E3A]/50"
                    value={editingItem!.collection}
                    onChange={(e) =>
                      updateEditingField("collection", e.target.value)
                    }
                  >
                    {availableCollections.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block font-medium">Veličina</label>
                  <select
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#C41E3A] focus:outline-none focus:ring-2 focus:ring-[#C41E3A]/50"
                    value={editingItem!.size || "Regular"}
                    onChange={(e) => updateEditingField("size", e.target.value)}
                  >
                    <option value="Mali">Mali</option>
                    <option value="Veliki">Veliki</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block font-medium">Cijena (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#C41E3A] focus:outline-none focus:ring-2 focus:ring-[#C41E3A]/50"
                    value={editingItem!.price}
                    onChange={(e) =>
                      updateEditingField(
                        "price",
                        Number.parseFloat(e.target.value) || 0
                      )
                    }
                  />
                </div>

                <div>
                  <label className="mb-1 block font-medium">URL slike</label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#C41E3A] focus:outline-none focus:ring-2 focus:ring-[#C41E3A]/50"
                    value={editingItem!.image || ""}
                    onChange={(e) =>
                      updateEditingField("image", e.target.value)
                    }
                  />
                  {editingItem!.image && (
                    <div className="mt-2 h-32 w-32 overflow-hidden rounded-lg border border-gray-200">
                      <img
                        src={editingItem!.image || "/placeholder.svg"}
                        alt="Preview"
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "/placeholder.svg?height=200&width=200";
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Right column - translations */}
              <div className="space-y-6">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <h3 className="mb-3 font-semibold">Croatian (HR)</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1 block font-medium">Naziv</label>
                      <input
                        type="text"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#C41E3A] focus:outline-none focus:ring-2 focus:ring-[#C41E3A]/50"
                        value={editingItem!.product_name}
                        onChange={(e) =>
                          updateEditingField("product_name", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <label className="mb-1 block font-medium">Opis</label>
                      <textarea
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#C41E3A] focus:outline-none focus:ring-2 focus:ring-[#C41E3A]/50"
                        rows={2}
                        value={editingItem!.description_hr || ""}
                        onChange={(e) =>
                          updateEditingField("description_hr", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Auto-translation button */}
                {translationAvailable && (
                  <div className="flex justify-center">
                    <button
                      onClick={handleTranslate}
                      disabled={isTranslating}
                      className="flex items-center rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:bg-blue-300"
                    >
                      <Languages className="mr-2 h-5 w-5" />
                      {isTranslating
                        ? "Translating..."
                        : "Auto-translate to other languages"}
                    </button>
                  </div>
                )}
              </div>
              <div className="col-span-2 gap-4 justify-center flex flex-wrap">
                {/* Dinamičke jezične sekcije */}
                {availableLanguages
                  .filter((lang) => lang.code !== "hr") // Preskoči izvorni jezik (HR)
                  .map((lang) => (
                    <div
                      key={lang.code}
                      className="rounded-lg border border-gray-200 bg-gray-50 p-4 w-[30%]"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold">{`${
                          lang.name
                        } (${lang.code.toUpperCase()})`}</h3>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditLanguage(lang.code)}
                            className="text-sm text-blue-600 hover:text-blue-700"
                          >
                            Uredi
                          </button>
                          <button onClick={() => setEditLanguage(null)}>
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {editLanguage === lang.code ? (
                        <div className="space-y-4">
                          <div>
                            <label className="mb-1 block font-medium">
                              Naziv
                            </label>
                            <input
                              type="text"
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#C41E3A] focus:outline-none focus:ring-2 focus:ring-[#C41E3A]/50"
                              value={
                                editingItem![`product_name_${lang.code}`] || ""
                              }
                              onChange={(e) =>
                                updateEditingField(
                                  `product_name_${lang.code}`,
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div>
                            <label className="mb-1 block font-medium">
                              Opis
                            </label>
                            <textarea
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#C41E3A] focus:outline-none focus:ring-2 focus:ring-[#C41E3A]/50"
                              rows={3}
                              value={
                                editingItem![`description_${lang.code}`] || ""
                              }
                              onChange={(e) =>
                                updateEditingField(
                                  `description_${lang.code}`,
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="font-medium">
                            {editingItem![`product_name_${lang.code}`]}
                          </p>
                          <p className="text-gray-600">
                            {editingItem![`description_${lang.code}`]}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={cancelEditing}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500/50"
              >
                CaOdustanincel
              </button>
              <button
                onClick={saveItem}
                className="flex items-center rounded-lg bg-[#C41E3A] px-4 py-2 text-white hover:bg-[#a01930] focus:outline-none focus:ring-2 focus:ring-[#C41E3A]/50"
              >
                <Save className="mr-2 h-5 w-5" />
                Spremi
              </button>
            </div>
          </div>
        )}

        {/* Items table */}
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="whitespace-nowrap border-b px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    <div
                      className="flex cursor-pointer items-center"
                      onClick={() => requestSort("product_name")}
                    >
                      Naziv
                      {getSortIndicator("product_name")}
                    </div>
                  </th>
                  <th className="whitespace-nowrap border-b px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    <div
                      className="flex cursor-pointer items-center"
                      onClick={() => requestSort("collection")}
                    >
                      Kategorija
                      {getSortIndicator("collection")}
                    </div>
                  </th>
                  <th className="whitespace-nowrap border-b px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    <div
                      className="flex cursor-pointer items-center"
                      onClick={() => requestSort("price")}
                    >
                      Cijena
                      {getSortIndicator("price")}
                    </div>
                  </th>
                  <th className="whitespace-nowrap border-b px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Veličina
                  </th>
                  <th className="whitespace-nowrap border-b px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Akcija
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredItems && filteredItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No items found
                    </td>
                  </tr>
                ) : (
                  filteredItems?.map((item) => (
                    <React.Fragment key={item.external_id}>
                      <tr
                        className={`${
                          expandedRowId === item.external_id
                            ? "bg-blue-50 border-b-0"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center">
                            {item.image ? (
                              <img
                                src={item.image || "/placeholder.svg"}
                                alt={item.product_name}
                                className="mr-3 h-10 w-10 rounded-md object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    "/placeholder.svg?height=100&width=100";
                                }}
                              />
                            ) : (
                              <div className="mr-3 h-10 w-10 rounded-md bg-gray-200"></div>
                            )}
                            <div>
                              <div className="font-medium text-gray-900">
                                {item.product_name}
                              </div>
                              <div className="text-sm text-gray-500 truncate overflow-hidden max-w-[200px]">
                                {item.description_hr}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className="rounded-full bg-[#C41E3A]/10 px-2 py-1 text-xs font-medium text-[#C41E3A]">
                            {item.collection}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 font-medium">
                          {item.price.toFixed(2)} €
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          {item.size || "Regular"}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right">
                          <button
                            onClick={() => startEditing(item)}
                            className="mr-2 rounded-full p-1 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                            title="Edit"
                            disabled={expandedRowId === item.external_id}
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => deleteItem(item.external_id)}
                            className="rounded-full p-1 text-red-600 hover:bg-red-50 disabled:opacity-50"
                            title="Delete"
                            disabled={expandedRowId === item.external_id}
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>

                      {/* EDIT FORM */}
                      <AnimatePresence>
                        {expandedRowId === item.external_id && editingItem && (
                          <motion.tr
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <td colSpan={5} className="px-6 py-4 bg-blue-50">
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2, delay: 0.1 }}
                                className="border rounded-lg bg-white p-4"
                              >
                                <div className="grid gap-6 md:grid-cols-2">
                                  {/* Left column */}
                                  <div className="space-y-4">
                                    <div>
                                      <label className="mb-1 block font-medium">
                                        Kategorija
                                      </label>
                                      <select
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#C41E3A] focus:outline-none focus:ring-2 focus:ring-[#C41E3A]/50"
                                        value={editingItem.collection}
                                        onChange={(e) =>
                                          updateEditingField(
                                            "collection",
                                            e.target.value
                                          )
                                        }
                                      >
                                        {availableCollections.map(
                                          (category) => (
                                            <option
                                              key={category}
                                              value={category}
                                            >
                                              {category}
                                            </option>
                                          )
                                        )}
                                      </select>
                                    </div>

                                    <div>
                                      <label className="mb-1 block font-medium">
                                        Size
                                      </label>
                                      <select
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#C41E3A] focus:outline-none focus:ring-2 focus:ring-[#C41E3A]/50"
                                        value={editingItem.size || "Regular"}
                                        onChange={(e) =>
                                          updateEditingField(
                                            "size",
                                            e.target.value
                                          )
                                        }
                                      >
                                        <option value="Mali">Mali</option>
                                        <option value="Veliki">Veliki</option>
                                      </select>
                                    </div>

                                    <div>
                                      <label className="mb-1 block font-medium">
                                        Cijena (€)
                                      </label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#C41E3A] focus:outline-none focus:ring-2 focus:ring-[#C41E3A]/50"
                                        value={editingItem.price}
                                        onChange={(e) =>
                                          updateEditingField(
                                            "price",
                                            Number.parseFloat(e.target.value) ||
                                              0
                                          )
                                        }
                                      />
                                    </div>

                                    <div>
                                      <label className="mb-1 block font-medium">
                                        URL slike
                                      </label>
                                      <input
                                        type="text"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#C41E3A] focus:outline-none focus:ring-2 focus:ring-[#C41E3A]/50"
                                        value={editingItem.image || ""}
                                        onChange={(e) =>
                                          updateEditingField(
                                            "image",
                                            e.target.value
                                          )
                                        }
                                      />
                                      {editingItem.image && (
                                        <div className="mt-2 h-32 w-32 overflow-hidden rounded-lg border border-gray-200">
                                          <img
                                            src={
                                              editingItem.image ||
                                              "/placeholder.svg"
                                            }
                                            alt="Preview"
                                            className="h-full w-full object-contain"
                                            onError={(e) => {
                                              (
                                                e.target as HTMLImageElement
                                              ).src =
                                                "/placeholder.svg?height=200&width=200";
                                            }}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Right column - translations */}
                                  <div className="space-y-6">
                                    {/* Croatian */}
                                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                      <h3 className="mb-3 font-semibold">
                                        Croatian (HR)
                                      </h3>
                                      <div className="space-y-4">
                                        <div>
                                          <label className="mb-1 block font-medium">
                                            Naziv
                                          </label>
                                          <input
                                            type="text"
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#C41E3A] focus:outline-none focus:ring-2 focus:ring-[#C41E3A]/50"
                                            value={editingItem.product_name}
                                            onChange={(e) =>
                                              updateEditingField(
                                                "product_name",
                                                e.target.value
                                              )
                                            }
                                          />
                                        </div>
                                        <div>
                                          <label className="mb-1 block font-medium">
                                            Opis
                                          </label>
                                          <textarea
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#C41E3A] focus:outline-none focus:ring-2 focus:ring-[#C41E3A]/50"
                                            rows={3}
                                            value={
                                              editingItem.description_hr || ""
                                            }
                                            onChange={(e) =>
                                              updateEditingField(
                                                "description_hr",
                                                e.target.value
                                              )
                                            }
                                          />
                                        </div>
                                      </div>
                                    </div>

                                    {/* Translate button */}
                                    {translationAvailable && (
                                      <div className="flex justify-center">
                                        <button
                                          onClick={handleTranslate}
                                          disabled={isTranslating}
                                          className="flex items-center rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:bg-blue-300"
                                        >
                                          <Languages className="mr-2 h-5 w-5" />
                                          {isTranslating
                                            ? "Translating..."
                                            : "Auto-translate"}
                                        </button>
                                      </div>
                                    )}

                                    {/* Translations display */}
                                  </div>
                                  <div className=" col-span-2 flex flex-wrap justify-center gap-4">
                                    {availableLanguages
                                      .filter((lang) => lang.code !== "hr") // Skip the source language (HR)
                                      .map((lang) => (
                                        <div
                                          key={lang.code}
                                          className="rounded-lg border border-gray-200 bg-gray-50 w-[30%] p-4"
                                        >
                                          <div className="flex items-center justify-between mb-3">
                                            <h3 className="font-semibold">{`${
                                              lang.name
                                            } (${lang.code.toUpperCase()})`}</h3>
                                            <div className="flex gap-2">
                                              <button
                                                onClick={() =>
                                                  setEditLanguage(lang.code)
                                                }
                                                className="text-sm text-blue-600 hover:text-blue-700"
                                              >
                                                Uredi
                                              </button>
                                              <button
                                                onClick={() =>
                                                  setEditLanguage(null)
                                                }
                                              >
                                                <X className="h-4 w-4" />
                                              </button>
                                            </div>
                                          </div>

                                          {editLanguage === lang.code ? (
                                            <div className="space-y-4">
                                              <div>
                                                <label className="mb-1 block font-medium">
                                                  Naziv
                                                </label>
                                                <input
                                                  type="text"
                                                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#C41E3A] focus:outline-none focus:ring-2 focus:ring-[#C41E3A]/50"
                                                  value={
                                                    editingItem![
                                                      `product_name_${lang.code}`
                                                    ] || ""
                                                  }
                                                  onChange={(e) =>
                                                    updateEditingField(
                                                      `product_name_${lang.code}`,
                                                      e.target.value
                                                    )
                                                  }
                                                />
                                              </div>
                                              <div>
                                                <label className="mb-1 block font-medium">
                                                  Opis
                                                </label>
                                                <textarea
                                                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#C41E3A] focus:outline-none focus:ring-2 focus:ring-[#C41E3A]/50"
                                                  rows={3}
                                                  value={
                                                    editingItem![
                                                      `description_${lang.code}`
                                                    ] || ""
                                                  }
                                                  onChange={(e) =>
                                                    updateEditingField(
                                                      `description_${lang.code}`,
                                                      e.target.value
                                                    )
                                                  }
                                                />
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="space-y-2">
                                              <p className="font-medium">
                                                {
                                                  editingItem![
                                                    `product_name_${lang.code}`
                                                  ]
                                                }
                                              </p>
                                              <p className="text-gray-600">
                                                {
                                                  editingItem![
                                                    `description_${lang.code}`
                                                  ]
                                                }
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                  </div>
                                </div>

                                {/* Save/Cancel buttons */}
                                <div className="mt-6 flex justify-end space-x-3">
                                  <button
                                    onClick={cancelEditing}
                                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500/50"
                                  >
                                    Odustani
                                  </button>
                                  <button
                                    onClick={saveItem}
                                    className="flex items-center rounded-lg bg-[#C41E3A] px-4 py-2 text-white hover:bg-[#a01930] focus:outline-none focus:ring-2 focus:ring-[#C41E3A]/50"
                                  >
                                    <Save className="mr-2 h-5 w-5" />
                                    Spremi
                                  </button>
                                </div>
                              </motion.div>
                            </td>
                          </motion.tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#7a1627] py-6 text-white">
        <div className="container mx-auto px-4 text-center">
          <p>© {new Date().getFullYear()} Ali Kebaba Admin Panel</p>
        </div>
      </footer>
    </div>
  );
};

export default AdminPanel;
