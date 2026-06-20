import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { X, Loader2, CheckCircle, AlertCircle, Zap, Lock, ArrowRightLeft } from 'lucide-react';
import { useStacksWallet } from '../hooks/useStacksWallet';
import { donate } from '../lib/stacks';
import { BridgeModal } from './BridgeModal';
import { TransactionChecklist, type ChecklistStep } from './TransactionChecklist';
import { ACTIVE_NETWORK } from '../lib/constants';

const stacksExplorerChain = ACTIVE_NETWORK === 'testnet' ? '?chain=testnet' : '';

interface DonateModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignTitle: string;
  campaignId: number;
  onSuccess?: () => void;
}

export function DonateModal({
  isOpen,
  onClose,
  campaignTitle,
  campaignId,
  onSuccess,
}: DonateModalProps) {
  const [amount, setAmount] = useState('');
  const [donating, setDonating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [txId, setTxId] = useState<string | null>(null);
  
  // Bridge Modal State
  const [showBridge, setShowBridge] = useState(false);
  
  const { connected: stxConnected, connect: connectStx, stxAddress } = useStacksWallet();

  const donationSteps: ChecklistStep[] = [
    {
      title: 'Connect Stacks wallet',
      description: 'Your wallet signs the donation transaction with USDCx.',
      status: stxConnected ? 'complete' : 'active',
    },
    {
      title: 'Confirm donation',
      description: 'Choose an amount and approve the transfer in your wallet.',
      status: success ? 'complete' : donating ? 'active' : stxConnected ? 'active' : 'pending',
    },
    {
      title: 'Funds enter escrow',
      description: 'USDCx is held by the campaign smart contract until the campaign outcome is known.',
      status: success ? 'complete' : 'pending',
    },
    {
      title: 'Campaign settles',
      description: 'Creators can claim only if the goal is met; otherwise supporters can request refunds after the deadline.',
      status: 'pending',
    },
  ];

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setAmount('');
      setError(null);
      setSuccess(false);
      setTxId(null);
      setDonating(false);
      setShowBridge(false);
    }
  }, [isOpen]);

  const triggerConfetti = () => {
    const end = Date.now() + 2000;
    const colors = ['#FF6B1A', '#FF8A4C', '#ffffff'];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };

  const handleDonate = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      const msg = 'Please enter a valid amount';
      setError(msg);
      toast.error(msg);
      return;
    }

    if (!stxConnected || !stxAddress) {
      const msg = 'Please connect your Stacks wallet';
      setError(msg);
      toast.error(msg);
      return;
    }

    setDonating(true);
    setError(null);
    const toastId = toast.loading('Processing donation...');

    try {
      // Call donate function - this transfers USDCx from user's wallet to contract escrow
      const result = await donate(campaignId, parseFloat(amount));
      
      setTxId(result.txId);
      setSuccess(true);
      toast.success('Donation successful!', { id: toastId });
      triggerConfetti();
      
      setTimeout(() => {
        onSuccess?.();
      }, 3000);
    } catch (err: any) {
      console.error('Donation failed:', err);
      const msg = err.message || 'Failed to donate. Make sure you have enough USDCx.';
      setError(msg);
      toast.error(msg, { id: toastId });
    } finally {
      setDonating(false);
    }
  };

  const handleClose = () => {
    if (!donating) {
      onClose();
    }
  };

  const openBridge = () => {
    setShowBridge(true);
  };

  // If showing bridge, render BridgeModal instead
  if (showBridge) {
    return (
      <BridgeModal 
        isOpen={true} 
        onClose={() => setShowBridge(false)} 
        defaultAmount={amount}
        onSuccess={() => {
          setShowBridge(false);
          toast.success('USDCx minted to your Stacks wallet. You can now confirm the donation.');
        }}
      />
    );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-dark-900/80 backdrop-blur-md"
        onClick={handleClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div
        className="glass-card relative max-w-md w-full max-h-[90vh] overflow-y-auto animate-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="donate-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 id="donate-modal-title" className="text-lg font-heading font-semibold text-dark-100">
            {success ? 'Donation Successful!' : 'Donate with USDCx'}
          </h2>
          <button 
            onClick={handleClose}
            disabled={donating}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
            aria-label="Close donation modal"
          >
            <X className="w-5 h-5 text-dark-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            /* Success State */
            <div className="text-center py-6">
              <CheckCircle className="w-16 h-16 text-success-400 mx-auto mb-4" />
              <h3 className="text-lg font-heading font-semibold text-dark-100 mb-2">
                Thank you for your support!
              </h3>
              <p className="text-dark-400 mb-4">
                Your donation of ${parseFloat(amount).toFixed(2)} USDCx has been deposited into escrow.
              </p>
              {txId && (
                <a
                  href={`https://explorer.hiro.so/txid/${txId}${stacksExplorerChain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-400 hover:text-primary-300 text-sm underline"
                >
                  View transaction
                </a>
              )}
            </div>
          ) : (
            <>
              {/* Campaign Info */}
              <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-sm text-dark-500 mb-1">Supporting</p>
                <p className="font-heading font-medium text-dark-100 truncate">{campaignTitle}</p>
              </div>

              {/* Escrow Info Box */}
              <div className="mb-6 p-4 rounded-xl bg-secondary-500/10 border border-secondary-500/20">
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-secondary-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-heading font-medium text-secondary-300 mb-1">Escrow Protection</h4>
                    <p className="text-xs text-secondary-400/80">
                      Your USDCx will be held securely in the smart contract. If the campaign doesn't reach its goal, 
                      you can request a full refund after the deadline.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <TransactionChecklist title="Donation protection checklist" steps={donationSteps} />
              </div>

              {!stxConnected ? (
                /* Connect Stacks Wallet */
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-500/15 flex items-center justify-center">
                    <Zap className="w-8 h-8 text-primary-400" />
                  </div>
                  <p className="text-dark-300 mb-6">
                    Connect your Stacks wallet to donate USDCx
                  </p>
                  <button onClick={connectStx} className="btn-primary w-full mb-4">
                    Connect Stacks Wallet
                  </button>
                  
                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-dark-900 px-2 text-dark-500">OR</span>
                    </div>
                  </div>

                  <button 
                    onClick={openBridge}
                    className="w-full btn-secondary flex items-center justify-center gap-2 mt-4"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                    Bridge USDC first
                  </button>
                </div>
              ) : (
                /* Donation Form */
                <>
                  {/* Connected Wallet */}
                  <div className="mb-4 p-3 rounded-xl bg-success-500/10 border border-success-500/30 flex items-center justify-between">
                    <p className="text-xs text-success-400">
                      Connected: <span className="font-mono">{stxAddress?.slice(0, 8)}...{stxAddress?.slice(-4)}</span>
                    </p>
                  </div>

                  {/* Amount Input */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-dark-300">
                        Donation Amount (USDCx)
                      </label>
                      <button 
                        onClick={openBridge}
                        className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
                      >
                        <ArrowRightLeft className="w-3 h-3" />
                        Need USDCx? Bridge first
                      </button>
                    </div>
                    
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400 text-lg">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="1"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-10 pr-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-dark-100 text-lg placeholder-dark-500 focus:outline-none focus:border-primary-500 transition-colors"
                        disabled={donating}
                      />
                    </div>
                    <p className="text-xs text-dark-500 mt-2">
                      Minimum: $1.00 USDCx
                    </p>
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {['10', '25', '100'].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setAmount(preset)}
                          disabled={donating}
                          className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                            amount === preset
                              ? 'border-primary-500/50 bg-primary-500/15 text-primary-300'
                              : 'border-white/10 bg-white/5 text-dark-300 hover:border-white/20 hover:bg-white/10'
                          }`}
                        >
                          ${preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                      <p className="text-dark-500 mb-1">If funded</p>
                      <p className="text-dark-300">Creator can claim funds after success. A 5% platform fee is deducted then.</p>
                    </div>
                    <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                      <p className="text-dark-500 mb-1">If not funded</p>
                      <p className="text-dark-300">Your escrowed donation remains refundable after the campaign deadline.</p>
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                      <p className="text-sm text-red-400">{error}</p>
                    </div>
                  )}

                  {/* Donate Button */}
                  <button
                    onClick={handleDonate}
                    disabled={donating || !amount || parseFloat(amount) < 1}
                    className="w-full btn-primary flex items-center justify-center gap-2"
                  >
                    {donating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Donating...
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5" />
                        Donate to Escrow
                      </>
                    )}
                  </button>

                  <p className="text-xs text-dark-500 mt-4 text-center leading-relaxed">
                    You only sign one Stacks transaction here. Need USDC on Stacks first? Use the bridge before donating.
                  </p>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
