/**
 * Converts an itinerary event into a calendar block format
 * @param {Object} event - The event object from the itinerary
 * @returns {Object} - Calendar block format
 */
export const eventToCalendarBlock = (event) => {
  return {
    id: event.id,
    title: event.title,
    start: new Date(event.startTime),
    end: new Date(event.endTime),
    extendedProps: {
      location: event.location,
      notes: event.notes
    }
  };
};

/**
 * Parses an entire itinerary into calendar blocks
 * @param {Object} itinerary - The complete itinerary object
 * @returns {Array} - Array of calendar blocks
 */
export const parseItineraryToCalendarBlocks = (itinerary) => {
  if (!itinerary || !itinerary.events) {
    return [];
  }

  return itinerary.events.map(eventToCalendarBlock);
};

/**
 * Groups events by date for easier display
 * @param {Array} calendarBlocks - Array of calendar blocks
 * @returns {Object} - Events grouped by date
 */
export const groupEventsByDate = (calendarBlocks) => {
  return calendarBlocks.reduce((acc, event) => {
    const date = event.start.toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(event);
    return acc;
  }, {});
}; 