import {
  Share2,
  Link2,
  Check,
  Twitter,
  Facebook,
  Linkedin,
  Send,
  MessageCircle,
  Mail,
} from "lucide-react";
import { useState } from "react";
import {
  ShareData,
  getTwitterShareUrl,
  getFacebookShareUrl,
  getLinkedInShareUrl,
  getTelegramShareUrl,
  getWhatsAppShareUrl,
  getEmailShareUrl,
  copyToClipboard,
  openShareWindow,
  shareViaWebAPI,
} from "../lib/social";

interface ShareButtonProps {
  data: ShareData;
  variant?: "button" | "icon" | "minimal";
  size?: "sm" | "md" | "lg";
}

export function ShareButton({ data, variant = "button", size = "md" }: ShareButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(data.url);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    const shared = await shareViaWebAPI(data);
    if (!shared) {
      setShowMenu(true);
    }
  };

  const handleShare = (url: string) => {
    openShareWindow(url);
    setShowMenu(false);
  };

  const sizeClasses = {
    sm: "p-1.5",
    md: "p-2",
    lg: "p-3",
  };

  const iconSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const shareOptions = [
    { name: "Twitter", icon: Twitter, url: getTwitterShareUrl(data), color: "#1DA1F2" },
    { name: "Facebook", icon: Facebook, url: getFacebookShareUrl(data), color: "#4267B2" },
    { name: "LinkedIn", icon: Linkedin, url: getLinkedInShareUrl(data), color: "#0077B5" },
    { name: "Telegram", icon: Send, url: getTelegramShareUrl(data), color: "#0088cc" },
    { name: "WhatsApp", icon: MessageCircle, url: getWhatsAppShareUrl(data), color: "#25D366" },
    { name: "Email", icon: Mail, url: getEmailShareUrl(data), color: "#EA4335" },
  ];

  if (variant === "minimal") {
    return (
      <button
        onClick={handleNativeShare}
        className={`${sizeClasses[size]} rounded-lg text-dark-400 hover:text-dark-200 hover:bg-white/5 transition-colors`}
        title="Share"
      >
        <Share2 className={iconSizes[size]} />
      </button>
    );
  }

  return (
    <div className="relative">
      {variant === "button" ? (
        <button onClick={handleNativeShare} className="btn-secondary flex items-center gap-2">
          <Share2 className="w-4 h-4" />
          Share
        </button>
      ) : (
        <button
          onClick={() => setShowMenu(!showMenu)}
          className={`${sizeClasses[size]} rounded-lg bg-white/5 text-dark-300 hover:bg-white/10 hover:text-dark-100 transition-colors`}
        >
          <Share2 className={iconSizes[size]} />
        </button>
      )}

      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 mt-2 w-64 glass-card z-50 p-2 space-y-1">
            <div className="px-3 py-2 text-xs font-medium text-dark-500 uppercase tracking-wider">
              Share Campaign
            </div>

            {shareOptions.map((option) => (
              <button
                key={option.name}
                onClick={() => handleShare(option.url)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-dark-200 hover:bg-white/5 transition-colors"
              >
                <option.icon className="w-4 h-4" style={{ color: option.color }} />
                {option.name}
              </button>
            ))}

            <div className="border-t border-white/10 my-1" />

            <button
              onClick={handleCopy}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-dark-200 hover:bg-white/5 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-success-400" />
                  <span className="text-success-400">Copied!</span>
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4" />
                  Copy Link
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
