import React, { useState } from 'react';
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

interface Club {
  id: string;
  name: string;
  bookTitle: string;
  membersCount: number;
  messages: { id: string; user: string; text: string; time: string }[];
}

export const Social: React.FC = () => {
  const { xp } = useGame();
  const { profile } = useAuth();

  const [activeTab, setActiveTab] = useState<'leaderboard' | 'clubs'>('leaderboard');
  
  // Friends search stub
  const [friendSearch, setFriendSearch] = useState('');
  const [friendAddedMsg, setFriendAddedMsg] = useState('');

  // Reading Club state
  const [activeClubId, setActiveClubId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');

  // Weekly Leaderboard users (computed with user's live XP!)
  const LEADERBOARD_USERS: LeaderboardUser[] = [
    { rank: 1, name: 'Zoe R.', avatar: '👩‍🎨', xp: 450 },
    { rank: 2, name: 'Sarah L.', avatar: '🙋‍♀️', xp: 320 },
    { rank: 3, name: profile?.display_name || 'Reader', avatar: '🦊', xp: Math.max(xp, 180), isCurrentUser: true },
    { rank: 4, name: 'Michael K.', avatar: '🙋‍♂️', xp: 140 },
    { rank: 5, name: 'Anna W.', avatar: '👩‍⚕️', xp: 90 },
  ].sort((a, b) => b.xp - a.xp).map((item, idx) => ({ ...item, rank: idx + 1 }));

  // Mock Reading Clubs
  const [clubs, setClubs] = useState<Club[]>([
    {
      id: 'c1',
      name: 'Stoic Philosophers',
      bookTitle: 'Seneca Meditation on Time',
      membersCount: 14,
      messages: [
        { id: 'm1', user: 'Zoe R.', text: 'Emerson and Seneca have such matching views on time!', time: '10:14 AM' },
        { id: 'm2', user: 'Sarah L.', text: 'Agree! It is not that life is short, but we waste it.', time: '11:05 AM' },
      ],
    },
    {
      id: 'c2',
      name: 'Sci-Fi Club',
      bookTitle: 'The Metamorphosis',
      membersCount: 8,
      messages: [
        { id: 'm3', user: 'Michael K.', text: 'Kafka starting off with Gregor turning into a bug is wild.', time: 'Yesterday' },
      ],
    },
  ]);

  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendSearch) return;
    setFriendAddedMsg(`✨ Invitation sent to "${friendSearch}"!`);
    setFriendSearch('');
    setTimeout(() => setFriendAddedMsg(''), 3000);
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment || !activeClubId) return;

    setClubs((prevClubs) =>
      prevClubs.map((club) => {
        if (club.id === activeClubId) {
          return {
            ...club,
            messages: [
              ...club.messages,
              {
                id: Math.random().toString(),
                user: profile?.display_name || 'Reader',
                text: newComment,
                time: 'Just Now',
              },
            ],
          };
        }
        return club;
      })
    );
    setNewComment('');
  };

  const activeClub = clubs.find((c) => c.id === activeClubId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-28 px-6 pt-6 max-w-md mx-auto relative select-none">
      
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl font-black text-white">Social Leagues</h1>
      </header>

      {/* Tabs Selector */}
      <div className="flex bg-slate-900/60 p-1 border border-slate-900 rounded-2xl mb-8">
        <button
          onClick={() => {
            setActiveTab('leaderboard');
            setActiveClubId(null);
          }}
          className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition duration-300 cursor-pointer ${
            activeTab === 'leaderboard'
              ? 'bg-orange-500 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Weekly League
        </button>
        <button
          onClick={() => setActiveTab('clubs')}
          className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition duration-300 cursor-pointer ${
            activeTab === 'clubs'
              ? 'bg-orange-500 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Reading Clubs
        </button>
      </div>

      {/* TAB 1: LEADERBOARD LEAGUE */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-6">
          {/* Add Friend Row */}
          <form onSubmit={handleAddFriend} className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={friendSearch}
                onChange={(e) => setFriendSearch(e.target.value)}
                placeholder="Search friend username..."
                className="flex-1 bg-slate-900 border border-slate-800 text-slate-100 text-xs rounded-xl px-3 py-2.5 outline-none focus:border-orange-500"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-orange-500 hover:bg-orange-400 transition font-bold rounded-xl text-xs text-white cursor-pointer"
              >
                Add
              </button>
            </div>
            {friendAddedMsg && (
              <div className="text-[11px] font-bold text-emerald-400">
                {friendAddedMsg}
              </div>
            )}
          </form>

          {/* Leaderboard list */}
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
      )}

      {/* TAB 2: READING CLUBS */}
      {activeTab === 'clubs' && (
        <div className="space-y-6">
          {!activeClub ? (
            <div className="space-y-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Join a reading circle and discuss classic texts:
              </p>
              
              <div className="grid grid-cols-1 gap-4">
                {clubs.map((club) => (
                  <div
                    key={club.id}
                    onClick={() => setActiveClubId(club.id)}
                    className="p-5 bg-slate-900/30 border border-slate-900 hover:border-slate-800/80 rounded-2xl transition duration-300 flex items-center justify-between cursor-pointer group"
                  >
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-extrabold text-white group-hover:text-orange-400 transition">
                        {club.name}
                      </h3>
                      <p className="text-xs text-slate-500 truncate mt-1">Reading: {club.bookTitle}</p>
                      <span className="text-[10px] font-bold text-slate-400 mt-2 block">
                        👥 {club.membersCount} active readers
                      </span>
                    </div>
                    <span className="text-slate-600 group-hover:text-orange-500 transition text-lg pl-4">→</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Club Chat Window View */
            <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-5 space-y-4">
              
              {/* Back out button */}
              <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                <button
                  onClick={() => setActiveClubId(null)}
                  className="text-slate-400 hover:text-slate-200 text-sm font-bold cursor-pointer"
                >
                  ← Back
                </button>
                <div>
                  <h3 className="font-black text-white text-sm">{activeClub.name}</h3>
                  <span className="text-[10px] text-slate-500">Reading: {activeClub.bookTitle}</span>
                </div>
              </div>

              {/* Message History */}
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {activeClub.messages.map((msg) => (
                  <div key={msg.id} className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-black text-orange-400">{msg.user}</span>
                      <span className="text-[8px] text-slate-600 font-bold">{msg.time}</span>
                    </div>
                    <p className="text-xs text-slate-300 bg-slate-950/40 p-2.5 rounded-xl border border-slate-900/80 leading-relaxed">
                      {msg.text}
                    </p>
                  </div>
                ))}
              </div>

              {/* Message Comment Form input */}
              <form onSubmit={handlePostComment} className="flex gap-2 pt-2 border-t border-slate-800">
                <input
                  type="text"
                  required
                  placeholder="Share your thoughts..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-xl px-3 py-2 outline-none focus:border-orange-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-400 transition font-bold rounded-xl text-xs text-white cursor-pointer"
                >
                  Send
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Bottom Spacer Nav */}
      <BottomNav />
    </div>
  );
};
export default Social;
