import React from "react";
import { useLanguage } from "../context/LanguageContext";

// Define interfaces for our data structure
export interface MenuItem {
    collection: string;
    external_id: string;
    product_name: string;
    image?: string;
    price: number;
    size?: string;
    collection_order: number;

    // translations
    product_name_hr?: string;
    product_name_en?: string;
    product_name_de?: string;
    product_name_tr?: string;
    description_en?: string;
    description_de?: string;
    description_tr?: string;
    description_hr?: string;
}

interface MenuSectionProps {
    title: string;
    items: MenuItem[];
}

interface GroupedItems {
    [key: string]: MenuItem[];
}

interface ConsolidatedItem {
    baseItem: MenuItem;
    sizes: {
        name: string;
        price: number;
        external_id: string;
    }[];
}

function useMenuData(items: MenuItem[]) {
    const { t, getProductTranslation } = useLanguage();

    const groupItemsByTypeAndMenu = (itemsToGroup: MenuItem[]) => {
        const standardItems = itemsToGroup.filter(
            (item) => !item.collection.includes("MENU")
        );
        const menuItems = itemsToGroup.filter((item) =>
            item.collection.includes("MENU")
        );

        const standardGrouped = standardItems.reduce<GroupedItems>((acc, item) => {
            const type = item.collection.replace("KEBAB", "").trim();
            if (!acc[type]) acc[type] = [];
            acc[type].push(item);
            return acc;
        }, {});

        const menuGrouped = menuItems.reduce<GroupedItems>((acc, item) => {
            const type = item.collection
                .replace(" MENU", "")
                .replace("KEBAB", "")
                .trim();
            if (!acc[type]) acc[type] = [];
            acc[type].push(item);
            return acc;
        }, {});

        return { standardGrouped, menuGrouped };
    };

    const consolidateItems = (itemsToConsolidate: MenuItem[]): ConsolidatedItem[] => {
        const itemMap = new Map<string, ConsolidatedItem>();

        itemsToConsolidate.forEach((item) => {
            const translatedName = getProductTranslation(item, "product_name");

            let baseName = translatedName
                .replace(/ - VELIKA$| - MALA$| - VELIKI$| - MALI$/, "")
                .trim();

            let sizeName = "Regular";
            if (translatedName.includes("VELIKA") || translatedName.includes("VELIKI")) {
                sizeName = "Veliki";
            } else if (translatedName.includes("MALA") || translatedName.includes("MALI")) {
                sizeName = "Mali";
            }

            if (itemMap.has(baseName)) {
                const existingItem = itemMap.get(baseName);
                if (existingItem) {
                    existingItem.sizes.push({
                        name: t(sizeName),
                        price: item.price,
                        external_id: item.external_id,
                    });
                }
            } else {
                itemMap.set(baseName, {
                    baseItem: {
                        ...item,
                        product_name: baseName,
                    },
                    sizes: [
                        {
                            name: t(sizeName),
                            price: item.price,
                            external_id: item.external_id,
                        },
                    ],
                });
            }
        });

        return Array.from(itemMap.values()).map((item) => ({
            ...item,
            sizes: item.sizes.sort((a, b) => {
                if (a.name === t("Veliki") && b.name !== t("Veliki")) return -1;
                if (a.name !== t("Veliki") && b.name === t("Veliki")) return 1;
                return 0;
            }),
        }));
    };

    const { standardGrouped, menuGrouped } = groupItemsByTypeAndMenu(items);

    return {
        t,
        getProductTranslation,
        standardGrouped,
        menuGrouped,
        consolidateItems,
    };
}

/** ---------------------------
 * MOBILE VIEW (do md)
 * - drugačiji layout: list + accordion (details/summary)
 * - fokus na čitljivost i brz scroll
 * -------------------------- */
function MenuSectionMobile({ items }: { items: MenuItem[] }) {
    const { t, getProductTranslation, standardGrouped, menuGrouped, consolidateItems } =
        useMenuData(items);

    const MobileItemRow = ({ item }: { item: ConsolidatedItem }) => {
        console.log("item", item);
        const hasMultiple = item.sizes.length > 1;
        const title = getProductTranslation(item.baseItem, "product_name");
        const desc = getProductTranslation(item.baseItem, "description") || "";
        console.log(`desc: ${desc}\n title: ${title}`);

        return (
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="flex flex-col sm:flex-row gap-3 p-3">

                    {/* Image */}
                    <div className="w-full sm:w-24 h-32 sm:h-24 rounded-xl ...">

                        {item.baseItem.image ? (
                            <img
                                src={item.baseItem.image}
                                alt={title}
                                className="w-full h-full object-contain"
                                loading="lazy"
                            />
                        ) : (
                            <div className="w-full h-full bg-gray-100" />
                        )}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <div className="font-semibold text-[15px] leading-5 text-[#7a1627] line-clamp-2">
                                    {title}
                                </div>


                                {desc ? (
                                    <div className="mt-1 text-[12.5px] leading-4 text-gray-600 line-clamp-4">
                                        {desc}
                                    </div>
                                ) : null}
                            </div>

                            {/* Single size quick price */}
                            {!hasMultiple ? (
                                <div className="flex-shrink-0">
                                    <span className="inline-flex items-center rounded-full bg-[#C41E3A]/10 px-2.5 py-1 text-[12.5px] font-bold text-[#C41E3A]">
                                        {item.sizes[0].price.toFixed(2)} €
                                    </span>
                                </div>
                            ) : null}
                        </div>

                        {/* Size chips */}
                        {hasMultiple ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {item.sizes.map((s) => (
                                    <div
                                        key={s.external_id}
                                        className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1"
                                    >
                                        <span className="text-[12.5px] font-semibold text-gray-700">
                                            {s.name}
                                        </span>
                                        <span className="text-[12.5px] font-bold text-[#C41E3A]">
                                            {s.price.toFixed(2)} €
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        );
    };


    const MobileGroup = ({
        title,
        grouped,
    }: {
        title?: string;
        grouped: GroupedItems;
    }) => {
        const entries = Object.entries(grouped);
        if (entries.length === 0) return null;

        return (
            <div className="space-y-3">
                {title ? (
                    <h3 className="text-center text-xl font-bold text-[#C41E3A]">{title}</h3>
                ) : null}

                <div className="">
                    {entries.map(([type, typeItems]) => {
                        const consolidated = consolidateItems(typeItems);

                        return (
                            <div
                                key={type}
                                className="rounded-2xl w-full "

                            >


                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">


                                    {consolidated.map((ci) => (
                                        <MobileItemRow key={ci.baseItem.external_id} item={ci} />
                                    ))}
                                </div>

                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Standard */}
            <MobileGroup grouped={standardGrouped} />

            {/* Menu */}
            {Object.entries(menuGrouped).length > 0 && (
                <div className="pt-2">
                    <MobileGroup title={t("menuOffer")} grouped={menuGrouped} />

                    <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                        <div className="text-sm text-gray-700">
                            <div className="mb-2">
                                {t("sweetPotatoOption")}{" "}
                                <span className="font-bold text-[#C41E3A]">+1.30€</span>
                            </div>
                            <div>{t("drinkOfChoice")}</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/** ---------------------------
 * DESKTOP VIEW (md+)
 * - tvoj postojeći grid layout (minimalno dirano)
 * -------------------------- */
function MenuSectionDesktop({ items }: { items: MenuItem[] }) {
    const { t, getProductTranslation, standardGrouped, menuGrouped, consolidateItems } =
        useMenuData(items);

    return (
        <div className="space-y-16">
            {/* Standard items */}
            {Object.entries(standardGrouped).length > 0 && (
                <div className="space-y-12">
                    {Object.entries(standardGrouped).map(([type, typeItems]) => {
                        const consolidatedItems = consolidateItems(typeItems);

                        return (
                            <div key={type} className="space-y-6">
                                <h4 className="text-2xl font-semibold text-[#8B4513]">
                                    {t(type.toUpperCase())}
                                </h4>

                                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                                    {consolidatedItems.map((item) => (
                                        <div
                                            key={item.baseItem.external_id}
                                            className="rounded-lg bg-gray-50 p-6 shadow-xl transition-transform duration-300 hover:scale-105 hover:shadow-2xl flex flex-col justify-between min-h-[320px] border border-gray-200"
                                        >
                                            {item.baseItem.image && (
                                                <div className="mb-4 overflow-hidden rounded-lg">
                                                    <img
                                                        src={item.baseItem.image}
                                                        alt={getProductTranslation(item.baseItem, "product_name")}
                                                        className="h-48 w-full rounded-lg object-contain transform hover:scale-105 transition-transform duration-500"
                                                    />
                                                </div>
                                            )}

                                            <div className="flex flex-col flex-grow">
                                                <h5 className="text-xl font-semibold text-[#C41E3A] mb-2">
                                                    {getProductTranslation(item.baseItem, "product_name")}
                                                </h5>

                                                <p className="text-sm text-gray-600 flex-grow">
                                                    {getProductTranslation(item.baseItem, "description") || " "}
                                                </p>
                                            </div>

                                            <div className="mt-4 bg-[#C41E3A]/10 p-3 rounded-lg">
                                                {item.sizes.map((size) => (
                                                    <div
                                                        key={size.external_id}
                                                        className="flex justify-between items-center"
                                                    >
                                                        {item.sizes.length > 1 ? (
                                                            <>
                                                                <span className="text-gray-700 font-medium">
                                                                    {size.name}
                                                                </span>
                                                                <span className="text-lg font-bold text-[#C41E3A]">
                                                                    {size.price.toFixed(2)} €
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <span className="text-lg font-bold text-[#C41E3A] w-full text-center">
                                                                {size.price.toFixed(2)} €
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Menu items */}
            {Object.entries(menuGrouped).length > 0 && (
                <div className="mt-16">
                    <h4 className="text-3xl font-bold text-[#C41E3A] text-center mb-8">
                        {t("menuOffer")}
                    </h4>

                    <div className="space-y-12">
                        {Object.entries(menuGrouped).map(([type, typeItems]) => {
                            const consolidatedItems = consolidateItems(typeItems);

                            return (
                                <div key={type} className="space-y-6">
                                    <h4 className="text-2xl font-semibold text-[#8B4513]">{t(type)}</h4>

                                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                                        {consolidatedItems.map((item) => (
                                            <div
                                                key={item.baseItem.external_id}
                                                className="rounded-lg bg-gradient-to-br from-white to-gray-50 p-6 shadow-2xl transition-transform duration-300 hover:scale-105 flex flex-col justify-between min-h-[320px] border-2 border-[#C41E3A]"
                                            >
                                                {item.baseItem.image && (
                                                    <div className="mb-4 overflow-hidden rounded-lg">
                                                        <img
                                                            src={item.baseItem.image}
                                                            alt={getProductTranslation(item.baseItem, "product_name")}
                                                            className="h-48 w-full rounded-lg object-contain transform hover:scale-105 transition-transform duration-500"
                                                        />
                                                    </div>
                                                )}

                                                <div className="flex flex-col flex-grow">
                                                    <h5 className="text-xl font-semibold text-[#C41E3A] mb-2">
                                                        {getProductTranslation(item.baseItem, "product_name")}
                                                    </h5>

                                                    <p className="text-sm text-gray-600 flex-grow">
                                                        {getProductTranslation(item.baseItem, "description") || " "}
                                                    </p>
                                                </div>

                                                <div className="mt-4">
                                                    <div className="bg-[#C41E3A]/10 p-3 rounded-lg mb-2">
                                                        {item.sizes.map((size) => (
                                                            <div
                                                                key={size.external_id}
                                                                className="flex justify-between items-center"
                                                            >
                                                                {item.sizes.length > 1 ? (
                                                                    <>
                                                                        <span className="text-gray-700 font-medium">
                                                                            {size.name}
                                                                        </span>
                                                                        <span className="text-lg font-bold text-[#C41E3A]">
                                                                            {size.price.toFixed(2)} €
                                                                        </span>
                                                                    </>
                                                                ) : (
                                                                    <span className="text-lg font-bold text-[#C41E3A] w-full text-center">
                                                                        {size.price.toFixed(2)} €
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}

                        <div className="bg-gray-50 p-4 rounded-lg shadow-md mt-6">
                            <span className="block mb-2">
                                {t("sweetPotatoOption")}{" "}
                                <span className="font-bold text-[#C41E3A]">+1.30€</span>
                            </span>
                            <span className="block">{t("drinkOfChoice")}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


const MenuSection = ({ title, items }: MenuSectionProps) => {
    // title trenutno ne koristiš u prikazu, ali ostavljam prop (možeš ga ubacit po želji)
    return (
        <div>
            {/* MOBILE */}
            <div className="block md:hidden">
                <MenuSectionMobile items={items} />
            </div>

            {/* DESKTOP */}
            <div className="hidden md:block">
                <MenuSectionDesktop items={items} />
            </div>
        </div>
    );
};

export default MenuSection;
