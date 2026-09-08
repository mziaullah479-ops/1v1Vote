import React, { useState } from 'react';
import { PlusCircle, BarChart3, AlertTriangle, CheckCircle, Flame, Users, Calendar, Trophy, Trash2, Link, Sparkles, Image, RefreshCw, Loader2, Check, ShieldCheck } from 'lucide-react';
import { Match, Creator, Platform, Region } from '../types';
import { fetchSocialProfile } from '../utils/socialDetector';
import { UrlValidatorCard } from './UrlValidatorCard';

interface AdminPanelProps {
  matches: Match[];
  onAddMatch: (matchData: Partial<Match>) => void;
  onEndMatch: (matchId: string, winnerId?: string) => void;
}

function parseSubscribersToRaw(subsStr: string): number {
  if (!subsStr) return 1000000;
  const clean = subsStr.trim().toUpperCase();
  const match = clean.match(/([\d.]+)\s*([MK]?)/);
  if (!match) return 1000000;
  const val = parseFloat(match[1]);
  const unit = match[2];
  if (unit === 'M') return Math.floor(val * 1000000);
  if (unit === 'K') return Math.floor(val * 1000);
  return Math.floor(val) || 1000000;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ matches, onAddMatch, onEndMatch }) => {
  // Form states
  const [c1Name, setC1Name] = useState('');
  const [c1Avatar, setC1Avatar] = useState('');
  const [c1ChannelLogo, setC1ChannelLogo] = useState('');
  const [c1Subs, setC1Subs] = useState('');
  const [c1Platform, setC1Platform] = useState<Platform>('YouTube');
  const [c1Region, setC1Region] = useState<Region>('Pakistan');
  const [c1ProfileUrl, setC1ProfileUrl] = useState('');
  const [c1Growth, setC1Growth] = useState('+1,800 today');
  const [isDetectingC1, setIsDetectingC1] = useState(false);
  const [c1UrlValid, setC1UrlValid] = useState(true);

  const [c2Name, setC2Name] = useState('');
  const [c2Avatar, setC2Avatar] = useState('');
  const [c2ChannelLogo, setC2ChannelLogo] = useState('');
  const [c2Subs, setC2Subs] = useState('');
  const [c2Platform, setC2Platform] = useState<Platform>('YouTube');
  const [c2Region, setC2Region] = useState<Region>('USA');
  const [c2ProfileUrl, setC2ProfileUrl] = useState('');
  const [c2Growth, setC2Growth] = useState('+2,400 today');
  const [isDetectingC2, setIsDetectingC2] = useState(false);
  const [c2UrlValid, setC2UrlValid] = useState(true);

  const [durationDays, setDurationDays] = useState(3);
  const [isTrending, setIsTrending] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');

  // Auto detect from link handlers with real metadata & logo extraction
  const handleAutoDetectC1 = async (url: string) => {
    setC1ProfileUrl(url);
    if (!url.trim()) return;
    setIsDetectingC1(true);
    setStatusMessage('یو آر ایل سے حقیقی سبسکرائبرز اور چینل کا لوگو حاصل کیا جا رہا ہے (Fetching real channel stats & logo)...');
    try {
      const detected = await fetchSocialProfile(url, c1Name);
      setC1Platform(detected.platform);
      if (!c1Name || c1Name === 'New Creator') setC1Name(detected.name);
      
      const realLogo = detected.avatarUrl || detected.channelLogoUrl;
      setC1ChannelLogo(realLogo);
      setC1Avatar(realLogo); // Default to genuine channel logo
      setC1Subs(detected.followersCount);
      setC1Growth(detected.growthRate);
      setStatusMessage(`✓ چینل کا اصل لوگو اور ${detected.followersCount} سبسکرائبرز کامیابی سے ڈیٹیکٹ ہو گئے!`);
    } catch (e) {
      console.error('Error auto-detecting C1:', e);
      setStatusMessage('Auto-detect finished with available channel data.');
    } finally {
      setIsDetectingC1(false);
    }
  };

  const handleAutoDetectC2 = async (url: string) => {
    setC2ProfileUrl(url);
    if (!url.trim()) return;
    setIsDetectingC2(true);
    setStatusMessage('یو آر ایل سے حقیقی سبسکرائبرز اور چینل کا لوگو حاصل کیا جا رہا ہے (Fetching real channel stats & logo)...');
    try {
      const detected = await fetchSocialProfile(url, c2Name);
      setC2Platform(detected.platform);
      if (!c2Name || c2Name === 'New Creator') setC2Name(detected.name);

      const realLogo = detected.avatarUrl || detected.channelLogoUrl;
      setC2ChannelLogo(realLogo);
      setC2Avatar(realLogo); // Default to genuine channel logo
      setC2Subs(detected.followersCount);
      setC2Growth(detected.growthRate);
      setStatusMessage(`✓ چینل کا اصل لوگو اور ${detected.followersCount} سبسکرائبرز کامیابی سے ڈیٹیکٹ ہو گئے!`);
    } catch (e) {
      console.error('Error auto-detecting C2:', e);
      setStatusMessage('Auto-detect finished with available channel data.');
    } finally {
      setIsDetectingC2(false);
    }
  };

  // Analytics
  const totalVotes = matches.reduce((acc, m) => acc + m.votes1 + m.votes2, 0);
  const activeCount = matches.filter((m) => m.status === 'active').length;
  const endedCount = matches.filter((m) => m.status === 'ended').length;
  const mostPopular = [...matches].sort((a, b) => (b.votes1 + b.votes2) - (a.votes1 + a.votes2))[0];

  const handleSubmitNewMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!c1Name.trim() || !c2Name.trim()) {
      setStatusMessage('Please provide names for both creators.');
      return;
    }

    if (!c1UrlValid || !c2UrlValid) {
      setStatusMessage('⚠️ Please fix the invalid creator URL(s) before publishing the battle.');
      return;
    }

    // Default to genuine channel logo if no custom override image was pasted
    const finalAvatar1 = c1Avatar.trim() || c1ChannelLogo.trim() || `https://unavatar.io/youtube/${encodeURIComponent(c1Name)}`;
    const finalAvatar2 = c2Avatar.trim() || c2ChannelLogo.trim() || `https://unavatar.io/youtube/${encodeURIComponent(c2Name)}`;

    const rawSubs1 = parseSubscribersToRaw(c1Subs);
    const rawSubs2 = parseSubscribersToRaw(c2Subs);

    const creator1: Creator = {
      id: 'c-' + Date.now() + '-1',
      name: c1Name.trim(),
      slug: c1Name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      avatar: finalAvatar1,
      subscribers: c1Subs.trim() || '1.0M',
      subscriberCountRaw: rawSubs1,
      platform: c1Platform,
      region: c1Region,
      verified: true,
      color: '#38bdf8',
      profileUrl: c1ProfileUrl.trim() || undefined,
      followersCount: c1Subs.trim() || '1.0M',
      growthRate: c1Growth || '+1,800 today',
      growthTrend: 'up',
    };

    const creator2: Creator = {
      id: 'c-' + Date.now() + '-2',
      name: c2Name.trim(),
      slug: c2Name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      avatar: finalAvatar2,
      subscribers: c2Subs.trim() || '1.0M',
      subscriberCountRaw: rawSubs2,
      platform: c2Platform,
      region: c2Region,
      verified: true,
      color: '#fb923c',
      profileUrl: c2ProfileUrl.trim() || undefined,
      followersCount: c2Subs.trim() || '1.0M',
      growthRate: c2Growth || '+2,000 today',
      growthTrend: 'up',
    };

    const startTime = new Date().toISOString();
    const endTime = new Date(Date.now() + 1000 * 60 * 60 * 24 * durationDays).toISOString();

    // High volatility initial stock history points with clear separation and trading wave swings
    const initialHistoryPoints = [
      { timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), timeLabel: '06h ago', p1: 42.0, p2: 58.0 },
      { timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), timeLabel: '04h ago', p1: 53.5, p2: 46.5 },
      { timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), timeLabel: '02h ago', p1: 48.0, p2: 52.0 }, // dip
      { timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),     timeLabel: '30m ago', p1: 64.2, p2: 35.8 }, // breakout surge (28.4% wide gap)
      { timestamp: new Date().toISOString(),                                 timeLabel: 'Live',    p1: 60.5, p2: 39.5 },
    ];

    onAddMatch({
      creator1,
      creator2,
      startTime,
      endTime,
      votes1: 0,
      votes2: 0,
      category: c1Platform,
      region: c1Region === c2Region ? c1Region : 'Global',
      isTrending,
      description: `Official Live Battle: ${creator1.name} vs ${creator2.name}! Real-time trading vote chart with volatile live waves.`,
      historyPoints: initialHistoryPoints,
    });

    setStatusMessage(`Successfully created live battle: ${creator1.name} vs ${creator2.name}!`);
    // Clear inputs
    setC1Name('');
    setC1Avatar('');
    setC1ChannelLogo('');
    setC1Subs('');
    setC1ProfileUrl('');
    setC2Name('');
    setC2Avatar('');
    setC2ChannelLogo('');
    setC2Subs('');
    setC2ProfileUrl('');

    setTimeout(() => setStatusMessage(''), 5000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto my-8 px-2 sm:px-4 animate-fade-in">
      {/* Top Banner */}
      <div className="bg-[#0b1324] border border-amber-500/40 rounded-3xl p-6 mb-8 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              1v1Vote Admin Control Panel
            </h2>
            <p className="text-xs text-slate-400">
              Manage live creator matchups, create battles, declare winners, and review platform engagement metrics.
            </p>
          </div>
        </div>

        {/* Analytics Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6">
          <div className="bg-[#080d1a] p-4 rounded-2xl border border-slate-800">
            <div className="text-xs text-slate-400 font-semibold mb-1">Total Platform Votes</div>
            <div className="text-2xl font-black text-sky-400">{totalVotes.toLocaleString()}</div>
          </div>
          <div className="bg-[#080d1a] p-4 rounded-2xl border border-slate-800">
            <div className="text-xs text-slate-400 font-semibold mb-1">Active Battles</div>
            <div className="text-2xl font-black text-emerald-400">{activeCount}</div>
          </div>
          <div className="bg-[#080d1a] p-4 rounded-2xl border border-slate-800">
            <div className="text-xs text-slate-400 font-semibold mb-1">Concluded Battles</div>
            <div className="text-2xl font-black text-amber-400">{endedCount}</div>
          </div>
          <div className="bg-[#080d1a] p-4 rounded-2xl border border-slate-800">
            <div className="text-xs text-slate-400 font-semibold mb-1">Most Trending Battle</div>
            <div className="text-xs font-bold text-white truncate mt-2">
              {mostPopular ? mostPopular.title : 'None yet'}
            </div>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="mb-6 bg-emerald-950/70 border border-emerald-500/70 text-emerald-300 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {statusMessage}
        </div>
      )}

      {/* Grid: Create New Match & Active Matches Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ================= FORM: ADD NEW MATCHUP ================= */}
        <div className="lg:col-span-6 bg-[#070e1b] rounded-3xl p-6 border border-slate-800">
          <div className="flex items-center gap-2 mb-5 pb-3 border-b border-slate-800">
            <PlusCircle className="w-5 h-5 text-sky-400" />
            <h3 className="text-lg font-bold text-white">Create New Matchup</h3>
          </div>

          <form onSubmit={handleSubmitNewMatch} className="space-y-4 text-xs">
            {/* Creator 1 Details */}
            <div className="bg-[#0a1426] p-4 rounded-2xl border border-sky-600/30">
              <span className="text-sky-400 font-bold block mb-3 uppercase tracking-wider text-[11px]">
                Creator 1 (Blue Corner)
              </span>

              <div className="space-y-2.5">
                {/* Social Media Link & Auto-Detect */}
                <div className="bg-[#050c18] p-3 rounded-xl border border-sky-500/25">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sky-300 font-semibold flex items-center gap-1.5 text-[11px]">
                      <Link className="w-3.5 h-3.5 text-sky-400" />
                      Social Media Profile URL (YouTube / TikTok / IG / Twitch)
                    </label>
                    <span className="text-[10px] text-emerald-400 font-bold">✓ Real-time Scraper</span>
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      type="url"
                      placeholder="e.g. https://youtube.com/@duckybhai or https://youtube.com/@CarryMinati"
                      value={c1ProfileUrl}
                      onChange={(e) => setC1ProfileUrl(e.target.value)}
                      className="flex-1 bg-[#060b16] border border-slate-800 rounded-lg px-2.5 py-2 text-white text-xs focus:outline-none focus:border-sky-500"
                    />
                    <button
                      type="button"
                      disabled={isDetectingC1}
                      onClick={() => handleAutoDetectC1(c1ProfileUrl)}
                      className="px-3 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold rounded-lg text-[10px] flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm transition-all"
                      title="Auto-detect real channel logo, subscribers, and stats"
                    >
                      {isDetectingC1 ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Scraping...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Auto-Detect</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5">
                    یو آر ایل ڈال کر Auto-Detect دبائیں تو اصل سبسکرائبرز اور چینل کا اصل لوگو فوری لگ جائے گا۔
                  </p>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Creator Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ducky Bhai, CarryMinati"
                    value={c1Name}
                    onChange={(e) => setC1Name(e.target.value)}
                    className="w-full bg-[#060b16] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">Subscribers / Followers</label>
                    <input
                      type="text"
                      placeholder="e.g. 10.2M"
                      value={c1Subs}
                      onChange={(e) => setC1Subs(e.target.value)}
                      className="w-full bg-[#060b16] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Platform</label>
                    <select
                      value={c1Platform}
                      onChange={(e) => setC1Platform(e.target.value as Platform)}
                      className="w-full bg-[#060b16] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                    >
                      <option value="YouTube">YouTube</option>
                      <option value="TikTok">TikTok</option>
                      <option value="Instagram">Instagram</option>
                      <option value="Twitch">Twitch</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">Region</label>
                    <select
                      value={c1Region}
                      onChange={(e) => setC1Region(e.target.value as Region)}
                      className="w-full bg-[#060b16] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                    >
                      <option value="Pakistan">Pakistan</option>
                      <option value="India">India</option>
                      <option value="USA">USA</option>
                      <option value="Global">Global</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Photo URL (Optional Override)</label>
                    <input
                      type="url"
                      placeholder="Paste custom image URL or leave blank"
                      value={c1Avatar}
                      onChange={(e) => setC1Avatar(e.target.value)}
                      className="w-full bg-[#060b16] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                {/* Detected Channel Logo / Avatar Preview Status */}
                {(c1ChannelLogo || c1Avatar) && (
                  <div className="bg-[#050c19] border border-sky-900/50 p-2.5 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={c1Avatar || c1ChannelLogo}
                        alt="Preview"
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover border-2 border-sky-400 shadow shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://unavatar.io/youtube/${encodeURIComponent(c1Name || 'creator')}`;
                        }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-sky-300 truncate">
                            {c1Avatar && c1Avatar !== c1ChannelLogo ? 'Custom Photo Active' : 'Official Channel Logo Active'}
                          </span>
                          <span className="bg-emerald-950 border border-emerald-500/50 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded font-bold">
                            ✓ Ready
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate">
                          {c1Avatar && c1Avatar !== c1ChannelLogo
                            ? 'Using your custom image URL override'
                            : 'چینل والا اصل لوگو استعمال ہوگا (ڈیفالٹ)'}
                        </p>
                      </div>
                    </div>

                    {c1ChannelLogo && c1Avatar !== c1ChannelLogo && (
                      <button
                        type="button"
                        onClick={() => setC1Avatar(c1ChannelLogo)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded-lg shrink-0 flex items-center gap-1 cursor-pointer transition-colors"
                        title="Revert back to genuine channel logo"
                      >
                        <RefreshCw className="w-2.5 h-2.5" />
                        Use Channel Logo
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Creator 2 Details */}
            <div className="bg-[#1c120a] p-4 rounded-2xl border border-orange-600/30">
              <span className="text-orange-400 font-bold block mb-3 uppercase tracking-wider text-[11px]">
                Creator 2 (Orange Corner)
              </span>

              <div className="space-y-2.5">
                {/* Social Media Link & Auto-Detect */}
                <div className="bg-[#140b04] p-3 rounded-xl border border-orange-500/25">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-orange-300 font-semibold flex items-center gap-1.5 text-[11px]">
                      <Link className="w-3.5 h-3.5 text-orange-400" />
                      Social Media Profile URL (YouTube / TikTok / IG / Twitch)
                    </label>
                    <span className="text-[10px] text-emerald-400 font-bold">✓ Real-time Scraper</span>
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      type="url"
                      placeholder="e.g. https://youtube.com/@mrbeastgaming or https://twitch.tv/kaicenat"
                      value={c2ProfileUrl}
                      onChange={(e) => setC2ProfileUrl(e.target.value)}
                      className="flex-1 bg-[#060b16] border border-slate-800 rounded-lg px-2.5 py-2 text-white text-xs focus:outline-none focus:border-orange-500"
                    />
                    <button
                      type="button"
                      disabled={isDetectingC2}
                      onClick={() => handleAutoDetectC2(c2ProfileUrl)}
                      className="px-3 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold rounded-lg text-[10px] flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm transition-all"
                      title="Auto-detect real channel logo, subscribers, and stats"
                    >
                      {isDetectingC2 ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Scraping...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Auto-Detect</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5">
                    یو آر ایل ڈال کر Auto-Detect دبائیں تو اصل سبسکرائبرز اور چینل کا اصل لوگو فوری لگ جائے گا۔
                  </p>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Creator Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MrBeast Gaming, Kai Cenat"
                    value={c2Name}
                    onChange={(e) => setC2Name(e.target.value)}
                    className="w-full bg-[#060b16] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">Subscribers / Followers</label>
                    <input
                      type="text"
                      placeholder="e.g. 44.8M"
                      value={c2Subs}
                      onChange={(e) => setC2Subs(e.target.value)}
                      className="w-full bg-[#060b16] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Platform</label>
                    <select
                      value={c2Platform}
                      onChange={(e) => setC2Platform(e.target.value as Platform)}
                      className="w-full bg-[#060b16] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                    >
                      <option value="YouTube">YouTube</option>
                      <option value="TikTok">TikTok</option>
                      <option value="Instagram">Instagram</option>
                      <option value="Twitch">Twitch</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">Region</label>
                    <select
                      value={c2Region}
                      onChange={(e) => setC2Region(e.target.value as Region)}
                      className="w-full bg-[#060b16] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                    >
                      <option value="USA">USA</option>
                      <option value="Pakistan">Pakistan</option>
                      <option value="India">India</option>
                      <option value="Global">Global</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Photo URL (Optional Override)</label>
                    <input
                      type="url"
                      placeholder="Paste custom image URL or leave blank"
                      value={c2Avatar}
                      onChange={(e) => setC2Avatar(e.target.value)}
                      className="w-full bg-[#060b16] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                {/* Detected Channel Logo / Avatar Preview Status */}
                {(c2ChannelLogo || c2Avatar) && (
                  <div className="bg-[#140b04] border border-orange-900/50 p-2.5 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={c2Avatar || c2ChannelLogo}
                        alt="Preview"
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover border-2 border-orange-400 shadow shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://unavatar.io/youtube/${encodeURIComponent(c2Name || 'creator')}`;
                        }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-orange-300 truncate">
                            {c2Avatar && c2Avatar !== c2ChannelLogo ? 'Custom Photo Active' : 'Official Channel Logo Active'}
                          </span>
                          <span className="bg-emerald-950 border border-emerald-500/50 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded font-bold">
                            ✓ Ready
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate">
                          {c2Avatar && c2Avatar !== c2ChannelLogo
                            ? 'Using your custom image URL override'
                            : 'چینل والا اصل لوگو استعمال ہوگا (ڈیفالٹ)'}
                        </p>
                      </div>
                    </div>

                    {c2ChannelLogo && c2Avatar !== c2ChannelLogo && (
                      <button
                        type="button"
                        onClick={() => setC2Avatar(c2ChannelLogo)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded-lg shrink-0 flex items-center gap-1 cursor-pointer transition-colors"
                        title="Revert back to genuine channel logo"
                      >
                        <RefreshCw className="w-2.5 h-2.5" />
                        Use Channel Logo
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Duration Settings */}
            <div className="flex items-center justify-between gap-4 bg-[#0a1122] p-3 rounded-xl border border-slate-800">
              <div>
                <label className="text-slate-300 font-semibold block mb-0.5">
                  Match Duration Window
                </label>
                <span className="text-slate-500 text-[10px]">
                  Configured match expiration time (2-3 days standard)
                </span>
              </div>
              <select
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                className="bg-[#060b16] border border-slate-700 rounded-lg px-3 py-1.5 text-white"
              >
                <option value={1}>24 Hours</option>
                <option value={2}>2 Days</option>
                <option value={3}>3 Days (Standard)</option>
                <option value={5}>5 Days</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Publish Battle to Live Arena
            </button>
          </form>
        </div>

        {/* ================= TABLE: ACTIVE BATTLES & MANUAL RESOLUTION ================= */}
        <div className="lg:col-span-6 bg-[#070e1b] rounded-3xl p-6 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-400" />
                <h3 className="text-lg font-bold text-white">Live Matches Control</h3>
              </div>
              <span className="text-xs text-slate-400">{matches.length} Total Registered</span>
            </div>

            <div className="space-y-3.5 max-h-[520px] overflow-y-auto pr-1">
              {matches.map((m) => {
                const total = m.votes1 + m.votes2;
                const p1 = total > 0 ? ((m.votes1 / total) * 100).toFixed(1) : '50.0';
                const p2 = total > 0 ? ((m.votes2 / total) * 100).toFixed(1) : '50.0';

                return (
                  <div
                    key={m.id}
                    className="bg-[#0a1224] rounded-2xl p-4 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-white text-sm truncate">
                          {m.creator1.name} vs {m.creator2.name}
                        </span>
                        {m.status === 'active' ? (
                          <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-800">
                            LIVE
                          </span>
                        ) : (
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                            ENDED
                          </span>
                        )}
                      </div>

                      <div className="text-slate-400 flex items-center gap-3 text-[11px]">
                        <span>Votes: {total.toLocaleString()}</span>
                        <span>
                          Split: <span className="text-sky-400">{p1}%</span> /{' '}
                          <span className="text-orange-400">{p2}%</span>
                        </span>
                      </div>
                    </div>

                    {/* Admin Action: Manual End / Declare Winner */}
                    {m.status === 'active' && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => onEndMatch(m.id, m.creator1.id)}
                          className="px-2.5 py-1 rounded-lg bg-sky-900/40 hover:bg-sky-800/60 border border-sky-700/50 text-sky-300 text-[11px] font-semibold"
                          title="Declare Creator 1 as Winner"
                        >
                          Win C1
                        </button>
                        <button
                          onClick={() => onEndMatch(m.id, m.creator2.id)}
                          className="px-2.5 py-1 rounded-lg bg-orange-900/40 hover:bg-orange-800/60 border border-orange-700/50 text-orange-300 text-[11px] font-semibold"
                          title="Declare Creator 2 as Winner"
                        >
                          Win C2
                        </button>
                        <button
                          onClick={() => onEndMatch(m.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-900/40 hover:bg-rose-800/60 border border-rose-700/50 text-rose-300 text-[11px] font-semibold"
                          title="Conclude match with current score"
                        >
                          End Battle
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
