import { useCallback, useState } from 'react'
import type { WeightUnit } from '../types/domain'

const STORAGE_KEY = 'gymtrack.weightUnit'
const DEFAULT_UNIT: WeightUnit = 'kg'

// localStorage puede no estar disponible (modo privado, datos del sitio
// bloqueados): en ese caso se usa kg y no se recuerda nada, sin romper.
function readStoredUnit(): WeightUnit {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'kg' || stored === 'lb' ? stored : DEFAULT_UNIT
  } catch {
    return DEFAULT_UNIT
  }
}

// Unidad en la que el usuario ingresa el peso de un registro, recordada por
// dispositivo (es una preferencia de comodidad, no un dato del usuario: no
// va a Supabase). Se recuerda apenas se elige, no recién al guardar.
export function useWeightUnit(): [WeightUnit, (unit: WeightUnit) => void] {
  const [unit, setUnitState] = useState<WeightUnit>(readStoredUnit)

  const setUnit = useCallback((next: WeightUnit) => {
    setUnitState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Sin almacenamiento disponible: la elección vale solo para este registro.
    }
  }, [])

  return [unit, setUnit]
}
