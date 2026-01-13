import { useState, useEffect, useMemo } from "react";
import { supabase } from "../supabaseClient";
import { MapPin, Clock, ChevronDown } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useNavigate } from "react-router-dom";

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

type DayKey = keyof WorkingHoursData;
type Interval = { start: number; end: number }; // minute offset from today 00:00

function slugify(input: string) {
  return (input || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function LocationsDisplayFooter({
  activeBranchSlug,
}: {
  activeBranchSlug?: string;
}) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // “clock tick” da se refreshaju badge + “za koliko”
  const [now, setNow] = useState(() => new Date());

  const { t } = useLanguage();

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const dayKeys = useMemo<DayKey[]>(
    () => ["ponedjeljak", "utorak", "srijeda", "cetvrtak", "petak", "subota", "nedjelja"],
    []
  );

  const todayKey: DayKey = useMemo(() => {
    // JS: 0=Sun..6=Sat
    const d = now.getDay();
    const map: DayKey[] = ["nedjelja", "ponedjeljak", "utorak", "srijeda", "cetvrtak", "petak", "subota"];
    return map[d];
  }, [now]);

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

  const formatTime = (time: string) => {
    if (!time) return "";
    const parts = time.split(":");
    return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : time;
  };

  const pad2 = (n: number) => String(n).padStart(2, "0");

  const toMinutes = (hhmm: string) => {
    const [h, m] = (hhmm || "").split(":");
    const hh = Number(h);
    const mm = Number(m);
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
    return hh * 60 + mm;
  };

  const startOfToday = useMemo(() => {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [now]);

  const minutesToClock = (minutesFromToday: number) => {
    const dt = new Date(startOfToday.getTime() + minutesFromToday * 60_000);
    return `${pad2(dt.getHours())}:${pad2(dt.getMinutes())}`;
  };

  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;

    const hShort = t("hourShort");
    const mShort = t("minuteShort");

    if (h <= 0) return `${m}${mShort}`;
    if (m <= 0) return `${h}${hShort}`;
    return `${h}${hShort} ${m}${mShort}`;
  };

  const buildIntervalsNextDays = (rv: WorkingHoursData, daysToScan = 8): Interval[] => {
    const intervals: Interval[] = [];

    const todayIdx = dayKeys.indexOf(todayKey);

    for (let k = 0; k < daysToScan; k++) {
      const key = dayKeys[(todayIdx + k) % dayKeys.length];
      const openMin = toMinutes(rv[key]?.otvaranje);
      const closeMin = toMinutes(rv[key]?.zatvaranje);
      if (openMin == null || closeMin == null) continue;

      const base = k * 1440;

      if (closeMin > openMin) {
        intervals.push({ start: base + openMin, end: base + closeMin });
      } else {
        intervals.push({ start: base + openMin, end: base + 1440 });
        intervals.push({ start: base + 1440 + 0, end: base + 1440 + closeMin });
      }
    }

    intervals.sort((a, b) => a.start - b.start);
    return intervals;
  };

  const getOpenInfo = (rv?: WorkingHoursData) => {
    if (!rv) {
      return { open: false, minutesToChange: null as number | null, changeAt: null as string | null, mode: "opens" as "opens" | "closes" };
    }

    const nowMin = now.getHours() * 60 + now.getMinutes();
    const intervals = buildIntervalsNextDays(rv, 8);

    const current = intervals.find((it) => nowMin >= it.start && nowMin < it.end);
    if (current) {
      const delta = Math.max(0, current.end - nowMin);
      return {
        open: true,
        minutesToChange: delta,
        changeAt: minutesToClock(current.end),
        mode: "closes" as const,
      };
    }

    const next = intervals.find((it) => it.start > nowMin);
    if (!next) {
      return { open: false, minutesToChange: null, changeAt: null, mode: "opens" as const };
    }

    const delta = Math.max(0, next.start - nowMin);
    return {
      open: false,
      minutesToChange: delta,
      changeAt: minutesToClock(next.start),
      mode: "opens" as const,
    };
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

          // default selekcija: prema URL slugu ako postoji
          const bySlug =
            activeBranchSlug
              ? data.find((l: any) => slugify(l.lokacija) === activeBranchSlug)
              : null;

          setSelectedLocation((bySlug || data[0]).id);
        }
      } catch (err) {
        console.error("Error fetching locations:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBranchSlug]);

  const selected = useMemo(
    () => locations.find((loc) => loc.id === selectedLocation),
    [locations, selectedLocation]
  );

  if (loading) {
    return <div className="py-4 text-center text-white/80">{t("loading")}</div>;
  }

  if (locations.length === 0) return null;

  const HoursTable = () => {
    if (!selected?.radno_vrijeme) return null;

    return (
      <div className="grid grid-cols-1 gap-1">
        {Object.entries(selected.radno_vrijeme).map(([day, hours]) => {
          const isToday = day === todayKey;
          return (
            <div
              key={day}
              className={[
                "flex items-center justify-between rounded-lg px-3 py-2",
                isToday ? "bg-white/10 border border-white/15" : "border border-transparent",
              ].join(" ")}
            >
              <span className={["font-medium", isToday ? "text-white" : "text-white/90"].join(" ")}>
                {getDayName(day)}
                {isToday ? <span className="ml-2 text-xs text-white/70">({t("today")})</span> : null}
              </span>
              <span className="text-white/90 tabular-nums">
                {formatTime(hours.otvaranje)} – {formatTime(hours.zatvaranje)}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const goToBranch = (location: Location) => {
    const slug = slugify(location.lokacija);
    navigate(`/${slug}`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Lokacije */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="h-5 w-5 text-white" />
          <h3 className="text-lg font-semibold">{t("ourLocations")}</h3>
        </div>

        <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto">
          {locations.map((location) => {
            const active = selectedLocation === location.id;

            const info = getOpenInfo(location.radno_vrijeme);
            const openLabel = t("openNow");
            const closedLabel = t("closedNow");

            const secondaryText =
              info.minutesToChange != null
                ? info.mode === "closes"
                  ? `${t("closesIn")} ${formatDuration(info.minutesToChange)}`
                  : `${t("opensIn")} ${formatDuration(info.minutesToChange)}`
                : "";

            const tooltipText =
              info.minutesToChange != null && info.changeAt
                ? info.mode === "closes"
                  ? `${t("closesAt")} ${info.changeAt}`
                  : `${t("opensAt")} ${info.changeAt}`
                : info.open
                ? openLabel
                : closedLabel;

            return (
              <button
                key={location.id}
                className={[
                  "text-left rounded-xl px-4 py-3 transition-all border",
                  active
                    ? "bg-white text-[#6f1222] border-white/30 shadow-sm"
                    : "bg-white/10 hover:bg-white/10 border-white/10 text-white",
                ].join(" ")}
                onClick={() => {
                  setSelectedLocation(location.id);
                  goToBranch(location); // ✅ vodi na /:branchSlug
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{location.lokacija}</div>

                    <div className={["text-sm mt-1", active ? "text-[#6f1222]/70" : "text-white/70"].join(" ")}>
                      {location.adresa}
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <span
                      className={[
                        "shrink-0 inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
                        info.open
                          ? active
                            ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30"
                            : "bg-emerald-400/15 text-emerald-100 border-emerald-300/25"
                          : active
                          ? "bg-black/5 text-[#6f1222]/60 border-black/10"
                          : "bg-white/10 text-white/70 border-white/15",
                      ].join(" ")}
                      title={tooltipText}
                    >
                      {info.open ? openLabel : closedLabel}
                    </span>

                    {secondaryText ? (
                      <div className={["text-xs mt-0.5", active ? "text-[#6f1222]/70" : "text-white/70"].join(" ")}>
                        {secondaryText}
                      </div>
                    ) : null}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Radno vrijeme */}
      <div>
        <div className="hidden md:block">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-5 w-5 text-white" />
            <h3 className="text-lg font-semibold">{t("workingHours")}</h3>
          </div>
          <HoursTable />
        </div>

        {/* Mobile accordion */}
        <div className="md:hidden">
          <details className="group rounded-xl border border-white/10 bg-white/5">
            <summary className="cursor-pointer list-none px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-white" />
                <span className="font-semibold">{t("workingHours")}</span>
              </div>
              <ChevronDown className="h-5 w-5 text-white/80 transition-transform group-open:rotate-180" />
            </summary>
            <div className="px-4 pb-4 pt-1">
              <HoursTable />
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
