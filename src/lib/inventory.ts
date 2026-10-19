import type { PoolConnection } from "mysql2/promise";

export interface OrderItemInput {
  menu_item_id: number;
  quantity: number;
}

export interface IngredientNeed {
  name: string;
  needed: number;
}

export async function getIngredientUsage(
  conn: PoolConnection,
  items: OrderItemInput[]
): Promise<Map<number, IngredientNeed>> {
  const qtyByMenu = new Map<number, number>();
  for (const item of items) {
    const id = Number(item.menu_item_id);
    const qty = Number(item.quantity);
    if (!id || qty <= 0) continue;
    qtyByMenu.set(id, (qtyByMenu.get(id) || 0) + qty);
  }
  if (qtyByMenu.size === 0) return new Map();

  const menuIds = [...qtyByMenu.keys()];
  const [rows] = (await conn.query(
    `SELECT mr.menu_item_id, mr.inventory_item_id, mr.quantity_per_serving, inv.item_name
     FROM menu_recipes mr
     JOIN inventory inv ON inv.id = mr.inventory_item_id
     WHERE mr.menu_item_id IN (${menuIds.map(() => "?").join(",")})`,
    menuIds
  )) as [Record<string, unknown>[], unknown];

  const usage = new Map<number, IngredientNeed>();
  for (const row of rows) {
    const inventoryId = Number(row.inventory_item_id);
    const needed = Number(row.quantity_per_serving) * (qtyByMenu.get(Number(row.menu_item_id)) || 0);
    const existing = usage.get(inventoryId);
    if (existing) existing.needed += needed;
    else usage.set(inventoryId, { name: String(row.item_name), needed });
  }
  return usage;
}

export async function deductIngredients(
  conn: PoolConnection,
  usage: Map<number, IngredientNeed>
): Promise<string | null> {
  if (usage.size === 0) return null;
  const ids = [...usage.keys()];
  const [rows] = (await conn.query(
    `SELECT id, item_name, quantity FROM inventory WHERE id IN (${ids.map(() => "?").join(",")}) FOR UPDATE`,
    ids
  )) as [Record<string, unknown>[], unknown];

  for (const row of rows) {
    const need = usage.get(Number(row.id))?.needed || 0;
    if (Number(row.quantity) < need) {
      return `Insufficient ingredients: ${row.item_name} (needs ${need}, only ${Number(row.quantity)} left)`;
    }
  }

  for (const row of rows) {
    const need = usage.get(Number(row.id))?.needed || 0;
    if (need > 0) {
      await conn.query("UPDATE inventory SET quantity = quantity - ? WHERE id = ?", [need, row.id]);
    }
  }
  return null;
}

export async function restoreIngredients(
  conn: PoolConnection,
  usage: Map<number, IngredientNeed>
): Promise<void> {
  for (const [inventoryId, { needed }] of usage) {
    if (needed > 0) {
      await conn.query("UPDATE inventory SET quantity = quantity + ? WHERE id = ?", [needed, inventoryId]);
    }
  }
}
