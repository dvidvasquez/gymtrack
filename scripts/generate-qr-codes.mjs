// Fase 5: genera un PNG de QR por cada máquina, para imprimir y pegar en el
// gimnasio. Cada QR codifica la URL de producción a `/log/:qrCode` (no el
// `qr_code` pelado) para que la cámara nativa del celular abra la app
// directo en esa máquina — ver decisión en .claude/CLAUDE.md ("El QR
// codifica el valor de machines.qr_code", actualizada para reflejar esto).
// El scanner propio de la app (`ScanPage`) también sabe leer este QR: extrae
// el pathname de la URL y navega ahí mismo dentro de la SPA.
//
// APP_URL está hardcodeado (mismo criterio que la lista de máquinas de
// abajo): es la URL real de producción en Vercel, no cambia seguido. Si el
// dominio cambia, actualizar acá y volver a correr el script.
//
// La lista de máquinas de abajo debe mantenerse en sync a mano con
// supabase/seed.sql — son las mismas 3 máquinas de prueba. Si la cantidad
// de máquinas reales crece más allá de un puñado, conviene que este script
// lea directamente de Supabase en vez de tener la lista harcodeada acá.
//
// Uso: npm run qr:generate

import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import QRCode from 'qrcode'

const APP_URL = 'https://gym-full-tracker.vercel.app'

const machines = [
  { name: 'Press de banca', qrCode: 'machine-press-banca' },
  { name: 'Prensa de piernas', qrCode: 'machine-prensa-piernas' },
  { name: 'Remo en polea', qrCode: 'machine-remo-polea' },
]

const outputDir = path.join(import.meta.dirname, 'output', 'qr-codes')

function slugify(name) {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

async function main() {
  await mkdir(outputDir, { recursive: true })

  for (const machine of machines) {
    const filePath = path.join(outputDir, `${slugify(machine.name)}.png`)
    const url = `${APP_URL}/log/${encodeURIComponent(machine.qrCode)}`
    await QRCode.toFile(filePath, url, {
      width: 512,
      margin: 2,
    })
    console.log(`✓ ${machine.name} (${url}) -> ${filePath}`)
  }

  console.log(`\n${machines.length} QR generados en ${outputDir}`)
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
