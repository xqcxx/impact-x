/**
 * Environment variable validation and type-safe access
 * Ensures all required env vars are present and correctly typed
 */

import { z } from 'zod';

// Define schema for environment variables
const envSchema = z.object({
  // WalletConnect
  VITE_WALLETCONNECT_PROJECT_ID: z.string().min(1, 'WalletConnect Project ID is required'),
  
  // Network
  VITE_NETWORK: z.enum(['testnet', 'mainnet']).default('testnet'),
  
  // Contract Addresses (optional with defaults)
  VITE_CONTRACT_ADDRESS: z.string().optional(),
  VITE_USDCX_CONTRACT: z.string().optional(),
  
  // API Keys (optional)
  VITE_IPFS_API_KEY: z.string().optional(),
  VITE_IPFS_API_SECRET: z.string().optional(),
});

// Type for validated environment
type ValidatedEnv = z.infer<typeof envSchema>;

/**
 * Validate and parse environment variables
 * Throws if validation fails
 */
function validateEnv(): ValidatedEnv {
  const env = {
    VITE_WALLETCONNECT_PROJECT_ID: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
    VITE_NETWORK: import.meta.env.VITE_NETWORK,
    VITE_CONTRACT_ADDRESS: import.meta.env.VITE_CONTRACT_ADDRESS,
    VITE_USDCX_CONTRACT: import.meta.env.VITE_USDCX_CONTRACT,
    VITE_IPFS_API_KEY: import.meta.env.VITE_IPFS_API_KEY,
    VITE_IPFS_API_SECRET: import.meta.env.VITE_IPFS_API_SECRET,
  };

  const result = envSchema.safeParse(env);

  if (!result.success) {
    const errors = result.error.errors.map(
      e => `  - ${e.path.join('.')}: ${e.message}`
    ).join('\n');
    
    throw new Error(
      `Environment validation failed:\n${errors}\n\n` +
      `Please check your .env file and ensure all required variables are set.`
    );
  }

  return result.data;
}

// Validate once and export
let validatedEnv: ValidatedEnv;

try {
  validatedEnv = validateEnv();
} catch (error) {
  console.error('Environment validation error:', error);
  // In development, show a warning but don't crash
  if (import.meta.env.DEV) {
    console.warn('Running with partial environment configuration');
    validatedEnv = {
      VITE_WALLETCONNECT_PROJECT_ID: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'dev-project-id',
      VITE_NETWORK: (import.meta.env.VITE_NETWORK as 'testnet' | 'mainnet') || 'testnet',
    };
  } else {
    throw error;
  }
}

// Export validated environment
export const env = validatedEnv;

// Export individual variables for convenience
export const WALLETCONNECT_PROJECT_ID = env.VITE_WALLETCONNECT_PROJECT_ID;
export const NETWORK = env.VITE_NETWORK;
export const CONTRACT_ADDRESS = env.VITE_CONTRACT_ADDRESS;
export const USDCX_CONTRACT = env.VITE_USDCX_CONTRACT;
export const IPFS_API_KEY = env.VITE_IPFS_API_KEY;
export const IPFS_API_SECRET = env.VITE_IPFS_API_SECRET;

// Helper to check if running on testnet
export const IS_TESTNET = NETWORK === 'testnet';

// Helper to check if running on mainnet
export const IS_MAINNET = NETWORK === 'mainnet';
