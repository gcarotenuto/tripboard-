// Type stub for tesseract.js — image OCR not used in web app
declare module "tesseract.js" {
  interface RecognizeResult {
    data: { text: string };
  }
  interface Worker {
    recognize(image: Buffer | string): Promise<RecognizeResult>;
    terminate(): Promise<void>;
  }
  export function createWorker(lang?: string): Promise<Worker>;
  export function recognize(
    image: Buffer | string,
    lang?: string,
    options?: Record<string, unknown>,
  ): Promise<RecognizeResult>;
  const _default: {
    createWorker: typeof createWorker;
    recognize: typeof recognize;
  };
  export default _default;
}
