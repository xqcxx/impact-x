/**
 * Gas Fee Estimation Documentation
 *
 * This module provides comprehensive gas/fee estimation for both Stacks and Ethereum networks.
 *
 * ## Features
 * - Real-time fee estimation for both networks
 * - Transaction type-specific estimates
 * - USD value conversion
 * - Gas speed selection (slow/standard/fast)
 * - Live gas price tracking
 * - Fee comparison between networks
 *
 * ## Components
 * - GasFeeDisplay: Show fee estimates in compact or detailed format
 * - GasSpeedSelector: Allow users to choose transaction speed
 * - GasPriceTracker: Monitor real-time gas prices with trends
 * - FeeComparison: Compare fees between Stacks and Ethereum
 *
 * ## Hooks
 * - useGasEstimate: Get fee estimates with auto-refresh
 * - useFeeComparison: Compare fees across networks
 *
 * ## Usage Example
 *
 * ```tsx
 * import { GasFeeDisplay } from './components/GasFeeDisplay';
 *
 * function DonationForm() {
 *   return (
 *     <GasFeeDisplay
 *       transactionType="donate"
 *       amount={100}
 *       network="stacks"
 *       variant="detailed"
 *       showRefresh={true}
 *     />
 *   );
 * }
 * ```
 *
 * ## Fee Calculation
 *
 * Stacks fees are calculated based on:
 * - Transaction type (create-campaign, donate, claim-funds, refund)
 * - Current network congestion
 * - Selected speed multiplier
 *
 * Ethereum gas is calculated based on:
 * - Current gas price (in gwei)
 * - Estimated gas limit for the transaction
 * - EIP-1559 parameters (maxFeePerGas, maxPriorityFeePerGas)
 *
 * ## Price Feeds
 *
 * TODO: Integrate with real price APIs:
 * - CoinGecko API for STX/USD and ETH/USD prices
 * - Ethereum gas price oracles
 * - Stacks fee estimation API
 *
 * ## Future Enhancements
 * - Historical fee data and trends
 * - Fee prediction based on time of day
 * - Automatic speed adjustment based on urgency
 * - Fee alerts and notifications
 */

export {};
