import React, { useMemo, useRef, useState } from "react";
import MenuSection from "./MenuSection";
import { useLanguage } from "../context/LanguageContext";

import steakBg from "../resources/menu-categories/steak.png";
import classicBg from "../resources/menu-categories/classic.png";
import chickenBg from "../resources/menu-categories/chicken.png";
import mixBg from "../resources/menu-categories/mix.webp";
import nuggetsBg from "../resources/menu-categories/nuggets.webp";
import vegeBg from "../resources/menu-categories/vege.png";
import priloziBg from "../resources/menu-categories/prilozi.png";
import desertBg from "../resources/menu-categories/desert.png";
import napitciBg from "../resources/menu-categories/napitci.png";

type MenuData = Record<string, any[]> | null;

type Props = {
    menuData: MenuData;
    defaultOpenKey?: string;
};

const ORDER = ["steak", "classic", "chicken", "mix", "nuggets", "vege", "prilozi", "desert", "napitci"];

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

/**
 * Po kategoriji namjesti "focus" (object-position) da se ne reže glavni subjekt.
 */
const BG_POSITION: Record<string, string> = {
    steak: "72% 50%",
    classic: "68% 50%",
    chicken: "70% 52%",
    mix: "67% 50%",
    nuggets: "58% 52%",
    vege: "66% 50%",
    prilozi: "55% 55%",
    desert: "60% 52%",
    napitci: "52% 50%",
};

function classNames(...xs: Array<string | false | undefined | null>) {
    return xs.filter(Boolean).join(" ");
}

export default function MenuAccordion({ menuData, defaultOpenKey = "classic" }: Props) {
    const { t, formatItemsCount } = useLanguage();

    const [openKey, setOpenKey] = useState<string>(defaultOpenKey);

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

        return sorted;
    }, [menuData]);
    const desktopOpenRef = useRef<HTMLDivElement | null>(null);
    const mobileItemRefs = useRef<Record<string, HTMLDivElement | null>>({});

    function toggleMobile(key: string) {
        setOpenKey((prev) => {
            const next = prev === key ? "" : key;

            // scroll samo kad otvaraš
            if (next && next !== prev) {
                requestAnimationFrame(() => {
                    mobileItemRefs.current[key]?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                    });
                });
            }

            return next;
        });
    }

    function toggleDesktop(key: string) {
        setOpenKey((prev) => {
            const next = prev === key ? "" : key;

            // scroll samo kad OTVARAMO (ne kad zatvaramo)
            if (next && next !== prev) {
                // 2x rAF je najstabilnije kad ima teških layout promjena (slike, grid, itd.)
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        desktopOpenRef.current?.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                        });

                        // opcionalno: pravi fokus (A11y + “osjećaj” da te odvede na content)
                        desktopOpenRef.current?.focus({ preventScroll: true });
                    });
                });
            }

            return next;
        });
    }


    if (!menuData) return null;

    // Helperi za trenutno otvorenu kategoriju
    const openItems = openKey ? menuData[openKey] || [] : [];
    const openCount = openItems.length;
    const openBg = openKey ? CATEGORY_BG[openKey] : "";
    const openPos = openKey ? BG_POSITION[openKey] || "center" : "center";

    return (
        <div className="mx-auto max-w-7xl">
            {/* =========================
          DESKTOP (md+): GRID + OPEN CONTENT
          ========================= */}
            <div className="hidden md:block">
                {/* Grid kategorija */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
                    {categories.map((key) => {
                        const isActive = openKey === key;
                        const items = menuData[key] || [];
                        const count = items.length;

                        const bg = CATEGORY_BG[key];
                        const pos = BG_POSITION[key] || "center";

                        return (
                            <button
                                key={key}
                                onClick={() => toggleDesktop(key)}
                                className={classNames(
                                    "relative overflow-hidden rounded-3xl text-left border shadow-sm transition-transform",
                                    "bg-white border-black/10",
                                    "hover:-translate-y-[1px] hover:shadow-md",
                                    isActive && "ring-2 ring-[#C41E3A]/40"
                                )}
                            >
                                {/* Background */}
                                {bg ? (
                                    <div className={classNames("absolute inset-0", key === "napitci" && "px-16")}>
                                        <img
                                            src={bg}
                                            alt=""
                                            aria-hidden="true"
                                            className={classNames(
                                                "h-full w-full object-cover",
                                                key === "napitci"
                                                    ? "blur-[1px] brightness-[0.78] saturate-[1.05]"
                                                    : "blur-[1px] brightness-[0.80] saturate-[1.12]"
                                            )}
                                            style={{ objectPosition: pos }}
                                            loading="lazy"
                                        />
                                    </div>
                                ) : null}


                                {/* Overlays */}
                                <div className="absolute inset-0 bg-black/30" />
                                <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-black/10" />

                                {/* Content */}
                                <div className="relative p-5 text-white min-h-[128px] flex flex-col justify-between">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <div className="font-bold tracking-wide text-[18px]">
                                                {t(key.toUpperCase())}
                                            </div>

                                            <div className="text-xs bg-white/15 px-2 py-1 rounded-full backdrop-blur-[2px]">
                                                {formatItemsCount(count)}
                                            </div>

                                            {key === "steak" ? (
                                                <div className="text-xs bg-white/15 px-2 py-1 rounded-full backdrop-blur-[2px]">
                                                    {t("steakWeekendOnly")}
                                                </div>
                                            ) : null}
                                        </div>

                                        <div
                                            className={classNames(
                                                "text-white/90 transition-transform duration-200",
                                                isActive && "rotate-180"
                                            )}
                                            aria-hidden="true"
                                        >
                                            ▼
                                        </div>
                                    </div>

                                    <div className="text-white/80 text-sm">
                                        {isActive ? t("selected") : t("open")}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Otvoreni sadržaj ispod grida */}
                <div
                    ref={desktopOpenRef}
                    tabIndex={-1}
                    className="mt-6 focus:outline-none"
                >
                    {openKey ? (
                        <div className="rounded-3xl bg-white shadow-sm border border-black/10 overflow-hidden">
                            {/* Header (kompaktan, bez “razvučenih linija”) */}
                            <button
                                onClick={() => toggleDesktop(openKey)}


                                className="w-full text-left relative overflow-hidden"
                            >
                                {openBg ? (
                                    <img
                                        src={openBg}
                                        alt=""
                                        aria-hidden="true"
                                        className={classNames(
                                            "absolute inset-0 h-full w-full object-cover scale-[1.03] ",
                                            openKey === "napitci"
                                                ? "blur-[0.5px] brightness-[0.80] saturate-[1.05]  "
                                                : "blur-[0.5px] brightness-[0.82] saturate-[1.12]"
                                        )}
                                        style={{ objectPosition: openPos }}
                                        loading="lazy"
                                    />
                                ) : null}

                                <div className="absolute inset-0 bg-black/35" />
                                <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-black/10" />

                                <div className="relative px-5 py-4 text-white">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <div className="font-bold tracking-wide text-[18px]">
                                                {t(openKey.toUpperCase())}
                                            </div>

                                            <div className="text-xs bg-white/15 px-2 py-1 rounded-full backdrop-blur-[2px]">
                                                {formatItemsCount(openCount)}
                                            </div>

                                            {openKey === "steak" ? (
                                                <div className="text-xs bg-white/15 px-2 py-1 rounded-full backdrop-blur-[2px]">
                                                    {t("steakWeekendOnly")}
                                                </div>
                                            ) : null}
                                        </div>

                                        <div className="text-white/90" aria-hidden="true">
                                            ▼
                                        </div>
                                    </div>
                                </div>
                            </button>

                            <div className="px-5 py-5 bg-[#fffafa]">
                                <MenuSection title={t(openKey.toUpperCase())} items={openItems} />
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-3xl border border-black/10 bg-white/60 p-6 text-black/60">
                            {t("chooseCategory")}
                        </div>
                    )}
                </div>
            </div>

            {/* =========================
          MOBILE (do md): ORIGINAL ACCORDION
          ========================= */}
            <div className="md:hidden">
                <div className="grid gap-3">
                    {categories.map((key) => {
                        const isOpen = openKey === key;
                        const items = menuData[key] || [];
                        const count = items.length;

                        const bg = CATEGORY_BG[key];
                        const pos = BG_POSITION[key] || "center";

                        return (
                            <div
                                key={key}
                                ref={(el) => {
                                    mobileItemRefs.current[key] = el;
                                }}
                                className="rounded-3xl bg-white shadow-sm border border-black/10 overflow-hidden"
                            >
                                <button onClick={() => toggleMobile(key)} className="w-full text-left relative overflow-hidden">
                                    {/* Background image layer */}
                                    {bg ? (
                                        <img
                                            src={bg}
                                            alt=""
                                            aria-hidden="true"
                                            className={
                                                "absolute inset-0 h-full w-full object-cover scale-[1.03] " +
                                                (key === "napitci"
                                                    ? " blur-[1.5px] brightness-[0.75] saturate-[1.05]"
                                                    : " blur-[2px] brightness-[0.72] saturate-[1.12]")
                                            }
                                            style={{ objectPosition: pos }}
                                            loading="lazy"
                                        />
                                    ) : null}

                                    {/* Overlays */}
                                    <div className="absolute inset-0 bg-black/35" />
                                    <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-black/10" />

                                    {/* Content */}
                                    <div className="relative px-4 py-4 text-white">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <div className="font-bold tracking-wide text-[16px]">
                                                    {t(key.toUpperCase())}
                                                </div>

                                                <div className="text-xs bg-white/15 px-2 py-1 rounded-full backdrop-blur-[2px]">
                                                    {formatItemsCount(count)}
                                                </div>

                                                {key === "steak" ? (
                                                    <div className="text-xs bg-white/15 px-2 py-1 rounded-full backdrop-blur-[2px]">
                                                        {t("steakWeekendOnly")}
                                                    </div>
                                                ) : null}
                                            </div>

                                            <div
                                                className={classNames(
                                                    "transition-transform duration-200 text-white/90",
                                                    isOpen && "rotate-180"
                                                )}
                                                aria-hidden="true"
                                            >
                                                ▼
                                            </div>
                                        </div>

                                        {/* Suptilna linija samo na mobu */}
                                        <div className="mt-3 h-px w-full bg-white/10" />
                                    </div>
                                </button>

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
        </div>
    );
}
