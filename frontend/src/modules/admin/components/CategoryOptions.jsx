import { CATEGORY_GROUPS, groupOf } from '../../../utils/categoryGroups';

/**
 * <option>s for a category <select>, grouped under their section (Dry Fruits, Metals, ...)
 * so categories are never mixed together. Pass `only` to show a single section.
 * `getValue` picks what each option's value is (slug by default).
 */
export default function CategoryOptions({ categories = [], only = 'all', getValue = (c) => c.slug || c.id || c._id }) {
  return CATEGORY_GROUPS.filter((g) => only === 'all' || only === g.id).map((g) => {
    const items = categories.filter((c) => groupOf(c) === g.id);
    if (items.length === 0) return null;
    return (
      <optgroup key={g.id} label={g.label}>
        {items.map((c) => (
          <option key={c.id || c.slug || c._id} value={getValue(c)}>{c.name}</option>
        ))}
      </optgroup>
    );
  });
}
