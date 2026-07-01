import React from 'react';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import { BottomNav } from '../components/BottomNav';

interface LeaderboardUser {
  rank: number;
  name: string;
  avatar: string;
  xp: number;
  isCurrentUser?: boolean;
}

export const Social: React.FC = () => {
  const { xp } = useGame();
  const { profile } = useAuth();

  // Weekly Leaderboard users (computed with user's live XP!)
  const LEADERBOARD_USERS: LeaderboardUser[] = [
    { rank: 1, name: 'Zoe R.', avatar: '👩‍🎨', xp: 450 },
    { rank: 2, name: 'Sarah L.', avatar: '🙋‍♀️', xp: 320 },
    { rank: 3, name: profile?.display_name || 'Reader', avatar: '🦊', xp: Math.max(xp, 180), isCurrentUser: true },
    { rank: 4, name: 'Michael K.', avatar: '🙋‍♂️', xp: 140 },
    { rank: 5, name: 'Anna W.', avatar: '👩‍⚕️', xp: 90 },
  ].sort((a, b) => b.xp - a.xp).map((item, idx) => ({ ...item, rank: idx + 1 }));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-28 px-6 pt-6 max-w-md mx-auto relative select-none">
      
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl font-black text-white">Social Leagues</h1>
        <p className="text-xs text-slate-400 mt-1">See how your weekly XP compares to other scholars.</p>
      </header>

      {/* Leaderboard list */}
      <div className="space-y-6">
        <div className="bg-slate-900/40 border border-slate-900 rounded-3xl overflow-hidden divide-y divide-slate-950">
          {LEADERBOARD_USERS.map((item) => (
            <div
              key={item.name}
              className={`p-4 flex items-center gap-4 transition duration-300 ${
                item.isCurrentUser ? 'bg-orange-500/10' : ''
              }`}
            >
              {/* Rank Badge */}
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0">
                {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : `${item.rank}`}
              </div>

              {/* Avatar */}
              <span className="text-2xl select-none">{item.avatar}</span>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <h3 className="font-extrabold text-white text-sm truncate">
                  {item.name} {item.isCurrentUser && <span className="text-[9px] bg-orange-500 text-white px-2 py-0.5 rounded-full uppercase ml-1">You</span>}
                </h3>
              </div>

              {/* XP */}
              <span className="font-black text-slate-300 text-xs shrink-0">{item.xp} XP</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Spacer Nav */}
      <BottomNav />
    </div>
  );
};
export default Social;
