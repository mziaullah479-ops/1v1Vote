import React, { useEffect, useState } from 'react';
import { X, Trophy, Medal, Flame, Award } from 'lucide-react';
import { UserProfile } from '../types';
import { MatchStore } from '../data/store';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
}

const FALLBACK_VOTERS = [
  { rank: 1, name: 'Hamza_Voter_PK', votes: 142, points: 2130, badge: 'Grandmaster' },
  { rank: 2, name: 'JimmyFanUSA', votes: 128, points: 1920, badge: 'Master' },
  { rank: 3, name: 'Aarav_DesiClash', votes: 115, points: 1725, badge: 'Master' },
  { rank: 4, name: 'SpeedGang_99', votes: 98, points: 1470, badge: 'Diamond' },
  { rank: 5, name: 'SistrologyFanGirl', votes: 84, points: 1260, badge: 'Platinum' },
  { rank: 6, name: 'KaiMafia_Official', votes: 76, points: 1140, badge: 'Gold' },
];

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [topVoters, setTopVoters] = useState(FALLBACK_VOTERS);

  useEffect(() => {
    if (!isOpen) return;
    void MatchStore.getLeaderboard().then((leaderboard) => {
      if (leaderboard.length) setTopVoters(leaderboard);
    });
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#09101f] border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Community Voter Leaderboard</h3>
            <p className="text-xs text-slate-400">
              Top influencers supporters earning points by voting in every daily battle.
            </p>
          </div>
        </div>

        {/* User Card if logged in */}
        {currentUser && (
          <div className="my-4 bg-[#0e1c36] border border-sky-500/40 rounded-2xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-10 h-10 rounded-full border border-sky-400"
              />
              <div>
                <span className="text-xs text-sky-400 font-bold block">Your Ranking</span>
                <span className="text-sm font-bold text-white">{currentUser.name}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-extrabold text-emerald-400 block">
                {currentUser.points || 120} PTS
              </span>
              <span className="text-[10px] text-slate-400">
                {currentUser.votedMatchIds?.length || 1} Matches Voted
              </span>
            </div>
          </div>
        )}

        {/* Table of Top Voters */}
        <div className="space-y-2 mt-4 max-h-[380px] overflow-y-auto">
          {topVoters.map((v) => (
            <div
              key={v.rank}
              className="flex items-center justify-between p-3 rounded-xl bg-[#060b17] border border-slate-800 text-xs"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                    v.rank === 1
                      ? 'bg-amber-400 text-slate-950 shadow-[0_0_10px_rgba(251,191,36,0.6)]'
                      : v.rank === 2
                      ? 'bg-slate-300 text-slate-950'
                      : v.rank === 3
                      ? 'bg-amber-700 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {v.rank}
                </span>
                <span className="font-bold text-white">{v.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  {v.badge}
                </span>
              </div>

              <div className="text-right">
                <span className="text-sky-400 font-bold block">{v.points} PTS</span>
                <span className="text-[10px] text-slate-500">{v.votes} votes cast</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
