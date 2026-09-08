import React, { useState } from 'react';
import { MessageSquare, ThumbsUp, Send, ShieldAlert, Heart } from 'lucide-react';
import { Match, Comment } from '../types';

interface CommentsSectionProps {
  match: Match;
  comments: Comment[];
  onAddComment: (authorName: string, content: string, allegianceCreatorId?: string) => void;
  onLikeComment: (commentId: string) => void;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({
  match,
  comments,
  onAddComment,
  onLikeComment,
}) => {
  const [authorName, setAuthorName] = useState('');
  const [content, setContent] = useState('');
  const [allegiance, setAllegiance] = useState<string>(match.creator1.id);
  const [filter, setFilter] = useState<'all' | 'c1' | 'c2'>('all');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    onAddComment(authorName, content, allegiance);
    setContent('');
  };

  const filteredComments = comments.filter((c) => {
    if (filter === 'c1') return c.allegianceCreatorId === match.creator1.id;
    if (filter === 'c2') return c.allegianceCreatorId === match.creator2.id;
    return true;
  });

  return (
    <div className="w-full max-w-6xl mx-auto my-8 px-2 sm:px-4">
      <div className="bg-[#070e1c] rounded-3xl p-5 sm:p-7 border border-slate-800/80 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="w-5 h-5 text-sky-400" />
            <h3 className="text-lg sm:text-xl font-bold text-white">
              Creator Fandom Banter ({filteredComments.length})
            </h3>
          </div>

          {/* Filter Pills */}
          <div className="flex max-w-full items-center gap-1.5 overflow-x-auto text-xs bg-[#0b1325] p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setFilter('all')}
                className={`shrink-0 whitespace-nowrap px-3 py-1 rounded-lg font-medium transition-all ${
                filter === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Comments
            </button>
            <button
              onClick={() => setFilter('c1')}
                className={`shrink-0 whitespace-nowrap px-3 py-1 rounded-lg font-medium transition-all ${
                filter === 'c1' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-sky-300'
              }`}
            >
              {match.creator1.name} Fans
            </button>
            <button
              onClick={() => setFilter('c2')}
                className={`shrink-0 whitespace-nowrap px-3 py-1 rounded-lg font-medium transition-all ${
                filter === 'c2' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-orange-300'
              }`}
            >
              {match.creator2.name} Fans
            </button>
          </div>
        </div>

        {/* Comment Input Box */}
        <form onSubmit={handleSubmit} className="mb-8 bg-[#0a1428] rounded-2xl p-4 border border-slate-800/90">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <input
              type="text"
              placeholder="Your name or handle (optional)"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="bg-[#060c18] border border-slate-800 rounded-xl px-3.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 w-full sm:w-60"
            />

            {/* Allegiance Radio Buttons */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 text-[11px] font-semibold">Allegiance:</span>
              <label className="flex items-center gap-1.5 cursor-pointer bg-[#0e1f3a] px-2.5 py-1 rounded-lg border border-sky-600/40 text-sky-300 font-semibold">
                <input
                  type="radio"
                  name="allegiance"
                  checked={allegiance === match.creator1.id}
                  onChange={() => setAllegiance(match.creator1.id)}
                  className="accent-sky-500"
                />
                {match.creator1.name}
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer bg-[#2b170e] px-2.5 py-1 rounded-lg border border-orange-600/40 text-orange-300 font-semibold">
                <input
                  type="radio"
                  name="allegiance"
                  checked={allegiance === match.creator2.id}
                  onChange={() => setAllegiance(match.creator2.id)}
                  className="accent-orange-500"
                />
                {match.creator2.name}
              </label>
            </div>
          </div>

          <div className="relative">
            <textarea
              rows={2}
              placeholder={`Cheer for your creator! Keep banter friendly & fun...`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-[#060c18] border border-slate-800 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 resize-none pr-24"
            />

            <button
              type="submit"
              disabled={!content.trim()}
              className="absolute right-2.5 bottom-3.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
            >
              <Send className="w-3.5 h-3.5" />
              Post
            </button>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-2">
            <ShieldAlert className="w-3 h-3 text-slate-400" />
            <span>Basic moderation is active. Keep fan discussions respectful.</span>
          </div>
        </form>

        {/* Comment List */}
        <div className="space-y-3.5">
          {filteredComments.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              No comments in this section yet. Be the first to cheer for your creator!
            </div>
          ) : (
            filteredComments.map((c) => {
              const isC1 = c.allegianceCreatorId === match.creator1.id;
              const isC2 = c.allegianceCreatorId === match.creator2.id;

              return (
                <div
                  key={c.id}
                  className="bg-[#091122] rounded-2xl p-4 border border-slate-800/60 flex items-start gap-3.5 transition-colors hover:border-slate-700"
                >
                  <img
                    src={c.authorAvatar}
                    alt={c.authorName}
                    className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 shrink-0"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold text-xs sm:text-sm">
                          {c.authorName}
                        </span>

                        {isC1 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-950 text-sky-400 border border-sky-800/60">
                            {match.creator1.name} Supporter
                          </span>
                        )}

                        {isC2 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-950 text-orange-400 border border-orange-800/60">
                            {match.creator2.name} Supporter
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] text-slate-500">{c.timestamp}</span>
                    </div>

                    <p className="text-slate-200 text-xs sm:text-sm leading-relaxed break-words">
                      {c.content}
                    </p>

                    <div className="mt-2.5 flex items-center gap-4 text-xs text-slate-400">
                      <button
                        onClick={() => onLikeComment(c.id)}
                        className="flex items-center gap-1.5 text-slate-400 hover:text-rose-400 active:scale-125 transition-all cursor-pointer font-medium"
                         title="React once to this comment"
                      >
                        <Heart className="w-3.5 h-3.5 fill-current text-rose-500" />
                        <span className="font-mono text-white font-bold">{c.likes}</span>
                         <span className="text-[10px] text-slate-500 hover:text-rose-300">Reactions</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
