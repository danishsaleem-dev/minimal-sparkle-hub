import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { StorefrontLayout } from "@/components/StorefrontLayout";
import { ProductCard } from "@/components/ProductCard";
import { PageBanner } from "@/components/PageBanner";
import { SITE_NAME, SITE_URL, SITE_DESCRIPTION } from "@/lib/seo";

export const Route = createFileRoute("/shop")({
  validateSearch: (search: Record<string, unknown>) => ({
    collection: typeof search.collection === "string" ? search.collection : undefined,
  }),
  head: () => ({
    meta: [
      { title: `Shop All Pieces — ${SITE_NAME}` },
      { name: "description", content: "Browse our full collection of trendy, minimal & affordable luxe fashion accessories. Free delivery all over Pakistan." },
      { property: "og:title", content: `Shop All Pieces — ${SITE_NAME}` },
      { property: "og:description", content: SITE_DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/shop` },
      { name: "twitter:title", content: `Shop All Pieces — ${SITE_NAME}` },
      { name: "twitter:description", content: SITE_DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/shop` }],
  }),
  component: ShopPage,
});

type SortKey = "featured" | "newest" | "price_asc" | "price_desc";

function ShopPage() {
  const { collection: collectionParam } = Route.useSearch();
  const [activeCollection, setActiveCollection] = useState<string>(collectionParam ?? "all");
  const [sort, setSort] = useState<SortKey>("featured");

  useEffect(() => {
    if (collectionParam) setActiveCollection(collectionParam);
  }, [collectionParam]);
  const [maxPrice, setMaxPrice] = useState<number>(10000);
  const [search, setSearch] = useState("");

  const { data: collections = [] } = useQuery({
    queryKey: ["public-collections"],
    queryFn: async () => {
      const { data } = await supabase
        .from("collections")
        .select("id, name, slug, image_url")
        .order("name");
      return data ?? [];
    },
    staleTime: 120_000,
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["public-products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, slug, price, images, material, product_collections(collection_id, collections(name, slug))")
        .eq("status", "published");
      return data ?? [];
    },
    staleTime: 60_000,
  });

  const filtered = useMemo(() => {
    let list = [...products] as any[];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        p.name?.toLowerCase().includes(q) || p.material?.toLowerCase().includes(q)
      );
    }

    if (activeCollection !== "all") {
      list = list.filter((p) =>
        p.product_collections?.some(
          (pc: any) => pc.collections?.slug === activeCollection
        )
      );
    }

    list = list.filter((p) => (p.price ?? 0) <= maxPrice);

    if (sort === "newest") {
      // newest by id (uuid v4 — fall back to name sort)
      list = list.slice().reverse();
    } else if (sort === "price_asc") {
      list = list.slice().sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    } else if (sort === "price_desc") {
      list = list.slice().sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    }
    // "featured" → original DB order

    return list;
  }, [products, activeCollection, sort, maxPrice, search]);

  const priceMax = useMemo(
    () => Math.max(10000, ...products.map((p: any) => p.price ?? 0)),
    [products]
  );

  return (
    <StorefrontLayout>
      <PageBanner
        eyebrow="All Pieces"
        title="The Collection"
        subtitle="Trendy, minimal & affordable luxe — handpicked and delivered all over Pakistan."
      />

      <section className="max-w-7xl mx-auto px-6 py-8 flex flex-col lg:flex-row gap-8">
        {/* Sidebar filters */}
        <aside className="lg:w-56 shrink-0 space-y-8">
          {/* Search */}
          <div>
            <p className="text-[10px] uppercase tracking-widest font-bold mb-3" style={{ color: "var(--brand)" }}>
              Search
            </p>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type to search..."
              className="w-full text-xs border border-foreground/10 bg-background px-3 py-2 rounded outline-none focus:border-[var(--brand)] transition-colors"
            />
          </div>

          {/* Collections filter */}
          <div>
            <p className="text-[10px] uppercase tracking-widest font-bold mb-3" style={{ color: "var(--brand)" }}>
              Collections
            </p>
            <ul className="space-y-1 text-xs">
              <li>
                <button
                  onClick={() => setActiveCollection("all")}
                  className={`w-full text-left px-2 py-1 rounded transition-colors ${
                    activeCollection === "all"
                      ? "text-[var(--brand)] font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All Pieces
                </button>
              </li>
              {collections.map((c: any) => (
                <li key={c.id}>
                  <button
                    onClick={() => setActiveCollection(c.slug)}
                    className={`w-full text-left px-2 py-1 rounded transition-colors ${
                      activeCollection === c.slug
                        ? "text-[var(--brand)] font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Price filter */}
          <div>
            <p className="text-[10px] uppercase tracking-widest font-bold mb-3" style={{ color: "var(--brand)" }}>
              Max Price
            </p>
            <input
              type="range"
              min={0}
              max={priceMax}
              step={100}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-[var(--brand)]"
            />
            <p className="text-xs text-muted-foreground mt-1">Up to PKR {maxPrice.toLocaleString()}</p>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
            <p className="text-xs text-muted-foreground">
              {isLoading ? "Loading..." : `${filtered.length} piece${filtered.length !== 1 ? "s" : ""}`}
            </p>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="text-xs border border-foreground/10 bg-background px-3 py-2 rounded outline-none focus:border-[var(--brand)] transition-colors"
            >
              <option value="featured">Featured</option>
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
            </select>
          </div>

          {/* Collection pills (mobile-friendly) */}
          <div className="flex gap-2 flex-wrap mb-6 lg:hidden">
            <button
              onClick={() => setActiveCollection("all")}
              className={`text-[10px] uppercase tracking-widest px-3 py-1 border transition-colors ${
                activeCollection === "all"
                  ? "border-[var(--brand)] text-[var(--brand)]"
                  : "border-foreground/10 text-muted-foreground hover:border-foreground/30"
              }`}
            >
              All
            </button>
            {collections.map((c: any) => (
              <button
                key={c.id}
                onClick={() => setActiveCollection(c.slug)}
                className={`text-[10px] uppercase tracking-widest px-3 py-1 border transition-colors ${
                  activeCollection === c.slug
                    ? "border-[var(--brand)] text-[var(--brand)]"
                    : "border-foreground/10 text-muted-foreground hover:border-foreground/30"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Product grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-foreground/5 animate-pulse rounded" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-24 text-center text-muted-foreground text-sm">
              No pieces found. Try adjusting your filters.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((product: any) => {
                const img = Array.isArray(product.images)
                  ? product.images[0]
                  : product.images;
                return (
                  <ProductCard
                    key={product.id}
                    variant="catalog"
                    product={{
                      id: product.id,
                      name: product.name,
                      slug: product.slug,
                      price: product.price,
                      img,
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>
    </StorefrontLayout>
  );
}
