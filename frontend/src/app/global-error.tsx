"use client";

// Root error boundary: catches errors in the root layout itself. It REPLACES
// the entire document, so it must render its own <html>/<body> and cannot rely
// on the locale provider or app CSS being available. Kept minimal and
// self-contained (bilingual, inline-styled, dark to match the brand baseline).
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0D1117",
          color: "#E6EDF3",
          fontFamily: "system-ui, sans-serif",
          padding: 24,
          textAlign: "center",
        }}
      >
        <div role="alert" style={{ maxWidth: 420 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>
            Something went wrong · حدث خطأ ما
          </h1>
          <p style={{ color: "#8B949E", fontSize: 14, margin: "0 0 20px" }}>
            An unexpected error occurred. · وقع خطأ غير متوقّع.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              background: "#1F6FEB",
              color: "#fff",
              border: 0,
              borderRadius: 8,
              padding: "10px 18px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again · حاول مرة أخرى
          </button>
        </div>
      </body>
    </html>
  );
}
