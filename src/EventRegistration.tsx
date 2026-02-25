import React, { useState } from 'react';

const RegisterEvent: React.FC = () => {
  const [eventData, setEventData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    venue: '',
    city: '',
    capacity: 100,
    status: 'Draft',
    plan: 'Plan A - Basic Package',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEventData(prev => ({ ...prev, [name]: value }));
  };

  const handlePlanChange = (plan: string) => {
    setEventData(prev => ({ ...prev, plan }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Event Submitted:', eventData);
    alert('Event Created!');
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-lg mt-10 space-y-8">
      <h2 className="text-3xl font-bold text-gray-800 text-center">Create New Event</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Event Details */}
        <section>
          <h3 className="text-xl font-semibold text-purple-700 mb-4">Event Details</h3>
          <div className="space-y-4">
            <input
              name="title"
              placeholder="Enter event title"
              required
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
            />
            <textarea
              name="description"
              placeholder="Describe your event..."
              required
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
              rows={4}
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="date"
                name="date"
                required
                onChange={handleChange}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
              />
              <input
                type="time"
                name="time"
                required
                onChange={handleChange}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>
        </section>

        {/* Venue & Location */}
        <section>
          <h3 className="text-xl font-semibold text-purple-700 mb-4">Venue & Location</h3>
          <div className="grid grid-cols-2 gap-4">
            <select
              name="venue"
              required
              onChange={handleChange}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">Select a venue</option>
              <option value="Hall A">Hall A</option>
              <option value="Hall B">Hall B</option>
            </select>
            <input
              name="city"
              placeholder="Enter city"
              required
              onChange={handleChange}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
        </section>

        {/* Configuration */}
        <section>
          <h3 className="text-xl font-semibold text-purple-700 mb-4">Event Configuration</h3>
          <div className="space-y-4">
            <input
              type="number"
              name="capacity"
              placeholder="Maximum Capacity"
              value={eventData.capacity}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
            />
            <select
              name="status"
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="Draft">Draft</option>
              <option value="Published">Published</option>
            </select>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              {[
                'Plan A - Basic Package',
                'Plan B - Standard Package',
                'Plan C - Premium Package',
                'Custom Package'
              ].map((plan) => (
                <button
                  type="button"
                  key={plan}
                  className={`border rounded-md px-4 py-2 text-sm font-medium ${
                    eventData.plan === plan
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-purple-50'
                  }`}
                  onClick={() => handlePlanChange(plan)}
                >
                  {plan}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Submit */}
        <button
          type="submit"
          className="w-full py-3 bg-purple-600 text-white font-semibold rounded-md shadow-md hover:bg-purple-700 transition duration-300"
        >
          Create Event
        </button>
      </form>
    </div>
  );
};

export default RegisterEvent;
