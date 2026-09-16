export const ROLE = {
  USER: 'USER',
  AUTHOR: 'AUTHOR',
  ADMIN: 'ADMIN',
} as const;

export type RoleName = (typeof ROLE)[keyof typeof ROLE];

// Runtime check that narrows a string to RoleName
export function isRoleName(value: string): value is RoleName {
  return Object.values(ROLE).includes(value as RoleName);
}