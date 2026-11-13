import { ForbiddenException } from '@nestjs/common';
import { ROLE } from '../roles/constants/role.constants';
import type { RoleName } from '../roles/constants/role.constants';

// Shared by private reads and mutations; callers keep action-specific errors.
// Permanent deletion is ADMIN-only and is enforced by its own caller check.
export function assertPostAccess(
  authorId: string,
  currentUserId: string,
  currentUserRole: RoleName,
  action: 'access' | 'update',
): void {
  if (authorId !== currentUserId && currentUserRole !== ROLE.ADMIN) {
    throw new ForbiddenException(
      `You do not have permission to ${action} this post.`,
    );
  }
}
