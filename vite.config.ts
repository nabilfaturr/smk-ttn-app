import { defineConfig, type Plugin } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import electron from "vite-plugin-electron"
import renderer from "vite-plugin-electron-renderer"
import path from "path"
import fs from "node:fs"

/**
 * Copy pdfkit/js/data → <outDir>/data
 *
 * pdfkit's bundled AFM font files live at `pdfkit/js/data/` and are loaded
 * at runtime via `fs.readFileSync(__dirname + '/data/Helvetica.afm', ...)`.
 * After Rollup bundles the main process, `__dirname` resolves ke
 * `dist-electron/`, sehingga font files harus ada di `dist-electron/data/`.
 *
 * Plugin ini di-trigger di `closeBundle` agar jalan setelah bundling
 * selesai — works for both dev (HMR rebuild) dan production build.
 */
function copyPdfkitFonts(): Plugin {
  return {
    name: "copy-pdfkit-fonts",
    apply: "build",
    closeBundle() {
      const outDir = (this as any).environment?.config?.build?.outDir ?? "dist-electron"
      const root = process.cwd()
      const srcDir = path.join(root, "node_modules/pdfkit/js/data")
      const destDir = path.join(root, outDir, "data")
      if (!fs.existsSync(srcDir)) {
        console.warn(`[copy-pdfkit-fonts] Source not found: ${srcDir}`)
        return
      }
      fs.mkdirSync(destDir, { recursive: true })
      const files = fs.readdirSync(srcDir)
      for (const file of files) {
        const src = path.join(srcDir, file)
        const dest = path.join(destDir, file)
        const stat = fs.statSync(src)
        if (stat.isFile()) {
          fs.copyFileSync(src, dest)
        }
      }
      console.log(`[copy-pdfkit-fonts] Copied ${files.length} files → ${destDir}`)
    },
  }
}

function copyRaporTemplate(): Plugin {
  return {
    name: "copy-rapor-template",
    apply: "build",
    closeBundle() {
      const outDir = (this as any).environment?.config?.build?.outDir ?? "dist-electron"
      const root = process.cwd()
      const src = path.join(root, "build/rapor-template.docx")
      const destDir = path.join(root, outDir)
      if (!fs.existsSync(src)) {
        console.warn(`[copy-rapor-template] Source not found: ${src}`)
        return
      }
      fs.mkdirSync(destDir, { recursive: true })
      fs.copyFileSync(src, path.join(destDir, "rapor-template.docx"))
      console.log(`[copy-rapor-template] Copied rapor-template.docx → ${destDir}`)
    },
  }
}

export default defineConfig({
  server: {
    host: "127.0.0.1",
    strictPort: true,
  },
  plugins: [
    react(),
    tailwindcss(),
    electron([
      {
        entry: "electron/main.ts",
        vite: {
          build: {
            rollupOptions: {
              external: ["better-sqlite3"],
            },
          },
          plugins: [copyPdfkitFonts(), copyRaporTemplate()],
        },
      },
      {
        entry: "electron/preload.ts",
        onstart(args) {
          args.reload()
        },
      },
    ]),
    renderer(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
