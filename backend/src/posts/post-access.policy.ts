import { ForbiddenException } from '@nestjs/common';
import { ROLE } from '../roles/constants/role.constants';
import type { RoleName } from '../roles/constants/role.constants';

// Shared by private reads and mutations; callers keep action-specific errors.
export function assertPostAccess(
  authorId: string,
  currentUserId: string,
  currentUserRole: RoleName,
  action: 'access' | 'update' | 'delete',
): void {
  if (authorId !== currentUserId && currentUserRole !== ROLE.ADMIN) {
    throw new ForbiddenException(
      `You do not have permission to ${action} this post.`,
    );
  }
}
