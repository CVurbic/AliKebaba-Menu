// Define interfaces for our data structure
interface MenuItem {
    collection: string;
    external_id: string;
    product_name: string;
    description?: string;
    image?: string;
    price: number;
    size?: string; // Optional size property
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
            // Extract base name without size indicators
            let baseName = item.product_name
                .replace(/ - VELIKA$| - MALA$| - VELIKI$| - MALI$/, '')
                .trim();
            
            // Determine size
            let sizeName = "Regular";
            if (item.product_name.includes("VELIKA") || item.product_name.includes("VELIKI")) {
                sizeName = "Veliki";
            } else if (item.product_name.includes("MALA") || item.product_name.includes("MALI")) {
                sizeName = "Mali";
            }
            
            // Check if we already have this base item
            if (itemMap.has(baseName)) {
                // Add size variation
                const existingItem = itemMap.get(baseName);
                if (existingItem) {
                    existingItem.sizes.push({
                        name: sizeName,
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
                        name: sizeName,
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
                if (a.name === "Veliki" && b.name !== "Veliki") return -1;
                if (a.name !== "Veliki" && b.name === "Veliki") return 1;
                return 0;
            })
        }));
    };

    const { standardGrouped, menuGrouped } = groupItemsByTypeAndMenu(items);

    return (
        <div className="space-y-16">
            <h3 className="text-4xl font-bold text-[#C41E3A] text-center">{title}</h3>

            {/* Standardni artikli */}
            {Object.entries(standardGrouped).length > 0 && (
                <div className="space-y-12">
                    {Object.entries(standardGrouped).map(([type, typeItems]) => {
                        const consolidatedItems = consolidateItems(typeItems);
                        
                        return (
                            <div key={type} className="space-y-6">
                                <h4 className="text-2xl font-semibold text-[#8B4513]">{type}</h4>

                                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                                    {consolidatedItems.map((item) => (
                                        <div 
                                            key={item.baseItem.external_id} 
                                            className="rounded-lg bg-gray-50 p-6 shadow-xl transition-transform duration-300 hover:scale-105 hover:shadow-2xl flex flex-col justify-between min-h-[320px] border border-gray-200"
                                        >
                                            {/* Slika proizvoda */}
                                            {item.baseItem.image && (
                                                <div className="mb-4 overflow-hidden rounded-lg">
                                                    <img
                                                        src={item.baseItem.image}
                                                        alt={item.baseItem.product_name}
                                                        className="h-48 w-full rounded-lg object-contain transform hover:scale-105 transition-transform duration-500"
                                                    />
                                                </div>
                                            )}

                                            {/* Sadržaj proizvoda */}
                                            <div className="flex flex-col flex-grow">
                                                {/* Naziv proizvoda */}
                                                <h5 className="text-xl font-semibold text-[#C41E3A] mb-2">{item.baseItem.product_name}</h5>

                                                {/* Opis proizvoda  */}
                                                <p className="text-sm text-gray-600 flex-grow">
                                                    {item.baseItem.description || " "}
                                                </p>
                                            </div>

                                            {/* Cijena */}
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

            {/* Menu artikli */}
            {Object.entries(menuGrouped).length > 0 && (
                <div className="mt-16">
                    <h4 className="text-3xl font-bold text-[#C41E3A] text-center mb-8">MENU PONUDA</h4>
                    
                    <div className="space-y-12">
                        {Object.entries(menuGrouped).map(([type, typeItems]) => {
                            const consolidatedItems = consolidateItems(typeItems);
                            
                            return (
                                <div key={type} className="space-y-6">
                                    <h4 className="text-2xl font-semibold text-[#8B4513]">{type}</h4>

                                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                                        {consolidatedItems.map((item) => (
                                            <div 
                                                key={item.baseItem.external_id} 
                                                className="rounded-lg bg-gradient-to-br from-white to-gray-50 p-6 shadow-2xl transition-transform duration-300 hover:scale-105 flex flex-col justify-between min-h-[320px] border-2 border-[#C41E3A]"
                                            >
                                                {/* Slika proizvoda */}
                                                {item.baseItem.image && (
                                                    <div className="mb-4 overflow-hidden rounded-lg">
                                                        <img
                                                            src={item.baseItem.image}
                                                            alt={item.baseItem.product_name}
                                                            className="h-48 w-full rounded-lg object-contain transform hover:scale-105 transition-transform duration-500"
                                                        />
                                                    </div>
                                                )}

                                                {/* Sadržaj proizvoda */}
                                                <div className="flex flex-col flex-grow">
                                                    {/* Naziv proizvoda */}
                                                    <h5 className="text-xl font-semibold text-[#C41E3A] mb-2">{item.baseItem.product_name}</h5>

                                                    {/* Opis proizvoda  */}
                                                    <p className="text-sm text-gray-600 flex-grow">
                                                        {item.baseItem.description || " "}
                                                    </p>
                                                </div>

                                                {/* Cijena i Menu badge  */}
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
                            <span className="block mb-2">Opcija Batat krumpiriči umjesto pommesa  <span className="font-bold text-[#C41E3A]">+1.30€</span></span>
                            <span className="block">Piće po izboru</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MenuSection;