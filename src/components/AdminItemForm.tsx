// components/AdminItemForm.tsx
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { MenuItem } from "./MenuSection";

interface AdminItemFormProps {
  item?: MenuItem | null;
  onSuccess: () => void;
}

const AdminItemForm = ({ item, onSuccess }: AdminItemFormProps) => {
  const [formData, setFormData] = useState<Partial<MenuItem>>({
    product_name: "",
    product_name_en: "",
    product_name_de: "",
    description_hr: "",
    description_en: "",
    description_de: "",
    price: 0,
    collection: "",
    collection_order: 0,
    image: "",
  });

  useEffect(() => {
    if (item) setFormData(item);
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (item) {
      // Update existing item
      await supabase
        .from("jelovnik")
        .update(formData)
        .match({ external_id: item.external_id });
    } else {
      // Create new item
      await supabase.from("jelovnik").insert([{
        ...formData,
        external_id: crypto.randomUUID(),
      }]);
    }
    
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Polja za osnovne informacije */}
        <div className="space-y-4">
          <label className="block">
            <span className="text-gray-700">Naziv (HR):</span>
            <input
              type="text"
              value={formData.product_name}
              onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            />
          </label>
          
          {/* Dodajte slična polja za ostale jezike */}
          <label className="block">
            <span className="text-gray-700">Cijena (€):</span>
            <input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            />
          </label>
        </div>

        {/* Polja za prijevode */}
        <div className="space-y-4">
          <label className="block">
            <span className="text-gray-700">Naziv (EN):</span>
            <input
              type="text"
              value={formData.product_name_en}
              onChange={(e) => setFormData({ ...formData, product_name_en: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </label>
          
          <label className="block">
            <span className="text-gray-700">Naziv (DE):</span>
            <input
              type="text"
              value={formData.product_name_de}
              onChange={(e) => setFormData({ ...formData, product_name_de: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </label>
        </div>
      </div>

      <div className="mt-6">
        <button
          type="submit"
          className="bg-[#C41E3A] text-white px-6 py-3 rounded-md hover:bg-[#9e172f] transition"
        >
          {item ? "Spremi promjene" : "Dodaj novi artikl"}
        </button>
      </div>
    </form>
  );
};

export default AdminItemForm;