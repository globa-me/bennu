export const LOCAL_WORKSPACE_DB = "bennu.local-workspaces.v1";
export const LOCAL_WORKSPACE_STORE = "projects";
export const LOCAL_WORKSPACE_VERSION = 1;

export class LocalWorkspaceError extends Error {
  constructor(code, message, cause) {
    super(message, cause ? { cause } : undefined);
    this.name = "LocalWorkspaceError";
    this.code = code;
  }
}

function idbFrom(options = {}) {
  if (Object.prototype.hasOwnProperty.call(options, "indexedDB"))
    return options.indexedDB;
  return globalThis.indexedDB;
}

export function isLocalWorkspaceSupported(options = {}) {
  return Boolean(idbFrom(options)?.open);
}

function workspaceError(
  error,
  fallbackMessage = "Local workspace storage failed.",
) {
  if (error instanceof LocalWorkspaceError) return error;
  if (error?.name === "QuotaExceededError") {
    return new LocalWorkspaceError(
      "QUOTA_EXCEEDED",
      "There is not enough browser storage to save this project.",
      error,
    );
  }
  return new LocalWorkspaceError(
    "STORAGE_FAILED",
    error?.message || fallbackMessage,
    error,
  );
}

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error || new Error("IndexedDB request failed."));
  });
}

function openDatabase(options = {}) {
  const indexedDB = idbFrom(options);
  if (!indexedDB?.open) {
    return Promise.reject(
      new LocalWorkspaceError(
        "UNAVAILABLE",
        "Local project storage is unavailable in this browser.",
      ),
    );
  }

  return new Promise((resolve, reject) => {
    let request;
    try {
      request = indexedDB.open(LOCAL_WORKSPACE_DB, LOCAL_WORKSPACE_VERSION);
    } catch (error) {
      reject(workspaceError(error));
      return;
    }

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(LOCAL_WORKSPACE_STORE)) {
        const store = database.createObjectStore(LOCAL_WORKSPACE_STORE, {
          keyPath: "id",
        });
        store.createIndex("updatedAt", "updatedAt");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(workspaceError(request.error));
    request.onblocked = () =>
      reject(
        new LocalWorkspaceError(
          "BLOCKED",
          "Local project storage is blocked by another Bennu tab.",
        ),
      );
  });
}

async function withStore(mode, operation, options = {}) {
  const database = await openDatabase(options);
  try {
    return await new Promise((resolve, reject) => {
      let settled = false;
      let operationResult;
      const transaction = database.transaction(LOCAL_WORKSPACE_STORE, mode);
      const store = transaction.objectStore(LOCAL_WORKSPACE_STORE);

      transaction.oncomplete = () => {
        if (!settled) {
          settled = true;
          resolve(operationResult);
        }
      };
      transaction.onerror = () => {
        if (!settled) {
          settled = true;
          reject(workspaceError(transaction.error));
        }
      };
      transaction.onabort = transaction.onerror;

      try {
        const request = operation(store);
        if (request) {
          requestResult(request)
            .then((result) => {
              operationResult = result;
            })
            .catch((error) => {
              if (!settled) {
                settled = true;
                reject(workspaceError(error));
              }
            });
        }
      } catch (error) {
        settled = true;
        reject(workspaceError(error));
      }
    });
  } finally {
    database.close();
  }
}

function normalizeFiles(files) {
  if (files instanceof Map) return Array.from(files.entries());
  if (Array.isArray(files)) {
    return files.map((entry) =>
      Array.isArray(entry) ? entry : [entry.path, entry.blob ?? entry.file],
    );
  }
  if (files && typeof files === "object") return Object.entries(files);
  return [];
}

function normalizeBlob(value) {
  if (value instanceof Blob) return value;
  if (
    typeof value === "string" ||
    value instanceof ArrayBuffer ||
    ArrayBuffer.isView(value)
  ) {
    return new Blob([value]);
  }
  throw new LocalWorkspaceError(
    "INVALID_PROJECT",
    "Every local project file must contain Blob-compatible data.",
  );
}

function normalizeProject(project, now = Date.now()) {
  if (!project || typeof project !== "object") {
    throw new LocalWorkspaceError(
      "INVALID_PROJECT",
      "A local project object is required.",
    );
  }
  const id = String(project.id || "").trim();
  if (!id)
    throw new LocalWorkspaceError(
      "INVALID_PROJECT",
      "A local project id is required.",
    );

  const files = normalizeFiles(project.files).map(([path, value]) => {
    const safePath = String(path || "").trim();
    if (!safePath)
      throw new LocalWorkspaceError(
        "INVALID_PROJECT",
        "Local project file paths cannot be empty.",
      );
    return { path: safePath, blob: normalizeBlob(value) };
  });

  const createdAt = Number.isFinite(Number(project.createdAt))
    ? Number(project.createdAt)
    : now;
  return {
    schemaVersion: LOCAL_WORKSPACE_VERSION,
    id,
    name: String(project.name || project.label || id),
    activeHtmlPath: String(
      project.activeHtmlPath || project.htmlPath || "index.html",
    ),
    currentHtml:
      typeof project.currentHtml === "string" ? project.currentHtml : "",
    files,
    metadata:
      project.metadata && typeof project.metadata === "object"
        ? { ...project.metadata }
        : {},
    createdAt,
    updatedAt: now,
  };
}

function hydrateProject(record) {
  if (!record) return null;
  const files = new Map(
    (record.files || []).map(({ path, blob }) => [path, blob]),
  );
  return { ...record, files };
}

export async function saveLocalProject(project, options = {}) {
  const now = typeof options.now === "function" ? options.now() : Date.now();
  const record = normalizeProject(project, now);
  await withStore("readwrite", (store) => store.put(record), options);
  return hydrateProject(record);
}

export async function loadLocalProject(id, options = {}) {
  const record = await withStore(
    "readonly",
    (store) => store.get(String(id)),
    options,
  );
  return hydrateProject(record);
}

export async function deleteLocalProject(id, options = {}) {
  await withStore("readwrite", (store) => store.delete(String(id)), options);
  return true;
}

export async function clearLocalProjects(options = {}) {
  await withStore("readwrite", (store) => store.clear(), options);
  return true;
}

export async function listLocalProjects(options = {}) {
  const records = await withStore(
    "readonly",
    (store) => store.getAll(),
    options,
  );
  return (records || [])
    .map(hydrateProject)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getStorageEstimate(
  storage = globalThis.navigator?.storage,
) {
  if (!storage?.estimate) {
    return {
      supported: false,
      usage: 0,
      quota: 0,
      percentUsed: 0,
      usageDetails: {},
    };
  }
  try {
    const estimate = await storage.estimate();
    const usage = Number(estimate?.usage) || 0;
    const quota = Number(estimate?.quota) || 0;
    return {
      supported: true,
      usage,
      quota,
      percentUsed: quota ? Math.min(100, (usage / quota) * 100) : 0,
      usageDetails: estimate?.usageDetails || {},
    };
  } catch (error) {
    return {
      supported: true,
      usage: 0,
      quota: 0,
      percentUsed: 0,
      usageDetails: {},
      error: workspaceError(error),
    };
  }
}

export async function requestPersistentStorage(
  storage = globalThis.navigator?.storage,
) {
  if (!storage?.persist) return false;
  try {
    return Boolean(await storage.persist());
  } catch {
    return false;
  }
}

export async function isPersistentStorage(
  storage = globalThis.navigator?.storage,
) {
  if (!storage?.persisted) return false;
  try {
    return Boolean(await storage.persisted());
  } catch {
    return false;
  }
}
