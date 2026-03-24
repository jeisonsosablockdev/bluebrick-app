import { beforeEach, describe, expect, it } from "vitest";

import {
  getFlowId,
  listPurchaseFlowEvents,
  recordPurchaseFlowEvent,
  withFlowIdHeader
} from "@/lib/purchase-flow-trace";

describe("lib/purchase-flow-trace flags", () => {
  beforeEach(() => {
    delete process.env.DATABASE_URL;
    delete process.env.PURCHASE_TRACE_ENABLED;
    delete process.env.PURCHASE_TRACE_ERRORS_ONLY;
  });

  it("disables tracing completely when PURCHASE_TRACE_ENABLED=false", async () => {
    process.env.PURCHASE_TRACE_ENABLED = "false";

    const flowId = getFlowId(null);
    expect(flowId).toBe("");

    await recordPurchaseFlowEvent({
      flowId: "flow-disabled",
      endpoint: "quote",
      phase: "request"
    });

    const events = await listPurchaseFlowEvents("flow-disabled");
    expect(events).toHaveLength(0);

    const response = withFlowIdHeader(new Response("ok"), "flow-disabled");
    expect(response.headers.get("x-flow-id")).toBeNull();
  });

  it("records only error events when PURCHASE_TRACE_ERRORS_ONLY=true", async () => {
    process.env.PURCHASE_TRACE_ENABLED = "true";
    process.env.PURCHASE_TRACE_ERRORS_ONLY = "true";

    await recordPurchaseFlowEvent({
      flowId: "flow-errors-only",
      endpoint: "prepare",
      phase: "request"
    });

    await recordPurchaseFlowEvent({
      flowId: "flow-errors-only",
      endpoint: "prepare",
      phase: "error",
      statusCode: 409,
      errorCode: "PRICE_CHANGED"
    });

    const events = await listPurchaseFlowEvents("flow-errors-only");
    expect(events).toHaveLength(1);
    expect(events[0]?.phase).toBe("error");
    expect(events[0]?.errorCode).toBe("PRICE_CHANGED");
  });
});
