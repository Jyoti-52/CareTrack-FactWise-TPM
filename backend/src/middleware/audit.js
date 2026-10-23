import { createId, store } from "../storage/jsonStore.js";

export async function audit(actor, action, resourceType, resourceId, details = {}) {
  await store.transaction((data) => {
    data.auditLogs.push({
      _id: createId(),
      actor: actor?._id || actor?.id || null,
      action,
      resourceType,
      resourceId: String(resourceId || ""),
      details,
      createdAt: new Date().toISOString(),
    });
  });
}
