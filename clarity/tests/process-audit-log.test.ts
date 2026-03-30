import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const wallet1 = accounts.get("wallet_1")!;

describe("process-audit-log", () => {
  it("logs process steps and approvals", () => {
    const step = simnet.callPublicFn(
      "process-audit-log",
      "log-step",
      [
        Cl.stringAscii("wf-001"),
        Cl.stringAscii("build"),
        Cl.stringUtf8("Build pipeline started"),
      ],
      wallet1
    );

    const approval = simnet.callPublicFn(
      "process-audit-log",
      "log-approval",
      [
        Cl.stringAscii("wf-001"),
        Cl.stringAscii("security-review"),
        Cl.stringAscii("approved"),
        Cl.stringUtf8("No critical findings"),
      ],
      wallet1
    );

    expect(step.result).toBeOk(Cl.bool(true));
    expect(approval.result).toBeOk(Cl.bool(true));
  });

  it("logs status changes and references", () => {
    const statusChange = simnet.callPublicFn(
      "process-audit-log",
      "log-status-change",
      [
        Cl.stringAscii("wf-001"),
        Cl.stringAscii("pending"),
        Cl.stringAscii("in-progress"),
      ],
      wallet1
    );

    const reference = simnet.callPublicFn(
      "process-audit-log",
      "attach-reference",
      [
        Cl.stringAscii("wf-001"),
        Cl.stringAscii("ticket"),
        Cl.stringUtf8("JIRA-1042"),
      ],
      wallet1
    );

    expect(statusChange.result).toBeOk(Cl.bool(true));
    expect(reference.result).toBeOk(Cl.bool(true));
  });

  it("exposes contract metadata", () => {
    const info = simnet.callReadOnlyFn(
      "process-audit-log",
      "get-contract-info",
      [],
      wallet1
    );

    expect(info.result).toBeOk(
      Cl.tuple({
        contract: Cl.stringAscii("process-audit-log"),
        version: Cl.stringAscii("1.0.0"),
        stateless: Cl.bool(true),
      })
    );
  });
});
