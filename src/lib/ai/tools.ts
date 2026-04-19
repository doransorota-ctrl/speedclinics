/** Tool definitions for the AI assistant (OpenAI Responses API format) */

export const CLINIC_TOOLS = [
  {
    type: "function" as const,
    name: "lookup_treatment_info",
    description: "Zoek informatie over behandelingen, prijzen, FAQ of andere kliniekinfo op de website van de kliniek. Gebruik dit bij elke vraag over behandelingen, prijzen, of wat de kliniek aanbiedt.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Wat te zoeken, bijv. 'lip fillers prijs', 'botox behandeling', 'openingstijden'"
        }
      },
      required: ["query"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    type: "function" as const,
    name: "check_availability",
    description: "Check beschikbare afspraaktijden voor een specifieke datum. Gebruik dit als de patiënt een afspraak wil maken of vraagt naar beschikbaarheid.",
    parameters: {
      type: "object",
      properties: {
        preferred_date: {
          type: "string",
          description: "Datum in YYYY-MM-DD formaat"
        },
        preferred_time: {
          type: "string",
          description: "Gewenste tijd in HH:MM formaat, of 'ochtend', 'middag', 'avond'. Optioneel."
        },
      },
      required: ["preferred_date"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    type: "function" as const,
    name: "book_appointment",
    description: "Boek een bevestigde afspraak. Gebruik dit ALLEEN nadat de patiënt een specifiek tijdslot heeft bevestigd EN je hun naam hebt.",
    parameters: {
      type: "object",
      properties: {
        patient_name: { type: "string", description: "Naam van de patiënt" },
        start_time: { type: "string", description: "Starttijd in YYYY-MM-DDThh:mm:ss formaat" },
        end_time: { type: "string", description: "Eindtijd in YYYY-MM-DDThh:mm:ss formaat" },
        treatment_type: { type: "string", description: "Type behandeling, bijv. 'Botox', 'Lip fillers'" },
      },
      required: ["patient_name", "start_time", "end_time", "treatment_type"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    type: "function" as const,
    name: "find_appointment",
    description: "Zoek een bestaande afspraak op basis van patiëntnaam of telefoonnummer. Gebruik dit als de patiënt wil verzetten of annuleren.",
    parameters: {
      type: "object",
      properties: {
        patient_name: { type: "string", description: "Naam van de patiënt" },
        patient_phone: { type: "string", description: "Telefoonnummer van de patiënt" },
      },
      required: ["patient_phone"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    type: "function" as const,
    name: "cancel_appointment",
    description: "Annuleer een bestaande afspraak. Gebruik dit ALLEEN nadat de patiënt heeft bevestigd dat ze willen annuleren.",
    parameters: {
      type: "object",
      properties: {
        appointment_id: { type: "string", description: "ID van de afspraak" },
        reason: { type: "string", description: "Reden van annulering" },
      },
      required: ["appointment_id"],
      additionalProperties: false,
    },
    strict: true,
  },
];
