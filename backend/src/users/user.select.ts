import { Prisma } from '../generated/prisma/client';

export const userPublicSelect = {
  id: true,
  email: true,
  username: true,
  name: true,
  avatarUrl: true,
  emailVerified: true,
  createdAt: true,
  updatedAt: true,

  // Expose role information instead of internal roleId
  role: {
    select: {
      name: true,
    },
  },
} satisfies Prisma.UserSelect;

export const userAdminSelect = {
  ...userPublicSelect,
  disabledAt: true,
} satisfies Prisma.UserSelect;

// Avatar responses reuse the public projection without email verification.
export const avatarUserSelect = {
  id: true,
  email: true,
  username: true,
  name: true,
  avatarUrl: true,
  createdAt: true,
  updatedAt: true,
  role: {
    select: {
      name: true,
    },
  },
} satisfies Prisma.UserSelect;
