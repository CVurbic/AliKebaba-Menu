import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { MapPin, Clock } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

interface WorkingHoursData {
  ponedjeljak: { otvaranje: string; zatvaranje: string };
  utorak: { otvaranje: string; zatvaranje: string };
  srijeda: { otvaranje: string; zatvaranje: string };
  cetvrtak: { otvaranje: string; zatvaranje: string };
  petak: { otvaranje: string; zatvaranje: string };
  subota: { otvaranje: string; zatvaranje: string };
  nedjelja: { otvaranje: string; zatvaranje: string };
}

interface Location {
  id: number;
  lokacija: string;
  adresa: string;
  aktivna: boolean;
  radno_vrijeme?: WorkingHoursData;
}

export default function LocationsDisplayFooter() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  // Get day of week in local language
  const getDayName = (day: string) => {
    const dayMapping: Record<string, string> = {
      ponedjeljak: t("monday"),
      utorak: t("tuesday"),
      srijeda: t("wednesday"),
      cetvrtak: t("thursday"),
      petak: t("friday"),
      subota: t("saturday"),
      nedjelja: t("sunday"),
    };

    return dayMapping[day] || day;
  };

  // Format time to be more readable
  const formatTime = (time: string) => {
    return time.replace(/:00$/, "h");
  };

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const { data, error } = await supabase
          .from("lokacije")
          .select("*")
          .eq("active", true)
          .order("id", { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
          setLocations(data);
          setSelectedLocation(data[0].id);
        }
      } catch (err) {
        console.error("Error fetching locations:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  // Get selected location
  const getSelectedLocation = () => {
    return locations.find((loc) => loc.id === selectedLocation);
  };

  // Sort locations to put selected location first
  const getSortedLocations = () => {
    if (!selectedLocation) return locations;

    // Vraćamo sve lokacije u izvornom redoslijedu za bolje animacije
    return locations;
  };

  if (loading) {
    return <div className="py-4 text-center text-white/80">{t("loading")}</div>;
  }

  if (locations.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* LIJEVA STRANA - Lokacije */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="h-5 w-5 text-white" />
          <h3 className="text-lg font-semibold">{t("ourLocations")}</h3>
        </div>

        <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-2">
          {getSortedLocations().map((location) => (
            <button
              key={location.id}
              className={`text-left px-4 py-2 rounded-md transition-all duration-300 ease-in-out flex flex-col ${
                selectedLocation === location.id
                  ? "bg-white text-[#7a1627] font-medium transform scale-102 shadow-md"
                  : "bg-[#a0313e] hover:bg-[#bb3748] text-white"
              }`}
              onClick={() => setSelectedLocation(location.id)}
            >
              <span className="font-medium">{location.lokacija}</span>
              <span
                className={`text-sm mt-1 overflow-hidden transition-all duration-300 ${
                  selectedLocation === location.id
                    ? "max-h-20 opacity-100 text-[#7a1627]/80"
                    : "max-h-0 opacity-0"
                }`}
              >
                {location.adresa}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* DESNA STRANA - Radno vrijeme */}
      {getSelectedLocation()?.radno_vrijeme && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-white" />
            <h3 className="text-lg font-semibold">{t("workingHours")}</h3>
          </div>

          <div className="grid grid-cols-1 gap-1">
            {Object.entries(getSelectedLocation()!.radno_vrijeme!).map(
              ([day, hours]) => (
                <div
                  key={day}
                  className="flex items-center justify-between border-b border-[#a0313e] py-1"
                >
                  <span className="font-medium">{getDayName(day)}</span>
                  <span className="text-white/90">
                    {formatTime(hours.otvaranje)} -{" "}
                    {formatTime(hours.zatvaranje)}
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
