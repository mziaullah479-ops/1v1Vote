import React, { useEffect, useState, useRef } from 'react';
import {
  Link as LinkIcon,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Zap,
  Image as ImageIcon,
  Check,
  RefreshCw,
  Youtube,
  Tv,
} from 'lucide-react';
import {
  prefetchAndValidateCreatorUrl,
  UrlValidationResult,
  SAMPLE_CREATOR_URLS,
} from '../services/urlValidatorService';
import { Platform, Region } from '../types';

interface UrlValidatorCardProps {
  label: string;
  cornerColor: 'blue' | 'orange';
  url: string;
  nameHint: string;
  onUrlChange: (newUrl: string) => void;
  onApplyMetadata: (data: {
    name: string;
    avatarUrl: string;
    subscribers: string;
    platform: Platform;
    growthRate?: string;
  }) => void;
  onValidationStatusChange?: (isValid: boolean) => void;
}

export const UrlValidatorCard: React.FC<UrlValidatorCardProps> = ({
  label,
  cornerColor,
  url,
  nameHint,
  onUrlChange,
  onApplyMetadata,
  onValidationStatusChange,
}) => {
  const [result, setResult] = useState<UrlValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [applied, setApplied] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isBlue = cornerColor === 'blue';
  const accentBorder = isBlue ? 'border-sky-500/30' : 'border-orange-500/30';
  const accentText = isBlue ? 'text-sky-400' : 'text-orange-400';
  const accentBg = isBlue ? 'bg-sky-500/10' : 'bg-orange-500/10';
  const focusBorder = isBlue ? 'focus:border-sky-500' : 'focus:border-orange-500';

  // Run validation and pre-fetch
  const runValidation = async (targetUrl: string, name: string) => {
    if (!targetUrl.trim()) {
      setResult(null);
      setIsValidating(false);
      onValidationStatusChange?.(true); // Empty is acceptable if manual mode
      return;
    }

    setIsValidating(true);
    setApplied(false);

    try {
      const res = await prefetchAndValidateCreatorUrl(targetUrl, name);
      setResult(res);
      onValidationStatusChange?.(res.isValidUrl);
    } catch (err) {
      console.error('Error during URL validation:', err);
    } finally {
      setIsValidating(false);
    }
  };

  // Real-time debounced trigger whenever URL changes
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!url.trim()) {
      setResult(null);
      setIsValidating(false);
      return;
    }

    setIsValidating(true);
    debounceTimerRef.current = setTimeout(() => {
      runValidation(url, nameHint);
    }, 450);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [url]);

  const handleApply = () => {
    if (!result || !result.isValidUrl) return;
    onApplyMetadata({
      name: result.creatorName,
      avatarUrl: result.avatarUrl,
      subscribers: result.followersCount,
      platform: (result.platform === 'Other' ? 'YouTube' : result.platform) as Platform,
      growthRate: result.growthRate,
    });
    setApplied(true);
    setTimeout(() => setApplied(false), 2500);
  };

  const handleQuickSample = (sampleUrl: string) => {
    onUrlChange(sampleUrl);
  };

  return (
    <div className={`p-3.5 rounded-2xl bg-[#060c18] border ${accentBorder} space-y-3`}>
      {/* Header with status badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <LinkIcon className={`w-3.5 h-3.5 ${accentText}`} />
          <span className="text-xs font-bold text-white tracking-wide">
            {label} Profile URL Validator
          </span>
        </div>

        {/* Real-Time Validator Status Indicator */}
        <div>
          {isValidating ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-semibold animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin" />
              Pre-fetching...
            </span>
          ) : result ? (
            result.isValidUrl ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Valid URL ({result.latencyMs}ms)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[10px] font-bold">
                <AlertTriangle className="w-3 h-3 text-rose-400" />
                Invalid URL
              </span>
            )
          ) : (
            <span className="text-[10px] text-slate-500">Live Validator Ready</span>
          )}
        </div>
      </div>

      {/* URL Input Bar */}
      <div className="relative">
        <input
          type="url"
          placeholder="Paste URL (e.g. https://youtube.com/@duckybhai or @mrbeast)"
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          className={`w-full bg-[#040813] border border-slate-800 rounded-xl pl-3 pr-24 py-2 text-white text-xs placeholder:text-slate-600 focus:outline-none ${focusBorder} transition-all`}
        />

        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {url && (
            <button
              type="button"
              onClick={() => runValidation(url, nameHint)}
              title="Re-verify Link"
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg text-[10px] transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${isValidating ? 'animate-spin' : ''}`} />
            </button>
          )}
          <button
            type="button"
            disabled={!result || !result.isValidUrl || isValidating}
            onClick={handleApply}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
              applied
                ? 'bg-emerald-600 text-white'
                : 'bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:hover:bg-blue-600 text-white shadow-sm'
            }`}
          >
            {applied ? (
              <>
                <Check className="w-2.5 h-2.5" />
                <span>Applied</span>
              </>
            ) : (
              <>
                <Sparkles className="w-2.5 h-2.5" />
                <span>Auto-Fill</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Quick Test Samples */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px]">
        <span className="text-slate-500 shrink-0">Quick presets:</span>
        {SAMPLE_CREATOR_URLS.slice(0, 3).map((sample, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleQuickSample(sample.url)}
            className="px-2 py-0.5 rounded-md bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-sky-300 border border-slate-800 text-[10px] shrink-0 transition-colors"
          >
            {sample.name}
          </button>
        ))}
      </div>

      {/* Error Message */}
      {result && !result.isValidUrl && result.errorMessage && (
        <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/50 flex items-start gap-2 text-rose-300 text-[11px]">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">{result.errorMessage}</p>
            <p className="text-[10px] text-rose-400/80 mt-0.5">
              Examples of valid formats: https://youtube.com/@channel, https://twitch.tv/user, @handle
            </p>
          </div>
        </div>
      )}

      {/* PRE-FETCHED METADATA PREVIEW CARD */}
      {result && result.isValidUrl && (
        <div className="bg-[#040813] border border-slate-800/90 rounded-xl p-3 space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Public Creator Metadata
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-300">
                {result.platform}
              </span>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span className="flex items-center gap-1 text-emerald-400">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                {result.sslSecure ? 'SSL Encrypted' : 'Standard'}
              </span>
              <span className="flex items-center gap-0.5 font-mono text-sky-400">
                <Zap className="w-2.5 h-2.5" />
                {result.latencyMs}ms
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            {/* Creator Image & Identity */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative shrink-0">
                <img
                  src={result.avatarUrl}
                  alt={result.creatorName}
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 rounded-full object-cover border-2 border-slate-700 shadow-md bg-slate-900"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://unavatar.io/youtube/${encodeURIComponent(result.handle)}`;
                  }}
                />
                <span
                  title="Image verified and accessible"
                  className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#040813] flex items-center justify-center text-[9px] text-white font-bold"
                >
                  ✓
                </span>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white text-xs truncate">
                    {result.creatorName}
                  </span>
                  {result.isVerified && (
                    <span className="w-3.5 h-3.5 rounded-full bg-sky-500 text-white flex items-center justify-center text-[8px] font-extrabold shrink-0">
                      ✓
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                  <span className="font-mono text-sky-300">{result.handle}</span>
                  <span>•</span>
                   <span className="text-slate-400 font-semibold">{result.followersCount || 'Unavailable'} followers</span>
                </div>
              </div>
            </div>

            {/* Quick Apply Button */}
            <button
              type="button"
              onClick={handleApply}
              className={`px-3 py-1.5 rounded-lg font-bold text-[11px] shrink-0 flex items-center gap-1.5 cursor-pointer transition-all ${
                applied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              {applied ? (
                <>
                  <Check className="w-3 h-3 text-white" />
                  <span>Applied</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Apply to Form</span>
                </>
              )}
            </button>
          </div>

          <div className="pt-1 text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-800/60">
                   <span className="truncate">{result.summary}</span>
            <span className="text-slate-500 shrink-0 ml-2 font-mono">{result.checkedAt}</span>
          </div>
        </div>
      )}
    </div>
  );
};
