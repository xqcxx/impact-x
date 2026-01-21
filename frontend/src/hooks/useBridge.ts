import { useState, useCallback } from 'react';
import { useWalletClient, usePublicClient, useAccount, useChainId } from 'wagmi';
import { 
  bridgeUSDCToStacks, 
  getUSDCBalance, 
  validateBridgeAmount,
  checkMintStatus,
  type BridgeResult 
} from '../lib/bridge';

export type BridgeStatus = 
  | 'idle' 
  | 'checking' 
  | 'approving' 
  | 'depositing'
  | 'polling'
  | 'success' 
  | 'error';

interface UseBridgeReturn {
  bridge: (amount: string, recipientStacksAddress: string) => Promise<BridgeResult | null>;
  checkStatus: (hookData: string) => Promise<boolean>;
  status: BridgeStatus;
  error: string | null;
  txHash: string | null;
  reset: () => void;
}

export function useBridge(): UseBridgeReturn {
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { address } = useAccount();
  const chainId = useChainId();
  
  const [status, setStatus] = useState<BridgeStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const getNetwork = () => {
    // Sepolia chain ID is 11155111
    return chainId === 11155111 ? 'sepolia' : 'mainnet';
  };

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setTxHash(null);
  }, []);

  const checkStatus = useCallback(async (hookData: string): Promise<boolean> => {
    // Determine network based on current chain
    const network = getNetwork() === 'sepolia' ? 'testnet' : 'mainnet';
    const result = await checkMintStatus(hookData, network);
    return result.success;
  }, [chainId]);

  const bridge = useCallback(async (
    amount: string,
    recipientStacksAddress: string
  ): Promise<BridgeResult | null> => {
    if (!walletClient || !publicClient || !address) {
      setError('Wallet not connected');
      setStatus('error');
      return null;
    }

    try {
      setStatus('checking');
      setError(null);
      setTxHash(null);

      const network = getNetwork();

      // Check balance
      const balance = await getUSDCBalance(address, publicClient, network);
      
      // Validate amount
      const validation = validateBridgeAmount(amount, balance);
      if (!validation.valid) {
        setError(validation.error || 'Invalid amount');
        setStatus('error');
        return null;
      }

      // Start bridge process (Approving + Depositing)
      setStatus('approving'); // Assume approval might be needed

      const result = await bridgeUSDCToStacks({
        amount,
        recipientStacksAddress,
        walletClient,
        publicClient,
        network,
      });

      setStatus('depositing');
      setTxHash(result.depositTxHash);

      // Wait for Ethereum confirmation
      await publicClient.waitForTransactionReceipt({ 
        hash: result.depositTxHash 
      });

      // Now we poll for Stacks minting
      setStatus('polling');
      
      return result;

    } catch (err: any) {
      console.error('Bridge error:', err);
      
      let errorMessage = 'Bridge failed';
      if (err.message?.includes('User rejected')) {
        errorMessage = 'Transaction rejected by user';
      } else if (err.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient ETH for gas';
      } else if (err.message?.includes('insufficient allowance')) {
        errorMessage = 'Insufficient USDC allowance';
      } else if (err.shortMessage) {
        errorMessage = err.shortMessage;
      }
      
      setError(errorMessage);
      setStatus('error');
      return null;
    }
  }, [walletClient, publicClient, address, chainId]);

  return { 
    bridge,
    checkStatus,
    status, 
    error, 
    txHash,
    reset,
  };
}
