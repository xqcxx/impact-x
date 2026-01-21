import { parseUnits, type Hex } from 'viem';
import { c32addressDecode } from 'c32check';

// Contract Addresses & Config
export const BRIDGE_CONFIG = {
  sepolia: {
    USDC: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' as Hex,
    X_RESERVE: '0x008888878f94C0d87defdf0B07f46B93C1934442' as Hex,
    DOMAIN: 0,
  },
  mainnet: {
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as Hex,
    X_RESERVE: '0x8888888199b2Df864bf678259607d6D5EBb4e3Ce' as Hex,
    DOMAIN: 0,
  },
  stacks: {
    testnet: {
      USDCX: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx',
      PROTOCOL: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx-v1',
      DOMAIN: 10003,
    },
    mainnet: {
      USDCX: 'SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE.usdcx',
      PROTOCOL: 'SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE.usdcx-v1',
      DOMAIN: 10003,
    }
  }
};

// ABI for xReserve depositToRemote
export const X_RESERVE_ABI = [
  {
    name: 'depositToRemote',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'value', type: 'uint256' },
      { name: 'remoteDomain', type: 'uint32' },
      { name: 'remoteRecipient', type: 'bytes32' },
      { name: 'localToken', type: 'address' },
      { name: 'maxFee', type: 'uint256' },
      { name: 'hookData', type: 'bytes' },
    ],
    outputs: [],
  },
] as const;

// ABI for ERC20 (USDC)
export const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: 'success', type: 'bool' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: 'balance', type: 'uint256' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: 'remaining', type: 'uint256' }],
  },
] as const;

export interface BridgeParams {
  amount: string;
  recipientStacksAddress: string;
  walletClient: any;
  publicClient: any;
  network?: 'sepolia' | 'mainnet';
}

export interface BridgeResult {
  approveTxHash?: Hex;
  depositTxHash: Hex;
  hookData: Hex;
}

/**
 * Convert Stacks Address to bytes32 format required by xReserve
 */
export function stacksAddressToBytes32(stacksAddress: string): Hex {
  const [version, hash160] = c32addressDecode(stacksAddress);
  
  // Pad to 32 bytes: version (1 byte) + hash160 (20 bytes) + padding (11 bytes)
  const versionHex = version.toString(16).padStart(2, '0');
  const paddedHash = hash160.padStart(40, '0');
  const padding = '0'.repeat(22); // 11 bytes of padding
  
  return `0x${padding}${versionHex}${paddedHash}` as Hex;
}

/**
 * Generate unique hookData for tracking the deposit
 * Format: 0x + timestamp (8 chars) + random (24 chars)
 */
export function generateHookData(): Hex {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const randomBytes = new Uint8Array(12);
  crypto.getRandomValues(randomBytes);
  const randomHex = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return `0x${timestamp}${randomHex}` as Hex;
}

/**
 * Bridge USDC from Ethereum to Stacks via Circle xReserve
 */
export async function bridgeUSDCToStacks({
  amount,
  recipientStacksAddress,
  walletClient,
  publicClient,
  network = 'sepolia',
}: BridgeParams): Promise<BridgeResult> {
  const ethConfig = BRIDGE_CONFIG[network];
  const stxConfig = BRIDGE_CONFIG.stacks[network === 'sepolia' ? 'testnet' : 'mainnet'];
  
  // USDC has 6 decimals
  const value = parseUnits(amount, 6);
  const maxFee = 0n; // No max fee limit
  
  // Prepare parameters
  const remoteRecipient = stacksAddressToBytes32(recipientStacksAddress);
  const hookData = generateHookData();

  console.log('Bridge params:', {
    amount,
    value: value.toString(),
    recipient: recipientStacksAddress,
    recipientBytes32: remoteRecipient,
    hookData,
    network,
  });

  // Step 1: Check allowance
  const address = walletClient.account.address;
  const allowance = await publicClient.readContract({
    address: ethConfig.USDC,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [address, ethConfig.X_RESERVE],
  });

  let approveTxHash: Hex | undefined;

  // Step 2: Approve if needed
  if (allowance < value) {
    console.log('Approving USDC spend...');
    approveTxHash = await walletClient.writeContract({
      address: ethConfig.USDC,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [ethConfig.X_RESERVE, value],
    });

    console.log('Approval tx hash:', approveTxHash);
    await publicClient.waitForTransactionReceipt({ hash: approveTxHash });
    console.log('Approval confirmed');
  }

  // Step 3: Deposit to Remote
  console.log('Initiating bridge deposit...');
  const depositTxHash = await walletClient.writeContract({
    address: ethConfig.X_RESERVE,
    abi: X_RESERVE_ABI,
    functionName: 'depositToRemote',
    args: [
      value,
      stxConfig.DOMAIN,
      remoteRecipient,
      ethConfig.USDC,
      maxFee,
      hookData,
    ],
  });

  console.log('Deposit tx hash:', depositTxHash);

  return {
    approveTxHash,
    depositTxHash,
    hookData,
  };
}

/**
 * Check Stacks mint status using hookData
 */
export async function checkMintStatus(
  hookData: string, 
  network: 'testnet' | 'mainnet' = 'testnet'
): Promise<{ success: boolean; txId?: string }> {
  const protocolContract = BRIDGE_CONFIG.stacks[network].PROTOCOL;
  const apiUrl = network === 'testnet' 
    ? 'https://api.testnet.hiro.so' 
    : 'https://api.hiro.so';
  
  try {
    const response = await fetch(
      `${apiUrl}/extended/v1/contract/${protocolContract}/events?limit=50`
    );
    
    const data = await response.json();
    
    // Find matching mint event
    const mintEvent = data.results?.find((event: any) => {
      if (event.event_type !== 'smart_contract_log') return false;
      
      const repr = event.contract_log?.value?.repr || '';
      
      // Check if it's a mint event
      if (!repr.includes('(topic "mint")') && !repr.includes('(topic \\"mint\\")')) {
        return false;
      }
      
      // Match by hookData
      if (hookData && hookData.length > 2) {
        const hookDataClean = hookData.replace('0x', '').toLowerCase();
        return repr.toLowerCase().includes(`(hook-data 0x${hookDataClean})`);
      }
      
      return false;
    });
    
    if (mintEvent) {
      return {
        success: true,
        txId: mintEvent.tx_id,
      };
    }
    
    return { success: false };
  } catch (error) {
    console.warn('Error checking mint status:', error);
    return { success: false };
  }
}

/**
 * Get USDC balance for an address
 */
export async function getUSDCBalance(
  address: string,
  publicClient: any,
  network: 'sepolia' | 'mainnet' = 'sepolia'
): Promise<bigint> {
  const config = BRIDGE_CONFIG[network];
  
  const balance = await publicClient.readContract({
    address: config.USDC,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address as Hex],
  });
  
  return balance as bigint;
}

/**
 * Validate bridge inputs
 */
export function validateBridgeAmount(
  amount: string,
  balance: bigint,
): { valid: boolean; error?: string } {
  const numAmount = parseFloat(amount);
  
  if (isNaN(numAmount) || numAmount <= 0) {
    return { valid: false, error: 'Please enter a valid amount' };
  }
  
  // Min amount 1 USDC
  if (numAmount < 1) {
    return { valid: false, error: 'Minimum amount is 1 USDC' };
  }
  
  const amountInMicro = parseUnits(amount, 6);
  if (amountInMicro > balance) {
    return { valid: false, error: 'Insufficient USDC balance' };
  }
  
  return { valid: true };
}
