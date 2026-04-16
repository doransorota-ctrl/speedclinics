const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";

function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timeout));
}

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
];

/** Generate the Google OAuth consent URL. */
export function getGoogleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    state,
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/** Exchange an authorization code for access + refresh tokens. */
export async function exchangeCodeForTokens(code: string) {
  const res = await fetchWithTimeout(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    throw new Error(`Google token exchange failed: ${res.statusText}`);
  }

  const data = await res.json();
  return {
    accessToken: data.access_token as string,
    refreshToken: data.refresh_token as string,
    expiresIn: data.expires_in as number,
  };
}

/** Refresh an expired access token. */
export async function refreshAccessToken(refreshToken: string) {
  const res = await fetchWithTimeout(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    throw new Error(`Google token refresh failed: ${res.statusText}`);
  }

  const data = await res.json();
  return {
    accessToken: data.access_token as string,
    expiresIn: data.expires_in as number,
  };
}

/** Fetch the user's primary calendar ID. */
export async function getPrimaryCalendarId(
  accessToken: string
): Promise<string> {
  const res = await fetchWithTimeout(`${GOOGLE_CALENDAR_API}/users/me/calendarList`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to list calendars: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const primary = data.items?.find((c: { primary?: boolean }) => c.primary);
  return primary?.id ?? "primary";
}

/** Get free/busy information for a calendar. */
export async function getFreeBusy(
  accessToken: string,
  calendarId: string,
  timeMin: string,
  timeMax: string
) {
  const res = await fetchWithTimeout(`${GOOGLE_CALENDAR_API}/freeBusy`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      timeMin,
      timeMax,
      items: [{ id: calendarId }],
    }),
  });

  if (!res.ok) {
    console.error(`[Calendar] FreeBusy failed: ${res.status} ${res.statusText}`);
    return [];
  }

  const data = await res.json();
  return data.calendars?.[calendarId]?.busy ?? [];
}

/** List calendar events in a time range. */
export async function listCalendarEvents(
  accessToken: string,
  calendarId: string,
  timeMin: string,
  timeMax: string
) {
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "100",
  });

  const res = await fetchWithTimeout(
    `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) return [];

  const data = await res.json();
  return (data.items ?? []).map(
    (e: {
      id: string;
      summary?: string;
      description?: string;
      location?: string;
      start?: { dateTime?: string; date?: string };
      end?: { dateTime?: string; date?: string };
    }) => ({
      id: e.id,
      summary: e.summary || "(Geen titel)",
      description: e.description || "",
      location: e.location || null,
      start: e.start?.dateTime || e.start?.date || null,
      end: e.end?.dateTime || e.end?.date || null,
    })
  );
}

/** Create a calendar event for a booked appointment. */
export async function createCalendarEvent(
  accessToken: string,
  calendarId: string,
  event: {
    summary: string;
    description: string;
    location?: string;
    start: string; // ISO datetime
    end: string; // ISO datetime
  }
) {
  const res = await fetchWithTimeout(
    `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: event.summary,
        description: event.description,
        location: event.location,
        start: { dateTime: event.start, timeZone: "Europe/Amsterdam" },
        end: { dateTime: event.end, timeZone: "Europe/Amsterdam" },
        reminders: {
          useDefault: false,
          overrides: [
            { method: "popup", minutes: 60 },
            { method: "popup", minutes: 15 },
          ],
        },
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to create calendar event: ${res.statusText}`);
  }

  const data = await res.json();
  return { eventId: data.id as string, htmlLink: data.htmlLink as string };
}

/** Update a calendar event's summary and description. */
export async function updateCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
  updates: { summary?: string; description?: string }
) {
  const res = await fetchWithTimeout(
    `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to update calendar event: ${res.statusText}`);
  }

  return await res.json();
}

/** Delete a calendar event by its ID. */
export async function deleteCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string
) {
  const res = await fetchWithTimeout(
    `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok && res.status !== 404) {
    throw new Error(`Failed to delete calendar event: ${res.statusText}`);
  }
}
