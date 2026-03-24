import { describe, expect, it } from "vitest";
import {
  buildRuntimeLifecycleItems,
  getApprovalTtlMeta,
  getRuntimeLifecycleStep,
  resolveApproveBindings,
} from "../../src/pages/control-plane-admin/sections/QueueSection.jsx";

describe("QueueSection runtime lifecycle", () => {
  it("maps runtime statuses to flow step index", () => {
    expect(getRuntimeLifecycleStep("pending_review")).toBe(0);
    expect(getRuntimeLifecycleStep("approved")).toBe(1);
    expect(getRuntimeLifecycleStep("issued")).toBe(2);
    expect(getRuntimeLifecycleStep("installed")).toBe(3);
    expect(getRuntimeLifecycleStep("rejected")).toBe(0);
    expect(getRuntimeLifecycleStep("unknown")).toBe(0);
  });

  it("builds lifecycle items with timestamps and review state", () => {
    const row = {
      status: "approved",
      created_at: "2026-03-24T10:00:00Z",
      reviewed_at: "2026-03-24T10:05:00Z",
      issued_at: null,
      installed_at: null,
    };

    const items = buildRuntimeLifecycleItems(row);
    expect(items).toHaveLength(4);
    expect(items[0].title).toBe("Pending review");
    expect(items[0].description).toContain("2026-03-24");
    expect(items[1].title).toBe("Approved");
    expect(items[1].description).toContain("2026-03-24");
    expect(items[2].description).toContain("not issued");
    expect(items[3].description).toContain("not received");
  });

  it("computes approval TTL warning and expired states", () => {
    const now = new Date("2026-03-24T12:00:00Z");

    const warning = getApprovalTtlMeta(
      {
        status: "approved",
        reviewed_at: "2026-03-21T12:30:00Z",
      },
      now,
    );
    expect(warning?.level).toBe("warning");

    const expired = getApprovalTtlMeta(
      {
        status: "approved",
        reviewed_at: "2026-03-21T11:00:00Z",
      },
      now,
    );
    expect(expired?.level).toBe("expired");

    const notApplicable = getApprovalTtlMeta(
      {
        status: "pending_review",
        reviewed_at: "2026-03-21T11:00:00Z",
      },
      now,
    );
    expect(notApplicable).toBeNull();
  });

  it("resolves approve bindings from selected maps and falls back to row links", () => {
    const row = { id: 25, deployment: 7, subscription: 9 };
    const direct = resolveApproveBindings(row, {}, {});
    expect(direct).toEqual({ deploymentId: 7, subscriptionId: 9 });

    const mapped = resolveApproveBindings(
      row,
      { 25: "11" },
      { 25: "13" },
    );
    expect(mapped).toEqual({ deploymentId: 11, subscriptionId: 13 });
  });
});
