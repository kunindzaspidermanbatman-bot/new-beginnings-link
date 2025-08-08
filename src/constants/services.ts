export const SERVICE_CATALOG = [
  'PC Gaming',
  'PlayStation 5',
  'Billiards',
  'Table Tennis',
] as const;

export type ServiceType = typeof SERVICE_CATALOG[number];
