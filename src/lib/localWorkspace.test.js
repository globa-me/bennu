import { describe, expect, it } from "vitest";
import {
  LocalWorkspaceError,
  clearLocalProjects,
  deleteLocalProject,
  getStorageEstimate,
  isLocalWorkspaceSupported,
  isPersistentStorage,
  listLocalProjects,
  loadLocalProject,
  requestPersistentStorage,
  saveLocalProject,
} from "./localWorkspace.js";

function createRequest(run, transaction) {
  const request = { result: undefined, error: null, onsuccess: null, onerror: null };
  queueMicrotask(() => {
    try {
      request.result = run();
      request.onsuccess?.();
    } catch (error) {
      request.error = error;
      request.onerror?.();
    }
    queueMicrotask(() => transaction.finish(request.error));
  });
  return request;
}

function createFakeIndexedDB({ failPut = false } = {}) {
  const records = new Map();
  let initialized = false;
  const cloneRecord = (record) => record && ({
    ...record,
    metadata: { ...record.metadata },
    files: record.files.map((file) => ({ ...file })),
  });

  const database = {
    objectStoreNames: { contains: () => initialized },
    createObjectStore() {
      initialized = true;
      return { createIndex() {} };
    },
    transaction() {
      const transaction = {
        error: null,
        oncomplete: null,
        onerror: null,
        onabort: null,
        finish(error) {
          if (error) {
            this.error = error;
            this.onerror?.();
          } else {
            this.oncomplete?.();
          }
        },
        objectStore() {
          return {
            put(record) {
              return createRequest(() => {
                if (failPut) {
                  const error = new Error("full");
                  error.name = "QuotaExceededError";
                  throw error;
                }
                records.set(record.id, cloneRecord(record));
                return record.id;
              }, transaction);
            },
            get(id) {
              return createRequest(() => cloneRecord(records.get(id)), transaction);
            },
            getAll() {
              return createRequest(() => Array.from(records.values(), cloneRecord), transaction);
            },
            delete(id) {
              return createRequest(() => records.delete(id), transaction);
            },
            clear() {
              return createRequest(() => records.clear(), transaction);
            },
          };
        },
      };
      return transaction;
    },
    close() {},
  };

  return {
    open() {
      const request = {
        result: database,
        error: null,
        onupgradeneeded: null,
        onsuccess: null,
        onerror: null,
        onblocked: null,
      };
      queueMicrotask(() => {
        if (!initialized) request.onupgradeneeded?.();
        request.onsuccess?.();
      });
      return request;
    },
  };
}

describe("local workspaces", () => {
  it("reports unavailable IndexedDB with a stable error", async () => {
    expect(isLocalWorkspaceSupported({ indexedDB: null })).toBe(false);
    await expect(loadLocalProject("missing", { indexedDB: null })).rejects.toMatchObject({
      name: "LocalWorkspaceError",
      code: "UNAVAILABLE",
    });
  });

  it("saves and hydrates Blob maps without losing project metadata", async () => {
    const indexedDB = createFakeIndexedDB();
    const project = await saveLocalProject({
      id: "demo",
      name: "Demo site",
      activeHtmlPath: "pages/index.html",
      currentHtml: "<!doctype html><title>Edited</title>",
      files: new Map([
        ["pages/index.html", new Blob(["original"], { type: "text/html" })],
        ["assets/logo.svg", new Blob(["<svg/>"] , { type: "image/svg+xml" })],
      ]),
      metadata: { source: "zip", dirty: true },
      createdAt: 50,
    }, { indexedDB, now: () => 100 });

    expect(project.updatedAt).toBe(100);
    expect(project.files).toBeInstanceOf(Map);
    const restored = await loadLocalProject("demo", { indexedDB });
    expect(restored).toMatchObject({
      id: "demo",
      name: "Demo site",
      activeHtmlPath: "pages/index.html",
      currentHtml: "<!doctype html><title>Edited</title>",
      metadata: { source: "zip", dirty: true },
      createdAt: 50,
      updatedAt: 100,
    });
    expect(restored.files.get("assets/logo.svg")).toBeInstanceOf(Blob);
    expect(restored.files.get("assets/logo.svg").type).toBe("image/svg+xml");
  });

  it("lists newest projects first and supports delete and clear", async () => {
    const indexedDB = createFakeIndexedDB();
    await saveLocalProject({ id: "old", files: {} }, { indexedDB, now: () => 10 });
    await saveLocalProject({ id: "new", files: [{ path: "index.html", blob: "hello" }] }, { indexedDB, now: () => 20 });
    expect((await listLocalProjects({ indexedDB })).map(({ id }) => id)).toEqual(["new", "old"]);

    await deleteLocalProject("new", { indexedDB });
    expect(await loadLocalProject("new", { indexedDB })).toBeNull();
    await clearLocalProjects({ indexedDB });
    expect(await listLocalProjects({ indexedDB })).toEqual([]);
  });

  it("rejects invalid projects and identifies quota failures", async () => {
    await expect(saveLocalProject({ files: {} }, { indexedDB: createFakeIndexedDB() }))
      .rejects.toBeInstanceOf(LocalWorkspaceError);
    await expect(saveLocalProject({ id: "demo", files: {} }, { indexedDB: createFakeIndexedDB({ failPut: true }) }))
      .rejects.toMatchObject({ code: "QUOTA_EXCEEDED" });
  });

  it("wraps storage estimate and persistence capabilities safely", async () => {
    const storage = {
      estimate: async () => ({ usage: 250, quota: 1000, usageDetails: { indexedDB: 200 } }),
      persist: async () => true,
      persisted: async () => false,
    };
    expect(await getStorageEstimate(storage)).toEqual({
      supported: true,
      usage: 250,
      quota: 1000,
      percentUsed: 25,
      usageDetails: { indexedDB: 200 },
    });
    expect(await requestPersistentStorage(storage)).toBe(true);
    expect(await isPersistentStorage(storage)).toBe(false);
    expect(await getStorageEstimate(null)).toMatchObject({ supported: false });
    expect(await requestPersistentStorage({ persist: async () => { throw new Error("denied"); } })).toBe(false);
  });
});
