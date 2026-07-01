import React, { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number; // percentage left
  delay: number; // seconds
  duration: number; // seconds
  size: number; // pixels
  color: string;
  shape: 'circle' | 'square' | 'triangle';
}

const CONFETTI_COLORS = [
  '#f97316', // orange-500
  '#ec4899', // pink-500
  '#8b5cf6', // purple-500
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#eab308', // yellow-500
];

const SHAPES: ('circle' | 'square' | 'triangle')[] = ['circle', 'square', 'triangle'];

export const Confetti: React.FC = () => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const generated: Particle[] = Array.from({ length: 80 }).map((_, idx) => {
      const size = Math.floor(Math.random() * 8) + 6;
      return {
        id: idx,
        x: Math.random() * 100,
        delay: Math.random() * 1.5,
        duration: Math.random() * 2 + 2,
        size,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
      };
    });
    setParticles(generated);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      <style>{`
        @keyframes fall {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(105vh) rotate(720deg);
            opacity: 0;
          }
        }
        .confetti-piece {
          animation-name: fall;
          animation-timing-function: cubic-bezier(0.1, 0.8, 0.3, 1);
          animation-fill-mode: forwards;
        }
      `}</style>
      {particles.map((p) => {
        let borderRadius = '0px';
        let clipPath = 'none';

        if (p.shape === 'circle') {
          borderRadius = '50%';
        } else if (p.shape === 'triangle') {
          clipPath = 'polygon(50% 0%, 0% 100%, 100% 100%)';
        }

        return (
          <div
            key={p.id}
            className="confetti-piece absolute"
            style={{
              left: `${p.x}%`,
              top: `-20px`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
              borderRadius,
              clipPath,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          />
        );
      })}
    </div>
  );
};
export default Confetti;
