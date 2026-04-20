import type { ExtractionResult, ParsedEmailData } from "@tripboard/shared";

export interface IngestInput {
  source: "email_forward" | "pdf_upload" | "image_upload" | "ics_import" | "manual";
  userId: string;
  tripId?: string;
  raw: Buffer | string;
  filename?: string;
  mimeType?: string;
  metadata?: Record<string, unknown>;
}

export interface IngestOutput {
  documentId?: string;
  extractionResult?: ExtractionResult;
  eventsCreated: number;
  errors: string[];
  processingTimeMs: number;
}

/**
 * IngestPipeline orchestrates the full ingestion flow:
 * 1. Route to appropriate adapter (email / pdf / image / ics)
 * 2. Extract raw text / structured data
 * 3. Pass to AI extractor for classification and field extraction
 * 4. Normalize events against timeline schema
 * 5. Run dedup check
 * 6. Persist document + events via API or direct DB call
 */
export class IngestPipeline {
  constructor(
    private readonly config: {
      aiProvider: string;
      aiModel: string;
      storageProvider: string;
    }
  ) {}

  async process(input: IngestInput): Promise<IngestOutput> {
    const start = Date.now();
    const errors: string[] = [];

    try {
      // Step 1: Adapter selection and raw extraction
      const rawText = await this.extractText(input);

      // Step 2: AI classification + field extraction
      const extraction = await this.runAIExtraction(rawText, input);

      // Step 3: Normalize + dedup (handled in API layer with DB access)
      // This returns structured events ready for timeline insertion
      return {
        extractionResult: extraction,
        eventsCreated: extraction.events.length,
        errors,
        processingTimeMs: Date.now() - start,
      };
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
      return {
        eventsCreated: 0,
        errors,
        processingTimeMs: Date.now() - start,
      };
    }
  }

  private async extractText(input: IngestInput): Promise<string> {
    // Route to the right adapter
    switch (input.source) {
      case "email_forward":
        return this.extractFromEmail(input);
      case "pdf_upload":
        return this.extractFromPDF(input);
      case "image_upload":
        return this.extractFromImage(input);
      case "ics_import":
        return this.extractFromICS(input);
      default:
        return typeof input.raw === "string" ? input.raw : input.raw.toString("utf-8");
    }
  }

  private async extractFromEmail(input: IngestInput): Promise<string> {
    // Dynamically import to avoid loading all adapters
    const { EmailAdapter } = await import("./adapters/email-adapter");
    const adapter = new EmailAdapter();
    const parsed = await adapter.parse(input.raw);
    return [parsed.subject, parsed.bodyText, ...(parsed.attachments.map((a) => a.filename))].join("\n\n");
  }

  private async extractFromPDF(input: IngestInput): Promise<string> {
    const { PdfAdapter } = await import("./adapters/pdf-adapter");
    const adapter = new PdfAdapter();
    return adapter.extractText(input.raw as Buffer);
  }

  private async extractFromImage(input: IngestInput): Promise<string> {
    const { ImageAdapter } = await import("./adapters/image-adapter");
    const adapter = new ImageAdapter();
    return adapter.extractText(input.raw as Buffer, input.mimeType ?? "image/jpeg");
  }

  private async extractFromICS(input: IngestInput): Promise<string> {
    const { ICSAdapter } = await import("./adapters/ics-adapter");
    const adapter = new ICSAdapter();
    const events = await adapter.parse(typeof input.raw === "string" ? input.raw : input.raw.toString());
    return events.map((e) => `${e.summary} | ${e.dtstart.toISOString()} | ${e.location ?? ""}`).join("\n");
  }

  private async runAIExtraction(text: string, input: IngestInput): Promise<ExtractionResult> {
    const { AIExtractor } = await import("./extractors/ai-extractor");
    const extractor = new AIExtractor({
      provider: this.config.aiProvider,
      model: this.config.aiModel,
    });
    return extractor.extract(text, {
      source: input.source,
      filename: input.filename,
      mimeType: input.mimeType,
    });
  }
}
