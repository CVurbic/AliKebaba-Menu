import { useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import MenuSection from "./MenuSection";
import { Clock, MapPin } from "lucide-react";
import heroImage from "./heroImage.jpg";

const Jelovnik = () => {
  const [menuData, setMenuData] = useState(null);
  const [activeTab, setActiveTab] = useState("classic");
  const [loading, setLoading] = useState(true);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (container) {
      setShowLeftArrow(container.scrollLeft > 0);
      setShowRightArrow(container.scrollLeft < container.scrollWidth - container.clientWidth);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const tabs = [
    { id: "steak", label: "STEAK" },
    { id: "classic", label: "CLASSIC" },
    { id: "chicken", label: "CHICKEN" },
    { id: "mix", label: "MIX" },
    { id: "nuggets", label: "NUGGETS" },
    { id: "vege", label: "VEGE" },
    { id: "prilozi", label: "PRILOZI" },
    { id: "desert", label: "DESERT" },
    { id: "napitci", label: "NAPITCI" },
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
        "NUGGETS": "nuggets",
        "FALAFEL": "vege",
        "MOZZARELLA": "vege",
        "PRILOZI": "prilozi",
        "NAPITCI": "napitci",
        "SLASTICE": "desert",
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

  if (loading) return <div className="text-center py-8">Učitavanje...</div>;

  return (
    <main className="min-h-screen w-full bg-white">
      {/* Hero sekcija */}
      <div className="relative h-[40vh] md:h-[60vh] w-full overflow-hidden bg-[#C41E3A]">
        <img
          src={heroImage}
          alt="Ali Kebaba restaurant"
          className="object-cover w-full h-full brightness-75"
        />
      </div>

      {/* Navigacijski tabovi */}
      <div className="sticky top-0 z-10 bg-white shadow-md">
        <div className="mx-auto max-w-7xl px-4">
          <div className="relative">
            {showLeftArrow && (
              <button 
                onClick={() => scrollContainerRef.current?.scrollBy(-200, 0)}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 rounded-full p-2 shadow-md text-[#C41E3A] hover:bg-red-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            
            <div 
              ref={scrollContainerRef}
              onScroll={checkScroll}
              className="flex sm:justify-center overflow-x-auto py-4 px-8 scrollbar-hide"
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-shrink-0 rounded-full px-6 py-2 font-medium transition-colors ${
                    activeTab === tab.id ? "bg-[#C41E3A] text-white" : "text-[#8B4513] hover:bg-red-50"
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
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sadržaj menija */}
      <div className="mx-auto max-w-7xl px-4 py-12">
        {menuData && Object.keys(menuData).map((category) => {
          if (category === activeTab) {
            return <MenuSection key={category} title={category.toUpperCase()} items={menuData[category]} />;
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
              <span>Trg Josipa Langa 7, Zagreb</span>
            </div>
            <div></div>
            {/* <div className="flex items-center justify-center md:justify-start">
              <Phone className="mr-2 h-5 w-5" />
              <span>099 123 4567</span>
            </div> */}
            <div className="flex flex-col items-center justify-center md:justify-start">
              <Clock className="mr-2 h-5 w-5" />
              <span>Pon-Uto: 09-01h</span>
              <span>Sri-Čet: 09-02h</span>
              <span>Pet-Sub: 09-04h</span>
              <span>Ned: 10-01h</span>
            </div>
          </div>
          <p className="text-center">© {new Date().getFullYear()} Ali Kebaba. Sva prava pridržana.</p>
        </div>
      </footer>
    </main>
  );
};

export default Jelovnik;
