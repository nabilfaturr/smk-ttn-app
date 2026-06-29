import { useState, useEffect } from "react"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { formatZodErrors } from "@/lib/utils/validation"

export type FieldConfig = {
  name: string
  label: string
  type: "text" | "number" | "date" | "select" | "radio" | "textarea"
  required?: boolean
  options?: { value: string; label: string }[]
  placeholder?: string
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  pattern?: { value: RegExp; message: string }
}

type FormDialogProps = {
  title: string
  description?: string
  fields: FieldConfig[]
  defaultValues?: Record<string, any>
  onSubmit: (values: Record<string, any>) => Promise<void>
  open: boolean
  onOpenChange: (open: boolean) => void
  isLoading?: boolean
  /**
   * Optional Zod schema. Jika diberikan, validasi menggunakan schema ini
   * (override validasi bawaan). Field name harus cocok dengan key di schema.
   */
  schema?: z.ZodTypeAny
  /**
   * Lebar dialog. Default = sm:max-w-lg (512px).
   * - "default": 512px
   * - "wide": 768px (untuk form dengan textarea panjang)
   * - "extra-wide": 896px
   */
  maxWidth?: "default" | "wide" | "extra-wide"
}

const MAX_WIDTH_CLASS: Record<NonNullable<FormDialogProps["maxWidth"]>, string> = {
  "default": "sm:max-w-lg",
  "wide": "sm:max-w-3xl",
  "extra-wide": "sm:max-w-4xl",
}

export function FormDialog({
  title,
  description,
  fields,
  defaultValues,
  onSubmit,
  open,
  onOpenChange,
  isLoading,
  schema,
  maxWidth = "default",
}: FormDialogProps) {
  const [values, setValues] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) {
      const initial: Record<string, any> = {}
      for (const f of fields) {
        initial[f.name] = defaultValues?.[f.name] ?? ""
      }
      setValues(initial)
      setErrors({})
    }
  }, [open, fields, defaultValues])

  function update(name: string, value: any) {
    setValues((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: "" }))
  }

  /**
   * Validasi: pakai Zod schema jika ada, fallback ke validasi bawaan.
   */
  function validate(): boolean {
    // Pakai Zod schema jika ada
    if (schema) {
      const result = schema.safeParse(values)
      if (result.success) {
        setErrors({})
        return true
      }
      setErrors(formatZodErrors(result.error))
      return false
    }

    // Fallback: validasi bawaan
    const errs: Record<string, string> = {}
    for (const f of fields) {
      const v = values[f.name]
      if (f.required && (v === "" || v == null)) {
        errs[f.name] = `${f.label} wajib diisi`
        continue
      }
      if (f.type === "number" && v !== "" && v != null) {
        const num = Number(v)
        if (isNaN(num)) {
          errs[f.name] = "Harus berupa angka"
          continue
        }
        if (f.min != null && num < f.min) errs[f.name] = `Minimal ${f.min}`
        if (f.max != null && num > f.max) errs[f.name] = `Maksimal ${f.max}`
      }
      if ((f.type === "text" || f.type === "textarea") && typeof v === "string") {
        if (f.minLength != null && v.length < f.minLength)
          errs[f.name] = `Minimal ${f.minLength} karakter`
        if (f.maxLength != null && v.length > f.maxLength)
          errs[f.name] = `Maksimal ${f.maxLength} karakter`
        if (f.pattern && !f.pattern.value.test(v))
          errs[f.name] = f.pattern.message
      }
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    const payload: Record<string, any> = {}
    for (const f of fields) {
      const val = values[f.name]
      // Konversi string kosong ke null untuk field optional non-required
      payload[f.name] =
        f.type === "number" && val !== "" && val != null
          ? Number(val)
          : val === "" && !f.required
            ? null
            : val
    }
    await onSubmit(payload)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`max-h-[90vh] overflow-y-auto ${MAX_WIDTH_CLASS[maxWidth]}`}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {fields.map((field) => (
            <div key={field.name} className="grid gap-2">
              <Label htmlFor={field.name}>
                {field.label}
                {field.required && <span className="ml-1 text-destructive">*</span>}
              </Label>

              {field.type === "textarea" ? (
                <Textarea
                  id={field.name}
                  value={values[field.name] ?? ""}
                  onChange={(e) => update(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  aria-invalid={!!errors[field.name]}
                  maxLength={field.maxLength}
                />
              ) : field.type === "select" ? (
                <Select
                  value={values[field.name] ?? ""}
                  onValueChange={(v) => update(field.name, v)}
                >
                  <SelectTrigger aria-invalid={!!errors[field.name]}>
                    <SelectValue>
                      {field.options?.find((o) => o.value === values[field.name])?.label ?? field.placeholder ?? `Pilih ${field.label}`}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : field.type === "radio" ? (
                <div className="flex flex-wrap gap-4">
                  {field.options?.map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name={field.name}
                        value={opt.value}
                        checked={values[field.name] === opt.value}
                        onChange={(e) => update(field.name, e.target.value)}
                        className="h-4 w-4"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              ) : (
                <Input
                  id={field.name}
                  type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                  value={values[field.name] ?? ""}
                  onChange={(e) => update(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  aria-invalid={!!errors[field.name]}
                  min={field.min}
                  max={field.max}
                  maxLength={field.maxLength}
                />
              )}

              {errors[field.name] && (
                <p className="text-xs text-destructive">{errors[field.name]}</p>
              )}
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
