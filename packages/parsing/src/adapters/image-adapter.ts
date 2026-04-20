/**
 * ImageAdapter performs OCR on uploaded images.
 * Provider abstraction: Tesseract.js (local) | Google Vision API | AWS Textract
 * MVP uses Tesseract.js for zero-dependency local dev.
 */
export class ImageAdapter {
  private readonly provider: string;

  constructor(provider?: string) {
    this.provider = provider ?? process.env.OCR_PROVIDER ?? "tesseract";
  }

  async extractText(buffer: Buffer, mimeType: string): Promise<string> {
    switch (this.provider) {
      case "google-vision":
        return this.googleVisionOCR(buffer, mimeType);
      case "aws-textract":
        return this.awsTextractOCR(buffer, mimeType);
      case "tesseract":
      default:
        return this.tesseractOCR(buffer);
    }
  }

  private async tesseractOCR(buffer: Buffer): Promise<string> {
    try {
      // Tesseract.js works in both Node and browser
      const Tesseract = await import("tesseract.js");
      const { data } = await Tesseract.recognize(buffer, "eng", {
        logger: () => {}, // suppress progress logs
      });
      return data.text;
    } catch (err) {
      console.warn("[ImageAdapter] Tesseract unavailable:", err);
      return "[OCR not available in current environment — install tesseract.js to enable]";
    }
  }

  private async googleVisionOCR(buffer: Buffer, mimeType: string): Promise<string> {
    const apiKey = process.env.GOOGLE_VISION_API_KEY;
    if (!apiKey) throw new Error("GOOGLE_VISION_API_KEY not configured");

    const base64 = buffer.toString("base64");
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [
            {
              image: { content: base64 },
              features: [{ type: "TEXT_DETECTION", maxResults: 1 }],
            },
          ],
        }),
      }
    );

    const json = (await response.json()) as { responses?: Array<{ fullTextAnnotation?: { text?: string } }> };
    return json.responses?.[0]?.fullTextAnnotation?.text ?? "";
  }

  private async awsTextractOCR(_buffer: Buffer, _mimeType: string): Promise<string> {
    // Scaffold — requires @aws-sdk/client-textract
    throw new Error("AWS Textract adapter not yet implemented. Set OCR_PROVIDER=tesseract or google-vision.");
  }
}
