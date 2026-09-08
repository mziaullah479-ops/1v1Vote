import React, { useRef, useEffect, useState } from 'react';
import { X, Download, Share2, Copy, Check } from 'lucide-react';
import { Match } from '../types';

interface ShareModalProps {
  match: Match;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ match, isOpen, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [imageDataUrl, setImageDataUrl] = useState<string>('');

  const total = match.votes1 + match.votes2;
  const p1 = total > 0 ? ((match.votes1 / total) * 100).toFixed(1) : '50.0';
  const p2 = total > 0 ? ((match.votes2 / total) * 100).toFixed(1) : '50.0';

  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High resolution canvas for social sharing (1200x630 standard landscape social card)
    canvas.width = 1200;
    canvas.height = 630;

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 1200, 630);
    bgGrad.addColorStop(0, '#060a15');
    bgGrad.addColorStop(0.5, '#0b1329');
    bgGrad.addColorStop(1, '#180d07');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1200, 630);

    // Cyan glow on left
    const leftGlow = ctx.createRadialGradient(250, 315, 50, 250, 315, 450);
    leftGlow.addColorStop(0, 'rgba(56, 189, 248, 0.25)');
    leftGlow.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = leftGlow;
    ctx.fillRect(0, 0, 600, 630);

    // Orange glow on right
    const rightGlow = ctx.createRadialGradient(950, 315, 50, 950, 315, 450);
    rightGlow.addColorStop(0, 'rgba(249, 115, 22, 0.25)');
    rightGlow.addColorStop(1, 'rgba(249, 115, 22, 0)');
    ctx.fillStyle = rightGlow;
    ctx.fillRect(600, 0, 600, 630);

    // Top Header Banner
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('1v1VOTE', 60, 70);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '600 20px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('• LIVE CREATOR MATCHUP', 225, 68);

    // VS Center Clash Emblem
    ctx.font = 'italic 900 90px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('V', 570, 335);
    ctx.fillStyle = '#fb923c';
    ctx.fillText('S', 630, 335);

    // Left Creator 1 Box
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(10, 25, 55, 0.85)';
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 4;
    roundRect(ctx, 80, 130, 420, 400, 24);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(match.creator1.name, 110, 200);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '600 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`${match.creator1.platform} • ${match.creator1.subscribers}`, 110, 240);

    // Vote Share 1
    ctx.fillStyle = '#10b981';
    ctx.font = '900 76px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`${p1}%`, 110, 380);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 20px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`${match.votes1.toLocaleString()} Votes`, 110, 425);

    // Progress bar 1
    ctx.fillStyle = '#1e293b';
    roundRect(ctx, 110, 455, 360, 16, 8);
    ctx.fill();
    ctx.fillStyle = '#10b981';
    roundRect(ctx, 110, 455, (360 * Number(p1)) / 100, 16, 8);
    ctx.fill();

    // Right Creator 2 Box
    ctx.fillStyle = 'rgba(45, 20, 10, 0.85)';
    ctx.strokeStyle = '#ea580c';
    ctx.lineWidth = 4;
    roundRect(ctx, 700, 130, 420, 400, 24);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(match.creator2.name, 730, 200);

    ctx.fillStyle = '#fb923c';
    ctx.font = '600 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`${match.creator2.platform} • ${match.creator2.subscribers}`, 730, 240);

    // Vote Share 2
    ctx.fillStyle = '#fb923c';
    ctx.font = '900 76px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`${p2}%`, 730, 380);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 20px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`${match.votes2.toLocaleString()} Votes`, 730, 425);

    // Progress bar 2
    ctx.fillStyle = '#1e293b';
    roundRect(ctx, 730, 455, 360, 16, 8);
    ctx.fill();
    ctx.fillStyle = '#fb923c';
    roundRect(ctx, 730, 455, (360 * Number(p2)) / 100, 16, 8);
    ctx.fill();

    // Footer Watermark
    ctx.textAlign = 'center';
    ctx.fillStyle = '#64748b';
    ctx.font = '500 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Cast your vote at 1v1Vote • Real-Time Influencer Standings', 600, 585);

    setImageDataUrl(canvas.toDataURL('image/png'));
  }, [isOpen, match, p1, p2]);

  // Helper for rounded rectangle in canvas
  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!imageDataUrl) return;
    const a = document.createElement('a');
    a.href = imageDataUrl;
    a.download = `${match.slug}-1v1vote-results.png`;
    a.click();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareText = encodeURIComponent(
    `🔥 Epic Battle: ${match.creator1.name} (${p1}%) VS ${match.creator2.name} (${p2}%)! Cast your vote now on 1v1Vote:`
  );
  const shareUrl = encodeURIComponent(window.location.href);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#090f1d] border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
          <Share2 className="w-5 h-5 text-sky-400" />
          Share Match Standings
        </h3>
        <p className="text-xs text-slate-400 mb-5">
          Download or share this official real-time battle card on WhatsApp, Instagram Stories, and X!
        </p>

        {/* Hidden Canvas & Visible Preview */}
        <canvas ref={canvasRef} className="hidden" />

        {imageDataUrl && (
          <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-2xl mb-6 bg-slate-950">
            <img src={imageDataUrl} alt="Battle Result Card" className="w-full h-auto" />
          </div>
        )}

        {/* Social Sharing Quick Buttons */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          <a
            href={`https://api.whatsapp.com/send?text=${shareText}%20${shareUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/50 text-emerald-300 text-xs font-bold transition-all"
          >
            WhatsApp
          </a>

          <a
            href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/50 text-sky-300 text-xs font-bold transition-all"
          >
            Twitter / X
          </a>

          <button
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>

        {/* Download Button */}
        <button
          onClick={handleDownload}
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-[0_0_20px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
        >
          <Download className="w-4 h-4" />
          Download HD Result Card (PNG)
        </button>
      </div>
    </div>
  );
};
