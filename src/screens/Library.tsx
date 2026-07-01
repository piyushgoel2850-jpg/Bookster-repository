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
  const { xp, streak, refreshStats } = useGame();

  const [activeTab, setActiveTab] = useState<'paths' | 'my-books'>('paths');
  const [stories, setStories] = useState<SeedStory[]>([]);
  const [myBooks, setMyBooks] = useState<UserBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const ALL_CATEGORIES = ['All', 'Philosophy', 'Fiction', 'Mystery', 'Self-Improvement', 'Fantasy'];

  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookLength, setBookLength] = useState('');
  
  // Google Books Search API states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState('');

  // Update Progress Modal State
  const [activeBookToLog, setActiveBookToLog] = useState<UserBook | null>(null);
  const [pagesLogged, setPagesLogged] = useState<string>('');
  const [showLogSuccess, setShowLogSuccess] = useState(false);
  const [xpGainedSession, setXpGainedSession] = useState(0);

  // Finished book reflection note states
  const [finishedBookForReflection, setFinishedBookForReflection] = useState<UserBook | null>(null);
  const [finishedBookStep, setFinishedBookStep] = useState<'options' | 'text' | 'video' | 'success'>('options');
  const [reflectionNoteText, setReflectionNoteText] = useState('');
  const [isVideoRecordingReview, setIsVideoRecordingReview] = useState(false);
  const [videoRecordedReview, setVideoRecordedReview] = useState(false);

  // Interactive Self-Reflection overlays for logging >= 5 pages
  const [activeBookForSelfReflection, setActiveBookForSelfReflection] = useState<UserBook | null>(null);
  const [pagesLoggedForSelfReflection, setPagesLoggedForSelfReflection] = useState<number>(0);
  const [selfReflectionStep, setSelfReflectionStep] = useState<'options' | 'text' | 'voice'>('options');
  const [selfReflectionText, setSelfReflectionText] = useState('');
  const [isRecordingVoiceSelfReflection, setIsRecordingVoiceSelfReflection] = useState(false);
  const [voiceRecordedSelfReflection, setVoiceRecordedSelfReflection] = useState(false);

  const handleSearchBooks = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5`
      );
      const data = await response.json();
      if (data.items) {
        const results = data.items.map((item: any) => {
          const info = item.volumeInfo;
          return {
            title: info.title || '',
            author: info.authors ? info.authors.join(', ') : 'Unknown Author',
            pages: info.pageCount || 150,
            cover: info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || '',
          };
        });
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    } catch (e) {
      console.error('Failed to query Google Books API:', e);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectBookResult = (book: any) => {
    setBookTitle(book.title);
    setBookAuthor(book.author);
    setBookLength(book.pages.toString());
    setCoverImageUrl(book.cover);
    setSearchResults([]);
    setSearchQuery('');
  };

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
      await db.addUserBook(profile.id, bookTitle, bookAuthor, lengthNum, coverImageUrl);
      
      // Reset form
      setBookTitle('');
      setBookAuthor('');
      setBookLength('');
      setCoverImageUrl('');
      setSearchQuery('');
      setShowAddForm(false);
      
      // Refresh list
      fetchLibraryData();
    } catch (e) {
      console.error('Error adding book:', e);
    }
  };

  const handleLogProgressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !activeBookToLog || !pagesLogged) return;

    try {
      const pagesNum = parseInt(pagesLogged) || 0;
      if (pagesNum <= 0) return;

      const currentPages = activeBookToLog.current_page || 0;
      const newPages = Math.min(activeBookToLog.total_length, currentPages + pagesNum);
      const newPercent = Math.round((newPages / activeBookToLog.total_length) * 100);

      // Core formula: 10 XP per page read
      const xpEarned = pagesNum * 10;

      // 1. Award XP immediately
      await db.addXP(profile.id, xpEarned, 'book-pages');

      // 2. Log session with pages_read and calculated telemetry
      await db.addReadingSession(profile.id, 1, null, activeBookToLog.id, pagesNum, xpEarned);

      // 3. Update book page count and status
      await db.updateUserBookProgress(profile.id, activeBookToLog.id, newPercent, newPages);

      // Refresh Stats immediately in GameContext
      await refreshStats();

      const finalBookRef = { ...activeBookToLog, current_page: newPages, progress_percent: newPercent };

      // Reset active book logging flow
      setActiveBookToLog(null);
      setPagesLogged('');
      fetchLibraryData();

      // Check if logged >= 5 pages: trigger interactive self-reflection check
      if (pagesNum >= 5) {
        setPagesLoggedForSelfReflection(pagesNum);
        setActiveBookForSelfReflection(finalBookRef);
        setSelfReflectionStep('options');
        setSelfReflectionText('');
        setVoiceRecordedSelfReflection(false);
        setIsRecordingVoiceSelfReflection(false);
      } else {
        // Show immediate success popup
        setXpGainedSession(xpEarned);
        setShowLogSuccess(true);
        setTimeout(() => {
          setShowLogSuccess(false);
          if (newPercent >= 100) {
            setFinishedBookStep('options');
            setFinishedBookForReflection(finalBookRef);
          }
        }, 2500);
      }

    } catch (e) {
      console.error('Error logging page progress:', e);
    }
  };

  const handleSaveSelfReflection = async (type: 'text' | 'voice' | 'skip') => {
    if (!profile || !activeBookForSelfReflection) return;

    try {
      const baseXP = pagesLoggedForSelfReflection * 10;
      let totalXPEarned = baseXP;

      if (type !== 'skip') {
        const textVal = type === 'text' ? selfReflectionText : 'Recorded Voice note summaries';
        await db.addBookReflection(profile.id, activeBookForSelfReflection.id, type, textVal);
        
        // Reflection bonus: +20 XP
        await db.addXP(profile.id, 20, 'book-reflection-bonus');
        await refreshStats();
        totalXPEarned += 20;
      }

      const finalBook = activeBookForSelfReflection;
      setActiveBookForSelfReflection(null);

      // Show success screen with total XP gained (base + reflection bonus if any)
      setXpGainedSession(totalXPEarned);
      setShowLogSuccess(true);

      setTimeout(() => {
        setShowLogSuccess(false);
        fetchLibraryData();

        if (finalBook.progress_percent >= 100) {
          setFinishedBookStep('options');
          setFinishedBookForReflection(finalBook);
        }
      }, 2500);

    } catch (err) {
      console.error('Error saving self reflection:', err);
    }
  };

  const handleSaveReflectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !finishedBookForReflection) return;

    try {
      if (finishedBookStep === 'text') {
        if (!reflectionNoteText.trim()) return;
        await db.addBookReflection(profile.id, finishedBookForReflection.id, 'text', reflectionNoteText);
        // Award standard completion bonus: +20 XP
        await db.addXP(profile.id, 20, 'book-completed-reflection');
      } else if (finishedBookStep === 'video') {
        if (!videoRecordedReview) return;
        await db.addBookReflection(profile.id, finishedBookForReflection.id, 'video', '', 'Video Review Stub');
        // Award Video Review completion bonus: +50 XP!
        await db.addXP(profile.id, 50, 'book-completed-video-review');
      }

      await refreshStats();
      setFinishedBookForReflection(null);
      setReflectionNoteText('');
      setVideoRecordedReview(false);
      setIsVideoRecordingReview(false);
      fetchLibraryData();
    } catch (e) {
      console.error('Error saving book reflection:', e);
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
              {/* Category selector chips */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {ALL_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 border whitespace-nowrap cursor-pointer hover:scale-105 active:scale-95 ${
                      selectedCategory === cat
                        ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/10'
                        : 'bg-slate-900/40 text-slate-400 border-slate-900 hover:text-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                Select a short piece to start logging today's habit:
              </p>
              
              <div className="grid grid-cols-1 gap-4">
                {stories
                  .filter((story) => selectedCategory === 'All' || story.genre_tags.includes(selectedCategory))
                  .map((story) => (
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
                      {/* Book Cover */}
                      {book.cover_image_url ? (
                        <img
                          src={book.cover_image_url}
                          alt={book.title}
                          className="w-10 h-14 object-cover rounded-lg shadow-md shrink-0 select-none"
                        />
                      ) : (
                        <div className="w-10 h-14 bg-gradient-to-br from-purple-600 to-indigo-800 rounded-lg flex items-center justify-center text-white text-xs font-black shadow-md shrink-0 select-none">
                          📖
                        </div>
                      )}

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
                            <span>{book.current_page || 0} / {book.total_length} pages read</span>
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
                                setPagesLogged('');
                              }}
                              className="text-xs font-bold text-orange-400 hover:text-orange-300 cursor-pointer"
                            >
                              Log Pages
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
              onClick={() => {
                setShowAddForm(false);
                setSearchQuery('');
                setSearchResults([]);
              }}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 text-lg font-bold"
            >
              ✕
            </button>
            <h3 className="text-xl font-black text-white">Track an External Book</h3>
            
            {/* Google Books Search Bar */}
            <div className="space-y-1 relative">
              <label className="text-xs font-bold text-slate-400">Search Book Metadata (Autofill)</label>
              <input
                type="text"
                placeholder="Type title or author to search..."
                value={searchQuery}
                onChange={(e) => handleSearchBooks(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-sm focus:border-orange-500 outline-none"
              />
              
              {/* Autocomplete Dropdown List */}
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-slate-950 border border-slate-800 rounded-xl mt-1 shadow-2xl z-50 overflow-hidden divide-y divide-slate-900 max-h-48 overflow-y-auto">
                  {searchResults.map((bookResult, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectBookResult(bookResult)}
                      className="w-full p-2.5 hover:bg-slate-900 flex items-center gap-3 text-left transition text-xs cursor-pointer"
                    >
                      {bookResult.cover ? (
                        <img src={bookResult.cover} className="w-6 h-8 object-cover rounded shadow" alt="" />
                      ) : (
                        <div className="w-6 h-8 bg-slate-900 rounded flex items-center justify-center">📖</div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-extrabold text-white truncate">{bookResult.title}</p>
                        <p className="text-[10px] text-slate-500 truncate">by {bookResult.author}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {searching && (
                <p className="text-[10px] text-orange-400 font-bold mt-1">Searching metadata...</p>
              )}
            </div>

            <div className="border-t border-slate-800/80 my-2" />

            <div className="space-y-3">
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

      {/* Log Pages Modal Dialg */}
      {activeBookToLog && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <form
            onSubmit={handleLogProgressSubmit}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm space-y-5 shadow-2xl"
          >
            <div className="space-y-1">
              <h3 className="text-lg font-black text-white">Log pages read</h3>
              <p className="text-xs text-slate-500">For book: "{activeBookToLog.title}"</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">How many pages did you read today?</label>
              <input
                type="number"
                required
                min="1"
                placeholder="E.g., 25"
                value={pagesLogged}
                onChange={(e) => setPagesLogged(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 text-slate-100 rounded-2xl px-4 py-3 outline-none focus:border-orange-500 text-center text-lg font-black"
                autoFocus
              />
            </div>

            <div className="flex gap-4 pt-2">
              <button
                type="button"
                onClick={() => {
                  setActiveBookToLog(null);
                  setPagesLogged('');
                }}
                className="flex-1 py-3.5 bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-400 font-bold rounded-2xl text-xs cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3.5 bg-orange-500 hover:bg-orange-400 active:bg-orange-600 transition font-black rounded-2xl text-white text-xs cursor-pointer text-center"
              >
                Log Pages
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Log XP Success Toast/Overlay */}
      {showLogSuccess && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-in fade-in duration-200">
          <div className="text-center space-y-4">
            <span className="text-6xl animate-bounce block select-none">⚡✨</span>
            <h2 className="text-2xl font-black text-white">Nice, that's logged!</h2>
            <p className="text-orange-400 font-black text-lg">+{xpGainedSession} XP Gained!</p>
            <p className="text-slate-400 text-xs font-semibold">Keep up the steady habit. Slow and steady wins!</p>
          </div>
        </div>
      )}

      {/* Finished Book Gentle Reflection Journal / Video Review (Skippable, 1-tap, no guilt) */}
      {finishedBookForReflection && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-6 select-none animate-in fade-in duration-200">
          <form
            onSubmit={handleSaveReflectionSubmit}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm text-center space-y-5 shadow-2xl relative"
          >
            <span className="text-5xl block animate-bounce">🏆📚</span>
            <div className="space-y-1">
              <h3 className="text-xl font-black text-white">You finished the book!</h3>
              <p className="text-slate-400 text-xs">"{finishedBookForReflection.title}" is complete!</p>
            </div>

            {/* Step 1: Select Reflection Mode */}
            {finishedBookStep === 'options' && (
              <div className="space-y-3 pt-2 text-left">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center pl-1 mb-2">
                  Choose how to capture your thoughts:
                </p>
                
                <button
                  type="button"
                  onClick={() => setFinishedBookStep('text')}
                  className="w-full p-4 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-orange-500/50 transition rounded-2xl flex items-center gap-3 cursor-pointer"
                >
                  <span className="text-2xl">✍️</span>
                  <div>
                    <h4 className="text-xs font-black text-white">Write Reflection</h4>
                    <p className="text-[10px] text-slate-500 font-medium">Jot a quick thought. (+20 XP)</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFinishedBookStep('video')}
                  className="w-full p-4 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-orange-500/50 transition rounded-2xl flex items-center gap-3 cursor-pointer"
                >
                  <span className="text-2xl">🎥</span>
                  <div>
                    <h4 className="text-xs font-black text-white">Record Video Review</h4>
                    <p className="text-[10px] text-orange-400 font-medium">Unlock exclusive video reviews! (+50 XP! 🏆)</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFinishedBookForReflection(null);
                    setReflectionNoteText('');
                  }}
                  className="w-full text-slate-500 hover:text-slate-400 text-xs font-bold transition py-2 text-center cursor-pointer"
                >
                  Skip and Continue (No pressure!)
                </button>
              </div>
            )}

            {/* Step 2: Write Reflection Notes */}
            {finishedBookStep === 'text' && (
              <div className="space-y-4 pt-2 text-left">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">
                    Your Reading Journal Notes (+20 XP)
                  </label>
                  <textarea
                    placeholder="Want to jot a quick thought about it before you move on?"
                    value={reflectionNoteText}
                    onChange={(e) => setReflectionNoteText(e.target.value)}
                    className="w-full h-24 bg-slate-950 border border-slate-850 text-slate-100 rounded-2xl p-3.5 text-xs focus:border-orange-500 outline-none resize-none leading-relaxed"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setFinishedBookStep('options')}
                    className="px-4 py-3 bg-slate-950 border border-slate-850 text-slate-400 font-bold rounded-2xl text-xs cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={!reflectionNoteText.trim()}
                    className={`flex-1 py-3 font-black rounded-2xl text-xs cursor-pointer text-center transition ${
                      reflectionNoteText.trim()
                        ? 'bg-orange-500 hover:bg-orange-400 text-white shadow-xl shadow-orange-500/10'
                        : 'bg-slate-950 text-slate-600 border border-slate-850 cursor-not-allowed'
                    }`}
                  >
                    Save to Journal
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Video Review Recorder */}
            {finishedBookStep === 'video' && (
              <div className="space-y-4 pt-2">
                <div className="p-6 bg-slate-950 rounded-2xl border border-slate-850 flex flex-col items-center justify-center min-h-[140px]">
                  {isVideoRecordingReview ? (
                    <div className="space-y-3 text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <span className="w-3.5 h-3.5 bg-red-500 rounded-full animate-ping" />
                        <span className="text-red-500 text-xs font-black uppercase tracking-wider">● Recording Review...</span>
                      </div>
                      <p className="text-[10px] text-slate-500">Record a summary explaining your favorite parts!</p>
                      <button
                        type="button"
                        onClick={() => {
                          setIsVideoRecordingReview(false);
                          setVideoRecordedReview(true);
                        }}
                        className="px-4 py-2 bg-red-500/20 text-red-400 text-[10px] font-black border border-red-500/30 rounded-xl"
                      >
                        Stop & Capture Review
                      </button>
                    </div>
                  ) : videoRecordedReview ? (
                    <div className="space-y-3 text-center">
                      <span className="text-4xl block">🎥✅</span>
                      <p className="text-[10px] text-emerald-400 font-black uppercase tracking-wider">Video Review Captured!</p>
                      <p className="text-[9px] text-slate-500">Captured: 15s review clip</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-[10px] text-slate-400 font-medium">Record a 15-30s video sharing your summary & final rating.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setIsVideoRecordingReview(true);
                          setVideoRecordedReview(false);
                        }}
                        className="w-14 h-14 rounded-full bg-orange-500 hover:bg-orange-400 flex items-center justify-center text-xl shadow-lg cursor-pointer text-white mx-auto animate-pulse"
                      >
                        📹
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setFinishedBookStep('options')}
                    className="px-4 py-3 bg-slate-950 border border-slate-850 text-slate-400 font-bold rounded-2xl text-xs cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={!videoRecordedReview}
                    className={`flex-1 py-3 font-black rounded-2xl text-xs cursor-pointer text-center transition ${
                      videoRecordedReview
                        ? 'bg-orange-500 hover:bg-orange-400 text-white shadow-xl shadow-orange-500/10'
                        : 'bg-slate-950 text-slate-600 border border-slate-850 cursor-not-allowed'
                    }`}
                  >
                    Submit & Claim +50 XP 🏆
                  </button>
                </div>
              </div>
            )}

          </form>
        </div>
      )}

      {/* Interactive Self-Reflection Check Overlay (logs >= 5 pages) */}
      {activeBookForSelfReflection && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm text-center space-y-6 shadow-2xl">
            
            {/* Header */}
            <div className="space-y-2">
              <span className="text-4xl block animate-bounce">🧠⚡</span>
              <h3 className="text-lg font-black text-white">Self-Reflection Check</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                You logged <span className="text-orange-400 font-bold">{pagesLoggedForSelfReflection} pages</span> read! Take 30 seconds to reflect to lock in learnings & claim your bonus.
              </p>
              <div className="inline-block px-3 py-1 bg-orange-500/10 text-orange-400 text-[10px] font-black uppercase tracking-wider rounded-full border border-orange-500/10">
                ✨ +20 XP reflection bonus active
              </div>
            </div>

            {/* Options steps view */}
            {selfReflectionStep === 'options' && (
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelfReflectionStep('text')}
                  className="w-full p-4 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-orange-500/50 transition rounded-2xl flex items-center gap-3 cursor-pointer text-left"
                >
                  <span className="text-2xl">✍️</span>
                  <div>
                    <h4 className="text-xs font-black text-white">Write Reflection</h4>
                    <p className="text-[10px] text-slate-500 font-medium">Jot down what you learned or chapter improvements.</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelfReflectionStep('voice')}
                  className="w-full p-4 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-orange-500/50 transition rounded-2xl flex items-center gap-3 cursor-pointer text-left"
                >
                  <span className="text-2xl">🎙️</span>
                  <div>
                    <h4 className="text-xs font-black text-white">Record Voice Note</h4>
                    <p className="text-[10px] text-slate-500 font-medium">Explain a quick summaries of the pages verbally.</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveSelfReflection('skip')}
                  className="w-full text-slate-500 hover:text-slate-400 text-xs font-bold transition py-2 text-center cursor-pointer animate-pulse"
                >
                  Skip Reflection (Forfeit +20 XP)
                </button>
              </div>
            )}

            {/* Text input step */}
            {selfReflectionStep === 'text' && (
              <div className="space-y-4 pt-2 text-left">
                <textarea
                  placeholder="What did you learn? Or what could be improved in the chapter?"
                  value={selfReflectionText}
                  onChange={(e) => setSelfReflectionText(e.target.value)}
                  className="w-full h-28 bg-slate-950 border border-slate-850 text-slate-100 rounded-2xl p-3.5 text-xs focus:border-orange-500 outline-none resize-none leading-relaxed"
                />
                
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSelfReflectionStep('options')}
                    className="px-4 py-3 bg-slate-950 border border-slate-850 text-slate-400 font-bold rounded-2xl text-xs cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveSelfReflection('text')}
                    disabled={!selfReflectionText.trim()}
                    className={`flex-1 py-3 font-black rounded-2xl text-xs cursor-pointer text-center transition ${
                      selfReflectionText.trim()
                        ? 'bg-orange-500 hover:bg-orange-400 text-white shadow-xl shadow-orange-500/10'
                        : 'bg-slate-950 text-slate-600 border border-slate-850 cursor-not-allowed'
                    }`}
                  >
                    Save & Claim +20 XP
                  </button>
                </div>
              </div>
            )}

            {/* Voice record step */}
            {selfReflectionStep === 'voice' && (
              <div className="space-y-4 pt-2">
                <div className="p-6 bg-slate-950 rounded-2xl border border-slate-850 flex flex-col items-center justify-center min-h-[100px]">
                  {isRecordingVoiceSelfReflection ? (
                    <div className="space-y-3 text-center">
                      <div className="flex items-center gap-1 justify-center h-8">
                        <span className="w-1.5 h-4 bg-red-500 rounded-full animate-bounce" />
                        <span className="w-1.5 h-8 bg-red-500 rounded-full animate-bounce delay-75" />
                        <span className="w-1.5 h-6 bg-red-500 rounded-full animate-bounce delay-150" />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsRecordingVoiceSelfReflection(false);
                          setVoiceRecordedSelfReflection(true);
                        }}
                        className="px-3 py-1.5 bg-red-500/20 text-red-400 text-[10px] font-black border border-red-500/30 rounded-xl"
                      >
                        Stop Recording
                      </button>
                    </div>
                  ) : voiceRecordedSelfReflection ? (
                    <div className="space-y-2">
                      <span className="text-3xl block">🎙️✅</span>
                      <p className="text-[10px] text-emerald-400 font-black uppercase tracking-wider">Voice summary ready!</p>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setIsRecordingVoiceSelfReflection(true);
                        setVoiceRecordedSelfReflection(false);
                      }}
                      className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center text-xl shadow-lg cursor-pointer text-white animate-pulse"
                    >
                      🎙️
                    </button>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSelfReflectionStep('options')}
                    className="px-4 py-3 bg-slate-950 border border-slate-850 text-slate-400 font-bold rounded-2xl text-xs cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveSelfReflection('voice')}
                    disabled={!voiceRecordedSelfReflection}
                    className={`flex-1 py-3 font-black rounded-2xl text-xs cursor-pointer text-center transition ${
                      voiceRecordedSelfReflection
                        ? 'bg-orange-500 hover:bg-orange-400 text-white shadow-xl shadow-orange-500/10'
                        : 'bg-slate-950 text-slate-600 border border-slate-850 cursor-not-allowed'
                    }`}
                  >
                    Save & Claim +20 XP
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Bottom Nav bar spacer */}
      <BottomNav />
    </div>
  );
};
export default Library;
