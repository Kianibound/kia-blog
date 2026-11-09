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

type MediaRow = {
  id: string;
  url: string;
  width: number | null;
  height: number | null;
  ownerId: string;
  resourceType: string;
  format: string;
  bytes: number;
};

const isEligibleImage = (item: MediaRow | undefined): item is MediaRow =>
  !!item &&
  item.resourceType === 'image' &&
  ['jpg', 'jpeg', 'png', 'webp'].includes(item.format) &&
  Number.isInteger(item.bytes) &&
  item.bytes > 0 &&
  item.bytes < 5 * 1024 * 1024 &&
  safeImageUrl(item.url);

const assertAttachable = (
  item: MediaRow,
  authorization?: { authorId: string; role: RoleName },
) => {
  if (
    authorization &&
    authorization.role !== ROLE.ADMIN &&
    item.ownerId !== authorization.authorId
  )
    throw new ForbiddenException('You cannot attach this media.');
};

const mediaSelect = {
  id: true,
  url: true,
  width: true,
  height: true,
  ownerId: true,
  resourceType: true,
  format: true,
  bytes: true,
} as const;

const presentMedia = (item: MediaRow) => ({
  id: item.id,
  url: item.url,
  width: item.width,
  height: item.height,
});

const COVER_IMAGE_UNAVAILABLE =
  'Referenced cover image is unavailable or unsupported.';

const presentCoverImage = (item: MediaRow, alt?: string | null) => ({
  ...presentMedia(item),
  alt: alt ?? '',
});

export async function resolveDocumentMedia(
  prisma: PrismaService,
  document: unknown,
  authorization?: { authorId: string; role: RoleName },
) {
  const ids = documentMediaIds(document);
  if (!ids.length) return [];
  const media = await prisma.media.findMany({
    where: { id: { in: ids } },
    select: mediaSelect,
  });
  return ids.map((id) => {
    const item = media.find((entry) => entry.id === id);
    if (!isEligibleImage(item))
      throw new BadRequestException(
        'Referenced image is unavailable or unsupported.',
      );
    assertAttachable(item, authorization);
    return presentMedia(item);
  });
}

export async function resolveCoverImage(
  prisma: PrismaService,
  mediaId: string,
  authorization: { authorId: string; role: RoleName },
) {
  const item = await prisma.media.findUnique({
    where: { id: mediaId },
    select: mediaSelect,
  });
  const row = item ?? undefined;
  if (!isEligibleImage(row))
    throw new BadRequestException(COVER_IMAGE_UNAVAILABLE);
  assertAttachable(row, authorization);
  return presentMedia(row);
}

export async function resolvePostCover(
  prisma: PrismaService,
  mediaId: string | null | undefined,
  coverAlt?: string | null,
) {
  if (!mediaId) return null;
  const item = await prisma.media.findUnique({
    where: { id: mediaId },
    select: mediaSelect,
  });
  const row = item ?? undefined;
  if (!isEligibleImage(row))
    throw new BadRequestException(COVER_IMAGE_UNAVAILABLE);
  return presentCoverImage(row, coverAlt);
}

export async function presentPostsWithMedia<
  T extends {
    contentDocument?: unknown;
    coverMediaId?: string | null;
    coverAlt?: string | null;
  },
>(prisma: PrismaService, posts: T[]) {
  // Resolve the whole page once; retain each post's unique document order.
  const media = await resolveDocumentMedia(prisma, {
    content: posts.map((post) => post.contentDocument),
  });
  const byId = new Map(media.map((item) => [item.id, item]));
  const coverIds = [
    ...new Set(
      posts
        .map((post) => post.coverMediaId)
        .filter((id): id is string => typeof id === 'string'),
    ),
  ];
  const coverRows = coverIds.length
    ? await prisma.media.findMany({
        where: { id: { in: coverIds } },
        select: mediaSelect,
      })
    : [];
  const coverById = new Map(coverRows.map((item) => [item.id, item]));
  return posts.map((post) => {
    const { coverMediaId, coverAlt, ...responsePost } = post;
    let coverImage: {
      id: string;
      url: string;
      width: number | null;
      height: number | null;
      alt: string;
    } | null = null;
    if (coverMediaId) {
      const item = coverById.get(coverMediaId);
      if (!isEligibleImage(item))
        throw new BadRequestException(COVER_IMAGE_UNAVAILABLE);
      coverImage = presentCoverImage(item, coverAlt);
    }
    return {
      ...responsePost,
      contentMedia: documentMediaIds(responsePost.contentDocument).map((id) =>
        byId.get(id)!,
      ),
      coverImage,
    };
  });
}
