interface PageBannerProps {
  /** Small mono eyebrow label above the title. */
  eyebrow?: string;
  title: string;
  /** Optional supporting line below the title. */
  subtitle?: string;
}

/**
 * Minimal, centred page banner used at the top of every storefront page
 * except the homepage (which has its own hero). Soft brand-tinted backdrop
 * with a thin accent rule — keeps the inner pages consistent and attractive.
 */
export function PageBanner({ eyebrow, title, subtitle }: PageBannerProps) {
  return (
    <section className="relative overflow-hidden border-b border-foreground/5">
      {/* Soft brand-tinted backdrop */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg, var(--brand-soft), transparent)" }}
      />
      <div className="relative max-w-7xl mx-auto px-6 py-14 md:py-20 text-center">
        {eyebrow && (
          <p
            className="text-[10px] uppercase tracking-[0.3em] mb-3"
            style={{ fontFamily: "var(--font-mono)", color: "var(--brand)" }}
          >
            {eyebrow}
          </p>
        )}
        <h1 className="text-4xl md:text-5xl font-bold italic" style={{ fontFamily: "var(--font-display)" }}>
          {title}
        </h1>
        {subtitle && (
          <p className="mt-4 text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
            {subtitle}
          </p>
        )}
        <div className="mx-auto mt-6 h-px w-16" style={{ background: "var(--brand)" }} />
      </div>
    </section>
  );
}
