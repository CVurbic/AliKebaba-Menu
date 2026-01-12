import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import heroImage from "./heroImage.jpg";
import logo from "../resources/LOGO Cjenik 1.png"
import { useLanguage } from "../context/LanguageContext";
import { availableLanguages } from "../services/language";
import LocationsDisplayFooter from "./LocationsDisplayFooter";
import MenuAccordion from "./MenuAccordion";

type MenuData = Record<string, any[]> | null;

type HeaderProps = {
  heroImage: string;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  currentLanguage: string;
  setLanguage: (lang: "hr" | "en" | "de" | "tr") => void;
  t: (key: string) => string;
};

type FooterProps = {
  isAuthenticated: boolean;
  t: (key: string) => string;
};

function HeroHeader({ heroImage, isOpen, setIsOpen, currentLanguage, setLanguage, t }: HeaderProps) {
  return (
    <div className="relative h-[40vh] md:h-[60vh] w-full bg-[#C41E3A]">
      <img src={heroImage} alt="Ali Kebaba restaurant" className="object-cover w-full h-full brightness-75" />

      <div className="absolute top-4 right-4 z-10">
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md px-4 py-2 text-[#C41E3A] font-medium hover:bg-white/90 transition-colors flex items-center space-x-2"
          >
            <span>{availableLanguages.find((lang) => lang.code === currentLanguage)?.name}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 transition-transform ${isOpen ? "rotate-180" : ""}`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden">
              {availableLanguages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code as "hr" | "en" | "de" | "tr");
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-red-50 transition-colors ${currentLanguage === lang.code ? "text-[#C41E3A] font-medium" : "text-gray-700"
                    }`}
                >
                  {lang.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <img src={logo} alt="AliKebaba Logo" className="md:block absolute -bottom-8 left-6 w-32 drop-shadow-lg" />
    </div>
  );
}

function MenuContent({ menuData }: { menuData: MenuData }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <MenuAccordion menuData={menuData} defaultOpenKey="classic" />
    </div>
  );
}

function Footer({ isAuthenticated, t }: FooterProps) {
  return (
    <footer className="bg-[#7a1627] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <LocationsDisplayFooter />
        </div>

        <div className="pt-6 border-t border-[#a0313e] flex justify-center items-center gap-4">
          <p className="text-center">
            © {new Date().getFullYear()} Ali Kebaba. {t("allRightsReserved")}
          </p>

          <a
            href={isAuthenticated ? "/admin" : "/admin/login"}
            className="px-4 py-2 bg-white text-[#7a1627] rounded-md hover:bg-gray-100 transition-colors"
          >
            {isAuthenticated ? t("adminPanel") : t("login")}
          </a>
        </div>
      </div>
    </footer>
  );
}

const Jelovnik = () => {
  const [menuData, setMenuData] = useState<MenuData>(null);
  const [loading, setLoading] = useState(true);

  const { currentLanguage, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const savedLanguage = localStorage.getItem("preferredLanguage");
    if (savedLanguage && ["hr", "en", "de", "tr"].includes(savedLanguage)) {
      setLanguage(savedLanguage as "hr" | "en" | "de" | "tr");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        const { data, error } = await supabase.from("jelovnik").select("*").order("collection_order", {
          ascending: true,
        });

        if (error) throw error;

        const groupedData = groupMenuItems(data || []);
        setMenuData(groupedData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching menu:", error);
        setLoading(false);
      }
    };

    fetchMenuData();
  }, []);

  const groupMenuItems = (data: any[]) => {
    return data.reduce((acc: Record<string, any[]>, item: any) => {
      const collectionMap: Record<string, string> = {
        "STEAK KEBAB": "steak",
        "CLASSIC KEBAB": "classic",
        "CHICKEN KEBAB": "chicken",
        "MIX KEBAB": "mix",
        NUGGETS: "nuggets",
        FALAFEL: "vege",
        MOZZARELLA: "vege",
        PRILOZI: "prilozi",
        NAPITCI: "napitci",
        DESERT: "desert",
      };

      const key = Object.entries(collectionMap).find(([collection]) => (item.collection || "").startsWith(collection))?.[1];

      if (key) {
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
      }
      return acc;
    }, {});
  };

  if (loading) return <div className="text-center py-8">{t("loading")}</div>;

  return (
    <main className="min-h-screen w-full bg-white">
      <HeroHeader
        heroImage={heroImage}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        currentLanguage={currentLanguage}
        setLanguage={setLanguage as any}
        t={t}
      />

      <MenuContent menuData={menuData} />

      <Footer isAuthenticated={isAuthenticated} t={t} />
    </main>
  );
};

export default Jelovnik;
