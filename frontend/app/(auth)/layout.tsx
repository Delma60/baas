// frontend/app/(auth)/layout.tsx
import Link from "next/link";
import { Database } from "lucide-react";
import { APP_NAME } from "@/lib/utils/constants";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background font-sans">
      {/* Warm ambient glow — matches brand */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div className="h-[500px] w-[700px] rounded-full bg-brand opacity-[0.06] blur-[120px]" />
      </div>

      {/* Subtle grid texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, oklch(0.6 0 0 / 0.06) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Logo */}
      <Link
        href="/"
        className="relative z-10 mb-10 flex items-center gap-2.5 transition-opacity hover:opacity-80"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand shadow-lg shadow-brand/30">
          <Database className="h-4.5 w-4.5 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight text-text-primary">
          {APP_NAME}
        </span>
      </Link>

      {/* Form card */}
      <div className="relative z-10 w-full max-w-md px-4">{children}</div>

      {/* Footer */}
      <p className="relative z-10 mt-10 text-xs text-text-muted">
        © {new Date().getFullYear()} {APP_NAME} · Built in Lagos 🇳🇬
      </p>
    </div>
  );
}
