import { describe, expect, it } from "vitest";

import { type AccountPurge, purgeAccount } from "./account";

/** Records the order of the calls so the ordering rule can be asserted. */
function fakePurge(overrides: Partial<AccountPurge> = {}) {
  const calls: string[] = [];
  const purge: AccountPurge = {
    documentPaths: async () => {
      calls.push("documentPaths");
      return ["uid/1/a.pdf", "uid/2/b.jpg"];
    },
    removeFiles: async (paths) => {
      calls.push(`removeFiles(${paths.join(",")})`);
    },
    deleteAuthIdentity: async () => {
      calls.push("deleteAuthIdentity");
    },
    ...overrides,
  };
  return { purge, calls };
}

describe("purgeAccount", () => {
  it("removes the User's Document files before deleting the Auth Identity", async () => {
    const { purge, calls } = fakePurge();

    await purgeAccount(purge, "uid");

    expect(calls).toEqual([
      "documentPaths",
      "removeFiles(uid/1/a.pdf,uid/2/b.jpg)",
      "deleteAuthIdentity",
    ]);
  });

  it("deletes the Auth Identity of a User with no Documents", async () => {
    const { purge, calls } = fakePurge({ documentPaths: async () => [] });

    await purgeAccount(purge, "uid");

    expect(calls).toEqual(["deleteAuthIdentity"]);
  });

  it("keeps the Auth Identity when Storage removal fails, so the User can retry", async () => {
    const { purge, calls } = fakePurge({
      removeFiles: async () => {
        throw new Error("storage down");
      },
    });

    await expect(purgeAccount(purge, "uid")).rejects.toThrow("storage down");
    expect(calls).not.toContain("deleteAuthIdentity");
  });
});
