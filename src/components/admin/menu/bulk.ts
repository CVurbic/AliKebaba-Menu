import { MenuItem } from "../../MenuSection";

export type BulkPatch = Partial<
    Pick<MenuItem, "collection" | "size" | "image" | "collection_order">
> & {
    priceDelta?: number; // npr +0.30
};

export function applyBulkPatch(items: MenuItem[], patch: BulkPatch): MenuItem[] {
    return items.map((it) => {
        const next: MenuItem = { ...it };

        if (patch.collection !== undefined) next.collection = patch.collection;
        if (patch.size !== undefined) next.size = patch.size;
        if (patch.image !== undefined) next.image = patch.image;
        if (patch.collection_order !== undefined)
            next.collection_order = patch.collection_order;

        if (patch.priceDelta !== undefined) {
            const newPrice = Number((Number(next.price) + patch.priceDelta).toFixed(2));
            next.price = newPrice < 0 ? 0 : newPrice;
        }

        return next;
    });
}
