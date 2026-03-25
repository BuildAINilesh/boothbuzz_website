import React from 'react';
import type { AdFormat } from '../config/adSlots';
import { Sparkles, Building2, Calendar, Users, ArrowRight } from 'lucide-react';

const MOCK_ADS: Record<
  string,
  { title: string; tagline: string; cta: string; imageSeed?: number; icon?: 'sparkles' | 'building' | 'calendar' | 'users' }
> = {
  top_strip: {
    title: 'Exhibit at your local mall',
    tagline: 'Partner with BoothBuzz for high-footfall venues. Book a stall in minutes.',
    cta: 'Learn more',
    imageSeed: 10,
    icon: 'building',
  },
  home_about: {
    title: 'Venue Partners Programme',
    tagline: 'Societies & malls — host exhibitions that bring communities together. Join 50+ venues.',
    cta: 'Partner with us',
    imageSeed: 20,
    icon: 'sparkles',
  },
  events_above: {
    title: 'Sponsor an upcoming event',
    tagline: 'Reach engaged audiences at curated exhibitions. Premium visibility for your brand.',
    cta: 'Get in touch',
    imageSeed: 30,
    icon: 'calendar',
  },
  events_infeed: {
    title: 'BoothBuzz Pro',
    tagline: 'Premium stall placement, dedicated marketing & priority support for exhibitors.',
    cta: 'Upgrade',
    imageSeed: 40,
    icon: 'users',
  },
  gallery_middle: {
    title: 'Past events showcase',
    tagline: 'See how we turn spaces into destinations. Real stories from communities.',
    cta: 'View gallery',
    imageSeed: 50,
    icon: 'sparkles',
  },
  exhibitors_above: {
    title: 'Exhibitor solutions',
    tagline: 'Stall kits, branding & end-to-end logistics for your next show. Trusted by 500+ exhibitors.',
    cta: 'Explore',
    imageSeed: 60,
    icon: 'building',
  },
  above_contact: {
    title: 'Ready to host or exhibit?',
    tagline: 'Plan your next exhibition with BoothBuzz. From concept to completion.',
    cta: 'Contact us',
    imageSeed: 70,
    icon: 'calendar',
  },
  sticky: {
    title: 'Book a stall at the next event',
    tagline: 'Register as exhibitor',
    cta: 'Register',
    imageSeed: 80,
  },
};

const FOOTER_PARTNERS = [
  { name: 'Venue Partner', sub: '50+ venues' },
  { name: 'Event Sponsor', sub: 'Premium visibility' },
  { name: 'Community Mall', sub: 'High footfall' },
];

const placeholderImg = (w: number, h: number, seed: number) =>
  `https://picsum.photos/seed/bb${seed}/${w}/${h}`;

const IconComp = ({ icon }: { icon?: string }) => {
  switch (icon) {
    case 'sparkles':
      return <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-white/90" />;
    case 'building':
      return <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-white/90" />;
    case 'calendar':
      return <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-white/90" />;
    case 'users':
      return <Users className="w-6 h-6 sm:w-8 sm:h-8 text-white/90" />;
    default:
      return <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-white/90" />;
  }
};

/** Full-width premium leaderboard: full-bleed image, overlay, typography, CTA */
function LeaderboardMock({ slotId }: { slotId: string }) {
  const ad = MOCK_ADS[slotId] ?? MOCK_ADS.top_strip;
  const seed = ad.imageSeed ?? 1;
  return (
    <a
      href="#"
      className="group block w-full min-h-[120px] sm:min-h-[140px] relative overflow-hidden"
      onClick={(e) => e.preventDefault()}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/95 via-slate-900/90 to-indigo-800/95" />
      <img
        src={placeholderImg(1600, 400, seed)}
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-50 group-hover:scale-105 transition-all duration-500"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
            <IconComp icon={ad.icon} />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-indigo-200 mb-1">
              Sponsored
            </p>
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white tracking-tight">
              {ad.title}
            </h3>
            <p className="text-sm text-white/80 mt-1 max-w-2xl">{ad.tagline}</p>
          </div>
        </div>
        <span className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-indigo-600 font-semibold text-sm hover:bg-indigo-50 transition-colors">
          {ad.cta}
          <ArrowRight className="w-4 h-4" />
        </span>
      </div>
    </a>
  );
}

function RectangleMock({ slotId }: { slotId: string }) {
  const ad = MOCK_ADS[slotId] ?? MOCK_ADS.gallery_middle;
  const seed = ad.imageSeed ?? 50;
  return (
    <a
      href="#"
      className="group block w-full max-w-[min(400px,calc(100vw-2rem))] mx-auto rounded-2xl overflow-hidden bg-white border border-slate-200/80 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:border-indigo-200/80 transition-all duration-300"
      onClick={(e) => e.preventDefault()}
    >
      <div className="relative aspect-[16/10] bg-gradient-to-br from-indigo-100 to-slate-100 overflow-hidden">
        <img
          src={placeholderImg(400, 250, seed)}
          alt=""
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-white/90">
            Sponsored
          </span>
          <h3 className="text-lg font-bold text-white mt-0.5">{ad.title}</h3>
        </div>
      </div>
      <div className="p-5">
        <p className="text-slate-600 text-sm leading-relaxed">{ad.tagline}</p>
        <span className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-indigo-600">
          {ad.cta}
          <ArrowRight className="w-4 h-4" />
        </span>
      </div>
    </a>
  );
}

function NativeMock({ slotId }: { slotId: string }) {
  const ad = MOCK_ADS[slotId] ?? MOCK_ADS.events_infeed;
  const seed = ad.imageSeed ?? 40;
  return (
    <a
      href="#"
      className="group block w-full h-full min-h-[250px] rounded-2xl overflow-hidden bg-white border border-slate-200/80 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:border-indigo-200/80 transition-all duration-300"
      onClick={(e) => e.preventDefault()}
    >
      <div className="relative aspect-[4/3] bg-gradient-to-br from-indigo-100 to-slate-100 overflow-hidden">
        <img
          src={placeholderImg(300, 225, seed)}
          alt=""
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/50 text-[10px] font-medium uppercase tracking-wider text-white">
          Sponsored
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-slate-900">{ad.title}</h3>
        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{ad.tagline}</p>
        <span className="inline-flex items-center gap-1 mt-3 text-sm font-semibold text-indigo-600">
          {ad.cta}
          <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </a>
  );
}

function FooterMock() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
      {FOOTER_PARTNERS.map((p) => (
        <div
          key={p.name}
          className="flex flex-col items-center gap-1 px-6 py-4 rounded-xl bg-white/60 border border-slate-200/80 hover:border-indigo-200 hover:bg-white/80 transition-colors min-w-[140px]"
        >
          <span className="text-sm font-bold text-slate-700">{p.name}</span>
          <span className="text-xs text-slate-500">{p.sub}</span>
        </div>
      ))}
    </div>
  );
}

function StickyMock({ slotId }: { slotId: string }) {
  const ad = MOCK_ADS[slotId] ?? MOCK_ADS.sticky;
  return (
    <a
      href="#"
      className="flex items-center gap-4 px-5 py-2.5 rounded-lg bg-white border border-slate-200 shadow-lg hover:border-indigo-200 transition-colors max-w-[400px]"
      onClick={(e) => e.preventDefault()}
    >
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-lg shadow-md">
        B
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-slate-900 text-sm truncate">{ad.title}</div>
        <div className="text-xs text-slate-500 truncate">{ad.tagline}</div>
      </div>
      <span className="text-sm font-semibold text-indigo-600 flex-shrink-0 bg-indigo-50 px-3 py-1.5 rounded-md">
        {ad.cta}
      </span>
    </a>
  );
}

export interface MockAdContentProps {
  slotId: string;
  format: AdFormat;
}

export function MockAdContent({ slotId, format }: MockAdContentProps) {
  if (format === 'footer') return <FooterMock />;
  if (format === 'sticky-bottom' || format === 'sticky-side') return <StickyMock slotId={slotId} />;
  if (format === 'rectangle') return <RectangleMock slotId={slotId} />;
  if (format === 'native') return <NativeMock slotId={slotId} />;
  return <LeaderboardMock slotId={slotId} />;
}
