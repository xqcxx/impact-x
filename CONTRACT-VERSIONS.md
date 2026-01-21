# Impact-X Smart Contract Versions

## Active Contract: V2 (campaign-registry-v2.clar)

**Use V2 for all new deployments and integrations.**

## Version Comparison

| Feature | V1 (campaign-registry.clar) | V2 (campaign-registry-v2.clar) |
|---------|----------------------------|--------------------------------|
| **Status** | ⚠️ DEPRECATED | ✅ ACTIVE |
| **Escrow Type** | Optimistic (manual registration) | True SIP-010 token escrow |
| **Platform Fee** | 5% (500 BPS) | 5% (500 BPS) |
| **Refunds** | Manual, no tracking | Automatic with refund tracking |
| **Donation Flow** | `register-deposit` (trust-based) | `donate` (token transfer) |
| **Security** | Moderate (relies on creator honesty) | High (trustless escrow) |

## V1 Details (DEPRECATED)

**File**: `contracts/contracts/campaign-registry.clar`

### Why V1 is Deprecated

V1 used an optimistic "register-deposit" pattern where:
1. Donors bridge funds to campaign creator's wallet
2. Creator manually calls `register-deposit` to track donations
3. No actual token escrow in the contract
4. Requires trust that creator will register donations honestly

**Key Functions**:
- `create-campaign` - Create campaign
- `register-deposit` - Manually register a donation (creator-only)
- `claim-funds` - Claim funds when goal met
- `update-campaign-metadata` - Update IPFS hash

**Issues**:
- No trustless escrow
- No automatic refunds
- Vulnerable to dishonest creators

## V2 Details (ACTIVE)

**File**: `contracts/contracts/campaign-registry-v2.clar`

### Improvements in V2

V2 implements true decentralized escrow:
1. Donors call `donate` which transfers USDCx to the contract
2. Tokens are held in contract escrow until campaign ends
3. If goal met: Creator can claim (5% fee deducted)
4. If goal NOT met: Donors can request full refund

**Key Functions**:
- `create-campaign` - Create campaign with IPFS metadata
- `donate` - Deposit USDCx into escrow (SIP-010 transfer)
- `claim-funds` - Claim when goal met (5% platform fee)
- `request-refund` - Get refund if campaign failed
- `update-campaign-metadata` - Update IPFS hash
- `get-donation` - Check individual donation amount

**Security Features**:
- SIP-010 fungible token trait for safe transfers
- Individual donation tracking for refunds
- Refund flag prevents double-refunds
- Platform fee calculation with basis points

### Contract Structure

```clarity
;; Campaign Data
{
  owner: principal,           // Campaign creator
  ipfs-hash: string-ascii,   // Metadata on IPFS
  goal: uint,                // Funding goal (micro-USDCx)
  raised: uint,              // Amount raised so far
  deadline: uint,            // Block height deadline
  claimed: bool,             // Whether funds claimed
  created-at: uint,          // Creation block
  refund-enabled: bool       // Whether refunds available
}

;; Donation Tracking
{
  campaign-id: uint,
  donor: principal,
  amount: uint,              // Donation amount
  refunded: bool             // Refund status
}
```

## Migration Guide

If you have V1 campaigns deployed:

1. **No automatic migration** - V1 and V2 are separate contracts
2. **New campaigns** - Deploy using V2 contract
3. **Existing V1 campaigns** - Can remain active but lack refund features
4. **Frontend** - Update contract address to V2 in `frontend/src/lib/stacks.ts`

## Deployment

### Testnet
```bash
cd contracts
clarinet check
clarinet deployments generate --testnet
clarinet deployments apply -p deployments/default.testnet-plan.yaml
```

### Update Frontend
After deploying V2, update the contract address:

**File**: `frontend/src/lib/stacks.ts`
```typescript
const CONTRACT_ADDRESS = 'YOUR_V2_DEPLOYED_ADDRESS';
const CONTRACT_NAME = 'campaign-registry-v2';
```

## Platform Fee: 5%

Both V1 and V2 now use a **5% platform fee** (500 basis points):
- Fee only charged on successful campaigns
- Deducted when creator calls `claim-funds`
- Accumulated fees can be withdrawn by contract owner

**Calculation**:
```clarity
(define-constant PLATFORM_FEE_BPS u500)
(define-constant BPS_DENOMINATOR u10000)

;; For $1000 raised:
;; Fee = (1000 * 500) / 10000 = $50
;; Payout = $950
```

## Questions?

For integration questions or contract details, see:
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
- [README.md](./README.md) - General project info
- [Clarity Docs](https://book.clarity-lang.org) - Clarity language reference
