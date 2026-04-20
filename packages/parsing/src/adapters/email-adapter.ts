import type { ParsedEmailData, ParsedAttachment } from "@tripboard/shared";

/**
 * EmailAdapter parses inbound forwarded emails.
 * Supports raw RFC 2822 email buffers and JSON webhook payloads
 * from Mailgun, Postmark, and similar providers.
 */
export class EmailAdapter {
  async parse(raw: Buffer | string): Promise<ParsedEmailData> {
    const content = typeof raw === "string" ? raw : raw.toString("utf-8");

    // Try JSON webhook payload first (Mailgun/Postmark format)
    if (content.trimStart().startsWith("{")) {
      return this.parseWebhookPayload(JSON.parse(content));
    }

    // Fall back to raw email parsing via mailparser
    return this.parseRawEmail(content);
  }

  private async parseRawEmail(rawEmail: string): Promise<ParsedEmailData> {
    // mailparser is loaded lazily — not bundled by default
    let simpleParser: (source: string) => Promise<{ from?: { text: string }; to?: { text: string }; subject?: string; text?: string; html?: string; date?: Date; attachments?: Array<{ filename?: string; contentType: string; size: number; content: Buffer }> }>;
    try {
      const mailparser = await import("mailparser");
      simpleParser = mailparser.simpleParser as typeof simpleParser;
    } catch {
      // If mailparser not available, do minimal parsing
      return this.minimalParse(rawEmail);
    }

    const parsed = await simpleParser(rawEmail);

    const attachments: ParsedAttachment[] = (parsed.attachments ?? []).map((a) => ({
      filename: a.filename ?? "attachment",
      mimeType: a.contentType,
      size: a.size,
      content: a.content,
    }));

    return {
      from: parsed.from?.text ?? "",
      to: parsed.to?.text ?? "",
      subject: parsed.subject ?? "",
      bodyText: parsed.text ?? "",
      bodyHtml: parsed.html || undefined,
      receivedAt: (parsed.date ?? new Date()).toISOString(),
      attachments,
    };
  }

  private parseWebhookPayload(payload: Record<string, unknown>): ParsedEmailData {
    // Normalize across Mailgun, Postmark, SendGrid formats
    const from = String(payload["from"] ?? payload["sender"] ?? payload["From"] ?? "");
    const to = String(payload["to"] ?? payload["recipient"] ?? payload["To"] ?? "");
    const subject = String(payload["subject"] ?? payload["Subject"] ?? "");
    const bodyText = String(payload["body-plain"] ?? payload["TextBody"] ?? payload["text"] ?? "");
    const bodyHtml = payload["body-html"] || payload["HtmlBody"] ? String(payload["body-html"] ?? payload["HtmlBody"]) : undefined;
    const receivedAt = String(payload["Date"] ?? payload["date"] ?? new Date().toISOString());

    return {
      from,
      to,
      subject,
      bodyText,
      bodyHtml,
      receivedAt,
      attachments: [],
    };
  }

  private minimalParse(rawEmail: string): ParsedEmailData {
    const lines = rawEmail.split("\n");
    const headers: Record<string, string> = {};
    let bodyStart = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim() === "") {
        bodyStart = i + 1;
        break;
      }
      const match = line.match(/^([^:]+):\s*(.+)/);
      if (match) {
        headers[match[1].toLowerCase()] = match[2].trim();
      }
    }

    return {
      from: headers["from"] ?? "",
      to: headers["to"] ?? "",
      subject: headers["subject"] ?? "",
      bodyText: lines.slice(bodyStart).join("\n"),
      receivedAt: headers["date"] ? new Date(headers["date"]).toISOString() : new Date().toISOString(),
      attachments: [],
    };
  }
}
