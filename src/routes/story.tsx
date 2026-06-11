import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { StorefrontLayout } from "@/components/StorefrontLayout";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

export const Route = createFileRoute("/story")({
  head: () => ({
    meta: [
      { title: `Our Story — ${SITE_NAME}` },
      { name: "description", content: `The story behind ${SITE_NAME} — minimal fashion accessories crafted with love in Pakistan.` },
      { property: "og:title", content: `Our Story — ${SITE_NAME}` },
      { property: "og:description", content: `The story behind ${SITE_NAME} — minimal fashion accessories crafted with love in Pakistan.` },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/story` },
      { name: "twitter:title", content: `Our Story — ${SITE_NAME}` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/story` }],
  }),
  component: StoryPage,
});

function StoryPage() {
  const { data: sections } = useQuery({
    queryKey: ["story-sections"],
    queryFn: async () => {
      const { data } = await supabase
        .from("homepage_sections")
        .select("key, value")
        .eq("section", "story");
      if (!data) return {};
      const map: Record<string, unknown> = {};
      for (const row of data) map[row.key] = row.value;
      return map;
    },
    staleTime: 120_000,
  });

  const heading = (sections?.heading as string)?.replace(/^"|"$/g, "") ?? "Tiny Details, Big Statements";
  const subheading = (sections?.subheading as string)?.replace(/^"|"$/g, "") ?? "A brand born from love for minimal luxury.";
  const body = (sections?.body as string)?.replace(/^"|"$/g, "") ??
    `By Areeqaan started as a dream — to bring beautifully crafted, minimal fashion accessories to everyone in Pakistan without the luxury price tag.\n\nEvery piece in our collection is handpicked with care, designed to complement your everyday look with that extra touch of elegance. We believe that style is in the details, and the right accessory can transform any outfit.\n\nFrom Karachi to Lahore, we deliver all over Pakistan, bringing you the latest trends in accessories that are trendy, affordable, and timeless.`;
  const image = (sections?.image as string)?.replace(/^"|"$/g, "");

  const paragraphs = body.split(/\n+/).filter(Boolean);

  return (
    <StorefrontLayout>
      {/* Header */}
      <section className="pt-16 pb-8 px-6 border-b border-foreground/5">
        <div className="max-w-7xl mx-auto">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2" style={{ fontFamily: "var(--font-mono)" }}>
            Who We Are
          </p>
          <h1 className="text-3xl md:text-4xl font-bold italic" style={{ fontFamily: "var(--font-display)" }}>
            {heading}
          </h1>
        </div>
      </section>

      {/* Story content */}
      <section className="max-w-5xl mx-auto px-6 py-14">
        <div className={`flex flex-col ${image ? "lg:flex-row" : ""} gap-12 lg:gap-20 items-start`}>
          {/* Text */}
          <div className="flex-1 max-w-2xl">
            <p className="text-base text-muted-foreground italic mb-8" style={{ fontFamily: "var(--font-display)" }}>
              {subheading}
            </p>
            <div className="space-y-5">
              {paragraphs.map((para, i) => (
                <p key={i} className="text-sm leading-relaxed text-foreground/80">
                  {para}
                </p>
              ))}
            </div>
          </div>

          {/* Optional image */}
          {image && (
            <div className="lg:w-80 shrink-0">
              <div className="aspect-[3/4] bg-foreground/5 overflow-hidden">
                <img
                  src={image}
                  alt="By Areeqaan Story"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </div>

        {/* Values */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-foreground/5">
          {[
            { label: "Minimal Design", desc: "Every piece is stripped down to its essence — no clutter, just pure style." },
            { label: "Affordable Luxe", desc: "You shouldn't have to break the bank to look and feel your best." },
            { label: "Made with Love", desc: "Handpicked in Pakistan, delivered to your door with care and attention." },
          ].map((v) => (
            <div key={v.label}>
              <p className="text-[10px] uppercase tracking-widest font-bold mb-2" style={{ color: "var(--brand)" }}>
                {v.label}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </StorefrontLayout>
  );
}
