import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import { db } from '../lib/db';
import type { UserBook } from '../lib/db';
import type { SeedStory } from '../data/stories';
import { BottomNav } from '../components/BottomNav';

export const Library: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { xp, streak } = useGame();

  const [activeTab, setActiveTab] = useState<'paths' | 'my-books'>('paths');
  const [stories, setStories] = useState<SeedStory[]>([]);
  const [myBooks, setMyBooks] = useState<UserBook[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookLength, setBookLength] = useState('');

  // Update Progress Modal State
  const [activeBookToLog, setActiveBookToLog] = useState<UserBook | null>(null);
  const [newProgress, setNewProgress] = useState<number>(0);

  const fetchLibraryData = async () => {
    if (!profile) return;
    try {
      const allStories = await db.getContentPieces();
      setStories(allStories);

      const books = await db.getUserBooks(profile.id);
      setMyBooks(books);
    } catch (e) {
      console.error('Failed to load library:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLibraryData();
  }, [profile]);

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !bookTitle || !bookAuthor || !bookLength) return;

    try {
      const lengthNum = parseInt(bookLength) || 100;
      await db.addUserBook(profile.id, bookTitle, bookAuthor, lengthNum);
      
      // Reset form
      setBookTitle('');
      setBookAuthor('');
      setBookLength('');
      setShowAddForm(false);
      
      // Refresh list
      fetchLibraryData();
    } catch (e) {
      console.error('Error adding book:', e);
    }
  };

  const handleLogProgressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !activeBookToLog) return;

    try {
      await db.updateUserBookProgress(profile.id, activeBookToLog.id, newProgress);
      setActiveBookToLog(null);
      
      // If completed, check if we should show milestone celebration
      if (newProgress >= 100) {
        navigate('/milestone');
      } else {
        fetchLibraryData();
      }
    } catch (e) {
      console.error('Error updating progress:', e);
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    if (!profile) return;
    if (confirm('Are you sure you want to remove this book from your library?')) {
      try {
        await db.deleteUserBook(profile.id, bookId);
        fetchLibraryData();
      } catch (e) {
        console.error('Error deleting book:', e);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-28 px-6 pt-6 max-w-md mx-auto relative select-none">
      
      {/* Mini Stats Banner */}
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-white">Library</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl text-xs font-black">
            ⚡ {xp} XP
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-500 rounded-xl text-xs font-black">
            🔥 {streak?.current_streak || 0}
          </div>
        </div>
      </header>

      {/* Tabs Selector */}
      <div className="flex bg-slate-900/60 p-1 border border-slate-900 rounded-2xl mb-8">
        <button
          onClick={() => setActiveTab('paths')}
          className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition duration-300 cursor-pointer ${
            activeTab === 'paths'
              ? 'bg-orange-500 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Reading Paths
        </button>
        <button
          onClick={() => setActiveTab('my-books')}
          className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition duration-300 cursor-pointer ${
            activeTab === 'my-books'
              ? 'bg-orange-500 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          My Books ({myBooks.length})
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-500 font-bold">
          Loading catalog...
        </div>
      ) : (
        <div className="space-y-6">
          {/* TAB 1: CURATED PATHS */}
          {activeTab === 'paths' && (
            <div className="space-y-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Select a short piece to start logging today's habit:
              </p>
              <div className="grid grid-cols-1 gap-4">
                {stories.map((story) => (
                  <div
                    key={story.id}
                    className="p-5 bg-slate-900/30 border border-slate-900 hover:border-slate-800/80 rounded-2xl transition duration-300 flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {story.genre_tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/10"
                          >
                            {tag}
                          </span>
                        ))}
                        <span className="text-[10px] text-slate-500 font-bold ml-auto">
                          ⏱️ {story.estimated_minutes} min read
                        </span>
                      </div>
                      <h3 className="text-lg font-extrabold text-white leading-tight mb-1">{story.title}</h3>
                      <p className="text-slate-400 text-xs">by {story.author}</p>
                    </div>

                    <button
                      onClick={() => navigate(`/reader?storyId=${story.id}`)}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold rounded-xl text-xs tracking-wide transition cursor-pointer text-center"
                    >
                      Read Now
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: MY EXTERNAL BOOKS */}
          {activeTab === 'my-books' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Track your physical & Kindle books:
                </p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-3 py-1.5 bg-orange-500 hover:bg-orange-400 transition font-bold rounded-xl text-[10px] uppercase tracking-wider text-white cursor-pointer"
                >
                  + Add Book
                </button>
              </div>

              {myBooks.length === 0 ? (
                <div className="p-8 text-center bg-slate-900/20 border border-dashed border-slate-900 rounded-2xl text-slate-500 font-bold text-sm">
                  No books added yet. Click "+ Add Book" to track external reading material!
                </div>
              ) : (
                <div className="space-y-4">
                  {myBooks.map((book) => (
                    <div
                      key={book.id}
                      className="p-4 bg-slate-900/30 border border-slate-900 hover:border-slate-800/80 rounded-2xl flex items-center gap-4 transition duration-300"
                    >
                      {/* Simulated Book Spine Cover */}
                      <div className="w-10 h-14 bg-gradient-to-br from-purple-600 to-indigo-800 rounded-lg flex items-center justify-center text-white text-xs font-black shadow-md shrink-0 select-none">
                        📖
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex justify-between items-baseline gap-2">
                          <h3 className="font-extrabold text-white text-sm truncate">{book.title}</h3>
                          <span
                            className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
                              book.status === 'finished'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'
                                : 'bg-purple-500/10 text-purple-400 border border-purple-500/10'
                            }`}
                          >
                            {book.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate">by {book.author}</p>

                        <div className="space-y-1 pt-1">
                          <div className="flex justify-between text-[10px] text-slate-400">
                            <span>Progress</span>
                            <span>{book.progress_percent}%</span>
                          </div>
                          <div className="w-full bg-slate-950 h-1 rounded-full overflow-hidden">
                            <div
                              className="bg-purple-500 h-full rounded-full transition-all duration-300"
                              style={{ width: `${book.progress_percent}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          {book.status !== 'finished' ? (
                            <button
                              onClick={() => {
                                setActiveBookToLog(book);
                                setNewProgress(book.progress_percent);
                              }}
                              className="text-xs font-bold text-orange-400 hover:text-orange-300 cursor-pointer"
                            >
                              Log Session
                            </button>
                          ) : (
                            <span className="text-[10px] text-emerald-400 font-extrabold flex items-center gap-1">
                              Finished! 🏆
                            </span>
                          )}

                          <button
                            onClick={() => handleDeleteBook(book.id)}
                            className="text-[10px] text-slate-600 hover:text-rose-400 transition cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Floating Add Book Form Modal Dialog */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <form
            onSubmit={handleAddBook}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl relative"
          >
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 text-lg font-bold"
            >
              ✕
            </button>
            <h3 className="text-xl font-black text-white">Track an External Book</h3>
            <p className="text-slate-400 text-xs">
              Log progress for books you read offline (paperbacks, Kindle, audiobooks).
            </p>

            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Book Title</label>
                <input
                  type="text"
                  required
                  placeholder="E.g., The Midnight Library"
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-sm focus:border-orange-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Author Name</label>
                <input
                  type="text"
                  required
                  placeholder="E.g., Matt Haig"
                  value={bookAuthor}
                  onChange={(e) => setBookAuthor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-sm focus:border-orange-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Total Pages / Length</label>
                <input
                  type="number"
                  required
                  min="10"
                  placeholder="E.g., 300"
                  value={bookLength}
                  onChange={(e) => setBookLength(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-sm focus:border-orange-500 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-orange-500 hover:bg-orange-400 transition font-black rounded-2xl text-white shadow-xl cursor-pointer text-center text-sm"
            >
              Add to Library
            </button>
          </form>
        </div>
      )}

      {/* Log Progress Slide Modal */}
      {activeBookToLog && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <form
            onSubmit={handleLogProgressSubmit}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm space-y-6 shadow-2xl"
          >
            <div className="space-y-1">
              <h3 className="text-lg font-black text-white">Log session: {activeBookToLog.title}</h3>
              <p className="text-xs text-slate-500">Update your current reading percentage.</p>
            </div>

            {/* Slider */}
            <div className="space-y-3">
              <div className="flex justify-between font-bold text-sm">
                <span className="text-slate-400">Progress Percent</span>
                <span className="text-orange-400 text-base">{newProgress}%</span>
              </div>
              <input
                type="range"
                min={activeBookToLog.progress_percent}
                max="100"
                value={newProgress}
                onChange={(e) => setNewProgress(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-orange-500 outline-none"
              />
              <div className="flex justify-between text-[10px] text-slate-600 font-bold">
                <span>Start ({activeBookToLog.progress_percent}%)</span>
                <span>Finished (100%)</span>
              </div>
            </div>

            {/* Simulated Timer check option */}
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
              💡 **Daily Streak Sync**: Manual entries will update your reading progress but don't count towards the active daily target timer directly. Read a curated story to log daily XP.
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setActiveBookToLog(null)}
                className="flex-1 py-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 font-bold rounded-2xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-orange-500 hover:bg-orange-400 transition font-black rounded-2xl text-white text-xs cursor-pointer"
              >
                Save Progress
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bottom Nav bar spacer */}
      <BottomNav />
    </div>
  );
};
export default Library;
