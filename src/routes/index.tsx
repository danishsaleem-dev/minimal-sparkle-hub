import { createFileRoute } from "@tanstack/react-router";
import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";
import product4 from "@/assets/product-4.jpg";
import storyImg from "@/assets/story.jpg";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "By Areeqaan — Minimal Fashion Accessories" },
      {
        name: "description",
        content:
          "By Areeqaan crafts trendy, minimal & affordable luxe fashion accessories. Tiny details, big statements. Delivery all over Pakistan.",
      },
      { property: "og:title", content: "By Areeqaan — Fashion Accessories" },
      {
        property: "og:description",
        content:
          "Trendy • Minimal • Affordable luxe. Tiny details, big statements. Delivery all over Pakistan.",
      },
      { property: "og:image", content: hero1 },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: hero1 },
    ],
  }),
  component: Index,
});

const products = [
  { name: "Petal Hoops", material: "Gold-plated brass", price: "Rs 1,290", img: product1 },
  { name: "Linea Stack", material: "Minimal ring set", price: "Rs 1,650", img: product2 },
  { name: "Aria Pendant", material: "Hand-finished chain", price: "Rs 1,890", img: product3 },
  { name: "Noor Cuff", material: "Statement bracelet", price: "Rs 2,150", img: product4 },
];

const features = [
  { label: "Shipping", text: "Delivery all over Pakistan" },
  { label: "Order", text: "Easy DM ordering" },
  { label: "Style", text: "Trendy minimal luxe" },
  { label: "Care", text: "Hand-finished detail" },
];

const WHATSAPP = "https://wa.me/923364246604";
const INSTAGRAM = "https://www.instagram.com/byareeqaan/";
const TIKTOK = "https://www.tiktok.com/@by_areeqan";
const FACEBOOK = "https://www.facebook.com/ByAreeqan/";

function Index() {
  return (
    <div
      className="min-h-screen bg-background text-foreground antialiased"
      style={{ fontFamily: "var(--font-body)" }}
    >
      {/* Announcement */}
      <div
        className="w-full text-center py-2 text-[10px] uppercase tracking-[0.25em] text-background"
        style={{ background: "var(--brand)", fontFamily: "var(--font-mono)" }}
      >
        New drops coming soon · Order via DM · Delivery all over Pakistan 🇵🇰
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-50 w-full bg-background/85 backdrop-blur-md border-b border-foreground/5 px-6 py-3 flex justify-between items-center">
        <a href="#top" className="flex items-center gap-3">
          <img src={logo} alt="By Areeqaan logo" className="h-11 w-auto" />
        </a>
        <div className="hidden md:flex gap-8 text-[11px] font-medium uppercase tracking-widest">
          <a href="#shop" className="hover:text-[var(--brand)] transition-colors">Shop</a>
          <a href="#story" className="hover:text-[var(--brand)] transition-colors">Story</a>
          <a href="#contact" className="hover:text-[var(--brand)] transition-colors">Contact</a>
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
          <img src={hero1} alt="Minimal accessories" className="absolute inset-0 w-full h-full object-cover animate-kb-1" />
          <img src={hero2} alt="Gold hoop earrings" loading="lazy" className="absolute inset-0 w-full h-full object-cover animate-kb-2" />
          <img src={hero3} alt="Layered necklaces" loading="lazy" className="absolute inset-0 w-full h-full object-cover animate-kb-3" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, oklch(0.22 0.08 295 / 0.35), oklch(0.22 0.08 295 / 0.55))" }} />
        </div>

        <div className="relative z-10 max-w-2xl fade-up">
          <img src={logo} alt="By Areeqaan" className="h-24 md:h-32 w-auto mx-auto mb-6 brightness-0 invert opacity-95" />
          <h1
            className="text-4xl md:text-6xl italic text-white text-balance leading-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Tiny details. Big statements.
          </h1>
          <p className="mt-5 text-white/85 text-xs md:text-sm tracking-[0.25em] uppercase font-medium">
            Trendy · Minimal · Affordable Luxe
          </p>
          <div className="mt-10 flex gap-3 justify-center flex-wrap">
            <a
              href="#shop"
              className="inline-block px-10 py-4 text-white text-[11px] uppercase tracking-[0.2em] font-medium hover:opacity-90 transition"
              style={{ background: "var(--brand)" }}
            >
              Shop the Edit
            </a>
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

      {/* Featured Grid */}
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
          {products.map((p) => (
            <article key={p.name} className="group bg-background p-4 flex flex-col">
              <div className="aspect-[4/5] overflow-hidden mb-6" style={{ background: "var(--brand-soft)" }}>
                <img
                  src={p.img}
                  alt={p.name}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-medium">{p.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{p.material}</p>
                </div>
                <p className="text-sm" style={{ fontFamily: "var(--font-mono)", color: "var(--brand)" }}>
                  {p.price}
                </p>
              </div>
              <a
                href={WHATSAPP}
                target="_blank"
                rel="noreferrer"
                className="mt-6 w-full py-3 text-center border text-[10px] uppercase tracking-widest transition-colors"
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
          {features.map((f) => (
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
            02/ Our Story
          </span>
          <p
            className="text-2xl md:text-3xl italic text-pretty leading-relaxed mb-8"
            style={{ fontFamily: "var(--font-display)" }}
          >
            "Accessories are the quiet language of style — small, deliberate pieces that carry
            their own confidence."
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
            alt="Detail of accessory styling"
            loading="lazy"
            className="w-full aspect-[16/10] object-cover"
          />
          <div className="max-w-md">
            <h2 className="text-3xl italic mb-6" style={{ fontFamily: "var(--font-display)" }}>
              Let's Connect
            </h2>
            <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
              New drops coming soon. Slide into our DMs to place an order or to be the first to
              know when a piece you love is back in stock.
            </p>
            <ul className="space-y-3 text-sm" style={{ fontFamily: "var(--font-mono)" }}>
              <li>
                <a href={WHATSAPP} target="_blank" rel="noreferrer" className="hover:underline" style={{ color: "var(--brand)" }}>
                  WhatsApp · +92 336 4246604
                </a>
              </li>
              <li>
                <a href="mailto:zeeshanarooj010@gmail.com" className="hover:underline" style={{ color: "var(--brand)" }}>
                  zeeshanarooj010@gmail.com
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
            <img src={logo} alt="By Areeqaan" className="h-12 w-auto" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Fashion accessories made for the everyday. Trendy, minimal, and affordable luxe —
              handpicked with love in Pakistan.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-12 md:gap-24">
            <div className="space-y-4">
              <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: "var(--brand)" }}>Shop</p>
              <ul className="text-[11px] text-muted-foreground space-y-2">
                <li><a href="#shop" className="hover:text-foreground">All Pieces</a></li>
                <li><a href="#shop" className="hover:text-foreground">Earrings</a></li>
                <li><a href="#shop" className="hover:text-foreground">Rings</a></li>
                <li><a href="#shop" className="hover:text-foreground">Necklaces</a></li>
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
