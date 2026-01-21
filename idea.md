# Impact-X: Cross-Chain Crowdfunding for the Bitcoin Economy

> **Tagline:** Unlock Ethereum liquidity to fund the next generation of Bitcoin & Stacks builders.

## 1. Executive Summary
**Impact-X** is a decentralized crowdfunding platform that bridges the gap between Ethereum capital and Stacks innovation. It allows creators, startups, and community leaders on Stacks to launch fundraising campaigns that accept native **USDC (Ethereum)**.

Using Circle’s xReserve protocol, donations are programmatically bridged and deposited directly into a **Clarity Escrow Smart Contract**. This ensures funds are secure, transparent, and only released when campaign goals are met.

## 2. The Problem
*   **Liquidity Silos:** Most crypto wealth sits on Ethereum in stablecoins. Most Bitcoin innovation happens on Stacks. Bridging this gap usually requires manual swapping, which kills donation conversion rates.
*   **Diaspora Funding:** In regions like Nigeria, the Diaspora wants to fund local development (tech hubs, solar projects) but often holds assets on major chains like Ethereum/Base. They need a trustless way to ensure their funds actually reach the target project on the ground (Stacks/Bitcoin).

## 3. The Solution
Impact-X is a "Kickstarter" where the backend is a cross-chain bridge.

*   **For Creators:** Launch a campaign on Stacks. Accept funds from anyone with an Ethereum wallet.
*   **For Donors:** Donate in USDC without leaving your ecosystem. No manual bridging, no gas tokens on Stacks needed.
*   **For Trust:** Funds settle in a **Clarity Smart Contract**, not a personal wallet. This enables "Refund logic" (if goal not met) and "Milestone logic" (vesting).

## 4. How It Works (The "Bridge-to-Contract" Flow)
1.  **Donation:** User approves USDC on Ethereum -> Calls `depositForBurn`.
2.  **Routing:** The bridge transaction encodes the **Impact-X Smart Contract** as the destination.
3.  **Settlement:** Circle mints USDCx directly into the Contract.
4.  **Logic:** The contract detects the mint (via SIP-010 hook or polling) and updates the campaign status.

## 5. Product Potential
*   **Launchpad:** This can evolve into a launchpad for Stacks Tokens (ICOs) where users buy in with Eth-USDC.
*   **Grants:** Stacks Foundation or other DAOs can use this to accept cross-chain grant matching.
*   **Revenue:** Impact-X takes a **5% Success Fee** on fully funded campaigns.

## 6. Technical Stack
*   **Frontend:** Vite + React.
*   **Smart Contract:** Clarity (Stacks) for holding funds and managing campaign state.
*   **Bridge:** Circle CCTP (Eth -> Stacks).