import type { ExtractionResult, ExtractionEvent } from "@tripboard/shared";

interface AIExtractorConfig {
  provider: string;
  model: string;
}

interface ExtractionContext {
  source?: string;
  filename?: string;
  mimeType?: string;
}

const EXTRACTION_SYSTEM_PROMPT = `You are a travel document parser for TripBoard, a privacy-first travel management system.

Your task: extract structured travel information from raw text (from emails, PDFs, images, or calendar files).

Always respond with valid JSON matching the ExtractionResult schema:
{
  "documentType": "BOOKING_CONFIRMATION|FLIGHT_TICKET|BOARDING_PASS|HOTEL_VOUCHER|TRAIN_TICKET|TOUR_VOUCHER|VISA|PASSPORT|INSURANCE|RECEIPT|ITINERARY|OTHER",
  "confidence": 0.0-1.0,
  "fields": {
    // Type-specific structured fields
  },
  "events": [
    {
      "type": "FLIGHT|TRAIN|HOTEL|ACTIVITY|RESTAURANT|TRANSFER|OTHER",
      "title": "Human-readable event title",
      "startsAt": "ISO 8601 datetime or null",
      "endsAt": "ISO 8601 datetime or null",
      "locationName": "Place name or null",
      "details": { /* type-specific structured details */ },
      "confidence": 0.0-1.0
    }
  ]
}

Rules:
- Only extract information that is explicitly present in the text
- Never infer or hallucinate booking references, flight numbers, or dates
- If a date has no year, infer the nearest future year
- Set confidence < 0.7 if the text is ambiguous or incomplete
- For flights: always extract flight number, route, departure/arrival times, booking reference
- For hotels: always extract check-in/out dates, hotel name, confirmation number
- For trains: extract train number, departure/arrival station and time, seat if present`;

/**
 * AIExtractor is the AI provider abstraction layer.
 * Supports: Anthropic Claude, OpenAI GPT, Google Gemini
 * Configured via AI_PROVIDER and AI_MODEL env vars.
 */
export class AIExtractor {
  constructor(private readonly config: AIExtractorConfig) {}

  async extract(text: string, context: ExtractionContext = {}): Promise<ExtractionResult> {
    const start = Date.now();

    const userPrompt = this.buildPrompt(text, context);

    let raw: string;
    try {
      raw = await this.callProvider(userPrompt);
    } catch (err) {
      console.error("[AIExtractor] Provider call failed:", err);
      return this.fallbackResult(Date.now() - start);
    }

    try {
      const parsed = JSON.parse(raw) as ExtractionResult;
      parsed.metadata = {
        model: this.config.model,
        processingTimeMs: Date.now() - start,
      };
      return parsed;
    } catch {
      console.error("[AIExtractor] Failed to parse AI response as JSON");
      return this.fallbackResult(Date.now() - start);
    }
  }

  private buildPrompt(text: string, context: ExtractionContext): string {
    const contextLine = context.filename
      ? `Document: ${context.filename} (${context.mimeType ?? "unknown"}), source: ${context.source ?? "upload"}\n\n`
      : "";
    return `${contextLine}Extract travel information from the following text:\n\n---\n${text.slice(0, 12000)}\n---`;
  }

  private async callProvider(prompt: string): Promise<string> {
    switch (this.config.provider) {
      case "anthropic":
        return this.callAnthropic(prompt);
      case "openai":
        return this.callOpenAI(prompt);
      case "google":
        return this.callGoogle(prompt);
      default:
        throw new Error(`Unknown AI provider: ${this.config.provider}`);
    }
  }

  private async callAnthropic(prompt: string): Promise<string> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: 2048,
        system: EXTRACTION_SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status} ${await response.text()}`);
    }

    const data = (await response.json()) as { content?: Array<{ type: string; text: string }> };
    const textBlock = data.content?.find((b) => b.type === "text");
    if (!textBlock) throw new Error("No text in Anthropic response");

    // Extract JSON from response (may be wrapped in markdown code blocks)
    const jsonMatch = textBlock.text.match(/```json\s*([\s\S]+?)\s*```/) ??
                      textBlock.text.match(/```\s*([\s\S]+?)\s*```/) ??
                      [null, textBlock.text];
    return jsonMatch[1] ?? textBlock.text;
  }

  private async callOpenAI(prompt: string): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY not set");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.config.model || "gpt-4o",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) throw new Error(`OpenAI API error: ${response.status}`);
    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content ?? "{}";
  }

  private async callGoogle(prompt: string): Promise<string> {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) throw new Error("GOOGLE_AI_API_KEY not set");

    const model = this.config.model || "gemini-1.5-pro";
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: EXTRACTION_SYSTEM_PROMPT }] },
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      }
    );

    if (!response.ok) throw new Error(`Google AI API error: ${response.status}`);
    const data = (await response.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
  }

  private fallbackResult(processingTimeMs: number): ExtractionResult {
    return {
      documentType: "OTHER",
      confidence: 0,
      fields: {},
      events: [],
      metadata: {
        model: this.config.model,
        processingTimeMs,
      },
    };
  }
}
