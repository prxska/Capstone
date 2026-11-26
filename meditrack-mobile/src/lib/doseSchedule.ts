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
