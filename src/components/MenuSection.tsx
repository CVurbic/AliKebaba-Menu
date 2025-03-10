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
    // Add fields for translations
    product_name_en?: string;
    product_name_de?: string;
    description_en?: string;
    description_de?: string;
    description_hr?: string;
}

interface MenuSectionProps {
    title: string;
    items: MenuItem[];
}

// Add this interface
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

const MenuSection = ({ title, items }: MenuSectionProps) => {
    const { t, getProductTranslation } = useLanguage();
    
    const groupItemsByTypeAndMenu = (items: MenuItem[]) => {
        // Prvo razdvojimo standardne i menu artikle
        const standardItems = items.filter(item => !item.collection.includes("MENU"));
        const menuItems = items.filter(item => item.collection.includes("MENU"));

        // Grupiramo standardne artikle po tipu
        const standardGrouped = standardItems.reduce<GroupedItems>((acc, item) => {
            const type = item.collection.replace("KEBAB", "").trim();
            if (!acc[type]) {
                acc[type] = [];
            }
            acc[type].push(item);
            return acc;
        }, {});
        
        // Grupiramo menu artikle po tipu
        const menuGrouped = menuItems.reduce<GroupedItems>((acc, item) => {
            const type = item.collection.replace(" MENU", "").replace("KEBAB", "").trim();
            if (!acc[type]) {
                acc[type] = [];
            }
            acc[type].push(item);
            return acc;
        }, {});

        return { standardGrouped, menuGrouped };
    };

    // Function to consolidate items with size variations
    const consolidateItems = (items: MenuItem[]): ConsolidatedItem[] => {
        const itemMap = new Map<string, ConsolidatedItem>();
        
        items.forEach(item => {
            // Get translated product name
            const translatedName = getProductTranslation(item, 'product_name');
            
            // Extract base name without size indicators
            let baseName = translatedName
                .replace(/ - VELIKA$| - MALA$| - VELIKI$| - MALI$/, '')
                .trim();
            
            // Determine size
            let sizeName = "Regular";
            if (translatedName.includes("VELIKA") || translatedName.includes("VELIKI")) {
                sizeName = "Veliki";
            } else if (translatedName.includes("MALA") || translatedName.includes("MALI")) {
                sizeName = "Mali";
            }
            
            // Check if we already have this base item
            if (itemMap.has(baseName)) {
                // Add size variation
                const existingItem = itemMap.get(baseName);
                if (existingItem) {
                    existingItem.sizes.push({
                        name: t(sizeName),
                        price: item.price,
                        external_id: item.external_id
                    });
                }
            } else {
                // Create new consolidated item
                itemMap.set(baseName, {
                    baseItem: { 
                        ...item, 
                        product_name: baseName // Use the base name without size
                    },
                    sizes: [{
                        name: t(sizeName),
                        price: item.price,
                        external_id: item.external_id
                    }]
                });
            }
        });
        
        // Sort sizes for each item (Veliki first, then Mali)
        return Array.from(itemMap.values()).map(item => ({
            ...item,
            sizes: item.sizes.sort((a, b) => {
                if (a.name === t("Veliki") && b.name !== t("Veliki")) return -1;
                if (a.name !== t("Veliki") && b.name === t("Veliki")) return 1;
                return 0;
            })
        }));
    };

    const { standardGrouped, menuGrouped } = groupItemsByTypeAndMenu(items);

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
                                            {/* Product image */}
                                            {item.baseItem.image && (
                                                <div className="mb-4 overflow-hidden rounded-lg">
                                                    <img
                                                        src={item.baseItem.image}
                                                        alt={getProductTranslation(item.baseItem, 'product_name')}
                                                        className="h-48 w-full rounded-lg object-contain transform hover:scale-105 transition-transform duration-500"
                                                    />
                                                </div>
                                            )}

                                            {/* Product content */}
                                            <div className="flex flex-col flex-grow">
                                                {/* Product name */}
                                                <h5 className="text-xl font-semibold text-[#C41E3A] mb-2">
                                                    {getProductTranslation(item.baseItem, 'product_name')}
                                                </h5>

                                                {/* Product description */}
                                                <p className="text-sm text-gray-600 flex-grow">
                                                    {getProductTranslation(item.baseItem, 'description') || " "}
                                                </p>
                                            </div>

                                            {/* Price */}
                                            <div className="mt-4 bg-[#C41E3A]/10 p-3 rounded-lg">
                                                {item.sizes.map((size, index) => (
                                                    <div key={size.external_id} className="flex justify-between items-center">
                                                        {item.sizes.length > 1 ? (
                                                            <>
                                                                <span className="text-gray-700 font-medium">{size.name}</span>
                                                                <span className="text-lg font-bold text-[#C41E3A]">{size.price.toFixed(2)} €</span>
                                                            </>
                                                        ) : (
                                                            <span className="text-lg font-bold text-[#C41E3A] w-full text-center">{size.price.toFixed(2)} €</span>
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
                    <h4 className="text-3xl font-bold text-[#C41E3A] text-center mb-8">{t('menuOffer')}</h4>
                    
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
                                                {/* Product image */}
                                                {item.baseItem.image && (
                                                    <div className="mb-4 overflow-hidden rounded-lg">
                                                        <img
                                                            src={item.baseItem.image}
                                                            alt={getProductTranslation(item.baseItem, 'product_name')}
                                                            className="h-48 w-full rounded-lg object-contain transform hover:scale-105 transition-transform duration-500"
                                                        />
                                                    </div>
                                                )}

                                                {/* Product content */}
                                                <div className="flex flex-col flex-grow">
                                                    {/* Product name */}
                                                    <h5 className="text-xl font-semibold text-[#C41E3A] mb-2">
                                                        {getProductTranslation(item.baseItem, 'product_name')}
                                                    </h5>

                                                    {/* Product description */}
                                                    <p className="text-sm text-gray-600 flex-grow">
                                                        {getProductTranslation(item.baseItem, 'description') || " "}
                                                    </p>
                                                </div>

                                                {/* Price */}
                                                <div className="mt-4">
                                                    <div className="bg-[#C41E3A]/10 p-3 rounded-lg mb-2">
                                                        {item.sizes.map((size, index) => (
                                                            <div key={size.external_id} className="flex justify-between items-center">
                                                                {item.sizes.length > 1 ? (
                                                                    <>
                                                                        <span className="text-gray-700 font-medium">{size.name}</span>
                                                                        <span className="text-lg font-bold text-[#C41E3A]">{size.price.toFixed(2)} €</span>
                                                                    </>
                                                                ) : (
                                                                    <span className="text-lg font-bold text-[#C41E3A] w-full text-center">{size.price.toFixed(2)} €</span>
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
                            <span className="block mb-2">{t('sweetPotatoOption')} <span className="font-bold text-[#C41E3A]">+1.30€</span></span>
                            <span className="block">{t('drinkOfChoice')}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MenuSection;