# Stacks Process Audit Log

Standalone project for immutable process/compliance logging on Stacks.

## Layout

- `clarity/`: Clarinet contract project
- `frontend/`: Next.js frontend for wallet-based interactions

## Contract

- `clarity/contracts/process-audit-log.clar`
- Methods: `log-step`, `log-approval`, `log-status-change`, `attach-reference`

## Run

```bash
cd clarity
clarinet check
npm test
```

```bash
cd frontend
npm run dev
```
