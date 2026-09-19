import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <h1 className="text-4xl font-bold text-[#e8e5e0] mb-2">404</h1>
      <p className="text-neutral-400 mb-6">Page not found</p>
      <Link
        href="/"
        className="px-4 py-2 bg-[#18181b] hover:bg-neutral-800 text-[#e8e5e0] border border-white/10 rounded-lg text-sm font-medium transition"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
