/**
 * VAT consistency utilities for supplier bills.
 *
 * Bill-level "Default VAT Category" is a default for new lines, not
 * authoritative truth — imported / dropship lines legitimately differ.
 */

const EXCLUDED_CHANNELS = new Set(["IMPORTED", "DROPSHIP"]);

/**
 * Return items eligible for VAT consistency checks.
 * Imported and dropship items are excluded because they follow
 * their own VAT rules (e.g. REVERSE_CHARGE).
 */
export function getVatConsistencyCandidates(items) {
  if (!Array.isArray(items)) return [];
  return items.filter((item) => !EXCLUDED_CHANNELS.has(String(item?.procurementChannel ?? "").toUpperCase()));
}

/**
 * Find line items whose VAT category differs from the bill-level default.
 *
 * Returns an array of `{ index, item, itemCategory, billCategory }` where
 * `index` is the item's position in the *original* `items` array.
 */
export function findVatMismatches(items, billVatCategory) {
  if (!billVatCategory) return [];
  if (!Array.isArray(items)) return [];

  const billCat = String(billVatCategory).toUpperCase();
  const candidates = new Set(getVatConsistencyCandidates(items));
  const mismatches = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!candidates.has(item)) continue;

    const itemCat = String(item?.vatCategory ?? "STANDARD").toUpperCase();
    if (itemCat !== billCat) {
      mismatches.push({
        index: i,
        item,
        itemCategory: itemCat,
        billCategory: billCat,
      });
    }
  }

  return mismatches;
}

/**
 * Derive a VAT summary grouped by category + rate.
 *
 * @param {Array} items         - Line items (need `vatCategory`, `vatRate`, `amount`, `vatAmount`)
 * @param {Array} vatCategories - Reference list with `{ value, label, rate }`
 * @returns {{ label: string, groups: Array, isMixed: boolean }}
 */
export function deriveVatSummary(items, vatCategories) {
  const empty = { label: "VAT", groups: [], isMixed: false };
  if (!Array.isArray(items) || !Array.isArray(vatCategories)) return empty;

  const catLookup = new Map(vatCategories.map((c) => [String(c.value).toUpperCase(), c]));

  const active = items.filter((item) => Number(item?.amount ?? 0) > 0 || Number(item?.vatAmount ?? 0) > 0);
  if (active.length === 0) return empty;

  const grouped = new Map();

  for (const item of active) {
    const cat = String(item?.vatCategory ?? "STANDARD").toUpperCase();
    const rate = Number(item?.vatRate ?? catLookup.get(cat)?.rate ?? 0);
    const key = `${cat}:${rate}`;

    if (!grouped.has(key)) {
      grouped.set(key, {
        category: cat,
        categoryLabel: catLookup.get(cat)?.label ?? cat,
        rate,
        count: 0,
        vatTotal: 0,
      });
    }

    const group = grouped.get(key);
    group.count += 1;
    group.vatTotal += Number(item?.vatAmount ?? 0);
  }

  const groups = [...grouped.values()].sort((a, b) => b.rate - a.rate);

  if (groups.length === 1) {
    return { label: `VAT (${groups[0].rate}%)`, groups, isMixed: false };
  }

  return { label: "VAT (Mixed)", groups, isMixed: true };
}

/**
 * Derive a consensus VAT category from linked GRN items.
 *
 * If all non-imported/dropship items agree, returns that category so
 * the bill form can pre-fill it.  Otherwise signals manual selection.
 */
export function deriveGrnVatConsensus(grnItems) {
  const none = { vatCategory: null, isConsensus: false, message: null };
  if (!Array.isArray(grnItems)) return none;

  const candidates = getVatConsistencyCandidates(grnItems);
  if (candidates.length === 0) return none;

  const unique = new Set(candidates.map((item) => String(item?.vatCategory ?? "STANDARD").toUpperCase()));

  if (unique.size === 1) {
    const [vatCategory] = unique;
    return { vatCategory, isConsensus: true, message: null };
  }

  return {
    vatCategory: null,
    isConsensus: false,
    message: "Linked items have mixed VAT categories. Please set the bill-level VAT category manually.",
  };
}
