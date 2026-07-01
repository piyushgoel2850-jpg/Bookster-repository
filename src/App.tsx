import { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';

interface Book {
  id: number;
  title: string;
  author: string;
  progress: number; // percentage
  status: 'Reading' | 'Completed' | 'To Read';
  coverColor: string;
}

const INITIAL_BOOKS: Book[] = [
  {
    id: 1,
    title: 'The Hobbit',
    author: 'J.R.R. Tolkien',
    progress: 75,
    status: 'Reading',
    coverColor: 'from-amber-600 to-amber-900',
  },
  {
    id: 2,
    title: 'Atomic Habits',
    author: 'James Clear',
    progress: 100,
    status: 'Completed',
    coverColor: 'from-emerald-600 to-emerald-900',
  },
  {
    id: 3,
    title: 'Dune',
    author: 'Frank Herbert',
    progress: 0,
    status: 'To Read',
    coverColor: 'from-orange-600 to-orange-900',
  },
  {
    id: 4,
    title: 'Project Hail Mary',
    author: 'Andy Weir',
    progress: 40,
    status: 'Reading',
    coverColor: 'from-sky-600 to-sky-900',
  },
];

export default function App() {
  const [books, setBooks] = useState<Book[]>(INITIAL_BOOKS);
  const [totalRead, setTotalRead] = useState(
    INITIAL_BOOKS.filter((b) => b.status === 'Completed').length
  );
  const [supabaseConfigured, setSupabaseConfigured] = useState(false);

  useEffect(() => {
    // Check if Supabase keys are configured
    const hasUrl = !!import.meta.env.VITE_SUPABASE_URL;
    const hasKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY;
    setSupabaseConfigured(hasUrl && hasKey);

    if (hasUrl && hasKey) {
      console.log('Supabase initialized successfully:', supabase);
    }
  }, []);

  const handleIncrementProgress = (id: number) => {
    setBooks((prevBooks) =>
      prevBooks.map((book) => {
        if (book.id === id) {
          const newProgress = Math.min(book.progress + 10, 100);
          const newStatus = newProgress === 100 ? 'Completed' : 'Reading';
          
          // If it transitions to completed, increment total read
          if (newProgress === 100 && book.progress < 100) {
            setTotalRead((prev) => prev + 1);
          }
          
          return {
            ...book,
            progress: newProgress,
            status: newStatus as 'Reading' | 'Completed' | 'To Read',
          };
        }
        return book;
      })
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-purple-500 selection:text-white">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-b from-purple-500/10 via-indigo-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-950/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Bookster
            </span>
          </div>

          <div className="flex items-center gap-4">
            {supabaseConfigured ? (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Supabase Connected
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Supabase Local Mode
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero Area */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-6">
            Track Your Reading,{' '}
            <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
              One Page at a Time
            </span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed mb-8">
            Manage your personal library, track your live progress, and integrate
            real-time syncing with Supabase.
          </p>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto p-2 bg-slate-900/50 border border-slate-800/80 rounded-2xl backdrop-blur-sm">
            <div className="p-4 text-center">
              <span className="block text-2xl font-bold text-white">
                {books.length}
              </span>
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                Total Books
              </span>
            </div>
            <div className="p-4 border-x border-slate-800/80 text-center">
              <span className="block text-2xl font-bold text-purple-400">
                {books.filter((b) => b.status === 'Reading').length}
              </span>
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                Reading
              </span>
            </div>
            <div className="p-4 text-center">
              <span className="block text-2xl font-bold text-emerald-400">
                {totalRead}
              </span>
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                Completed
              </span>
            </div>
          </div>
        </div>

        {/* Supabase Notice Banner */}
        {!supabaseConfigured && (
          <div className="mb-12 p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-amber-300 font-semibold mb-1 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-amber-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                Complete Supabase Configuration
              </h3>
              <p className="text-slate-400 text-sm">
                To sync your bookshelf to the cloud, configure the environment variables
                inside your local <code>.env</code> file.
              </p>
            </div>
            <div className="text-sm font-mono bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300 select-all">
              VITE_SUPABASE_URL=...
            </div>
          </div>
        )}

        {/* Books Shelf Section */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              My Reading List
            </h2>
            <div className="h-px flex-1 bg-slate-900 mx-6 hidden sm:block" />
            <button
              onClick={() => {
                const title = prompt('Enter book title:');
                const author = prompt('Enter author name:');
                if (title && author) {
                  const newBook: Book = {
                    id: Date.now(),
                    title,
                    author,
                    progress: 0,
                    status: 'To Read',
                    coverColor: 'from-indigo-600 to-indigo-900',
                  };
                  setBooks((prev) => [...prev, newBook]);
                }
              }}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 active:bg-purple-700 transition font-semibold text-sm flex items-center gap-2 shadow-lg shadow-purple-500/10 cursor-pointer"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add New Book
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {books.map((book) => (
              <div
                key={book.id}
                className="group relative bg-slate-900/40 border border-slate-900 hover:border-slate-800/80 rounded-2xl p-6 transition duration-300 hover:shadow-2xl hover:shadow-purple-500/5 flex gap-6 overflow-hidden"
              >
                {/* Book Cover Art */}
                <div
                  className={`w-24 h-32 rounded-xl bg-gradient-to-br ${book.coverColor} flex flex-col justify-between p-3 shadow-md shrink-0 select-none transform transition duration-500 group-hover:scale-105`}
                >
                  <div className="w-1.5 h-full bg-black/10 absolute left-0 top-0 rounded-l-xl blur-[0.5px]" />
                  <div className="flex justify-end">
                    <div className="w-1 h-4 bg-white/20 rounded-full" />
                  </div>
                  <div className="text-[10px] font-black text-white/40 tracking-widest uppercase overflow-hidden whitespace-nowrap text-ellipsis">
                    {book.author}
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-bold text-white text-lg leading-snug truncate group-hover:text-purple-300 transition duration-300">
                        {book.title}
                      </h3>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
                          book.status === 'Completed'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'
                            : book.status === 'Reading'
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/10'
                            : 'bg-slate-500/10 text-slate-400 border border-slate-500/10'
                        }`}
                      >
                        {book.status}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm mb-4 truncate">
                      by {book.author}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                      <span>Progress</span>
                      <span className="text-white">{book.progress}%</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${book.progress}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center pt-1">
                      {book.status !== 'Completed' ? (
                        <button
                          onClick={() => handleIncrementProgress(book.id)}
                          className="text-xs font-bold text-purple-400 hover:text-purple-300 active:text-purple-500 flex items-center gap-1 group/btn cursor-pointer"
                        >
                          Read 10%
                          <span className="transform translate-x-0 group-hover/btn:translate-x-0.5 transition duration-200">
                            →
                          </span>
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                          Completed! 🎉
                        </span>
                      )}

                      <button
                        onClick={() => {
                          setBooks((prev) => prev.filter((b) => b.id !== book.id));
                          if (book.status === 'Completed') {
                            setTotalRead((prev) => Math.max(0, prev - 1));
                          }
                        }}
                        className="text-[10px] text-slate-600 hover:text-red-400 transition"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-900/60 mt-24 py-12 bg-slate-950/40">
        <div className="max-w-6xl mx-auto px-6 text-center text-slate-600 text-sm">
          <p className="mb-2">Bookster • Built with React, TypeScript, Tailwind CSS, and Supabase.</p>
          <p>© {new Date().getFullYear()} Bookster App. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
