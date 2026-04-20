/**
 * PdfAdapter extracts text from PDF files.
 * Primary: pdf-parse (Node.js)
 * Fallback: basic text extraction for deployment environments without native deps
 */
export class PdfAdapter {
  async extractText(buffer: Buffer): Promise<string> {
    try {
      const pdfParse = await import("pdf-parse");
      const result = await pdfParse.default(buffer);
      return result.text;
    } catch (err) {
      // If pdf-parse fails (missing deps), return placeholder for development
      console.warn("[PdfAdapter] pdf-parse unavailable, returning raw content hint:", err);
      return this.extractBasicText(buffer);
    }
  }

  private extractBasicText(buffer: Buffer): string {
    // Extract visible ASCII text from PDF binary — rough fallback
    const str = buffer.toString("latin1");
    const textMatches = str.match(/\(([^)]{3,})\)/g) ?? [];
    return textMatches
      .map((m) => m.slice(1, -1).replace(/\\n/g, "\n").replace(/\\r/g, ""))
      .filter((t) => t.trim().length > 2)
      .join(" ");
  }

  async getMetadata(buffer: Buffer): Promise<Record<string, unknown>> {
    try {
      const pdfParse = await import("pdf-parse");
      const result = await pdfParse.default(buffer);
      return {
        numPages: result.numpages,
        info: result.info,
        metadata: result.metadata,
      };
    } catch {
      return { numPages: 0 };
    }
  }
}
