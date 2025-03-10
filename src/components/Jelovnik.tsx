import { useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import MenuSection from "./MenuSection";
import { Clock, MapPin } from "lucide-react";
import heroImage from "./heroImage.jpg";
import logo from "../resources/LOGO Cjenik 1.png";
import { useLanguage } from "../context/LanguageContext";
import { availableLanguages } from "../services/language";

const Jelovnik = () => {
  const [menuData, setMenuData] = useState(null);
  const [activeTab, setActiveTab] = useState("classic");
  const [loading, setLoading] = useState(true);
  const { currentLanguage, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (container) {
      setShowLeftArrow(container.scrollLeft > 0);
      setShowRightArrow(
        container.scrollLeft < container.scrollWidth - container.clientWidth
      );
    }
  };

  useEffect(() => {
    // Check if we have a saved language preference
    const savedLanguage = localStorage.getItem("preferredLanguage");
    if (savedLanguage && ["hr", "en", "de"].includes(savedLanguage)) {
      setLanguage(savedLanguage as "hr" | "en" | "de");
    }

    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
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

  // Add new useEffect for image caching
  useEffect(() => {
    const cacheImages = async () => {
      if ("caches" in window) {
        try {
          const cache = await caches.open("ali-kebaba-images");
          const imagesToCache = [
            heroImage,
            logo,
            // Add any other static images you want to cache
          ];

          // Check which images are not yet cached
          const uncachedImages = await Promise.all(
            imagesToCache.map(async (imageUrl) => {
              const match = await cache.match(imageUrl);
              return match ? null : imageUrl;
            })
          );

          // Cache the uncached images
          const imagesToAdd = uncachedImages.filter(Boolean);
          if (imagesToAdd.length > 0) {
            await Promise.all(
              imagesToAdd.map(
                (imageUrl) =>
                  imageUrl &&
                  fetch(imageUrl).then((response) =>
                    cache.put(imageUrl, response)
                  )
              )
            );
          }
        } catch (error) {
          console.error("Failed to cache images:", error);
        }
      }
    };

    cacheImages();
  }, []); // Run once on component mount

  const tabs = [
    { id: "steak", label: t("STEAK") },
    { id: "classic", label: t("CLASSIC") },
    { id: "chicken", label: t("CHICKEN") },
    { id: "mix", label: t("MIX") },
    { id: "nuggets", label: t("NUGGETS") },
    { id: "vege", label: t("VEGE") },
    { id: "prilozi", label: t("PRILOZI") },
    { id: "desert", label: t("DESERT") },
    { id: "napitci", label: t("NAPITCI") },
  ];

  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        const { data, error } = await supabase
          .from("jelovnik")
          .select("*")
          .order("collection_order", { ascending: true });

        if (error) throw error;

        const groupedData = groupMenuItems(data);
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
    return data.reduce((acc, item) => {
      const collectionMap = {
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
        item.collection.startsWith(collection)
      )?.[1];

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
      {/* Hero section */}
      <div className="relative h-[40vh] md:h-[60vh] w-full overflow-hidden bg-[#C41E3A]">
        <img
          src={heroImage}
          alt="Ali Kebaba restaurant"
          className="object-cover w-full h-full brightness-75"
        />

        {/* Language selector */}
        <div className="absolute top-4 right-4 z-10">
          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md px-4 py-2 text-[#C41E3A] font-medium hover:bg-white/90 transition-colors flex items-center space-x-2"
            >
              <span>
                {
                  availableLanguages.find(
                    (lang) => lang.code === currentLanguage
                  )?.name
                }
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
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
                      setLanguage(lang.code as "hr" | "en" | "de");
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
      </div>

      {/* Navigation tabs */}
      <div className="sticky top-0 z-10 bg-white shadow-md">
        <div className="mx-auto max-w-7xl px-4">
          <div className="relative">
            <img
              src={logo}
              alt="AliKebaba Logo"
              className="absolute -top-32 left-0 w-32 aspect-auto"
            />

            {showLeftArrow && (
              <button
                onClick={() => scrollContainerRef.current?.scrollBy(-200, 0)}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 rounded-full p-2 shadow-md text-[#C41E3A] hover:bg-red-50"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            )}

            <div
              ref={scrollContainerRef}
              onScroll={checkScroll}
              className="flex lg:justify-center overflow-x-auto p-4 scrollbar-hide"
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-shrink-0 border border-red-100 rounded-full px-6 py-2 font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-[#C41E3A] text-white"
                      : "text-[#8B4513] hover:bg-red-50"
                  } mr-2`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {showRightArrow && (
              <button
                onClick={() => scrollContainerRef.current?.scrollBy(200, 0)}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 rounded-full p-2 shadow-md text-[#C41E3A] hover:bg-red-50"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Menu content */}
      <div className="mx-auto max-w-7xl px-4 py-12">
        {menuData &&
          Object.keys(menuData).map((category) => {
            if (category === activeTab) {
              return (
                <>
                  {category === "steak" && (
                    <div className="text-[#C41E3A] w-full text-center mb-4 -mt-8 font-medium">
                      <span className="inline-block text-xl font-bold rounded-full py-2 px-6 bg-red-100 shadow-lg border border-red-200">
                        {t("Dostupno samo vikendom (petak, subota)")}
                      </span>
                    </div>
                  )}
                  <MenuSection
                    key={category}
                    title={t(category.toUpperCase())}
                    items={menuData[category]}
                  />
                </>
              );
            }
            return null;
          })}
      </div>

      {/* Footer */}
      <footer className="bg-[#7a1627] py-8 text-white">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-8 grid gap-8 md:grid-cols-3">
            <div className="flex items-center justify-center md:justify-start">
              <MapPin className="mr-2 h-5 w-5" />
              <span>{t("address")}</span>
            </div>
            <div></div>
            <div className="flex flex-col items-center justify-center md:justify-start">
              <Clock className="mr-2 h-5 w-5" />
              <span>{t("workingHoursPonUto")}</span>
              <span>{t("workingHoursSriCet")}</span>
              <span>{t("workingHoursPetSub")}</span>
              <span>{t("workingHoursNed")}</span>
            </div>
          </div>
          <div className="flex justify-center items-center gap-4">
            <p className="text-center">
              © {new Date().getFullYear()} Ali Kebaba. {t("allRightsReserved")}
            </p>
            <a
              href={isAuthenticated ? "/admin" : "/admin/login"}
              className="px-4 py-2 bg-white text-[#7a1627] rounded-md hover:bg-gray-100 transition-colors"
            >
              {isAuthenticated ? "Admin Panel" : "Login"}
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default Jelovnik;
