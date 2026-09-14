import React, { useEffect, useState } from 'react';
import { Bot, BookOpen, ExternalLink, Send, Sparkles } from 'lucide-react';

interface AiContext {
  profiles?: Array<{ name: string; category: string; country: string; votes: number }>;
}

interface ChatMessage {
  role: 'assistant' | 'user';
  text: string;
}

const quickQuestions = ['How does voting work?', 'Can paid promotion change votes?', 'Where do profiles come from?', 'How can I promote a profile?'];

function answerQuestion(question: string, profileCount: number) {
  const value = question.toLowerCase();
  if (/promot|sponsor|paid|buy|feature/.test(value)) return 'Paid promotion is a separate, time-limited visibility placement. It is labeled Sponsored profile, reviewed by an admin after payment verification, and never changes organic votes or ranking totals. Start at /promote.';
  if (/vote|cooldown|daily|24/.test(value)) return 'Visitors can cast one organic vote for each active profile every 24 hours. Votes are stored server-side and rankings use organic votes first, then shares, then name.';
  if (/source|where|profile|bio|image|data/.test(value)) return `Active profiles represent real public figures and include a biography, category, country, real image, and public source link. The live directory currently contains ${profileCount} active profiles.`;
  if (/rank|leader|top|popular/.test(value)) return 'Open the live rankings at the homepage or /people. The ranking is a public support index, not an official poll or endorsement.';
  return 'I can explain voting, rankings, public sources, profile corrections, paid promotions, and the site data rules. Try one of the suggested questions.';
}

export const AiGuideView: React.FC = () => {
  const [profileCount, setProfileCount] = useState(0);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: 'assistant', text: 'I can explain how 1v1Vote works, how profiles are sourced, and how sponsored promotion stays separate from organic votes.' }]);

  useEffect(() => {
    fetch('/ai-context.json', { cache: 'no-store' }).then((response) => response.json() as Promise<AiContext>).then((data) => setProfileCount(data.profiles?.length || 0)).catch(() => undefined);
  }, []);

  const ask = (text = question) => {
    const clean = text.trim();
    if (!clean) return;
    setMessages((current) => [...current, { role: 'user', text: clean }, { role: 'assistant', text: answerQuestion(clean, profileCount) }]);
    setQuestion('');
  };

  return <main className="min-h-screen bg-[#060a13] px-4 py-8 text-slate-100 sm:px-6 sm:py-14"><div className="mx-auto max-w-6xl"><a href="/" className="text-xs font-bold text-sky-300 hover:text-white">Back to live rankings</a><section className="mt-5 rounded-[2rem] border border-violet-400/25 bg-gradient-to-br from-[#1a1231] via-[#111525] to-[#0a0e19] p-6 shadow-2xl sm:p-10"><div className="flex flex-wrap items-start justify-between gap-5"><div><div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-violet-300"><Sparkles className="h-4 w-4" /> AI guide</div><h1 className="mt-4 max-w-3xl text-3xl font-black tracking-tight text-white sm:text-5xl">Understand 1v1Vote in plain language.</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">Ask about votes, rankings, sources, profile corrections, or paid promotion. This guide uses the same public rules that are published for people and AI systems.</p></div><Bot className="h-12 w-12 text-violet-300" /></div></section><div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_.85fr]"><section className="rounded-3xl border border-slate-800 bg-[#0b1221] p-5 sm:p-7"><div className="flex items-center gap-2 text-sm font-black text-white"><Bot className="h-5 w-5 text-violet-300" /> 1v1Vote assistant</div><div className="mt-5 space-y-3" aria-live="polite">{messages.map((message, index) => <div key={`${message.role}-${index}`} className={`max-w-2xl rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === 'assistant' ? 'border border-violet-400/20 bg-violet-950/20 text-slate-200' : 'ml-auto bg-sky-500 text-slate-950'}`}>{message.text}</div>)}</div><div className="mt-5 flex flex-wrap gap-2">{quickQuestions.map((item) => <button key={item} type="button" onClick={() => ask(item)} className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 hover:border-violet-400 hover:text-white">{item}</button>)}</div><form onSubmit={(event) => { event.preventDefault(); ask(); }} className="mt-5 flex gap-2"><input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about 1v1Vote" className="min-h-11 min-w-0 flex-1 rounded-xl border border-slate-700 bg-[#060b17] px-4 text-sm text-white outline-none focus:border-violet-400" /><button aria-label="Ask assistant" className="flex min-h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-400 text-slate-950"><Send className="h-4 w-4" /></button></form></section><aside className="space-y-5"><div className="rounded-3xl border border-slate-800 bg-[#0b1221] p-5 sm:p-6"><div className="flex items-center gap-2 text-sm font-black text-white"><BookOpen className="h-5 w-5 text-sky-300" /> Public AI resources</div><p className="mt-3 text-sm leading-6 text-slate-400">The live context currently describes {profileCount || 'the'} active public profiles and the rules that separate organic votes from sponsored visibility.</p><div className="mt-5 space-y-2"><a href="/llms.txt" className="flex items-center justify-between rounded-xl border border-slate-800 bg-[#060b17] px-3 py-3 text-xs font-bold text-slate-200 hover:border-sky-400">Read llms.txt <ExternalLink className="h-4 w-4" /></a><a href="/ai-context.json" className="flex items-center justify-between rounded-xl border border-slate-800 bg-[#060b17] px-3 py-3 text-xs font-bold text-slate-200 hover:border-sky-400">Open live JSON context <ExternalLink className="h-4 w-4" /></a><a href="/sources" className="flex items-center justify-between rounded-xl border border-slate-800 bg-[#060b17] px-3 py-3 text-xs font-bold text-slate-200 hover:border-sky-400">Profile source policy <ExternalLink className="h-4 w-4" /></a></div></div><div className="rounded-3xl border border-emerald-500/25 bg-emerald-950/15 p-5 text-xs leading-6 text-emerald-100"><strong>Important:</strong> A sponsored placement is visibility advertising. It is not an organic vote, endorsement, or change to the ranking calculation.</div></aside></div></div></main>;
};
