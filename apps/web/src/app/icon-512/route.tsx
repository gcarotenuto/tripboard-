import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 512,
          height: 512,
          borderRadius: 116,
          background: "linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width="288"
          height="288"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19 2c-2-2-4-2-5.5-.5L10 5 1.8 6.2c-.5.1-.9.5-.8 1.1l1 5.2c.1.5.5.9 1 .9H8l-1 4-2 1v1h6l2-2h3.5c.5 0 1-.5 1-1v-.8z" />
        </svg>
      </div>
    ),
    { width: 512, height: 512 }
  );
}
