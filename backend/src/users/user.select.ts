import { Prisma } from '../../generated/prisma/client';

export const userPublicSelect = {
  id: true,
  email: true,
  username: true,
  name: true,
  avatarUrl: true,
  emailVerified: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;