# Impact-X Smart Contracts

Clarity smart contracts for the Impact-X crowdfunding platform on Stacks blockchain.

## Contracts

### campaign-registry-v2.clar (Production)
Escrow-based crowdfunding contract with USDCx integration.

**Features:**
- Smart contract escrow for all donations
- Automatic refund mechanism if goal not met
- 5% platform fee on successful campaigns
- SIP-010 token integration (USDCx)
- Owner-only fund claims
- Metadata updates before deadline

**Deployed to Testnet:**
- Address: `STZ5Q1C2GVSMCWS9NWVDEKHNW04THC75SEGDHS74.campaign-registry-v2`
- TX: `65c74549326adb8b46a97989d5204132ef1f3aa43586be3c78cb1e5bba5d523d`

### campaign-registry.clar (Legacy)
Original contract with manual deposit registration. **Do not use** - has fraud vulnerability.

## Clarity Version

**Current Configuration:** Clarity 3 with Epoch 3.0

**Note:** Clarity 4 is available on Stacks mainnet (activated at Bitcoin block 923222). 
To upgrade to Clarity 4:
1. Update `clarity_version = 4` in `Clarinet.toml`
2. Update `epoch` to a compatible version (e.g., `3.0` or higher)
3. Run `clarinet check` to validate
4. Re-run deployment

## Development

### Prerequisites
- Clarinet 3.13.1+
- Node.js 18+

### Testing

```bash
npm install
npm test
```

### Deployment

```bash
clarinet deployments generate --testnet
clarinet deployments apply -p deployments/default.testnet-plan.yaml --low-cost
```

## Contract Functions

### Public Functions
- `create-campaign(ipfs-hash, goal, duration-blocks)` - Create new campaign
- `donate(campaign-id, amount, token)` - Deposit USDCx to escrow
- `claim-funds(campaign-id, token)` - Withdraw 95% (owner only, goal met)
- `request-refund(campaign-id, token)` - Get refund (goal not met + expired)
- `update-campaign-metadata(campaign-id, new-ipfs-hash)` - Update IPFS hash

### Read-Only Functions
- `get-campaign(id)` - Get campaign details
- `get-campaign-count()` - Total campaigns
- `get-donation(campaign-id, donor)` - Get donor's donation amount
- `get-backer-count(campaign-id)` - Number of backers
- `is-goal-met(campaign-id)` - Check if funding goal reached
- `can-claim(campaign-id)` - Check if owner can claim
- `can-refund(campaign-id)` - Check if refunds available

## Test Coverage

29 passing tests covering:
- Campaign creation & validation
- Escrow deposits
- Fund claiming with 5% fee
- Refund mechanism
- Edge cases & error handling
