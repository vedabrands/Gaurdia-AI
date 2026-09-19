"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-[#0f0f11] text-[#e8e5e0] flex items-center justify-center min-h-screen">
        <div className="text-center p-8 bg-[#18181b] border border-white/10 rounded-xl max-w-md">
          <h2 className="text-xl font-bold text-red-400 mb-2">System Error</h2>
          <p className="text-sm text-neutral-400 mb-4">{error.message || "An unexpected error occurred."}</p>
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-sm font-medium rounded-lg transition"
          >
            Retry
          </button>
        </div>
      </body>
    </html>
  );
}
