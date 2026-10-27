export function calculateDoseTimes(startTime: string, intervalHours: number): string[] {
  const [hourStr, minuteStr] = (startTime || '08:00').split(':');
  let startHour = parseInt(hourStr, 10);
  const startMin = minuteStr || '00';
  if (isNaN(startHour)) startHour = 8;

  const times: string[] = [];
  const dosesPerDay = Math.floor(24 / intervalHours);

  for (let i = 0; i < dosesPerDay; i++) {
    const currentHour = (startHour + i * intervalHours) % 24;
    times.push(`${String(currentHour).padStart(2, '0')}:${startMin}`);
  }
  return times;
}

// "Cada 8 hrs", "Una al día (24 hrs)" o una frecuencia personalizada "Cada N hrs"
export function getIntervalHours(frequency: string): number {
  const match = /(\d+)\s*hrs/.exec(frequency || '');
  const hours = match ? parseInt(match[1], 10) : 24;
  return hours > 0 ? hours : 24;
}

const UNIT_NAMES: Record<string, [string, string]> = {
  comp: ['pastilla', 'pastillas'],
  gotas: ['gota', 'gotas'],
  ml: ['ml', 'ml'],
  mg: ['mg', 'mg'],
};

// "1 comp" -> "1 pastilla", "3 gotas" -> "3 gotas"
export function formatDose(dose: string): string {
  const [amount = '', unit = ''] = (dose || '').trim().split(/\s+/);
  const names = UNIT_NAMES[unit];
  if (!names) return (dose || '').trim();
  return `${amount} ${amount === '1' ? names[0] : names[1]}`;
}

export const LOW_STOCK_DAYS = 3;

// "1 comp" -> 1, "2,5 ml" -> 2.5
export function parseDoseAmount(dose: string): number {
  const amount = parseFloat(String(dose || '').trim().split(/\s+/)[0]?.replace(',', '.'));
  return Number.isFinite(amount) && amount > 0 ? amount : 1;
}

export function getDoseUnit(dose: string): string {
  return String(dose || '').trim().split(/\s+/)[1] || 'comp';
}

/** Días que alcanza el stock con la dosis y frecuencia de la receta, o null si no se controla. */
export function getStockDaysLeft(recipe: { stock?: number | null; dose?: string; frequency?: string; time?: string }) {
  if (recipe.stock == null) return null;
  const dosesPerDay = calculateDoseTimes(recipe.time || '08:00', getIntervalHours(recipe.frequency || '')).length || 1;
  return Math.floor(recipe.stock / (parseDoseAmount(recipe.dose || '') * dosesPerDay));
}

// 4 + "1 comp" -> "4 pastillas"
export function formatStock(stock: number, dose: string) {
  const rounded = Math.round(stock * 100) / 100;
  return formatDose(`${String(rounded).replace('.', ',')} ${getDoseUnit(dose)}`);
}
