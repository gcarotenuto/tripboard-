export type IngestJobStatus = "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED" | "PARTIAL";
export type IngestJobSource = "EMAIL_FORWARD" | "EMAIL_CONNECTOR" | "PDF_UPLOAD" | "IMAGE_UPLOAD" | "ICS_IMPORT" | "MANUAL";

export interface IngestJob {
  id: string;
  userId: string;
  tripId: string | null;
  status: IngestJobStatus;
  source: IngestJobSource;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
  retryCount: number;
  documentsCreated: number;
  eventsCreated: number;
  createdAt: string;
  updatedAt: string;
}

export interface IngestToken {
  id: string;
  userId: string;
  token: string;
  label: string;
  source: string;
  tripId: string | null;
  lastUsedAt: string | null;
  usageCount: number;
  isActive: boolean;
  createdAt: string;
  expiresAt: string | null;
}

// Parsed intermediate types from adapters
export interface ParsedEmailData {
  from: string;
  to: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  receivedAt: string;
  attachments: ParsedAttachment[];
}

export interface ParsedAttachment {
  filename: string;
  mimeType: string;
  size: number;
  content: Buffer | string;
}

export interface ParsedICSEvent {
  uid: string;
  summary: string;
  description?: string;
  location?: string;
  dtstart: Date;
  dtend?: Date;
  organizer?: string;
  url?: string;
}

// AI extraction output schema
export interface ExtractionResult {
  documentType: string;
  confidence: number;
  fields: Record<string, unknown>;
  events: ExtractionEvent[];
  metadata: {
    model: string;
    processingTimeMs: number;
    tokensUsed?: number;
  };
}

export interface ExtractionEvent {
  type: string;
  title: string;
  startsAt?: string;
  endsAt?: string;
  locationName?: string;
  details: Record<string, unknown>;
  confidence: number;
}
