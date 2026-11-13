import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';

export type TaxonomyKind = 'Category' | 'Tag';

/**
 * ADMIN-managed taxonomy names are trimmed before validation and persistence.
 * Whitespace-only input is rejected so a blank name can never create a record
 * or an empty slug. Non-string input is rejected defensively for direct callers.
 */
export function normalizeTaxonomyName(name: unknown): string {
  if (typeof name !== 'string')
    throw new BadRequestException('Name must be a string.');
  const trimmed = name.trim();
  if (!trimmed) throw new BadRequestException('Name cannot be blank.');
  return trimmed;
}

/**
 * The database unique index is the final arbiter for generated slug (and name)
 * collisions, so concurrent creates/renames fail safely instead of racing a
 * read-then-write check.
 */
export function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

/**
 * Deletion runs inside a serializable transaction (see the taxonomy services).
 * These mappings cover the remaining outcomes: the row disappearing mid-flight
 * and PostgreSQL aborting on a serialization conflict caused by a concurrent
 * reference insert. A serialization conflict is a 409 because the caller must
 * retry against the new state; it never means the row was silently detached.
 */
export function rethrowTaxonomyDeleteError(
  error: unknown,
  kind: TaxonomyKind,
): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2025')
      throw new NotFoundException(`${kind} not found.`);
    if (error.code === 'P2034')
      throw new ConflictException(
        `${kind} changes concurrently; retry the deletion.`,
      );
  }
  throw error;
}
