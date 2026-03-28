import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import heroImage from "./heroImage.jpg";
import logo from "../resources/LOGO Cjenik 1.png";
import { useLanguage } from "../context/LanguageContext";
import { availableLanguages } from "../services/language";
import LocationsDisplayFooter from "./LocationsDisplayFooter";
import MenuAccordion from "./MenuAccordion";
import FeaturedStrip from "./FeaturedStrip";
import ItemDetailModal, { type ModalItem } from "./ItemDetailModal";
import WelcomeModal from "./WelcomeModal";
import { useParams, useNavigate } from "react-router-dom";

type MenuData = Record<string, any[]> | null;

type HeaderProps = {
  heroImage: string;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  currentLanguage: string;
  setLanguage: (lang: "hr" | "en" | "de" | "tr") => void;
  t: (key: string) => string;
  branchLabel?: string;
};

type FooterProps = {
  t: (key: string) => string;
  activeBranchSlug: string;
};

function HeroHeader({
  heroImage,
  isOpen,
  setIsOpen,
  currentLanguage,
  setLanguage,
  t,
  branchLabel,
}: HeaderProps) {
  return (
    <div className="relative h-[40vh] md:h-[60vh] w-full bg-[#C41E3A]">
      <img
        src={heroImage}
        alt="Ali Kebaba restaurant"
        className="object-cover w-full h-full brightness-75"
      />

      {branchLabel ? (
        <div className="absolute top-4 left-4 z-10">
          <div className="bg-black/35 backdrop-blur-sm text-white rounded-xl px-4 py-2 shadow-md border border-white/10">
            <div className="text-sm text-white/80">{t("currentLocation")}</div>
            <div className="font-bold tracking-wide">{branchLabel}</div>
          </div>
        </div>
      ) : null}

      <div className="absolute top-4 right-4 z-10">
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md px-4 py-2 text-[#C41E3A] font-medium hover:bg-white/90 transition-colors flex items-center space-x-2"
          >
            <span>
              {availableLanguages.find((lang) => lang.code === currentLanguage)?.name}
            </span>
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
                  className={`w-full text-left px-4 py-2 hover:bg-red-50 transition-colors ${
                    currentLanguage === lang.code
                      ? "text-[#C41E3A] font-medium"
                      : "text-gray-700"
                  }`}
                >
                  {lang.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <img
        src={logo}
        alt="AliKebaba Logo"
        className="md:block absolute -bottom-8 left-6 w-32 drop-shadow-lg"
      />
    </div>
  );
}

function MenuContent({ menuData, onItemClick }: { menuData: MenuData; onItemClick?: (item: ModalItem) => void }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <MenuAccordion menuData={menuData} defaultOpenKey="" onItemClick={onItemClick} />
    </div>
  );
}

function Footer({ t, activeBranchSlug }: FooterProps) {
  return (
    <footer className="bg-[#7a1627] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <LocationsDisplayFooter activeBranchSlug={activeBranchSlug} />
        </div>

        <div className="pt-6 border-t border-[#a0313e] flex justify-center items-center gap-4">
          <p className="text-center">
            © {new Date().getFullYear()} Ali Kebaba. {t("allRightsReserved")}
          </p>
        </div>
      </div>
    </footer>
  );
}

function slugify(input: string) {
  return (input || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const Jelovnik = () => {
  const { branchSlug } = useParams<{ branchSlug?: string }>();
  const navigate = useNavigate();
  const activeBranchSlug = useMemo(() => branchSlug ?? "dubrava", [branchSlug]);

  // Synchronously detect if we need to show branch picker
  const [showWelcome, setShowWelcome] = useState<boolean>(
    !branchSlug && !localStorage.getItem("preferredBranch")
  );

  const [menuData, setMenuData] = useState<MenuData>(null);
  const [newItems, setNewItems] = useState<any[]>([]);
  const [featuredItems, setFeaturedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalItem, setModalItem] = useState<ModalItem | null>(null);

  const { currentLanguage, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const [branchLabel, setBranchLabel] = useState<string>("");

  useEffect(() => {
    const savedLanguage = localStorage.getItem("preferredLanguage");
    if (savedLanguage && ["hr", "en", "de", "tr"].includes(savedLanguage)) {
      setLanguage(savedLanguage as "hr" | "en" | "de" | "tr");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-redirect if no branch in URL but preference is saved
  useEffect(() => {
    if (branchSlug) return;
    const saved = localStorage.getItem("preferredBranch");
    if (saved) navigate(`/${saved}`, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  useEffect(() => {
    if (showWelcome) return;
    const fetchMenuData = async () => {
      setLoading(true);

      try {
        // 1) Nađi lokaciju po slug-u
        const { data: locationsData, error: locErr } = await supabase
          .from("lokacije")
          .select("id, lokacija, active")
          .eq("active", true);

        if (locErr) throw locErr;

        const activeLoc =
          (locationsData || []).find((l: any) => slugify(l.lokacija) === activeBranchSlug) ||
          (locationsData || [])[0];

        setBranchLabel(activeLoc?.lokacija || activeBranchSlug);

        if (!activeLoc?.id) {
          setMenuData({});
          return;
        }

        // 2) Pivot: što je uključeno za lokaciju
        const { data: links, error: linkErr } = await supabase
          .from("lokacija_jelovnik")
          .select("jelovnik_id, enabled, price_override, order_override, is_new, is_featured")
          .eq("lokacija_id", activeLoc.id)
          .eq("enabled", true);

        if (linkErr) throw linkErr;

        const ids = (links || []).map((x: any) => x.jelovnik_id).filter(Boolean);

        if (ids.length === 0) {
          setMenuData({});
          return;
        }

        // 3) Pravi artikli iz jelovnik tablice
        const { data: items, error: itemsErr } = await supabase
          .from("jelovnik")
          .select("*")
          .in("id", ids);

        if (itemsErr) throw itemsErr;

        // 4) Apply overrides (cijena + redoslijed)
        const linkById = new Map<number, any>((links || []).map((l: any) => [l.jelovnik_id, l]));

        const merged = (items || []).map((it: any) => {
          const l = linkById.get(it.id);
          return {
            ...it,
            price: l?.price_override ?? it.price,
            collection_order: l?.order_override ?? it.collection_order,
            is_new: l?.is_new ?? false,
            is_featured: l?.is_featured ?? false,
          };
        });

        // merged.sort((a: any, b: any) => (a.collection_order ?? 0) - (b.collection_order ?? 0));
        // Sort by product name
        merged.sort((a: any, b: any) => a.product_name.localeCompare(b.product_name));

        setNewItems(merged.filter((item: any) => item.is_new));
        setFeaturedItems(merged.filter((item: any) => item.is_featured));

        const groupedData = groupMenuItems(merged);
        setMenuData(groupedData);
      } catch (error) {
        console.error("Error fetching menu:", error);
        setMenuData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuData();
  }, [activeBranchSlug]);

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

      const key = Object.entries(collectionMap).find(([collection]) =>
        (item.collection || "").startsWith(collection)
      )?.[1];

      if (key) {
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
      }
      return acc;
    }, {});
  };

  if (showWelcome) return (
    <WelcomeModal
      onSelect={(slug) => {
        localStorage.setItem("preferredBranch", slug);
        navigate(`/${slug}`, { replace: true });
        setShowWelcome(false);
      }}
    />
  );

  if (loading) return <div className="text-center py-8">{t("loading")}</div>;

  return (
    <main className="min-h-screen w-full bg-white">
      <HeroHeader
        heroImage={heroImage}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        currentLanguage={currentLanguage}
        setLanguage={setLanguage}
        t={t}
        branchLabel={branchLabel}
      />

      {(newItems.length > 0 || featuredItems.length > 0) && (
        <div className="mx-auto max-w-7xl px-4 pt-10 pb-2 space-y-6">
          {newItems.length > 0 && (
            <FeaturedStrip title={t("newInOffer")} badge={t("newBadge")} items={newItems} onItemClick={setModalItem} />
          )}
          {featuredItems.length > 0 && (
            <FeaturedStrip title={t("featured")} badge={t("featuredBadge")} items={featuredItems} onItemClick={setModalItem} />
          )}
        </div>
      )}

      <MenuContent menuData={menuData} onItemClick={setModalItem} />

      <Footer t={t} activeBranchSlug={activeBranchSlug} />

      <ItemDetailModal item={modalItem} onClose={() => setModalItem(null)} />
    </main>
  );
};

export default Jelovnik;
