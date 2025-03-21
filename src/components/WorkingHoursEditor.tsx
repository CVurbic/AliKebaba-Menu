import { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import { supabase } from "../supabaseClient";

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

interface WorkingHoursEditorProps {
  onClose: () => void;
  locations: Location[];
  onUpdateComplete: () => void;
}

const DEFAULT_HOURS: WorkingHoursData = {
  ponedjeljak: { otvaranje: "09:00", zatvaranje: "24:00" },
  utorak: { otvaranje: "09:00", zatvaranje: "24:00" },
  srijeda: { otvaranje: "09:00", zatvaranje: "24:00" },
  cetvrtak: { otvaranje: "09:00", zatvaranje: "24:00" },
  petak: { otvaranje: "09:00", zatvaranje: "24:00" },
  subota: { otvaranje: "10:00", zatvaranje: "24:00" },
  nedjelja: { otvaranje: "10:00", zatvaranje: "24:00" },
};

const dayLabels = {
  ponedjeljak: "Ponedjeljak",
  utorak: "Utorak",
  srijeda: "Srijeda",
  cetvrtak: "Četvrtak",
  petak: "Petak",
  subota: "Subota",
  nedjelja: "Nedjelja",
};

export default function WorkingHoursEditor({
  onClose,
  locations,
  onUpdateComplete,
}: WorkingHoursEditorProps) {
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [workingHours, setWorkingHours] =
    useState<WorkingHoursData>(DEFAULT_HOURS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isActive, setIsActive] = useState(false);

  // Load working hours when location changes
  useEffect(() => {
    if (selectedLocation) {
      const location = locations.find((loc) => loc.id === selectedLocation);
      if (location) {
        setWorkingHours(location.radno_vrijeme || DEFAULT_HOURS);
        setIsActive(location.aktivna || false);
      }
    }
  }, [selectedLocation, locations]);

  const updateTime = (
    day: keyof WorkingHoursData,
    field: "otvaranje" | "zatvaranje",
    value: string
  ) => {
    setWorkingHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    if (!selectedLocation) {
      setError("Molimo odaberite poslovnicu");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("lokacije")
        .update({
          radno_vrijeme: workingHours,
          aktivna: isActive,
        })
        .eq("id", selectedLocation);

      if (error) throw error;

      onUpdateComplete();
      setError("");
    } catch (err: any) {
      setError(`Greška pri spremanju: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const applyToAllDays = (day: keyof WorkingHoursData) => {
    const dayHours = workingHours[day];

    const updatedHours = Object.keys(workingHours).reduce((acc, currentDay) => {
      acc[currentDay as keyof WorkingHoursData] = { ...dayHours };
      return acc;
    }, {} as WorkingHoursData);

    setWorkingHours(updatedHours);
  };

  const applyToWeekdays = (day: keyof WorkingHoursData) => {
    const dayHours = workingHours[day];
    const weekdays: (keyof WorkingHoursData)[] = [
      "ponedjeljak",
      "utorak",
      "srijeda",
      "cetvrtak",
      "petak",
      "subota",
      "nedjelja",
    ];

    const updatedHours = { ...workingHours };
    weekdays.forEach((weekday) => {
      updatedHours[weekday] = { ...dayHours };
    });

    setWorkingHours(updatedHours);
  };

  const applyToWeekend = (day: keyof WorkingHoursData) => {
    const dayHours = workingHours[day];
    const weekend: (keyof WorkingHoursData)[] = ["subota", "nedjelja"];

    const updatedHours = { ...workingHours };
    weekend.forEach((weekday) => {
      updatedHours[weekday] = { ...dayHours };
    });

    setWorkingHours(updatedHours);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-[#C41E3A]">
            Uređivanje radnog vremena
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-gray-100"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        <div className="p-4">
          <div className="mb-4">
            <label className="block font-medium mb-1">
              Odaberite poslovnicu
            </label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#C41E3A] focus:outline-none focus:ring-2 focus:ring-[#C41E3A]/50"
              value={selectedLocation || ""}
              onChange={(e) => setSelectedLocation(Number(e.target.value))}
            >
              <option value="">-- Odaberite poslovnicu --</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.lokacija}
                </option>
              ))}
            </select>
          </div>

          {selectedLocation && (
            <>
              <div className="mb-4 flex items-center">
                <input
                  type="checkbox"
                  id="activeLocation"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="mr-2 h-4 w-4 text-[#C41E3A] focus:ring-[#C41E3A]"
                />
                <label htmlFor="activeLocation" className="font-medium">
                  Prikaži ovu lokaciju na web stranici
                </label>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg mb-4">
                <h3 className="font-medium mb-2">Brze akcije:</h3>
                <div className="flex flex-wrap gap-2">
                  <select
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value) {
                        const [action, day] = value.split("|");
                        const typedDay = day as keyof WorkingHoursData;

                        if (action === "all") applyToAllDays(typedDay);
                        if (action === "weekdays") applyToWeekdays(typedDay);
                        if (action === "weekend") applyToWeekend(typedDay);

                        e.target.value = "";
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="">Kopiraj vrijeme...</option>
                    <optgroup label="Kopiraj na sve dane">
                      {Object.keys(workingHours).map((day) => (
                        <option key={`all-${day}`} value={`all|${day}`}>
                          Kopiraj {dayLabels[day as keyof WorkingHoursData]} na
                          sve
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Kopiraj na radne dane">
                      {Object.keys(workingHours).map((day) => (
                        <option
                          key={`weekdays-${day}`}
                          value={`weekdays|${day}`}
                        >
                          Kopiraj {dayLabels[day as keyof WorkingHoursData]} na
                          radne dane
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Kopiraj na vikend">
                      {Object.keys(workingHours).map((day) => (
                        <option key={`weekend-${day}`} value={`weekend|${day}`}>
                          Kopiraj {dayLabels[day as keyof WorkingHoursData]} na
                          vikend
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                {Object.entries(workingHours).map(([day, hours]) => (
                  <div
                    key={day}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center p-3 border border-gray-200 rounded-lg"
                  >
                    <div className="font-medium">
                      {dayLabels[day as keyof WorkingHoursData]}
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Otvaranje
                      </label>
                      <input
                        type="time"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#C41E3A] focus:outline-none focus:ring-2 focus:ring-[#C41E3A]/50"
                        value={hours.otvaranje}
                        onChange={(e) =>
                          updateTime(
                            day as keyof WorkingHoursData,
                            "otvaranje",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Zatvaranje
                      </label>
                      <input
                        type="time"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-[#C41E3A] focus:outline-none focus:ring-2 focus:ring-[#C41E3A]/50"
                        value={hours.zatvaranje}
                        onChange={(e) =>
                          updateTime(
                            day as keyof WorkingHoursData,
                            "zatvaranje",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg mt-4">
                  {error}
                </div>
              )}

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500/50"
                >
                  Odustani
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center rounded-lg bg-[#C41E3A] px-4 py-2 text-white hover:bg-[#a01930] focus:outline-none focus:ring-2 focus:ring-[#C41E3A]/50 disabled:bg-[#C41E3A]/70"
                >
                  <Save className="mr-2 h-5 w-5" />
                  {loading ? "Spremanje..." : "Spremi"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
