import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import { db } from '../lib/db';
import { Confetti } from '../components/Confetti';

export const Milestone: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { streak, refreshStats } = useGame();

  const [recording, setRecording] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const [keepPrivate, setKeepPrivate] = useState(true);
  const [saving, setSaving] = useState(false);

  // Trigger state check
  const [triggerName, setTriggerName] = useState('Goal Unlocked');
  const [badgeDetails, setBadgeDetails] = useState({
    name: 'Habit Champion',
    icon: '🏆',
    desc: 'You completed your first milestone target!',
  });

  useEffect(() => {
    refreshStats();
    // Dynamically identify milestone trigger based on streak count
    const currentStreak = streak?.current_streak || 1;
    if (currentStreak >= 7) {
      setTriggerName('7-Day Streak Milestone!');
      setBadgeDetails({
        name: '7-Day Streak',
        icon: '🔥',
        desc: '7 days of consistent daily habit reading!',
      });
    } else {
      setTriggerName('Reading Milestone Unlocked!');
      setBadgeDetails({
        name: 'Bookworm',
        icon: '🐛',
        desc: 'Finished an entire book from your library!',
      });
    }
  }, [streak]);

  const handleSaveVideo = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Log milestone video record stub
      await db.addMilestoneVideo(
        user.id,
        triggerName,
        'https://example.com/mock-video-url.mp4',
        keepPrivate ? 'private' : 'shared'
      );
      // Award special badge for video reflection
      await db.awardBadge(user.id, 'genre_explorer');
    } catch (e) {
      console.error('Error saving milestone video:', e);
    } finally {
      setSaving(false);
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between px-6 py-10 max-w-md mx-auto relative overflow-hidden select-none">
      
      {/* Full-screen confetti effect */}
      <Confetti />

      {/* Top Section */}
      <div className="text-center space-y-6 pt-10">
        <span className="text-6xl animate-bounce block select-none">🏆</span>
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-white">{triggerName}</h1>
          <p className="text-slate-400 text-sm">You've unlocked a new milestone achievement!</p>
        </div>

        {/* Badge Card Unlocked */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xs mx-auto space-y-3 shadow-xl">
          <span className="text-5xl block select-none">{badgeDetails.icon}</span>
          <div>
            <h3 className="font-extrabold text-white text-lg">{badgeDetails.name}</h3>
            <p className="text-slate-400 text-xs mt-1">{badgeDetails.desc}</p>
          </div>
        </div>
      </div>

      {/* Video Recording Reflection Panel */}
      <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-5 my-8 space-y-4">
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest text-center">
          Share a Video Reflection
        </h3>

        {/* Simulated Camera Viewport */}
        <div className="w-full aspect-video bg-slate-950 rounded-2xl border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden">
          {recording ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/20 text-red-500 font-mono text-xs font-bold gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
              <span>REC • 0:08</span>
            </div>
          ) : recorded ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-950/20 text-emerald-400 font-mono text-xs font-bold gap-2">
              <span>✅ VIDEO RECORDED</span>
              <span className="text-[10px] text-slate-500">8 seconds reviewable</span>
            </div>
          ) : (
            <div className="text-center space-y-2">
              <span className="text-2xl block select-none">📹</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase">Simulated Video Feed</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-3">
          {recording ? (
            <button
              onClick={() => {
                setRecording(false);
                setRecorded(true);
              }}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-500 transition font-bold rounded-xl text-xs text-white cursor-pointer"
            >
              Stop Recording
            </button>
          ) : (
            <button
              onClick={() => {
                setRecording(true);
                setRecorded(false);
              }}
              className="px-6 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 transition font-bold rounded-xl text-xs text-slate-300 cursor-pointer"
            >
              {recorded ? 'Re-record' : 'Record Thoughts'}
            </button>
          )}
        </div>

        {/* Sharing Controls */}
        {recorded && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between p-3 bg-slate-950/40 rounded-xl border border-slate-800 text-xs">
              <span className="font-bold text-slate-300">Keep Video Private</span>
              <button
                type="button"
                onClick={() => setKeepPrivate(!keepPrivate)}
                className={`w-10 h-6 rounded-full p-0.5 transition duration-300 ${
                  keepPrivate ? 'bg-orange-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition duration-300 ${
                    keepPrivate ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <button
              onClick={handleSaveVideo}
              disabled={saving}
              className="w-full py-3 bg-orange-500 hover:bg-orange-400 active:bg-orange-600 transition font-black rounded-2xl text-white text-xs cursor-pointer text-center"
            >
              {saving ? 'Saving...' : 'Save Video Reflection'}
            </button>
          </div>
        )}
      </div>

      {/* Bottom Option Navigation */}
      <div className="space-y-2 pt-2">
        <button
          onClick={() => navigate('/')}
          className="w-full py-4 bg-slate-900 hover:bg-slate-800 transition font-bold rounded-2xl text-slate-400 border border-slate-800 text-center cursor-pointer text-sm"
        >
          {recorded ? 'Discard & Close' : 'Maybe Later'}
        </button>
      </div>
    </div>
  );
};
export default Milestone;
