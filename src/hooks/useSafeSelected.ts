import { useEffect } from "react"

/**
 * Auto-clear `selected` kalau items sudah loaded tapi gak ada match.
 *
 * Fix bug: <SelectValue> render raw UUID sebagai display text kalau
 * `value` di-set tapi items ke-replace (mis. DB re-seed, stale state).
 *
 * Usage:
 *   const [selectedMapel, setSelectedMapel] = useState("")
 *   useSafeSelected(subjects, selectedMapel, setSelectedMapel)
 */
export function useSafeSelected<T extends { id: string | number }>(
  items: T[],
  selected: string,
  setSelected: (v: string) => void,
) {
  useEffect(() => {
    if (selected && items.length > 0 && !items.find((i) => String(i.id) === selected)) {
      setSelected("")
    }
  }, [items, selected, setSelected])
}
