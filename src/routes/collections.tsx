import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { StorefrontLayout } from "@/components/StorefrontLayout";
import { SITE_NAME, SITE_URL, SITE_DESCRIPTION } from "@/lib/seo";

export const Route = createFileRoute("/collections")({
  head: () => ({
    meta: [
      { title: `Collections — ${SITE_NAME}` },
      { name: "description", content: `Explore curated collections from ${SITE_NAME}. Each collection tells a story of minimal, luxe style.` },
      { property: "og:title", content: `Collections — ${SITE_NAME}` },
      { property: "og:description", content: SITE_DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/collections` },
      { name: "twitter:title", content: `Collections — ${SITE_NAME}` },
      { name: "twitter:description", content: SITE_DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/collections` }],
  }),
  component: CollectionsPage,
});

function CollectionsPage() {
  const { data: collections = [], isLoading } = useQuery({
    queryKey: ["public-collections-full"],
    queryFn: async () => {
      const { data } = await supabase
        .from("collections")
        .select("id, name, slug, image_url, description")
        .order("name");
      return data ?? [];
    },
    staleTime: 120_000,
  });

  return (
    <StorefrontLayout>
      {/* Header */}
      <section className="pt-16 pb-8 px-6 border-b border-foreground/5">
        <div className="max-w-7xl mx-auto">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2" style={{ fontFamily: "var(--font-mono)" }}>
            Curated for you
          </p>
          <h1 className="text-3xl md:text-4xl font-bold italic" style={{ fontFamily: "var(--font-display)" }}>
            Collections
          </h1>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-14">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] bg-foreground/5 animate-pulse rounded" />
            ))}
          </div>
        ) : collections.length === 0 ? (
          <div className="py-24 text-center text-muted-foreground text-sm">
            Collections coming soon.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {(collections as any[]).map((c) => (
              <Link
                key={c.id}
                to="/shop"
                search={{ collection: c.slug }}
                className="group block"
              >
                <div className="aspect-[4/3] bg-foreground/5 overflow-hidden relative mb-4">
                  {c.image_url ? (
                    <img
                      src={c.image_url}
                      alt={c.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-2xl font-bold italic text-foreground/10" style={{ fontFamily: "var(--font-display)" }}>
                        {c.name}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-300" />
                </div>
                <p className="text-sm font-semibold uppercase tracking-widest">{c.name}</p>
                {c.description && (
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{c.description}</p>
                )}
                <p className="text-[10px] uppercase tracking-widest mt-2 transition-colors" style={{ color: "var(--brand)" }}>
                  Shop Collection →
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </StorefrontLayout>
  );
}
