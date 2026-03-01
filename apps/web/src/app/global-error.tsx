"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            gap: "1rem",
          }}
        >
          <h1>Something went wrong</h1>
          <button onClick={reset}>Try again</button>
        </div>
      </body>
    </html>
  );
}
