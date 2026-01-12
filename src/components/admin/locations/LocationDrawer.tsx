import React, { useEffect, useState } from "react";
import { X, Save } from "lucide-react";
import { LocationRow, WorkingHoursData } from "./LocationsTable";

export type LocationDraft = {
    lokacija: string;
    adresa: string;
    active: boolean;
    radno_vrijeme: WorkingHoursData;
};

const DEFAULT_HOURS: WorkingHoursData = {
    ponedjeljak: { otvaranje: "09:00", zatvaranje: "24:00" },
    utorak: { otvaranje: "09:00", zatvaranje: "24:00" },
    srijeda: { otvaranje: "09:00", zatvaranje: "24:00" },
    cetvrtak: { otvaranje: "09:00", zatvaranje: "24:00" },
    petak: { otvaranje: "09:00", zatvaranje: "24:00" },
    subota: { otvaranje: "10:00", zatvaranje: "24:00" },
    nedjelja: { otvaranje: "10:00", zatvaranje: "24:00" },
};

const dayLabels: Record<keyof WorkingHoursData, string> = {
    ponedjeljak: "Ponedjeljak",
    utorak: "Utorak",
    srijeda: "Srijeda",
    cetvrtak: "Četvrtak",
    petak: "Petak",
    subota: "Subota",
    nedjelja: "Nedjelja",
};

export default function LocationDrawer({
    open,
    mode,
    initial,
    onClose,
    onSave,
}: {
    open: boolean;
    mode: "create" | "edit";
    initial: LocationRow | null;
    onClose: () => void;
    onSave: (draft: LocationDraft) => Promise<void> | void;
}) {
    const [draft, setDraft] = useState<LocationDraft>({
        lokacija: "",
        adresa: "",
        active: true,
        radno_vrijeme: DEFAULT_HOURS,
    });

    useEffect(() => {
        if (!open) return;

        if (mode === "edit" && initial) {
            setDraft({
                lokacija: initial.lokacija || "",
                adresa: initial.adresa || "",
                active: !!initial.active,
                radno_vrijeme: initial.radno_vrijeme || DEFAULT_HOURS,
            });
        } else {
            setDraft({
                lokacija: "",
                adresa: "",
                active: true,
                radno_vrijeme: DEFAULT_HOURS,
            });
        }
    }, [open, mode, initial]);

    if (!open) return null;

    const title = mode === "create" ? "Nova lokacija" : "Uredi lokaciju";

    const updateTime = (
        day: keyof WorkingHoursData,
        field: "otvaranje" | "zatvaranje",
        value: string
    ) => {
        setDraft((prev) => ({
            ...prev,
            radno_vrijeme: {
                ...prev.radno_vrijeme,
                [day]: { ...prev.radno_vrijeme[day], [field]: value },
            },
        }));
    };

    const copyDayToAll = (day: keyof WorkingHoursData) => {
        const v = draft.radno_vrijeme[day];
        const all: WorkingHoursData = { ...draft.radno_vrijeme };
        (Object.keys(all) as (keyof WorkingHoursData)[]).forEach((d) => {
            all[d] = { ...v };
        });
        setDraft((p) => ({ ...p, radno_vrijeme: all }));
    };

    return (
        <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="absolute right-0 top-0 h-full w-full sm:w-[560px] bg-white shadow-2xl flex flex-col">
                <div className="p-4 border-b flex items-center justify-between">
                    <div>
                        <div className="text-lg font-bold text-[#C41E3A]">{title}</div>
                        <div className="text-sm text-gray-500 truncate">
                            {draft.lokacija || "(bez naziva)"}
                        </div>
                    </div>
                    <button onClick={onClose} className="rounded-lg p-2 hover:bg-gray-100">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-4 overflow-y-auto flex-1 space-y-5">
                    <div className="grid grid-cols-1 gap-3">
                        <div>
                            <label className="text-sm font-medium">Naziv lokacije</label>
                            <input
                                value={draft.lokacija}
                                onChange={(e) => setDraft((p) => ({ ...p, lokacija: e.target.value }))}
                                className="w-full border rounded-lg px-3 py-2 mt-1"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium">Adresa</label>
                            <input
                                value={draft.adresa}
                                onChange={(e) => setDraft((p) => ({ ...p, adresa: e.target.value }))}
                                className="w-full border rounded-lg px-3 py-2 mt-1"
                            />
                        </div>

                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={draft.active}
                                onChange={(e) => setDraft((p) => ({ ...p, active: e.target.checked }))}
                            />
                            Aktivna (prikaz na webu)
                        </label>
                    </div>

                    <div className="border rounded-lg p-3 bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                            <div className="font-semibold">Radno vrijeme</div>
                            <div className="text-xs text-gray-500">Tip: kopiraj dan na sve</div>
                        </div>

                        <div className="space-y-3">
                            {(Object.keys(draft.radno_vrijeme) as (keyof WorkingHoursData)[]).map((day) => (
                                <div key={day} className="border rounded-lg bg-white p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="font-medium">{dayLabels[day]}</div>
                                        <button
                                            className="text-xs px-2 py-1 rounded-md border hover:bg-gray-50"
                                            onClick={() => copyDayToAll(day)}
                                            type="button"
                                        >
                                            Kopiraj na sve dane
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs text-gray-600">Otvaranje</label>
                                            <input
                                                type="time"
                                                value={draft.radno_vrijeme[day].otvaranje}
                                                onChange={(e) => updateTime(day, "otvaranje", e.target.value)}
                                                className="w-full border rounded-lg px-3 py-2 mt-1"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-600">Zatvaranje</label>
                                            <input
                                                type="time"
                                                value={draft.radno_vrijeme[day].zatvaranje}
                                                onChange={(e) => updateTime(day, "zatvaranje", e.target.value)}
                                                className="w-full border rounded-lg px-3 py-2 mt-1"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg border hover:bg-gray-50">
                        Odustani
                    </button>
                    <button
                        onClick={() => onSave(draft)}
                        className="px-4 py-2 rounded-lg bg-[#C41E3A] text-white hover:bg-[#a01930] flex items-center gap-2"
                    >
                        <Save className="h-4 w-4" />
                        Spremi
                    </button>
                </div>
            </div>
        </div>
    );
}
