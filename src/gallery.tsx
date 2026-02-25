import React, { useState } from 'react';
import { MapPin, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEvents } from './hooks/useSupabaseData';

const defaultImage = 'https://images.pexels.com/photos/1099816/pexels-photo-1099816.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop';

const CATEGORIES: { label: string; bg: string; text: string }[] = [
  { label: 'Cooking', bg: 'bg-red-50', text: 'text-red-600' },
  { label: 'Art & Craft', bg: 'bg-blue-50', text: 'text-blue-600' },
  { label: 'Fashion', bg: 'bg-violet-50', text: 'text-violet-600' },
  { label: 'Jewelry', bg: 'bg-amber-50', text: 'text-amber-600' },
  { label: 'Handmade', bg: 'bg-green-50', text: 'text-green-600' },
  { label: 'Photography', bg: 'bg-pink-50', text: 'text-pink-600' },
];

const TESTIMONIALS = [
  { quote: "BoothBuzz transformed our society's parking area into a vibrant marketplace. Flawless organization and overwhelming community response.", author: "Priya Sharma", role: "Society Secretary, Sunrise Apartments", image: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop", rating: 5 },
  { quote: "As a home baker, this exhibition gave me the perfect platform. I received 50+ orders and made wonderful connections.", author: "Meera Patel", role: "Home Baker & Exhibitor", image: "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop", rating: 5 },
  { quote: "The art exhibition brought our community together like never before. Well-organized and incredibly supportive team.", author: "Rajesh Kumar", role: "Resident, Green Valley Society", image: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop", rating: 5 },
  { quote: "Our jewelry exhibition was a huge success. We sold 80% of inventory and gained many new customers.", author: "Anita Desai", role: "Jewelry Designer, Sparkle Creations", image: "https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop", rating: 5 },
  { quote: "The food festival was phenomenal. Our restaurant gained 100+ new regular customers from this single event.", author: "Chef Vikram Singh", role: "Owner, Spice Garden Restaurant", image: "https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop", rating: 5 },
];

export const Gallery: React.FC<{ title?: string }> = () => {
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const { events, loading, error } = useEvents();

  const scrollGallery = (dir: number) => {
    const el = document.getElementById('gallery-events-container');
    if (el) el.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };
  const scrollTestimonials = (dir: number) => {
    const el = document.getElementById('testimonials-container');
    if (el) el.scrollBy({ left: dir * 340, behavior: 'smooth' });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-12">
        <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Past events</h2>
        <p className="mt-2 text-slate-600">Highlights from our community exhibitions.</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-10">
        {CATEGORIES.map((cat) => (
          <span
            key={cat.label}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg border border-transparent hover:opacity-90 transition-opacity ${cat.bg} ${cat.text}`}
          >
            {cat.label}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between gap-4 mb-6">
        <p className="text-sm text-slate-500">Scroll or use arrows</p>
        <div className="flex gap-1">
          <button type="button" onClick={() => scrollGallery(-1)} className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors" aria-label="Previous">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button type="button" onClick={() => scrollGallery(1)} className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors" aria-label="Next">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">Loading…</div>
      ) : error ? (
        <div className="py-16 text-center text-red-500 text-sm">Error: {error}</div>
      ) : (
        <div
          id="gallery-events-container"
          className="flex gap-6 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 sm:mx-0 sm:px-0"
        >
          {events.map((event) => (
            <button
              key={event.id}
              type="button"
              onClick={() => setSelectedEvent(event)}
              className="flex-shrink-0 w-[280px] sm:w-[300px] text-left bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 transition-colors"
            >
              <div className="aspect-[4/3] bg-slate-100">
                <img
                  src={event.image || defaultImage}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = defaultImage; }}
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-slate-900">{event.title}</h3>
                <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                  <MapPin className="h-4 w-4 shrink-0" />
                  {event.venue}
                </div>
                {event.attendees != null && (
                  <p className="mt-1 text-sm text-slate-500">{event.attendees} attendees</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="mt-20">
        <h3 className="text-xl font-semibold text-slate-900 mb-6">What clients say</h3>
        <div className="flex items-center justify-end gap-1 mb-4">
          <button type="button" onClick={() => scrollTestimonials(-1)} className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50" aria-label="Previous">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button type="button" onClick={() => scrollTestimonials(1)} className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50" aria-label="Next">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div id="testimonials-container" className="flex gap-6 overflow-x-auto scrollbar-hide pb-2">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="flex-shrink-0 w-[300px] rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex gap-1 mb-3">
                {[...Array(t.rating)].map((_, j) => (
                  <Star key={j} className="h-4 w-4 text-amber-400 fill-current" />
                ))}
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">"{t.quote}"</p>
              <div className="mt-4 flex items-center gap-3">
                <img src={t.image} alt="" className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <div className="font-medium text-slate-900 text-sm">{t.author}</div>
                  <div className="text-xs text-slate-500">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedEvent(null)}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start gap-4">
              <h2 className="text-2xl font-semibold text-slate-900">{selectedEvent.title}</h2>
              <button type="button" onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="mt-2 flex items-center gap-4 text-slate-600 text-sm">
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {selectedEvent.venue}</span>
              <span>{selectedEvent.attendees} attendees</span>
            </div>
            <span className="inline-block mt-3 px-2.5 py-1 text-xs font-medium rounded bg-slate-100 text-slate-700">
              {selectedEvent.planType || 'Event'}
            </span>
            <p className="mt-4 text-slate-600 leading-relaxed">{selectedEvent.description || 'No description.'}</p>
            <div className="mt-6">
              <img
                src={selectedEvent.image || defaultImage}
                alt=""
                className="rounded-lg w-full h-48 object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = defaultImage; }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;
