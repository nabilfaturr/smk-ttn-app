import { useState, useMemo } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronUp, ChevronDown, ChevronsUpDown, Search } from "lucide-react"

export type ColumnDef<T> = {
  key: string
  header: string
  sortable?: boolean
  render?: (row: T) => React.ReactNode
}

type DataTableProps<T> = {
  columns: ColumnDef<T>[]
  data: T[]
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  onAdd?: () => void
  extraActions?: (row: T) => React.ReactNode
  isLoading?: boolean
  searchPlaceholder?: string
  searchKeys?: string[]
  pageSize?: number
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  onEdit,
  onDelete,
  onAdd,
  extraActions,
  isLoading,
  searchPlaceholder = "Cari...",
  searchKeys,
  pageSize: pageSizeProp,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const pageSize = pageSizeProp ?? 15

  const filtered = useMemo(() => {
    if (!search.trim()) return data
    const q = search.toLowerCase()
    const keys = searchKeys ?? (columns.length > 0 ? [columns[0].key] : [])
    return data.filter((row) => keys.some((k) => String(row[k] ?? "").toLowerCase().includes(q)))
  }, [data, search, searchKeys, columns])

  const sorted = useMemo(() => {
    if (!sortKey) return filtered
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]
      if (aVal == null) return 1
      if (bVal == null) return -1
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return sortDir === "asc" ? cmp : -cmp
    })
  }, [filtered, sortKey, sortDir])

  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize)
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
    setPage(0)
  }

  function SortIcon({ columnKey }: { columnKey: string }) {
    if (sortKey !== columnKey) return <ChevronsUpDown className="ml-1 inline h-3 w-3" />
    return sortDir === "asc" ? (
      <ChevronUp className="ml-1 inline h-3 w-3" />
    ) : (
      <ChevronDown className="ml-1 inline h-3 w-3" />
    )
  }

  const hasActions = !!(onEdit || onDelete || extraActions)
  const actionColCount = columns.length + (hasActions ? 1 : 0)

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-10 animate-pulse rounded bg-gray-200" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded bg-gray-100" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(0)
            }}
            className="pl-8"
          />
        </div>
        {onAdd && (
          <Button onClick={onAdd} size="sm">
            + Tambah
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={col.sortable !== false ? "cursor-pointer select-none" : ""}
                  onClick={() => col.sortable !== false && toggleSort(col.key)}
                >
                  {col.header}
                  {col.sortable !== false && <SortIcon columnKey={col.key} />}
                </TableHead>
              ))}
              {hasActions && <TableHead className="w-36">Aksi</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={actionColCount} className="h-24 text-center text-muted-foreground">
                  Tidak ada data
                </TableCell>
              </TableRow>
            ) : (
              paged.map((row, i) => (
                <TableRow key={i}>
                  {columns.map((col) => (
                    <TableCell key={col.key}>
                      {col.render ? col.render(row) : row[col.key] ?? "-"}
                    </TableCell>
                  ))}
                  {hasActions && (
                    <TableCell className="space-x-1 whitespace-nowrap">
                      {onEdit && (
                        <Button variant="outline" size="sm" onClick={() => onEdit(row)}>
                          Edit
                        </Button>
                      )}
                      {onDelete && (
                        <Button variant="destructive" size="sm" onClick={() => onDelete(row)}>
                          Hapus
                        </Button>
                      )}
                      {extraActions?.(row)}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Menampilkan {sorted.length === 0 ? 0 : page * pageSize + 1}-
          {Math.min((page + 1) * pageSize, sorted.length)} dari {sorted.length}
        </span>
        {totalPages > 1 && (
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              Selanjutnya
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
