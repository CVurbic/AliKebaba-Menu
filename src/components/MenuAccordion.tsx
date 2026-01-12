import React, { useMemo, useRef, useState } from "react";
import MenuSection from "./MenuSection";

/**
 * TODO: Uskladi ove import putanje i imena slika s tvojim projektom.
 * Preporuka: napravi folder npr. src/resources/menu-categories/
 * i stavi slike:
 * steak.jpg, classic.jpg, chicken.jpg, mix.jpg, nuggets.jpg, vege.jpg, prilozi.jpg, desert.jpg, napitci.jpg
 */
import steakBg from "../resources/menu-categories/steak.webp";
import classicBg from "../resources/menu-categories/classic.webp";
import chickenBg from "../resources/menu-categories/chicken.webp";
import mixBg from "../resources/menu-categories/mix.webp";
import nuggetsBg from "../resources/menu-categories/nuggets.webp";
import vegeBg from "../resources/menu-categories/vege.webp";
import priloziBg from "../resources/menu-categories/prilozi.webp";
import desertBg from "../resources/menu-categories/desert.webp";
import napitciBg from "../resources/menu-categories/napitci.webp";

type MenuData = Record<string, any[]> | null;

type Props = {
    menuData: MenuData;
    t: (key: string) => string;
    defaultOpenKey?: string;
};

const ORDER = [
    "steak",
    "classic",
    "chicken",
    "mix",
    "nuggets",
    "vege",
    "prilozi",
    "desert",
    "napitci",
];

const CATEGORY_BG: Record<string, string> = {
    steak: steakBg,
    classic: classicBg,
    chicken: chickenBg,
    mix: mixBg,
    nuggets: nuggetsBg,
    vege: vegeBg,
    prilozi: priloziBg,
    desert: desertBg,
    napitci: napitciBg,
};

export default function MenuAccordion({ menuData, t, defaultOpenKey = "classic" }: Props) {
    const [openKey, setOpenKey] = useState<string>(defaultOpenKey);
    const [q, setQ] = useState("");

    const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const categories = useMemo(() => {
        if (!menuData) return [];

        const keys = Object.keys(menuData);

        const sorted = [...keys].sort((a, b) => {
            const ai = ORDER.indexOf(a);
            const bi = ORDER.indexOf(b);
            const aRank = ai === -1 ? 999 : ai;
            const bRank = bi === -1 ? 999 : bi;
            return aRank - bRank;
        });

        const query = q.trim().toLowerCase();
        if (!query) return sorted;

        return sorted.filter((key) => {
            const items = menuData[key] || [];
            return items.some((it: any) => {
                const name =
                    (it.product_name_hr ||
                        it.product_name_en ||
                        it.product_name_de ||
                        it.product_name ||
                        "") +
                    " " +
                    (it.description_hr ||
                        it.description_en ||
                        it.description_de ||
                        it.description ||
                        "");
                return name.toLowerCase().includes(query);
            });
        });
    }, [menuData, q]);

    function toggle(key: string) {
        setOpenKey((prev) => {
            const next = prev === key ? "" : key;

            queueMicrotask(() => {
                const el = sectionRefs.current[key];
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
            });

            return next;
        });
    }

    if (!menuData) return null;

    return (
        <div className="mx-auto max-w-7xl">

            {/* Accordion */}
            <div className="grid gap-3">
                {categories.map((key) => {
                    const isOpen = openKey === key;
                    const items = menuData[key] || [];
                    const count = items.length;

                    const bg = CATEGORY_BG[key];

                    return (
                        <div
                            key={key}
                            ref={(el) => {
                                sectionRefs.current[key] = el;
                            }}
                            className="rounded-3xl bg-white shadow-sm border border-black/10 overflow-hidden"
                        >
                            {/* Header (sa slikom u pozadini) */}
                            <button
                                onClick={() => toggle(key)}
                                className="w-full text-left"
                                style={{
                                    backgroundImage: bg ? `url(${bg})` : undefined,
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                }}
                            >
                                {/* Overlay da tekst bude čitljiv */}
                                <div className="px-4 py-4 text-white relative">
                                    <div className="absolute inset-0 bg-black/55" />
                                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-black/10" />

                                    <div className="relative flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <div className="font-bold tracking-wide text-[16px] md:text-[18px]">
                                                {t(key.toUpperCase())}
                                            </div>

                                            <div className="text-xs bg-white/15 px-2 py-1 rounded-full">
                                                {count} {t("stavki")}
                                            </div>

                                            {key === "steak" ? (
                                                <div className="text-xs bg-white/15 px-2 py-1 rounded-full">
                                                    {t("Dostupno samo vikendom (petak, subota) Langov Trg")}
                                                </div>
                                            ) : null}
                                        </div>

                                        <div className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
                                            ▼
                                        </div>
                                    </div>
                                </div>
                            </button>

                            {/* Content */}
                            {isOpen ? (
                                <div className="px-4 py-4 bg-[#fffafa]">
                                    <MenuSection title={t(key.toUpperCase())} items={items} />
                                </div>
                            ) : null}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
