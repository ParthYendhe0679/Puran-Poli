import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-7xl font-extrabold text-ink/10">404</p>
      <h1 className="mt-2 text-2xl font-extrabold">This page wandered off</h1>
      <p className="mt-2 text-sm font-medium text-muted">The link may be wrong. Head back and pick up your plans.</p>
      <div className="mt-6 flex gap-2">
        <Link href="/" className="inline-flex h-11 items-center rounded-full border-2 border-ink bg-white px-5 text-sm font-semibold shadow-pop">Home</Link>
        <Link href="/dashboard" className="inline-flex h-11 items-center rounded-full border-2 border-pill bg-pill px-5 text-sm font-semibold text-white shadow-[3px_3px_0_#7b5cf0]">My plans</Link>
      </div>
    </main>
  );
}
