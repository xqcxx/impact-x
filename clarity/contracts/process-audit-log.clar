;; Process Audit Log
;; Immutable process logging for approvals, handoffs, and status updates.

(define-constant CONTRACT_NAME "process-audit-log")
(define-constant VERSION "1.0.0")

(define-public (log-step
    (workflow-id (string-ascii 40))
    (step-name (string-ascii 40))
    (details (string-utf8 240))
  )
  (begin
    (print {
      event: "step-logged",
      workflow: workflow-id,
      step: step-name,
      details: details,
      actor: tx-sender,
      burn-block: burn-block-height,
    })
    (ok true)
  )
)

(define-public (log-approval
    (workflow-id (string-ascii 40))
    (approval-type (string-ascii 40))
    (decision (string-ascii 16))
    (note (string-utf8 180))
  )
  (begin
    (print {
      event: "approval-logged",
      workflow: workflow-id,
      approval-type: approval-type,
      decision: decision,
      note: note,
      approver: tx-sender,
      burn-block: burn-block-height,
    })
    (ok true)
  )
)

(define-public (log-status-change
    (workflow-id (string-ascii 40))
    (from-status (string-ascii 24))
    (to-status (string-ascii 24))
  )
  (begin
    (print {
      event: "status-changed",
      workflow: workflow-id,
      from: from-status,
      to: to-status,
      actor: tx-sender,
      burn-block: burn-block-height,
    })
    (ok true)
  )
)

(define-public (attach-reference
    (workflow-id (string-ascii 40))
    (ref-type (string-ascii 24))
    (ref-id (string-utf8 120))
  )
  (begin
    (print {
      event: "reference-attached",
      workflow: workflow-id,
      ref-type: ref-type,
      ref-id: ref-id,
      actor: tx-sender,
      burn-block: burn-block-height,
    })
    (ok true)
  )
)

(define-read-only (get-contract-info)
  (ok {
    contract: CONTRACT_NAME,
    version: VERSION,
    stateless: true,
  })
)
