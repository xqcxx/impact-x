"use client";

import { useEffect, useMemo, useState } from "react";
import type { ClarityValue } from "@stacks/transactions";

type ActivityItem = {
  id: string;
  type: "step" | "approval" | "status" | "reference";
  summary: string;
  txId: string;
  at: string;
};

const DEFAULT_NETWORK = "testnet";

function txIdFromResult(result: { txid?: string; txId?: string }): string {
  return result.txid ?? result.txId ?? "unknown";
}

async function loadStacksConnect() {
  return import("@stacks/connect");
}

async function loadStacksTransactions() {
  return import("@stacks/transactions");
}

export default function Home() {
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [contract, setContract] = useState<string>(
    "ST000000000000000000002AMW42H.process-audit-log"
  );
  const [network, setNetwork] = useState<string>(DEFAULT_NETWORK);
  const [status, setStatus] = useState<string>("Ready");
  const [busy, setBusy] = useState<boolean>(false);
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  const [workflowId, setWorkflowId] = useState<string>("wf-001");
  const [stepName, setStepName] = useState<string>("build");
  const [stepDetails, setStepDetails] = useState<string>(
    "Build pipeline started"
  );
  const [approvalType, setApprovalType] = useState<string>("security-review");
  const [decision, setDecision] = useState<string>("approved");
  const [approvalNote, setApprovalNote] = useState<string>(
    "No critical findings"
  );
  const [fromStatus, setFromStatus] = useState<string>("pending");
  const [toStatus, setToStatus] = useState<string>("in-progress");
  const [refType, setRefType] = useState<string>("ticket");
  const [refId, setRefId] = useState<string>("JIRA-1042");

  useEffect(() => {
    (async () => {
      const { getLocalStorage, isConnected } = await loadStacksConnect();
      const cached = getLocalStorage();
      const stxAddress = cached?.addresses?.stx?.[0]?.address ?? "";

      if (isConnected() && stxAddress) {
        setWalletAddress(stxAddress);
        setStatus("Wallet connected.");
      }
    })();
  }, []);

  const shortAddress = useMemo(() => {
    if (!walletAddress) return "Not connected";
    return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
  }, [walletAddress]);

  async function refreshAddress() {
    const { getLocalStorage, request } = await loadStacksConnect();
    const data = getLocalStorage();
    const fromCache = data?.addresses?.stx?.[0]?.address;

    if (fromCache) {
      setWalletAddress(fromCache);
      return;
    }

    const response = await request("stx_getAddresses", { network });
    const first = response.addresses[0]?.address ?? "";
    setWalletAddress(first);
  }

  async function connectWallet() {
    try {
      setBusy(true);
      setStatus("Opening wallet selector...");
      const { connect } = await loadStacksConnect();
      await connect({ network });
      await refreshAddress();
      setStatus("Wallet connected.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setStatus(`Connect failed: ${message}`);
    } finally {
      setBusy(false);
    }
  }

  function disconnectWallet() {
    void (async () => {
      const { disconnect } = await loadStacksConnect();
      disconnect();
      setWalletAddress("");
      setStatus("Disconnected.");
    })();
  }

  async function callAudit(
    functionName: string,
    functionArgs: ClarityValue[],
    activityType: ActivityItem["type"],
    summary: string
  ) {
    if (!contract.includes(".")) {
      setStatus("Invalid contract format. Use: SP....contract-name");
      return;
    }

    try {
      setBusy(true);
      setStatus(`Sending ${functionName} transaction...`);
      const { request } = await loadStacksConnect();

      const tx = await request("stx_callContract", {
        contract: contract as `${string}.${string}`,
        functionName,
        functionArgs,
        network,
        sponsored: false,
      });

      const txId = txIdFromResult(tx);
      setActivity((prev) => [
        {
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          type: activityType,
          summary,
          txId,
          at: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
      setStatus(`Transaction submitted: ${txId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setStatus(`Transaction failed: ${message}`);
    } finally {
      setBusy(false);
    }
  }

  async function submitLogStep() {
    const { Cl } = await loadStacksTransactions();
    await callAudit(
      "log-step",
      [
        Cl.stringAscii(workflowId),
        Cl.stringAscii(stepName),
        Cl.stringUtf8(stepDetails),
      ],
      "step",
      `${workflowId} step ${stepName}`
    );
  }

  async function submitLogApproval() {
    const { Cl } = await loadStacksTransactions();
    await callAudit(
      "log-approval",
      [
        Cl.stringAscii(workflowId),
        Cl.stringAscii(approvalType),
        Cl.stringAscii(decision),
        Cl.stringUtf8(approvalNote),
      ],
      "approval",
      `${workflowId} approval ${decision}`
    );
  }

  async function submitStatusChange() {
    const { Cl } = await loadStacksTransactions();
    await callAudit(
      "log-status-change",
      [
        Cl.stringAscii(workflowId),
        Cl.stringAscii(fromStatus),
        Cl.stringAscii(toStatus),
      ],
      "status",
      `${workflowId} ${fromStatus} -> ${toStatus}`
    );
  }

  async function submitReference() {
    const { Cl } = await loadStacksTransactions();
    await callAudit(
      "attach-reference",
      [
        Cl.stringAscii(workflowId),
        Cl.stringAscii(refType),
        Cl.stringUtf8(refId),
      ],
      "reference",
      `${workflowId} ${refType} ${refId}`
    );
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-4 py-6 sm:px-6 md:py-10">
      <nav className="rise-in flex items-center justify-between rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--text-soft)]">AuditLedger</p>
        <div className="flex items-center gap-2 text-xs">
          <a href="#how-it-works" className="rounded-md border border-[var(--border)] px-3 py-1">How It Works</a>
          <a href="#live-console" className="rounded-md border border-[var(--border)] px-3 py-1">Console</a>
          <a href="#contact" className="rounded-md bg-[var(--brand)] px-3 py-1 text-white">Request Demo</a>
        </div>
      </nav>

      <header className="rise-in rounded-md border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_15px_40px_-28px_rgba(43,30,20,0.4)]">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--text-soft)]">Registry of Proceedings</p>
        <h1 className="mt-3 text-4xl leading-tight md:text-5xl">Process Audit Ledger</h1>
        <p className="mt-4 max-w-3xl text-sm text-[var(--text-soft)] md:text-base">
          Preserve workflow evidence in immutable on-chain records. Built for compliance, quality systems,
          and teams that need tamper-resistant process visibility.
        </p>
      </header>

      <section id="how-it-works" className="rise-in mt-6 grid gap-4 [animation-delay:70ms] md:grid-cols-3">
        <article className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="font-mono text-xs uppercase tracking-wide text-[var(--text-soft)]">How It Works</p>
          <h2 className="mt-2 text-lg">1) Define workflow context</h2>
          <p className="mt-2 text-sm text-[var(--text-soft)]">Set a workflow ID and classify each procedural action.</p>
        </article>
        <article className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="font-mono text-xs uppercase tracking-wide text-[var(--text-soft)]">How It Works</p>
          <h2 className="mt-2 text-lg">2) Record steps on-chain</h2>
          <p className="mt-2 text-sm text-[var(--text-soft)]">Submit step, approval, status, and reference events as immutable entries.</p>
        </article>
        <article className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="font-mono text-xs uppercase tracking-wide text-[var(--text-soft)]">How It Works</p>
          <h2 className="mt-2 text-lg">3) Audit from one timeline</h2>
          <p className="mt-2 text-sm text-[var(--text-soft)]">Use transaction history to reconstruct evidence during audits or incidents.</p>
        </article>
      </section>

      <section className="rise-in mt-4 rounded-md border border-[var(--border)] bg-[var(--surface)] p-5 [animation-delay:95ms]">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <p className="font-mono text-xs uppercase tracking-wide text-[var(--text-soft)]">Ideal For</p>
            <p className="mt-2 text-sm">SOP compliance, approvals, handoffs, postmortem evidence.</p>
          </div>
          <div className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <p className="font-mono text-xs uppercase tracking-wide text-[var(--text-soft)]">Contract Pattern</p>
            <p className="mt-2 text-sm">Event-first stateless methods designed for reliable repeat calls.</p>
          </div>
          <div className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <p className="font-mono text-xs uppercase tracking-wide text-[var(--text-soft)]">Current Session</p>
            <p className="mt-2 text-sm">Wallet: {shortAddress}. Network: {network}. Entries: {activity.length}.</p>
          </div>
        </div>
      </section>

      <section className="rise-in mt-4 grid gap-4 [animation-delay:112ms] md:grid-cols-3">
        <article className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="font-mono text-xs uppercase tracking-wide text-[var(--text-soft)]">Assurance</p>
          <h3 className="mt-2 text-lg">Audit-ready evidence trail</h3>
          <p className="mt-2 text-sm text-[var(--text-soft)]">Every submission is immutable and timestamped by transaction lifecycle.</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-[var(--border)] px-2 py-1">Immutable logs</span>
            <span className="rounded-full border border-[var(--border)] px-2 py-1">Chain-anchored</span>
            <span className="rounded-full border border-[var(--border)] px-2 py-1">Tamper-resistant</span>
          </div>
        </article>
        <article className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="font-mono text-xs uppercase tracking-wide text-[var(--text-soft)]">Integrations</p>
          <h3 className="mt-2 text-lg">Fits compliance workflows</h3>
          <p className="mt-2 text-sm text-[var(--text-soft)]">Mirror records into GRC tools, case systems, and internal evidence repositories.</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-[var(--border)] px-2 py-1">GRC Platforms</span>
            <span className="rounded-full border border-[var(--border)] px-2 py-1">Case Systems</span>
            <span className="rounded-full border border-[var(--border)] px-2 py-1">Data Lake</span>
          </div>
        </article>
        <article className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="font-mono text-xs uppercase tracking-wide text-[var(--text-soft)]">FAQ</p>
          <h3 className="mt-2 text-lg">Can we model different workflows?</h3>
          <p className="mt-2 text-sm text-[var(--text-soft)]">Yes. Use workflow IDs and reference types to represent any process taxonomy.</p>
          <h4 className="mt-3 text-sm font-semibold">Is this suitable for repeated automation?</h4>
          <p className="mt-1 text-sm text-[var(--text-soft)]">Yes. The emit-only pattern avoids state lockups from repeated calls.</p>
        </article>
      </section>

      <section className="rise-in mt-4 rounded-md border border-[var(--border)] bg-[var(--surface)] p-5 [animation-delay:118ms]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-wide text-[var(--text-soft)]">Get Started</p>
            <h2 className="mt-1 text-2xl">Create your first audit entry now</h2>
            <p className="mt-1 text-sm text-[var(--text-soft)]">Connect wallet, set workflow ID, and record a complete procedural sequence.</p>
          </div>
          <button
            type="button"
            onClick={connectWallet}
            disabled={busy}
            className="rounded-md bg-[var(--brand)] px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            Open Console
          </button>
        </div>
      </section>

      <section id="contact" className="rise-in mt-4 rounded-md border border-[var(--border)] bg-[var(--surface)] p-5 [animation-delay:119ms]">
        <h2 className="text-2xl">Request a Compliance Demo</h2>
        <p className="mt-1 text-sm text-[var(--text-soft)]">Tell us your audit or quality objective and we will map a recommended event taxonomy.</p>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          <input className="rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm" placeholder="Work email" />
          <input className="rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm" placeholder="Organization" />
          <input className="rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm" placeholder="Audit standard (e.g. SOC 2)" />
        </div>
        <button type="button" className="mt-3 rounded-md bg-[var(--brand)] px-4 py-2 text-sm text-white">Submit Interest</button>
      </section>

      <div id="live-console" className="mt-6 grid gap-5 lg:grid-cols-[2fr_1fr]">
        <section className="rise-in rounded-md border border-[var(--border)] bg-[var(--surface)] p-5 [animation-delay:120ms]">
          <h2 className="text-2xl">Live Console</h2>
          <p className="mt-1 text-sm text-[var(--text-soft)]">Use this interactive form to demonstrate end-to-end workflow logging.</p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block font-medium">Contract ID</span>
              <input value={contract} onChange={(event) => setContract(event.target.value)} className="w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 font-mono text-xs outline-none ring-[var(--ring)] focus:ring" />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium">Network</span>
              <select value={network} onChange={(event) => setNetwork(event.target.value)} className="w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 outline-none ring-[var(--ring)] focus:ring"><option value="testnet">testnet</option><option value="mainnet">mainnet</option><option value="devnet">devnet</option></select>
            </label>
            <label className="text-sm md:col-span-2">
              <span className="mb-1 block font-medium">Workflow ID</span>
              <input value={workflowId} onChange={(event) => setWorkflowId(event.target.value)} className="w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 font-mono text-sm outline-none ring-[var(--ring)] focus:ring" placeholder="workflow-id" />
            </label>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <article className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              <h3 className="text-lg">Log Step</h3>
              <div className="mt-3 grid gap-2">
                <input value={stepName} onChange={(event) => setStepName(event.target.value)} className="w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 font-mono text-sm" placeholder="step-name" />
                <input value={stepDetails} onChange={(event) => setStepDetails(event.target.value)} className="w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 font-mono text-sm" placeholder="details" />
              </div>
              <button type="button" onClick={submitLogStep} disabled={busy} className="mt-3 rounded-md bg-[var(--brand)] px-4 py-2 text-sm text-white disabled:opacity-60">Record `log-step`</button>
            </article>

            <article className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              <h3 className="text-lg">Log Approval</h3>
              <div className="mt-3 grid gap-2">
                <input value={approvalType} onChange={(event) => setApprovalType(event.target.value)} className="w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 font-mono text-sm" placeholder="approval-type" />
                <input value={decision} onChange={(event) => setDecision(event.target.value)} className="w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 font-mono text-sm" placeholder="decision" />
                <input value={approvalNote} onChange={(event) => setApprovalNote(event.target.value)} className="w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 font-mono text-sm" placeholder="note" />
              </div>
              <button type="button" onClick={submitLogApproval} disabled={busy} className="mt-3 rounded-md bg-[var(--brand)] px-4 py-2 text-sm text-white disabled:opacity-60">Record `log-approval`</button>
            </article>

            <article className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              <h3 className="text-lg">Status Change</h3>
              <div className="mt-3 grid gap-2">
                <input value={fromStatus} onChange={(event) => setFromStatus(event.target.value)} className="w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 font-mono text-sm" placeholder="from-status" />
                <input value={toStatus} onChange={(event) => setToStatus(event.target.value)} className="w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 font-mono text-sm" placeholder="to-status" />
              </div>
              <button type="button" onClick={submitStatusChange} disabled={busy} className="mt-3 rounded-md bg-[var(--accent)] px-4 py-2 text-sm text-white disabled:opacity-60">Record `log-status-change`</button>
            </article>

            <article className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              <h3 className="text-lg">Attach Reference</h3>
              <div className="mt-3 grid gap-2">
                <input value={refType} onChange={(event) => setRefType(event.target.value)} className="w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 font-mono text-sm" placeholder="ref-type" />
                <input value={refId} onChange={(event) => setRefId(event.target.value)} className="w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 font-mono text-sm" placeholder="ref-id" />
              </div>
              <button type="button" onClick={submitReference} disabled={busy} className="mt-3 rounded-md bg-[var(--brand)] px-4 py-2 text-sm text-white disabled:opacity-60">Record `attach-reference`</button>
            </article>
          </div>
        </section>

        <aside className="rise-in space-y-4 rounded-md border border-[var(--border)] bg-[var(--surface)] p-5 [animation-delay:150ms]">
          <div className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--text-soft)]">Witness</p>
            <p className="mt-2 font-mono text-sm">{shortAddress}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={connectWallet} disabled={busy} className="rounded-md bg-[var(--brand)] px-3 py-1.5 text-xs text-white disabled:opacity-60">Connect</button>
              <button type="button" onClick={disconnectWallet} className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs">Disconnect</button>
            </div>
          </div>

          <div className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--text-soft)]">Status</p>
            <p className="mt-2 text-sm text-[var(--text-soft)]">{status}</p>
          </div>

          <div className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base">Recent Entries</h2>
              <span className="font-mono text-xs text-[var(--text-soft)]">{activity.length}</span>
            </div>
            {activity.length === 0 ? (
              <p className="mt-2 text-sm text-[var(--text-soft)]">No records submitted.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {activity.slice(0, 6).map((item) => (
                  <li key={item.id} className="rounded-md border border-[var(--border)] bg-white px-2 py-2">
                    <p className="font-mono text-[11px] uppercase tracking-wide text-[var(--text-soft)]">{item.type} / {item.at}</p>
                    <p className="mt-0.5 text-xs">{item.summary}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>

      <footer className="mt-5 rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-4 text-xs text-[var(--text-soft)]">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <p>AuditLedger - immutable workflow evidence for compliance operations.</p>
          <div className="flex items-center gap-3">
            <span>Evidence-ready</span>
            <span>Policy-aligned</span>
            <span>Version 1.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
