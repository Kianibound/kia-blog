import "server-only";
import { readAuthenticated } from "../session/server.ts";
import { UnauthenticatedError } from "../session/errors.ts";
import {
  inventoryPath,
  parseAdminInventory,
  parseAuthorInventory,
  type AdminInventory,
  type OwnPostStatusFilter,
  type OwnPosts,
} from "../own-posts-contract.ts";

export type InventoryResult =
  | { status: "success"; role: "AUTHOR"; posts: OwnPosts }
  | { status: "success"; role: "ADMIN"; posts: AdminInventory }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "unavailable" };

export async function loadInventory(input: {
  role: "AUTHOR" | "ADMIN";
  page: number;
  status?: OwnPostStatusFilter;
  authorId: string;
}): Promise<InventoryResult> {
  try {
    const result = await readAuthenticated(async ({ read }) => {
      const response = await read(
        inventoryPath(input.role, input.page, input.status),
      );
      if (response.status === 403) return { status: "forbidden" } as const;
      if (!response.ok) return { status: "unavailable" } as const;
      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        return { status: "unavailable" } as const;
      }
      try {
        return input.role === "ADMIN"
          ? {
              status: "success",
              role: "ADMIN",
              posts: parseAdminInventory(payload, input.page, 10),
            } as const
          : {
              status: "success",
              role: "AUTHOR",
              posts: parseAuthorInventory(
                payload,
                input.page,
                10,
                input.authorId,
              ),
            } as const;
      } catch {
        return { status: "unavailable" } as const;
      }
    });
    return result ?? { status: "unauthenticated" };
  } catch (error) {
    return error instanceof UnauthenticatedError
      ? { status: "unauthenticated" }
      : { status: "unavailable" };
  }
}
