import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download, Share2, Smartphone } from "lucide-react";

interface QRCodeShareProps {
  url: string;
  campaignTitle: string;
  size?: number;
}

export function QRCodeShare({ url, campaignTitle, size = 200 }: QRCodeShareProps) {
  const [showQR, setShowQR] = useState(false);

  const handleDownload = () => {
    const svg = document.getElementById("campaign-qr-code");
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        canvas.width = size;
        canvas.height = size;
        ctx?.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `${campaignTitle.replace(/\s+/g, "-").toLowerCase()}-qr.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      };

      img.src = "data:image/svg+xml;base64," + btoa(svgData);
    }
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-heading font-semibold text-dark-100 flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-primary-400" />
          Mobile Share
        </h3>
        <button
          onClick={() => setShowQR(!showQR)}
          className="text-sm text-primary-400 hover:text-primary-300"
        >
          {showQR ? "Hide QR" : "Show QR Code"}
        </button>
      </div>

      {showQR ? (
        <div className="text-center space-y-4">
          <div className="inline-block p-4 bg-white rounded-xl">
            <QRCodeSVG
              id="campaign-qr-code"
              value={url}
              size={size}
              level="H"
              includeMargin={true}
              imageSettings={{
                src: "/logo.png", // Add your logo
                height: 40,
                width: 40,
                excavate: true,
              }}
            />
          </div>

          <p className="text-sm text-dark-400">Scan with your phone camera to view this campaign</p>

          <button
            onClick={handleDownload}
            className="btn-secondary flex items-center gap-2 mx-auto"
          >
            <Download className="w-4 h-4" />
            Download QR Code
          </button>
        </div>
      ) : (
        <div className="text-center py-8">
          <Share2 className="w-12 h-12 text-dark-600 mx-auto mb-3" />
          <p className="text-dark-400 text-sm">
            Generate a QR code to easily share this campaign with mobile users
          </p>
        </div>
      )}
    </div>
  );
}
