// Fase 5: genera un PNG de QR por cada máquina, para imprimir y pegar en el
// gimnasio. Cada QR codifica el mismo `qr_code` que usa ScanPage/LogPage
// para identificar la máquina dentro de la app (ver decisión en
// .claude/CLAUDE.md: "El QR codifica el valor de machines.qr_code").
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
    await QRCode.toFile(filePath, machine.qrCode, {
      width: 512,
      margin: 2,
    })
    console.log(`✓ ${machine.name} (${machine.qrCode}) -> ${filePath}`)
  }

  console.log(`\n${machines.length} QR generados en ${outputDir}`)
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
