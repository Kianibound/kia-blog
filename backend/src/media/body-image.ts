import { BadRequestException, ForbiddenException } from '@nestjs/common';
import type { PrismaService } from '../database/prisma.service';
import { ROLE, type RoleName } from '../roles/constants/role.constants';
import { Prisma } from '../generated/prisma/client';

export function rethrowMediaReferenceError(error: unknown): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    ['P2003', 'P2025'].includes(error.code)
  )
    throw new BadRequestException(
      'Referenced image or relation is no longer available.',
    );
  throw error;
}

// Called only on already validated canonical documents, never legacy strings.
export function documentMediaIds(document: unknown): string[] {
  const ids = new Set<string>();
  const visit = (node: unknown) => {
    if (!node || typeof node !== 'object') return;
    const value = node as {
      type?: string;
      attrs?: { mediaId?: string };
      content?: unknown[];
    };
    if (value.type === 'image' && value.attrs?.mediaId)
      ids.add(value.attrs.mediaId);
    value.content?.forEach(visit);
  };
  visit(document);
  return [...ids];
}

const safeImageUrl = (input: string) => {
  try {
    const url = new URL(input);
    return (
      url.protocol === 'https:' &&
      url.hostname === 'res.cloudinary.com' &&
      !url.username &&
      !url.password &&
      !url.port &&
      !url.search &&
      !url.hash &&
      /^\/[^/]+\/image\/upload\//.test(url.pathname)
    );
  } catch {
    return false;
  }
};

export async function resolveDocumentMedia(
  prisma: PrismaService,
  document: unknown,
  authorization?: { authorId: string; role: RoleName },
) {
  const ids = documentMediaIds(document);
  if (!ids.length) return [];
  const media = await prisma.media.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      url: true,
      width: true,
      height: true,
      ownerId: true,
      resourceType: true,
      format: true,
      bytes: true,
    },
  });
  return ids.map((id) => {
    const item = media.find((entry) => entry.id === id);
    if (
      !item ||
      item.resourceType !== 'image' ||
      !['jpg', 'jpeg', 'png', 'webp'].includes(item.format) ||
      !Number.isInteger(item.bytes) ||
      item.bytes <= 0 ||
      item.bytes >= 5 * 1024 * 1024 ||
      !safeImageUrl(item.url)
    )
      throw new BadRequestException(
        'Referenced image is unavailable or unsupported.',
      );
    if (
      authorization &&
      authorization.role !== ROLE.ADMIN &&
      item.ownerId !== authorization.authorId
    )
      throw new ForbiddenException('You cannot attach this media.');
    return {
      id: item.id,
      url: item.url,
      width: item.width,
      height: item.height,
    };
  });
}

export async function presentPostsWithMedia<
  T extends { contentDocument?: unknown },
>(prisma: PrismaService, posts: T[]) {
  // Resolve the whole page once; retain each post's unique document order.
  const media = await resolveDocumentMedia(prisma, {
    content: posts.map((post) => post.contentDocument),
  });
  const byId = new Map(media.map((item) => [item.id, item]));
  return posts.map((post) => ({
    ...post,
    contentMedia: documentMediaIds(post.contentDocument).map((id) =>
      byId.get(id)!,
    ),
  }));
}
