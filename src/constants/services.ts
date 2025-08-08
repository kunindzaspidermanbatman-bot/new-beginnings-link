export const SERVICE_CATALOG = [
  'PC Gaming',
  'PlayStation 5',
  'Billiards',
  'Table Tennis',
] as const;

export type ServiceType = typeof SERVICE_CATALOG[number];

export const PER_TABLE_SERVICES: readonly ServiceType[] = ['PC Gaming', 'Billiards'];
export const isPerTableService = (type?: string): boolean =>
  !!type && (PER_TABLE_SERVICES as readonly string[]).includes(type);
