import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import { db } from '../lib/db';
import type { CoachMessage, CoachProfile, UserBook } from '../lib/db';
import { coachEngine } from '../lib/coachEngine';
import { BottomNav } from '../components/BottomNav';

export const Coach: React.FC = () => {
  const { profile } = useAuth();
  const { refreshStats } = useGame();

  const [books, setBooks] = useState<UserBook[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<string>('general');
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [coachProfile, setCoachProfile] = useState<CoachProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);

  // Typewriter effect state
  const [xpAwardText, setXpAwardText] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchCoachData = async () => {
    if (!profile) return;
    try {
      const userBooks = await db.getUserBooks(profile.id);
      setBooks(userBooks);

      // Load conversations
      const msgs = await db.getCoachMessages(profile.id, selectedBookId === 'general' ? null : selectedBookId);
      setMessages(msgs);

      // Load profile memory details
      const cProf = await db.getCoachProfile(profile.id);
      setCoachProfile(cProf);
    } catch (e) {
      console.error('Failed to load coach conversations:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoachData();
  }, [profile, selectedBookId]);

  // Scroll to bottom helper
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !inputMessage.trim()) return;

    const userText = inputMessage.trim();
    setInputMessage('');

    // Save user message record
    const userMsg: CoachMessage = {
      id: Math.random().toString(),
      user_id: profile.id,
      book_id: selectedBookId === 'general' ? null : selectedBookId,
      sender: 'user',
      content: userText,
      created_at: new Date().toISOString()
    };

    try {
      await db.saveCoachMessage(userMsg);
      setMessages(prev => [...prev, userMsg]);
      setIsTyping(true);

      // Delay to simulate AI reading and deep reflecting
      setTimeout(async () => {
        const result = await coachEngine.processReflection(
          profile.id,
          userText,
          selectedBookId === 'general' ? null : selectedBookId
        );
        
        setIsTyping(false);
        setMessages(prev => [...prev, result.message]);

        if (result.xpAwarded > 0) {
          setXpAwardText(`✨ +${result.xpAwarded} XP Reflection Bonus!`);
          await refreshStats();
          setTimeout(() => setXpAwardText(null), 3000);
        }

        // Refresh stats
        const cProf = await db.getCoachProfile(profile.id);
        setCoachProfile(cProf);
      }, 1500);

    } catch (e) {
      console.error('Failed to send reflection:', e);
      setIsTyping(false);
    }
  };

  const handlePredefinedPrompt = (promptText: string) => {
    setInputMessage(promptText);
  };

  return (
    <div className="min-h-screen bg-[#120f0d] text-[#faf6ee] pb-28 px-6 pt-6 max-w-md mx-auto relative overflow-hidden flex flex-col select-none">
      {/* Background Soft Sunset Candle Glows */}
      <div className="absolute top-10 left-[-40px] w-56 h-56 bg-[#d35d3b]/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute top-1/2 right-[-40px] w-56 h-56 bg-[#f9d382]/10 rounded-full blur-[80px] pointer-events-none" />

      {/* Top Banner Header */}
      <header className="flex items-center justify-between mb-4 relative z-10 border-b border-[#FAF6EE]/10 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#faf6ee] border border-[#d35d3b] flex items-center justify-center text-xl shadow-md transform hover:rotate-12 transition">
            🦉
          </div>
          <div>
            <h2 className="text-[10px] font-black text-[#f09f80] uppercase tracking-widest leading-none mb-1">Reading Coach</h2>
            <h1 className="font-extrabold font-serif text-white text-base leading-none tracking-tight">
              Aesthetic Mentor
            </h1>
          </div>
        </div>

        {/* Profile memory toggle badge */}
        <button
          onClick={() => setShowProfileDrawer(!showProfileDrawer)}
          className="px-3 py-1.5 bg-[#FAF6EE]/5 border border-[#FAF6EE]/15 text-[#faf6ee] rounded-xl text-[10px] font-extrabold tracking-wide shadow-sm hover:border-[#d35d3b] transition cursor-pointer"
        >
          🧠 Coach Memory
        </button>
      </header>

      {/* XP Award floating toast */}
      {xpAwardText && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-600 border border-[#FAF6EE]/20 rounded-full px-5 py-2 text-white font-extrabold text-xs shadow-2xl z-50 animate-bounce">
          {xpAwardText}
        </div>
      )}

      {/* Book Context Selection dropdown row */}
      <div className="mb-4 shrink-0 relative z-10 flex gap-2 items-center">
        <span className="text-[9px] font-black text-[#FAF6EE]/50 uppercase tracking-widest">Context:</span>
        <select
          value={selectedBookId}
          onChange={(e) => setSelectedBookId(e.target.value)}
          className="flex-1 bg-[#1e1a18] border border-[#FAF6EE]/15 rounded-xl px-3 py-2 text-xs font-black text-[#faf6ee] outline-none cursor-pointer"
        >
          <option value="general">📚 General reading notes</option>
          {books.map((b) => (
            <option key={b.id} value={b.id}>
              📖 {b.title}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-[#FAF6EE]/60 font-bold">
          🦉 Consulting details and insights diary...
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 relative z-10">
          
          {/* Messages list bubble viewport */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-4 pb-4 scrollbar-none">
            {messages.length === 0 ? (
              <div className="text-center py-10 space-y-4 max-w-xs mx-auto">
                <div className="w-12 h-12 rounded-full bg-[#faf6ee]/5 border border-[#FAF6EE]/10 flex items-center justify-center mx-auto text-2xl animate-pulse">
                  🌱
                </div>
                <h3 className="font-serif font-black text-sm text-[#faf6ee]">Start your dialogue</h3>
                <p className="text-xs text-[#FAF6EE]/50 leading-relaxed font-medium">
                  Share a reflection note, transcript, or details from your reading. Your mentor will help you digest ideas, concepts, and make daily applications.
                </p>
                <div className="flex flex-wrap gap-2 justify-center pt-2">
                  <button
                    onClick={() => handlePredefinedPrompt("I want to build a better reading habit but get distracted.")}
                    className="text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full bg-[#FAF6EE]/5 border border-[#FAF6EE]/10 text-[#FAF6EE]/80 hover:border-[#d35d3b] transition"
                  >
                    Habit tips
                  </button>
                  <button
                    onClick={() => handlePredefinedPrompt("How can I remember concepts from books longer?")}
                    className="text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full bg-[#FAF6EE]/5 border border-[#FAF6EE]/10 text-[#FAF6EE]/80 hover:border-[#d35d3b] transition"
                  >
                    Retention ideas
                  </button>
                </div>
              </div>
            ) : (
              messages.map((m) => {
                const isCoach = m.sender === 'coach';
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isCoach ? 'items-start' : 'items-end'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-3xl p-4 text-xs font-semibold leading-relaxed shadow-md text-left relative ${
                        isCoach
                          ? 'bg-[#faf6ee] text-[#2c2724] border border-[#FAF6EE]/20 font-serif'
                          : 'bg-[#d35d3b] text-white'
                      }`}
                    >
                      {/* Top border decoration line for Ghibli stamp look on coach messages */}
                      {isCoach && <div className="absolute top-0 left-0 right-0 h-1 bg-[#d35d3b] rounded-t-3xl" />}
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    </div>
                    <span className="text-[7px] text-[#FAF6EE]/40 font-black uppercase tracking-widest mt-1 px-1">
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })
            )}

            {/* Simulated Coach reflecting typewriter loading */}
            {isTyping && (
              <div className="flex flex-col items-start">
                <div className="bg-[#faf6ee] text-[#2c2724] border border-[#FAF6EE]/20 rounded-3xl p-4 text-xs font-serif shadow-md text-left flex gap-1 items-center relative">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-[#d35d3b] rounded-t-3xl" />
                  <span className="text-[#d35d3b] font-black animate-pulse">🦉 Reflecting</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2c2724] animate-bounce delay-100" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2c2724] animate-bounce delay-200" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2c2724] animate-bounce delay-300" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Interactive Chat dialog bottom entry */}
          <form onSubmit={handleSendMessage} className="pt-2 border-t border-[#FAF6EE]/10 flex gap-2 items-center shrink-0">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Reflect on themes, lessons, questions..."
              className="flex-1 bg-[#1e1a18] border border-[#FAF6EE]/15 focus:border-[#d35d3b] text-[#faf6ee] rounded-2xl px-4 py-3 text-xs outline-none"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black transition ${
                inputMessage.trim()
                  ? 'bg-[#d35d3b] text-white hover:scale-105 active:scale-95 cursor-pointer'
                  : 'bg-[#1e1a18] text-[#FAF6EE]/20 border border-[#FAF6EE]/10'
              }`}
            >
              ✍️
            </button>
          </form>
        </div>
      )}

      {/* COACH MEMORY PROFILE DRAWER MODAL OVERLAY */}
      {showProfileDrawer && (
        <div className="fixed inset-0 bg-[#120f0d]/90 backdrop-blur-md flex items-center justify-center z-50 p-6">
          <div className="bg-[#faf6ee] text-[#2c2724] border-2 border-[#d35d3b] rounded-3xl p-6 w-full max-w-sm text-left relative overflow-hidden space-y-5">
            {/* Top design strip border */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#d35d3b]" />

            <div className="flex justify-between items-center pb-2 border-b border-[#2c2724]/10">
              <h3 className="font-serif font-black text-[#d35d3b] text-base">🧠 Coach Memory Profile</h3>
              <button
                onClick={() => setShowProfileDrawer(false)}
                className="text-[#2c2724]/60 hover:text-[#d35d3b] text-xs font-black"
              >
                ✕ CLOSE
              </button>
            </div>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 scrollbar-none text-xs font-semibold">
              {/* Reading interests */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-black text-[#d35d3b] uppercase tracking-widest block">Reading interests</span>
                {coachProfile?.reading_interests?.length === 0 ? (
                  <p className="text-[#2c2724]/60 italic text-[11px]">No interest tags profiled yet. Keep discussing.</p>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {coachProfile?.reading_interests.map((item) => (
                      <span key={item} className="text-[8px] font-black uppercase bg-[#2c2724]/5 px-2 py-0.5 rounded-full text-[#2c2724]/75 border border-[#2c2724]/10">
                        {item}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Favorite themes */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-black text-[#d35d3b] uppercase tracking-widest block">Favorite themes</span>
                {coachProfile?.favorite_themes?.length === 0 ? (
                  <p className="text-[#2c2724]/60 italic text-[11px]">No themes mapped yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {coachProfile?.favorite_themes.map((theme) => (
                      <span key={theme} className="text-[8px] font-black uppercase bg-[#d35d3b]/10 px-2 py-0.5 rounded-full text-[#d35d3b] border border-[#d35d3b]/10">
                        {theme}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Insights memory bank */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-black text-[#d35d3b] uppercase tracking-widest block">Recurring Insights</span>
                {coachProfile?.recurring_insights?.length === 0 ? (
                  <p className="text-[#2c2724]/60 italic text-[11px]">No insights stored yet.</p>
                ) : (
                  <ul className="list-disc pl-4 space-y-1 text-[#2c2724]/70 leading-relaxed">
                    {coachProfile?.recurring_insights.map((ins, idx) => (
                      <li key={idx} className="italic">"{ins}"</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};
