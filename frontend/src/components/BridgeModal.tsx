import { useState, useEffect, useRef } from 'react';
import { X, Loader2, CheckCircle, ArrowRight, Wallet, ExternalLink, RefreshCw } from 'lucide-react';
import { useAccount, useConnect } from 'wagmi';
import { useStacksWallet } from '../hooks/useStacksWallet';
import { useBridge } from '../hooks/useBridge';

interface BridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultAmount?: string;
}

export function BridgeModal({
  isOpen,
  onClose,
  onSuccess,
  defaultAmount = '',
}: BridgeModalProps) {
  const [amount, setAmount] = useState(defaultAmount);
  const [pollingAttempt, setPollingAttempt] = useState(0);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Ethereum Wallet
  const { isConnected: isEthConnected, address: ethAddress } = useAccount();
  const { connect, connectors } = useConnect();
  // removed unused disconnect

  // Stacks Wallet (Recipient)
  const { connected: isStxConnected, stxAddress, connect: connectStx } = useStacksWallet();

  // Bridge Hook
  const { bridge, checkStatus, status, error, txHash, reset } = useBridge();

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmount(defaultAmount);
      reset();
      setPollingAttempt(0);
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    }
    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [isOpen, defaultAmount, reset]);

  // Handle Polling for Mint Status
  useEffect(() => {
    if (status === 'polling' && txHash) {
      // We need the hookData to check status, but it's returned by the bridge function.
      // In a real app, we might store this in a context or pass it through state.
      // For now, we'll assume the user waits or we use a simplified polling mechanism 
      // if we can't persist the hookData easily across re-renders without more state.
      
      // Since `bridge()` returns the hookData, we should capture it in the handleBridge function
      // This effect is mainly for cleanup or recovering state if we persisted it.
    }
  }, [status, txHash]);

  const handleBridge = async () => {
    if (!amount || !isStxConnected || !stxAddress) return;
    
    // 1. Execute Bridge Transaction
    const result = await bridge(amount, stxAddress);
    
    if (result && result.hookData) {
      // 2. Start Polling for Mint
      pollForMint(result.hookData);
    }
  };

  const pollForMint = async (hookData: string) => {
    const MAX_ATTEMPTS = 60; // 10 minutes (10s interval)
    let attempts = 0;

    const check = async () => {
      attempts++;
      setPollingAttempt(attempts);
      
      const success = await checkStatus(hookData);
      
      if (success) {
        if (onSuccess) onSuccess();
      } else if (attempts < MAX_ATTEMPTS) {
        pollTimerRef.current = setTimeout(check, 10000); // Check every 10s
      } else {
        // Timeout
        console.warn('Polling timeout');
      }
    };

    check();
  };

  const handleClose = () => {
    if (status !== 'approving' && status !== 'depositing' && status !== 'polling') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-dark-900/90 backdrop-blur-md"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="glass-card relative max-w-md w-full overflow-hidden animate-in border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/5">
          <h2 className="text-lg font-heading font-semibold text-dark-100 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-primary-400" />
            Bridge USDC to Stacks
          </h2>
          <button 
            onClick={handleClose}
            disabled={status === 'approving' || status === 'depositing'}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-dark-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Status: Success */}
          {status === 'success' || (status === 'polling' && pollingAttempt > 0) ? (
            <div className="text-center py-6">
              {status === 'success' ? (
                 <CheckCircle className="w-16 h-16 text-success-400 mx-auto mb-4" />
              ) : (
                 <div className="relative w-16 h-16 mx-auto mb-4">
                   <Loader2 className="w-16 h-16 text-primary-400 animate-spin" />
                   <div className="absolute inset-0 flex items-center justify-center text-xs font-mono text-white">
                     {pollingAttempt}
                   </div>
                 </div>
              )}
             
              <h3 className="text-lg font-heading font-semibold text-dark-100 mb-2">
                {status === 'success' ? 'Bridge Complete!' : 'Bridge Initiated'}
              </h3>
              
              <p className="text-dark-400 mb-6">
                {status === 'success' 
                  ? 'Your USDCx has been minted on Stacks.' 
                  : 'Waiting for Circle and Stacks validators to finalize the transfer (~15 mins).'}
              </p>

              {txHash && (
                <a
                  href={`https://sepolia.etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 text-sm mb-6"
                >
                  View Ethereum Transaction <ExternalLink className="w-4 h-4" />
                </a>
              )}

              {status === 'success' && (
                <button onClick={onClose} className="btn-primary w-full">
                  Continue to Donate
                </button>
              )}
            </div>
          ) : (
            /* Input Form */
            <>
              {/* Step 1: Connect Wallets */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-dark-800 border border-dark-700">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <img src="https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=026" className="w-5 h-5" alt="ETH" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs text-dark-400">From (Sepolia)</div>
                      <div className="text-sm font-medium text-dark-200">
                        {isEthConnected ? `${ethAddress?.slice(0,6)}...${ethAddress?.slice(-4)}` : 'Not Connected'}
                      </div>
                    </div>
                  </div>
                  {!isEthConnected && (
                    <button 
                      onClick={() => connect({ connector: connectors[0] })}
                      className="px-3 py-1.5 text-xs font-medium bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20"
                    >
                      Connect
                    </button>
                  )}
                </div>

                <div className="flex justify-center -my-2 relative z-10">
                  <div className="bg-dark-900 p-1 rounded-full border border-dark-700">
                    <ArrowRight className="w-4 h-4 text-dark-400 rotate-90" />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-dark-800 border border-dark-700">
                   <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                       <span className="text-purple-400 font-bold text-xs">STX</span>
                    </div>
                    <div className="text-left">
                      <div className="text-xs text-dark-400">To (Stacks)</div>
                      <div className="text-sm font-medium text-dark-200">
                        {isStxConnected ? `${stxAddress?.slice(0,6)}...${stxAddress?.slice(-4)}` : 'Not Connected'}
                      </div>
                    </div>
                  </div>
                  {!isStxConnected && (
                    <button 
                      onClick={connectStx}
                      className="px-3 py-1.5 text-xs font-medium bg-purple-500/10 text-purple-400 rounded-lg hover:bg-purple-500/20"
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>

              {/* Step 2: Amount */}
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Amount to Bridge (USDC)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400 text-lg">$</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    disabled={status !== 'idle' && status !== 'error'}
                    className="w-full pl-10 pr-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-dark-100 text-lg focus:outline-none focus:border-primary-500 transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-dark-400">
                    USDC
                  </span>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                  {error}
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={handleBridge}
                disabled={!isEthConnected || !isStxConnected || !amount || status !== 'idle' && status !== 'error'}
                className="w-full btn-primary py-3 flex items-center justify-center gap-2"
              >
                {status === 'checking' && 'Checking Balance...'}
                {status === 'approving' && 'Approving USDC...'}
                {status === 'depositing' && 'Initiating Transfer...'}
                {(status === 'idle' || status === 'error') && (
                  <>
                    <Wallet className="w-5 h-5" />
                    Bridge to Stacks
                  </>
                )}
              </button>
              
              <p className="text-xs text-center text-dark-500">
                Powered by Circle xReserve. Transfers typically take 15-20 minutes.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}