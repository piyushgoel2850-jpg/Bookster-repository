import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const BottomNav: React.FC = () => {
  const location = useLocation();

  const navItems = [
    {
      path: '/',
      label: 'Home',
      icon: (active: boolean) => (
        <svg
          className={`w-5 h-5 transition-transform duration-300 ${active ? 'scale-110' : ''}`}
          fill={active ? 'currentColor' : 'none'}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={active ? 0 : 2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
    {
      path: '/library',
      label: 'Library',
      icon: (active: boolean) => (
        <svg
          className={`w-5 h-5 transition-transform duration-300 ${active ? 'scale-110' : ''}`}
          fill={active ? 'currentColor' : 'none'}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={active ? 0 : 2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      ),
    },
    {
      path: '/coach',
      label: 'Coach',
      icon: (active: boolean) => (
        <svg
          className={`w-5 h-5 transition-transform duration-300 ${active ? 'scale-110' : ''}`}
          fill={active ? 'currentColor' : 'none'}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={active ? 0 : 2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
      ),
    },
    {
      path: '/social',
      label: 'Social',
      icon: (active: boolean) => (
        <svg
          className={`w-5 h-5 transition-transform duration-300 ${active ? 'scale-110' : ''}`}
          fill={active ? 'currentColor' : 'none'}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={active ? 0 : 2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
    },
    {
      path: '/profile',
      label: 'Profile',
      icon: (active: boolean) => (
        <svg
          className={`w-5 h-5 transition-transform duration-300 ${active ? 'scale-110' : ''}`}
          fill={active ? 'currentColor' : 'none'}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={active ? 0 : 2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#1e1a18] border-t border-[#FAF6EE]/10 px-4 py-2 pb-safe z-40 shadow-xl max-w-md mx-auto rounded-t-2xl">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1.5 py-1 px-2.5 rounded-xl transition duration-300 cursor-pointer ${
                active ? 'text-[#d35d3b]' : 'text-[#FAF6EE]/50 hover:text-white'
              }`}
            >
              <div className="relative">{item.icon(active)}</div>
              <span className="text-[8px] font-black tracking-widest uppercase">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
export default BottomNav;
