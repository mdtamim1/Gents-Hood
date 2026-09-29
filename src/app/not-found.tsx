import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-cream p-8 text-center text-ink">
      <h2 className="text-6xl font-bold tracking-tight">404</h2>
      <p className="mt-4 text-sm uppercase tracking-widest text-muted">Page Not Found</p>
      <Link
        href="/"
        className="mt-8 inline-block bg-ink px-8 py-4 text-xs font-semibold uppercase tracking-looser text-cream transition-colors hover:bg-ink-soft"
      >
        Return Home
      </Link>
    </main>
  );
}
