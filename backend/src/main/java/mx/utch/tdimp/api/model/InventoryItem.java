package mx.utch.tdimp.api.model;

/** An inventory line joined with its catalog item (name, type, rarity, icon). */
public record InventoryItem(String itemId, String name, String type, String rarity, String iconKey, int quantity) {
}
