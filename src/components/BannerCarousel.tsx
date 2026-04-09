import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DEFAULT_SLIDES = [
  { id: '1', image: 'https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg?auto=compress&cs=tinysrgb&w=1800', title: 'Exhibitions that bring communities together' },
  { id: '2', image: 'https://images.pexels.com/photos/2747449/pexels-photo-2747449.jpeg?auto=compress&cs=tinysrgb&w=1800', title: 'Local talent, local venues' },
  { id: '3', image: 'https://images.pexels.com/photos/2263436/pexels-photo-2263436.jpeg?auto=compress&cs=tinysrgb&w=1800', title: 'Plan your next exhibition' },
];

const FALLBACK_IMAGE = 'https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg?auto=compress&cs=tinysrgb&w=1800';

export const BannerCarousel: React.FC<{ onScrollToSection?: (id: string) => void }> = ({ onScrollToSection }) => {
  const [index, setIndex] = useState(0);

  const slides = DEFAULT_SLIDES;

  const go = (next: number) => {
    setIndex(i => (i + next + slides.length) % slides.length);
  };

  const slideCount = slides.length;
  useEffect(() => {
    const t = setInterval(() => setIndex(i => (i + 1) % slideCount), 5000);
    return () => clearInterval(t);
  }, [slideCount]);

  return (
    <section className="relative h-[70vh] min-h-[420px] overflow-hidden bg-slate-900">
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          className="absolute inset-0 transition-opacity duration-700 ease-out"
          style={{
            opacity: i === index ? 1 : 0,
            zIndex: i === index ? 1 : 0,
          }}
        >
          <img
            src={slide.image}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => {
              const t = e.target as HTMLImageElement;
              t.src = FALLBACK_IMAGE;
            }}
          />
          <div className="absolute inset-0 bg-slate-900/50" />
        </div>
      ))}

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-4 text-center">
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold text-white tracking-tight max-w-4xl">
          {slides[index]?.title ?? 'Bringing exhibitions to life'}
        </h1>
        <p className="mt-4 text-lg sm:text-xl text-white/90 max-w-2xl">
          Local exhibition hosting for societies, malls, and venues. Connect communities and showcase talent.
        </p>
        <div className="mt-10 flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => onScrollToSection?.('contact')}
            className="px-6 py-3 bg-white text-slate-900 font-medium rounded-md hover:bg-slate-100 transition-colors"
          >
            Plan your exhibition
          </button>
          <button
            onClick={() => onScrollToSection?.('events')}
            className="px-6 py-3 border border-white/80 text-white font-medium rounded-md hover:bg-white/10 transition-colors"
          >
            View events
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => go(-1)}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        type="button"
        onClick={() => go(1)}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === index ? 'w-8 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/70'
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
};
