// Stub for tesseract.js — image OCR is not used in the web/Vercel context.
// This file is aliased by webpack so the parsing package can be transpiled
// without pulling in the real tesseract.js native binary.
module.exports = {
  createWorker: async () => ({
    recognize: async () => ({ data: { text: "" } }),
    terminate: async () => {},
  }),
  recognize: async () => ({ data: { text: "" } }),
  default: {
    createWorker: async () => ({
      recognize: async () => ({ data: { text: "" } }),
      terminate: async () => {},
    }),
    recognize: async () => ({ data: { text: "" } }),
  },
};
