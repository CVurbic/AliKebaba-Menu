import React, { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { supabase } from "../supabaseClient";
import logo from "../resources/LOGO Cjenik 1.png";
import { useLanguage } from "../context/LanguageContext";

interface Branch {
  id: number;
  lokacija: string;
  adresa: string;
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[čć]/g, "c")
    .replace(/[š]/g, "s")
    .replace(/[đ]/g, "d")
    .replace(/[ž]/g, "z")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/(^-|-$)/g, "");
}

interface Props {
  onSelect: (slug: string) => void;
}

export default function WelcomeModal({ onSelect }: Props) {
  const { t } = useLanguage();
  const [branches, setBranches] = useState<Branch[]>([]);

  useEffect(() => {
    supabase
      .from("lokacije")
      .select("id, lokacija, adresa")
      .eq("active", true)
      .order("lokacija")
      .then(({ data }) => setBranches(data || []));
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-[#7a1627] px-6 py-8 text-center">
          <img
            src={logo}
            alt="Ali Kebaba"
            className="h-16 mx-auto mb-4 object-contain"
          />
          <h1 className="text-white text-xl font-bold leading-snug">
            {t("welcomeTitle")}
          </h1>
        </div>

        {/* Branch picker */}
        <div className="p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            {t("selectBranch")}
          </p>

          <div className="space-y-2">
            {branches.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-sm">
                Učitavanje...
              </div>
            ) : (
              branches.map((branch) => (
                <button
                  key={branch.id}
                  type="button"
                  onClick={() => onSelect(slugify(branch.lokacija))}
                  className="w-full text-left flex items-start gap-3 rounded-2xl border border-gray-200 px-4 py-3 hover:bg-[#C41E3A]/5 hover:border-[#C41E3A]/40 transition-colors group"
                >
                  <MapPin className="h-5 w-5 text-[#C41E3A] mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 group-hover:text-[#C41E3A] transition-colors">
                      {branch.lokacija}
                    </div>
                    {branch.adresa && (
                      <div className="text-sm text-gray-500 truncate">{branch.adresa}</div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
