
import React from "react";
import { Edit, Trash2 } from "lucide-react";

export type WorkingHoursData = {
    ponedjeljak: { otvaranje: string; zatvaranje: string };
    utorak: { otvaranje: string; zatvaranje: string };
    srijeda: { otvaranje: string; zatvaranje: string };
    cetvrtak: { otvaranje: string; zatvaranje: string };
    petak: { otvaranje: string; zatvaranje: string };
    subota: { otvaranje: string; zatvaranje: string };
    nedjelja: { otvaranje: string; zatvaranje: string };
};

export type LocationRow = {
    id: number;
    lokacija: string;
    adresa: string;
    active: boolean;
    radno_vrijeme?: WorkingHoursData;
};

export default function LocationsTable({
    locations,
    onEdit,
    onDelete,
    onToggleActive,
    onSort,
    sortKey,
    sortDir,
}: {
    locations: LocationRow[];
    onEdit: (row: LocationRow) => void;
    onDelete: (row: LocationRow) => void;
    onToggleActive: (row: LocationRow) => void;
    onSort: (key: "lokacija" | "adresa" | "active") => void;
    sortKey: string | null;
    sortDir: "asc" | "desc" | null;
}) {

    const arrow = (key: string) =>
        sortKey !== key
            ? ""
            : sortDir === "asc"
                ? " ▲"
                : sortDir === "desc"
                    ? " ▼"
                    : "";


    return (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead className="bg-gray-50">
                        <tr>
                            <th
                                onClick={() => onSort("lokacija")}
                                className="cursor-pointer border-b px-4 py-3 text-left text-xs uppercase text-gray-500 hover:text-black"
                            >
                                Lokacija{arrow("lokacija")}
                            </th>

                            <th
                                onClick={() => onSort("adresa")}
                                className="cursor-pointer border-b px-4 py-3 text-left text-xs uppercase text-gray-500 hover:text-black"
                            >
                                Adresa{arrow("adresa")}
                            </th>

                            <th
                                onClick={() => onSort("active")}
                                className="cursor-pointer border-b px-4 py-3 text-left text-xs uppercase text-gray-500 hover:text-black"
                            >
                                Aktivna{arrow("active")}
                            </th>

                            <th className="border-b px-4 py-3 text-right text-xs uppercase text-gray-500">
                                Akcije
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-200">
                        {locations.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                                    Nema lokacija
                                </td>
                            </tr>
                        ) : (
                            locations.map((row) => (
                                <tr key={row.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-gray-900">
                                        {row.lokacija}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">{row.adresa}</td>
                                    <td className="px-4 py-3">
                                        <button
                                            onClick={() => onToggleActive(row)}
                                            className={`px-3 py-1 rounded-full text-xs font-medium ${row.active
                                                ? "bg-green-100 text-green-800"
                                                : "bg-gray-100 text-gray-700"
                                                }`}
                                            title="Toggle aktivna"
                                        >
                                            {row.active ? "DA" : "NE"}
                                        </button>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            className="inline-flex items-center justify-center rounded-lg p-2 hover:bg-blue-50 text-blue-700"
                                            onClick={() => onEdit(row)}
                                            title="Uredi"
                                        >
                                            <Edit className="h-5 w-5" />
                                        </button>
                                        <button
                                            className="inline-flex items-center justify-center rounded-lg p-2 hover:bg-red-50 text-red-700"
                                            onClick={() => onDelete(row)}
                                            title="Obriši"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
