import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="text-balance px-4 text-center text-2xl font-medium">
        Page not found. Back to{" "}
        <Link
          href="/"
          className="text-muted-foreground underline underline-offset-4 hover:text-primary"
        >
          Homepage
        </Link>
        .
      </p>
    </div>
  );
}
