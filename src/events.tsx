import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEvents, useUsers } from './hooks/useSupabaseData';
import React, { useState } from 'react';
import { EventRegistration } from './components/EventRegistration';

export interface Event {
  id: string;
  name: string;
  description: string;
  location: string;
  date: string;
  time: string;
}

const defaultImage = 'https://images.pexels.com/photos/1099816/pexels-photo-1099816.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop';

export const Events: React.FC = () => {
  const { loading: usersLoading } = useUsers();
  const { events, loading: eventsLoading } = useEvents();
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showRegistration, setShowRegistration] = useState(false);

  const loading = usersLoading || eventsLoading;

  const registerEvent = (event: any) => {
    setSelectedEvent(event);
    setShowRegistration(true);
  };

  const closeRegistration = () => {
    setShowRegistration(false);
    setSelectedEvent(null);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-64 flex items-center justify-center text-slate-400 text-sm">Loading events…</div>
      </div>
    );
  }

  const mappedEvents = events.map(event => ({
    id: event.id,
    title: event.title,
    date: event.date,
    time: event.time,
    location: event.venue,
    type: event.planType,
    description: event.description,
    image: event.image || defaultImage,
    featured: event.planType === 'Plan A'
  }));

  const scroll = (dir: number) => {
    const el = document.getElementById('events-container');
    if (el) el.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Upcoming events</h2>
          <p className="mt-2 text-slate-600">Exhibitions and fairs in your area.</p>
        </div>

        <div className="flex items-center justify-between gap-4 mb-6">
          <p className="text-sm text-slate-500">Scroll or use arrows</p>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => scroll(-1)}
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => scroll(1)}
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              aria-label="Next"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div
          id="events-container"
          className="flex gap-6 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 sm:mx-0 sm:px-0"
        >
          {mappedEvents.map((event) => (
            <article
              key={event.id}
              className="flex-shrink-0 w-[280px] sm:w-[300px] bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-indigo-200 transition-colors"
            >
              <div className="relative aspect-[4/3] bg-slate-100">
                <img
                  src={event.image}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = defaultImage; }}
                />
                {event.featured && (
                  <span className="absolute top-3 left-3 text-xs font-medium px-2 py-1 rounded bg-indigo-100 text-indigo-800">
                    Featured
                  </span>
                )}
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-slate-900">{event.title}</h3>
                <p className="mt-1 text-sm text-slate-600 line-clamp-2">{event.description}</p>
                <div className="mt-4 space-y-1.5 text-sm text-slate-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 shrink-0" />
                    {event.date}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 shrink-0" />
                    {event.time}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0" />
                    {event.location}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => registerEvent(event)}
                  className="mt-5 w-full py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Register
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      {selectedEvent && showRegistration && (
        <EventRegistration event={selectedEvent} isOpen={showRegistration} onClose={closeRegistration} />
      )}
    </>
  );
};
