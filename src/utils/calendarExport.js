/**
 * Generates an iCalendar (.ics) file content from calendar events
 * @param {Array.<{
 *   id: string,
 *   startTime: Date,
 *   endTime: Date,
 *   title: string,
 *   location?: string,
 *   description?: string
 * }>} events - Array of calendar events
 * @returns {string} - iCalendar file content
 */
export function generateICalendar(events) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Trip Build//Calendar Export//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ]

  for (const {
    id,
    startTime,
    endTime,
    title,
    location,
    description,
  } of events) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${id}@tripbuild.com`,
      `DTSTAMP:${formatICalDateTime(new Date())}`,
      `DTSTART:${formatICalDateTime(startTime)}`,
      `DTEND:${formatICalDateTime(endTime)}`,
      `SUMMARY:${escapeICalText(title)}`
    )

    if (location) {
      lines.push(`LOCATION:${escapeICalText(location)}`)
    }

    if (description) {
      lines.push(`DESCRIPTION:${escapeICalText(description)}`)
    }

    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')

  return lines.join('\r\n')
}

/**
 * Formats a Date object into iCalendar date-time format
 * @param {Date} date - Date to format
 * @returns {string} - Formatted date-time string
 */
function formatICalDateTime(date) {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  const seconds = String(date.getUTCSeconds()).padStart(2, '0')

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`
}

/**
 * Escapes text for iCalendar format
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
function escapeICalText(text) {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

/**
 * Downloads an iCalendar file
 * @param {string} content - iCalendar content
 * @param {string} [filename='trip-calendar.ics'] - Name for the downloaded file
 * @returns {void}
 */
export function downloadICalendar(content, filename = 'trip-calendar.ics') {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
