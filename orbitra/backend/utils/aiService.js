const OpenAI = require('openai');

let openaiClient = null;

const getOpenAIClient = () => {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
};

/**
 * Extract structured booking data from raw text
 */
const extractBookingData = async (rawTexts) => {
  const combinedText = rawTexts.join('\n\n---DOCUMENT SEPARATOR---\n\n');

  const prompt = `You are a travel document parser. Extract all booking information from the following travel documents.

Return a JSON array where each element represents one booking/document with these fields:
- type: "flight" | "hotel" | "train" | "bus" | "ferry" | "car_rental" | "other"
- from: origin city/location
- to: destination city/location  
- departureDate: date string (YYYY-MM-DD format if possible)
- departureTime: time string
- arrivalDate: date string
- arrivalTime: time string
- passengerName: traveler name
- bookingRef: booking/PNR/confirmation number
- carrier: airline/hotel/transport company name
- flightNumber: flight/train/bus number
- seatNumber: seat/room assignment
- checkIn: hotel check-in date
- checkOut: hotel check-out date
- hotelName: hotel name
- roomType: room type description
- raw: brief summary of document

Only include fields that have actual values. Return ONLY valid JSON, no explanation.

Documents:
${combinedText}`;

  const client = getOpenAIClient();
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.1,
  });

  const content = response.choices[0].message.content;
  const parsed = JSON.parse(content);
  return Array.isArray(parsed) ? parsed : parsed.bookings || parsed.data || [parsed];
};

/**
 * Generate comprehensive itinerary from extracted booking data
 */
const generateItinerary = async (extractedData, userPreferences = {}) => {
  const dataStr = JSON.stringify(extractedData, null, 2);

  const prompt = `You are an expert travel planner. Based on the following travel booking data, create a comprehensive and detailed travel itinerary.

Booking Data:
${dataStr}

User Preferences: ${JSON.stringify(userPreferences)}

Create a complete itinerary JSON with this exact structure:
{
  "title": "Trip title (e.g., 'Paris Adventure - June 2024')",
  "destination": "Main destination",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "duration": <number of days>,
  "travelers": <number of travelers, default 1>,
  "summary": "2-3 sentence trip overview",
  "tags": ["array", "of", "trip", "tags", "like", "leisure", "adventure", "family"],
  "days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "title": "Day title",
      "activities": [
        {
          "time": "HH:MM",
          "activity": "Activity description",
          "location": "Location name",
          "notes": "Helpful tips or details",
          "type": "transport|accommodation|food|sightseeing|leisure|other"
        }
      ]
    }
  ],
  "tips": [
    "Practical travel tip 1",
    "Practical travel tip 2",
    "Practical travel tip 3"
  ],
  "emergencyInfo": {
    "localEmergency": "112 or local emergency number",
    "embassy": "Indian embassy contact if applicable",
    "nearestHospital": "General advice on finding hospitals"
  }
}

Rules:
- Include ALL booked activities (flights, hotel check-ins/check-outs, etc.) in the correct day
- Add realistic suggestions for free time between bookings
- Include meal recommendations at appropriate times
- Add local transportation tips
- Keep activities realistic for the destination
- Return ONLY valid JSON, no other text`;

  const client = getOpenAIClient();
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 4000,
  });

  const content = response.choices[0].message.content;
  return JSON.parse(content);
};

/**
 * Fallback: generate itinerary from raw text if structured extraction fails
 */
const generateFromRawText = async (rawTexts) => {
  const combined = rawTexts.join('\n\n');

  const prompt = `Based on these travel documents, create a travel itinerary in JSON format:

${combined}

Return JSON with: title, destination, startDate, endDate, duration, travelers, summary, days (array with day, date, title, activities), tips, tags.
Each activity has: time, activity, location, notes, type.
Return ONLY valid JSON.`;

  const client = getOpenAIClient();
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 3000,
  });

  return JSON.parse(response.choices[0].message.content);
};

module.exports = {
  extractBookingData,
  generateItinerary,
  generateFromRawText,
};
