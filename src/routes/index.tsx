import { useState, useEffect, useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";
import product4 from "@/assets/product-4.jpg";
import storyImg from "@/assets/story.jpg";
import logo from "@/assets/logo.png";
import { supabase } from "@/lib/supabase";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, productListSchema } from "@/lib/seo";

const PAGE_TITLE = `${SITE_NAME} — Minimal Fashion Accessories Pakistan`;
const OG_IMAGE = hero1 as string;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: SITE_DESCRIPTION },
      // Open Graph
      { property: "og:title", content: PAGE_TITLE },
      { property: "og:description", content: SITE_DESCRIPTION },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "By Areeqaan — Minimal jewellery accessories" },
      { property: "og:url", content: SITE_URL + "/" },
      { property: "og:type", content: "website" },
      // Twitter
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: PAGE_TITLE },
      { name: "twitter:description", content: SITE_DESCRIPTION },
      { name: "twitter:image", content: OG_IMAGE },
      { name: "twitter:image:alt", content: "By Areeqaan accessories" },
    ],
    links: [
      // Self-canonical
      { rel: "canonical", href: SITE_URL + "/" },
      // Preload LCP hero image (static fallback — always shown on first render)
      { rel: "preload", href: hero1 as string, as: "image", fetchpriority: "high" },
    ],
  }),
  component: Index,
});

const FALLBACK_PRODUCTS = [
  { id: "f1", name: "Petal Hoops", material: "Gold-plated brass", price: 1290, img: product1 },
  { id: "f2", name: "Linea Stack", material: "Minimal ring set", price: 1650, img: product2 },
  { id: "f3", name: "Aria Pendant", material: "Hand-finished chain", price: 1890, img: product3 },
  { id: "f4", name: "Noor Cuff", material: "Statement bracelet", price: 2150, img: product4 },
];

const FALLBACK_FEATURES = [
  { label: "Shipping", text: "Delivery all over Pakistan" },
  { label: "Order", text: "Easy DM ordering" },
  { label: "Style", text: "Trendy minimal luxe" },
  { label: "Care", text: "Hand-finished detail" },
];

function Index() {
  // Load products from Supabase
  const { data: dbProducts } = useQuery({
    queryKey: ["storefront-products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, material, price, compare_price, product_images(url, is_primary)")
        .eq("status", "published")
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(8);
      return data ?? [];
    },
    staleTime: 60_000,
  });

  // Load homepage content from Supabase
  const { data: homepageData } = useQuery({
    queryKey: ["storefront-homepage"],
    queryFn: async () => {
      const { data } = await supabase
        .from("homepage_sections")
        .select("section, key, value")
        .order("section")
        .order("position");
      if (!data) return null;
      const grouped: Record<string, Record<string, unknown>> = {};
      for (const row of data) {
        if (!grouped[row.section]) grouped[row.section] = {};
        grouped[row.section][row.key] = row.value;
      }
      return grouped;
    },
    staleTime: 60_000,
  });

  // Load site settings
  const { data: siteSettings } = useQuery({
    queryKey: ["storefront-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("key, value");
      if (!data) return null;
      const map: Record<string, string> = {};
      for (const row of data) {
        const v = row.value;
        map[row.key] = typeof v === "string" ? v.replace(/^"|"$/g, "") : v === null ? "" : String(v);
      }
      return map;
    },
    staleTime: 60_000,
  });

  // Derive values with fallbacks
  const hp = homepageData ?? {};
  const st = siteSettings ?? {};

  const announcementText =
    (hp.announcement?.text as string)?.replace(/^"|"$/g, "") ??
    "New drops coming soon · Order via DM · Delivery all over Pakistan 🇵🇰";
  const announcementEnabled = hp.announcement?.enabled !== false;

  const heroTitle = (hp.hero?.title as string)?.replace(/^"|"$/g, "") ?? "Tiny details.";
  const heroSubtitle = (hp.hero?.subtitle as string)?.replace(/^"|"$/g, "") ?? "Big statements.";
  const heroDesc =
    (hp.hero?.description as string)?.replace(/^"|"$/g, "") ??
    "Trendy · Minimal · Affordable Luxe";
  const heroCtaText = (hp.hero?.cta_text as string)?.replace(/^"|"$/g, "") ?? "Shop the Edit";

  // Hero slideshow images — prefer DB bg_images array, fall back to single bg_image, then static assets
  const heroImages: string[] = (() => {
    const arr = hp.hero?.bg_images;
    if (Array.isArray(arr) && arr.length > 0) return arr as string[];
    const single = (hp.hero?.bg_image as string)?.replace(/^"|"$/g, "");
    if (single) return [single];
    return [hero1 as string, hero2 as string, hero3 as string];
  })();

  const storyTitle = (hp.story?.title as string)?.replace(/^"|"$/g, "") ?? "Our Story";
  const storyContent =
    (hp.story?.content as string)?.replace(/^"|"$/g, "") ??
    '"Accessories are the quiet language of style — small, deliberate pieces that carry their own confidence."';

  const contactTitle = (hp.contact?.title as string)?.replace(/^"|"$/g, "") ?? "Let's Connect";
  const contactContent =
    (hp.contact?.content as string)?.replace(/^"|"$/g, "") ??
    "New drops coming soon. Slide into our DMs to place an order or to be the first to know when a piece you love is back in stock.";

  const featuresItems: Array<{ label: string; text: string }> = Array.isArray(hp.features?.items)
    ? (hp.features.items as Array<{ label: string; text: string }>)
    : FALLBACK_FEATURES;

  const WHATSAPP = st.whatsapp_number
    ? `https://wa.me/${st.whatsapp_number}`
    : "https://wa.me/923364246604";
  const INSTAGRAM = st.instagram_url || "https://www.instagram.com/byareeqaan/";
  const TIKTOK = st.tiktok_url || "https://www.tiktok.com/@by_areeqan";
  const FACEBOOK = st.facebook_url || "https://www.facebook.com/ByAreeqan/";

  // Products to show
  const showProducts =
    dbProducts && dbProducts.length > 0
      ? dbProducts.map((p) => {
          const images = p.product_images as Array<{ url: string; is_primary: boolean }> | undefined;
          const img =
            images?.find((i) => i.is_primary)?.url ??
            images?.[0]?.url ??
            null;
          return {
            id: p.id,
            name: p.name,
            material: p.material ?? "",
            price: p.price,
            compare_price: p.compare_price,
            img,
          };
        })
      : FALLBACK_PRODUCTS.map((p) => ({
          id: p.id,
          name: p.name,
          material: p.material,
          price: p.price,
          compare_price: null as number | null,
          img: p.img as string | null,
        }));

  // Page-specific JSON-LD
  const ldProductList = productListSchema(
    showProducts.map(p => ({ name: p.name, price: p.price, img: p.img, material: p.material }))
  );

  return (
    <div
      className="min-h-screen bg-background text-foreground antialiased"
      style={{ fontFamily: "var(--font-body)" }}
    >
      {/* Page-specific JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldProductList) }}
      />

      {/* Announcement */}
      {announcementEnabled && (
        <div
          className="w-full text-center py-2 text-[10px] uppercase tracking-[0.25em] text-background"
          style={{ background: "var(--brand)", fontFamily: "var(--font-mono)" }}
        >
          {announcementText}
        </div>
      )}

      {/* Nav */}
      <nav className="sticky top-0 z-50 w-full bg-background/85 backdrop-blur-md border-b border-foreground/5 px-6 flex justify-between items-center" style={{ height: "64px" }}>
        <a href="#top" className="flex items-center">
          <img
            src={logo}
            alt="By Areeqaan logo"
            width={150}
            height={40}
            style={{ height: "40px", width: "auto" }}
            className="block"
            decoding="async"
          />
        </a>
        <div className="hidden md:flex gap-8 text-[11px] font-medium uppercase tracking-widest">
          <Link to="/shop" className="hover:text-[var(--brand)] transition-colors">Shop</Link>
          <Link to="/collections" className="hover:text-[var(--brand)] transition-colors">Collections</Link>
          <Link to="/story" className="hover:text-[var(--brand)] transition-colors">Story</Link>
          <Link to="/contact" className="hover:text-[var(--brand)] transition-colors">Contact</Link>
        </div>
        <a
          href={WHATSAPP}
          target="_blank"
          rel="noreferrer"
          className="text-[10px] uppercase tracking-widest px-4 py-2 text-background hover:opacity-90 transition"
          style={{ background: "var(--brand)", fontFamily: "var(--font-mono)" }}
        >
          Order on WhatsApp
        </a>
      </nav>

      {/* Hero */}
      <header id="top" className="relative h-[90vh] overflow-hidden flex items-center justify-center text-center px-6">
        <div className="absolute inset-0 z-0" style={{ background: "var(--brand-soft)" }}>
          <HeroSlideshow images={heroImages} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, oklch(0.22 0.08 295 / 0.35), oklch(0.22 0.08 295 / 0.55))" }} />
        </div>

        <div className="relative z-10 max-w-2xl fade-up">
          <img src={logo} alt="By Areeqaan" width={300} height={80} fetchPriority="high" decoding="sync" className="h-24 md:h-32 w-auto mx-auto mb-6 brightness-0 invert opacity-95" />
          <h1
            className="text-4xl md:text-6xl italic text-white text-balance leading-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {heroTitle} <br className="hidden md:block" />
            <span className="opacity-90">{heroSubtitle}</span>
          </h1>
          <p className="mt-5 text-white/85 text-xs md:text-sm tracking-[0.25em] uppercase font-medium">
            {heroDesc}
          </p>
          <div className="mt-10 flex gap-3 justify-center flex-wrap">
            <Link
              to="/shop"
              className="inline-block px-10 py-4 text-white text-[11px] uppercase tracking-[0.2em] font-medium hover:opacity-90 transition"
              style={{ background: "var(--brand)" }}
            >
              {heroCtaText}
            </Link>
            <a
              href={INSTAGRAM}
              target="_blank"
              rel="noreferrer"
              className="inline-block px-10 py-4 bg-white/95 text-foreground text-[11px] uppercase tracking-[0.2em] font-medium hover:bg-white transition"
            >
              Follow @byareeqaan
            </a>
          </div>
        </div>
      </header>

      {/* Featured Products Grid */}
      <section id="shop" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <span
              className="text-[10px] uppercase tracking-tighter mb-2 block"
              style={{ fontFamily: "var(--font-mono)", color: "var(--brand)" }}
            >
              01/ The Edit
            </span>
            <h2 className="text-3xl italic" style={{ fontFamily: "var(--font-display)" }}>
              Signature Pieces
            </h2>
          </div>
          <a
            href={INSTAGRAM}
            target="_blank"
            rel="noreferrer"
            className="text-[10px] uppercase border-b pb-1 transition-all"
            style={{ fontFamily: "var(--font-mono)", borderColor: "var(--brand)", color: "var(--brand)" }}
          >
            See All on Instagram →
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-foreground/5 border border-foreground/5">
          {showProducts.map((p) => (
            <article key={p.id} className="group bg-background p-4 flex flex-col">
              <div className="aspect-[4/5] overflow-hidden mb-6" style={{ background: "var(--brand-soft)" }}>
                {p.img ? (
                  <img
                    src={p.img as string}
                    alt={p.name}
                    loading="lazy"
                    decoding="async"
                    width={400}
                    height={500}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-medium">{p.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{p.material}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm" style={{ fontFamily: "var(--font-mono)", color: "var(--brand)" }}>
                    Rs {p.price.toLocaleString()}
                  </p>
                  {p.compare_price && (
                    <p className="text-xs text-muted-foreground line-through">
                      Rs {p.compare_price.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
              <a
                href={WHATSAPP}
                target="_blank"
                rel="noreferrer"
                className="mt-6 w-full py-3 text-center border text-[10px] uppercase tracking-widest transition-colors hover:bg-[var(--brand)] hover:text-white hover:border-[var(--brand)]"
                style={{ borderColor: "var(--brand)", color: "var(--brand)" }}
              >
                Order via DM
              </a>
            </article>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6 text-background" style={{ background: "var(--brand)" }}>
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {featuresItems.map((f) => (
            <div key={f.label}>
              <p
                className="text-[10px] uppercase tracking-[0.2em] mb-2 text-white"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {f.label}
              </p>
              <p className="text-xs text-white/75">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Story */}
      <section id="story" className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <span
            className="text-[10px] uppercase tracking-tighter mb-4 block"
            style={{ fontFamily: "var(--font-mono)", color: "var(--brand)" }}
          >
            02/ {storyTitle}
          </span>
          <p
            className="text-2xl md:text-3xl italic text-pretty leading-relaxed mb-8"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {storyContent.startsWith('"') ? storyContent : `"${storyContent}"`}
          </p>
          <p className="text-[10px] uppercase tracking-widest font-medium" style={{ color: "var(--brand)" }}>
            By Areeqaan · Est. Pakistan
          </p>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-24 border-t border-foreground/5">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <img
            src={storyImg}
            alt="Detailed close-up of By Areeqaan jewellery accessories"
            loading="lazy"
            decoding="async"
            width={800}
            height={500}
            className="w-full aspect-[16/10] object-cover"
          />
          <div className="max-w-md">
            <h2 className="text-3xl italic mb-6" style={{ fontFamily: "var(--font-display)" }}>
              {contactTitle}
            </h2>
            <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
              {contactContent}
            </p>
            <ul className="space-y-3 text-sm" style={{ fontFamily: "var(--font-mono)" }}>
              <li>
                <a href={WHATSAPP} target="_blank" rel="noreferrer" className="hover:underline" style={{ color: "var(--brand)" }}>
                  WhatsApp · +92 336 4246604
                </a>
              </li>
              <li className="flex gap-4 pt-2 text-[11px] uppercase tracking-widest">
                <a href={INSTAGRAM} target="_blank" rel="noreferrer" className="hover:opacity-70">Instagram</a>
                <a href={TIKTOK} target="_blank" rel="noreferrer" className="hover:opacity-70">TikTok</a>
                <a href={FACEBOOK} target="_blank" rel="noreferrer" className="hover:opacity-70">Facebook</a>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-foreground/5 py-16 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-12">
          <div className="space-y-4 max-w-xs">
            <img src={logo} alt="By Areeqaan" width={220} height={60} loading="lazy" decoding="async" className="h-12 w-auto" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Fashion accessories made for the everyday. Trendy, minimal, and affordable luxe —
              handpicked with love in Pakistan.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-12 md:gap-24">
            <div className="space-y-4">
              <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: "var(--brand)" }}>Shop</p>
              <ul className="text-[11px] text-muted-foreground space-y-2">
                <li><Link to="/shop" className="hover:text-foreground">All Pieces</Link></li>
                <li><Link to="/collections" className="hover:text-foreground">Collections</Link></li>
                <li><Link to="/story" className="hover:text-foreground">Our Story</Link></li>
                <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: "var(--brand)" }}>Connect</p>
              <ul className="text-[11px] text-muted-foreground space-y-2">
                <li><a href={INSTAGRAM} target="_blank" rel="noreferrer" className="hover:text-foreground">Instagram</a></li>
                <li><a href={TIKTOK} target="_blank" rel="noreferrer" className="hover:text-foreground">TikTok</a></li>
                <li><a href={FACEBOOK} target="_blank" rel="noreferrer" className="hover:text-foreground">Facebook</a></li>
                <li><a href={WHATSAPP} target="_blank" rel="noreferrer" className="hover:text-foreground">WhatsApp</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-foreground/5 flex flex-col md:flex-row gap-2 justify-between items-center text-[9px] text-muted-foreground uppercase tracking-widest">
          <p>&copy; {new Date().getFullYear()} By Areeqaan. All rights reserved.</p>
          <p>Tiny details · Big statements</p>
        </div>
      </footer>
    </div>
  );
}

// Ken Burns slideshow — each image gets a fresh zoom animation when it becomes active
function HeroSlide({ src, active, priority }: { src: string; active: boolean; priority: boolean }) {
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !active) return;
    el.style.animation = "none";
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    el.offsetHeight; // force reflow to restart animation
    el.style.animation = "";
  }, [active]);

  return (
    <img
      ref={ref}
      src={src}
      alt=""
      // First slide is the LCP — load eagerly with high fetch priority
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "low"}
      decoding={priority ? "sync" : "async"}
      width={1920}
      height={1080}
      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 animate-kb ${active ? "opacity-100" : "opacity-0"}`}
    />
  );
}

function HeroSlideshow({ images }: { images: string[] }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setIdx(i => (i + 1) % images.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <>
      {images.map((src, i) => (
        <HeroSlide key={src} src={src} active={i === idx} priority={i === 0} />
      ))}
    </>
  );
}
