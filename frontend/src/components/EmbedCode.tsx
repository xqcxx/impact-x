import { useState } from "react";
import { Code, Copy, Check, ExternalLink } from "lucide-react";
import { generateEmbedCode } from "../lib/social";
import { copyToClipboard } from "../lib/social";

interface EmbedCodeProps {
  campaignUrl: string;
  campaignTitle: string;
}

export function EmbedCode({ campaignUrl, campaignTitle }: EmbedCodeProps) {
  const [copied, setCopied] = useState(false);
  const [width, setWidth] = useState(600);
  const [height, setHeight] = useState(400);
  const [showPreview, setShowPreview] = useState(false);

  const embedCode = generateEmbedCode(campaignUrl, width, height);

  const handleCopy = async () => {
    const success = await copyToClipboard(embedCode);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-heading font-semibold text-dark-100 flex items-center gap-2">
          <Code className="w-5 h-5 text-primary-400" />
          Embed Campaign
        </h3>
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1"
        >
          <ExternalLink className="w-4 h-4" />
          {showPreview ? "Hide Preview" : "Show Preview"}
        </button>
      </div>

      <p className="text-sm text-dark-400">
        Embed this campaign on your website or blog to help it reach more backers.
      </p>

      {/* Size Controls */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-1">Width (px)</label>
          <input
            type="number"
            value={width}
            onChange={(e) => setWidth(parseInt(e.target.value) || 600)}
            className="input py-2"
            min={300}
            max={1200}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-1">Height (px)</label>
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(parseInt(e.target.value) || 400)}
            className="input py-2"
            min={200}
            max={800}
          />
        </div>
      </div>

      {/* Preview */}
      {showPreview && (
        <div className="p-4 rounded-xl bg-dark-900/50 border border-white/5">
          <p className="text-xs text-dark-500 mb-2">Preview:</p>
          <div className="overflow-x-auto">
            <div
              className="mx-auto bg-dark-800 rounded-lg flex items-center justify-center"
              style={{ width: Math.min(width, 400), height: Math.min(height, 200) }}
            >
              <div className="text-center p-4">
                <p className="text-dark-400 text-sm mb-2">{campaignTitle}</p>
                <p className="text-dark-600 text-xs">
                  iframe preview ({width}x{height})
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Embed Code */}
      <div className="relative">
        <pre className="p-4 rounded-xl bg-dark-900 text-dark-300 text-sm overflow-x-auto whitespace-pre-wrap font-mono">
          {embedCode}
        </pre>
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 p-2 rounded-lg bg-dark-800 text-dark-400 hover:text-dark-200 hover:bg-dark-700 transition-colors"
          title="Copy embed code"
        >
          {copied ? <Check className="w-4 h-4 text-success-400" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      <div className="flex items-center gap-2 text-xs text-dark-500">
        <span className="inline-block w-2 h-2 rounded-full bg-success-500" />
        Compatible with WordPress, Medium, and most website builders
      </div>
    </div>
  );
}
