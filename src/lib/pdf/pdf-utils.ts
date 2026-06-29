import PDFDocument from "pdfkit"
import path from "path"
import fs from "fs"
import { app } from "electron"

export function createPdfDocument() {
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    info: { Title: "Rapor SMK Taruna Tekno Nusantara" },
  })
  return doc
}

export function addKop(doc: PDFKit.PDFDocument, info: { nama: string; alamat: string; npsn: string; kepala_sekolah: string }) {
  doc.fontSize(14).font("Helvetica-Bold").text(info.nama, { align: "center" })
  doc.fontSize(9).font("Helvetica").text(info.alamat, { align: "center" })
  doc.fontSize(8).text(`NPSN: ${info.npsn}`, { align: "center" })
  doc.moveDown(0.5)
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke()
  doc.moveDown(1)
}

export function addSectionTitle(doc: PDFKit.PDFDocument, title: string) {
  doc.moveDown(0.5)
  doc.fontSize(11).font("Helvetica-Bold").text(title)
  doc.moveDown(0.3)
}

export function addTable(
  doc: PDFKit.PDFDocument,
  headers: string[],
  rows: (string | number | null)[][],
  options?: { fontSize?: number; columnWidths?: number[] },
) {
  const fontSize = options?.fontSize ?? 8
  const colW = options?.columnWidths ?? Array(headers.length).fill(445 / headers.length)
  const startX = 50
  let y = doc.y

  // Header
  doc.font("Helvetica-Bold").fontSize(fontSize)
  let x = startX
  for (let i = 0; i < headers.length; i++) {
    doc.text(headers[i], x + 2, y + 2, { width: colW[i] - 4, align: "left" })
    x += colW[i]
  }
  y += 16
  doc.moveTo(startX, y).lineTo(startX + 445, y).stroke()

  // Rows
  doc.font("Helvetica").fontSize(fontSize)
  for (const row of rows) {
    if (y > 750) {
      doc.addPage()
      y = 50
      // Re-draw header on new page
      doc.font("Helvetica-Bold").fontSize(fontSize)
      x = startX
      for (let i = 0; i < headers.length; i++) {
        doc.text(headers[i], x + 2, y + 2, { width: colW[i] - 4, align: "left" })
        x += colW[i]
      }
      y += 16
      doc.moveTo(startX, y).lineTo(startX + 445, y).stroke()
      doc.font("Helvetica").fontSize(fontSize)
    }

    x = startX
    for (let i = 0; i < row.length; i++) {
      const val = row[i] ?? "-"
      doc.text(String(val), x + 2, y + 2, { width: colW[i] - 4, align: "left" })
      x += colW[i]
    }
    y += 16
    doc.moveTo(startX, y).lineTo(startX + 445, y).stroke()
  }

  doc.y = y + 5
}

export function addText(doc: PDFKit.PDFDocument, text: string, opts?: { fontSize?: number; bold?: boolean; align?: "left" | "center" | "right" }) {
  doc.font(opts?.bold ? "Helvetica-Bold" : "Helvetica").fontSize(opts?.fontSize ?? 10)
  doc.text(text, { align: opts?.align ?? "left" })
  doc.moveDown(0.3)
}

export function addTtdLine(doc: PDFKit.PDFDocument, label: string, x: number) {
  doc.fontSize(8).font("Helvetica").text(label, x, doc.y + 20, { align: "center" })
  doc.moveTo(x, doc.y + 15).lineTo(x + 120, doc.y + 15).stroke()
  doc.moveDown(3)
}
