import { createFileRoute } from "@tanstack/react-router";
import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";
import product4 from "@/assets/product-4.jpg";
import storyImg from "@/assets/story.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aurelia — Minimal Fine Jewelry, Handcrafted" },
      {
        name: "description",
        content:
          "Aurelia crafts minimal fine jewelry in recycled gold — quiet, considered pieces designed for the everyday ritual. Free global shipping and lifetime warranty.",
      },
      { property: "og:title", content: "Aurelia — Minimal Fine Jewelry" },
      {
        property: "og:description",
        content:
          "Quiet, considered jewelry in recycled gold. Handcrafted for the everyday ritual.",
      },
      { property: "og:image", content: hero1 },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: hero1 },
    ],
  }),
  component: Index,
});

const products = [
  { name: "Trace Ring", material: "14k Solid Gold", price: "$240", img: product1 },
  { name: "Arc Earrings", material: "Hand-polished Gold", price: "$185", img: product2 },
  { name: "Line Pendant", material: "Recycled Gold", price: "$310", img: product3 },
  { name: "Anchor Signet", material: "Heavy 14k Gold", price: "$550", img: product4 },
];

const features = [
  { label: "Shipping", text: "Free global delivery" },
  { label: "Craft", text: "Lifetime warranty" },
  { label: "Payment", text: "Secure checkout" },
  { label: "Returns", text: "30-day effortless exchange" },
];

function Index() {
  return (
    <div
      className="min-h-screen bg-background text-foreground antialiased"
      style={{ fontFamily: "var(--font-body)" }}
    >
      {/* Nav */}
      <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-foreground/5 px-6 py-4 flex justify-between items-center">
        <div
          className="text-xs tracking-widest uppercase"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Aurelia
        </div>
        <div className="hidden md:flex gap-8 text-[11px] font-medium uppercase tracking-widest">
          <a href="#shop" className="hover:text-muted-foreground transition-colors">Shop</a>
          <a href="#story" className="hover:text-muted-foreground transition-colors">Story</a>
          <a href="#archive" className="hover:text-muted-foreground transition-colors">Archive</a>
        </div>
        <div className="text-xs uppercase" style={{ fontFamily: "var(--font-mono)" }}>
          Bag (0)
        </div>
      </nav>

      {/* Hero */}
      <header className="relative h-[90vh] overflow-hidden flex items-center justify-center text-center px-6">
        <div className="absolute inset-0 z-0 bg-stone-200">
          <img
            src={hero1}
            alt="Gold ring on marble"
            width={1920}
            height={1088}
            className="absolute inset-0 w-full h-full object-cover animate-kb-1"
          />
          <img
            src={hero2}
            alt="Woman wearing gold hoop earrings"
            width={1920}
            height={1088}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover animate-kb-2"
          />
          <img
            src={hero3}
            alt="Gold necklaces on linen"
            width={1920}
            height={1088}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover animate-kb-3"
          />
          <div className="absolute inset-0 bg-foreground/25" />
        </div>

        <div className="relative z-10 max-w-2xl fade-up">
          <h1
            className="text-5xl md:text-7xl italic text-white text-balance leading-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Objects of quiet reflection.
          </h1>
          <p className="mt-6 text-white/90 text-sm tracking-wide uppercase font-medium">
            The SS24 Archive is Here
          </p>
          <a
            href="#shop"
            className="inline-block mt-10 px-10 py-4 bg-white text-foreground text-[11px] uppercase tracking-[0.2em] font-medium hover:bg-background transition-colors"
          >
            Explore Collection
          </a>
        </div>
      </header>

      {/* Featured Grid */}
      <section id="shop" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <span
              className="text-[10px] text-muted-foreground uppercase tracking-tighter mb-2 block"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              01/ Featured
            </span>
            <h2 className="text-3xl italic" style={{ fontFamily: "var(--font-display)" }}>
              The Essentials
            </h2>
          </div>
          <a
            href="#archive"
            className="text-[10px] uppercase border-b border-foreground/20 pb-1 hover:border-foreground transition-all"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            View All
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-foreground/5 border border-foreground/5">
          {products.map((p) => (
            <article key={p.name} className="group bg-background p-4 flex flex-col">
              <div className="aspect-[4/5] bg-stone-100 overflow-hidden mb-6">
                <img
                  src={p.img}
                  alt={p.name}
                  width={800}
                  height={1000}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-medium">{p.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{p.material}</p>
                </div>
                <p className="text-sm" style={{ fontFamily: "var(--font-mono)" }}>
                  {p.price}
                </p>
              </div>
              <button
                type="button"
                className="mt-6 w-full py-3 border border-foreground/10 text-[10px] uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors"
              >
                Add to Bag
              </button>
            </article>
          ))}
        </div>
      </section>

      {/* Feature points */}
      <section className="bg-foreground text-background py-16 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {features.map((f) => (
            <div key={f.label}>
              <p
                className="text-[10px] uppercase tracking-[0.2em] mb-2"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {f.label}
              </p>
              <p className="text-xs text-background/60">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonial */}
      <section id="story" className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <span
            className="text-[10px] text-muted-foreground uppercase tracking-tighter mb-4 block"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            02/ Shared Words
          </span>
          <p
            className="text-2xl md:text-3xl italic text-pretty leading-relaxed mb-8"
            style={{ fontFamily: "var(--font-display)" }}
          >
            “There is a rare honesty in these pieces. They don't demand attention, but
            they certainly command it when found.”
          </p>
          <p className="text-[10px] uppercase tracking-widest font-medium">
            Elena R. — Collector
          </p>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-24 border-t border-foreground/5">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <img
            src={storyImg}
            alt="Detail of gold jewelry on silk"
            width={1216}
            height={800}
            loading="lazy"
            className="w-full aspect-[16/10] object-cover"
          />
          <div className="max-w-md">
            <h2
              className="text-3xl italic mb-6"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Join the Archive
            </h2>
            <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
              Receive exclusive previews of new releases and stories from the studio. We
              value silence as much as you do.
            </p>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex border-b border-foreground pb-2"
            >
              <input
                type="email"
                required
                placeholder="Your email address"
                className="bg-transparent flex-1 text-sm outline-none placeholder:text-muted-foreground/50"
                style={{ fontFamily: "var(--font-mono)" }}
              />
              <button
                type="submit"
                className="text-[10px] uppercase tracking-widest font-medium"
              >
                Submit
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-foreground/5 py-16 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-12">
          <div className="space-y-4">
            <div
              className="text-xs tracking-widest uppercase"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Aurelia Studio
            </div>
            <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
              Purveyors of minimal fine jewelry designed for the everyday ritual.
              Handcrafted with intention.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-12 md:gap-24">
            <div className="space-y-4">
              <p className="text-[10px] uppercase tracking-widest font-bold">Shop</p>
              <ul className="text-[11px] text-muted-foreground space-y-2">
                <li><a href="#" className="hover:text-foreground">All Collections</a></li>
                <li><a href="#" className="hover:text-foreground">Rings</a></li>
                <li><a href="#" className="hover:text-foreground">Earrings</a></li>
                <li><a href="#" className="hover:text-foreground">Necklaces</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <p className="text-[10px] uppercase tracking-widest font-bold">Connect</p>
              <ul className="text-[11px] text-muted-foreground space-y-2">
                <li><a href="#" className="hover:text-foreground">Instagram</a></li>
                <li><a href="#" className="hover:text-foreground">Contact</a></li>
                <li><a href="#" className="hover:text-foreground">Care Guide</a></li>
                <li><a href="#" className="hover:text-foreground">Ethics</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-foreground/5 flex justify-between items-center text-[9px] text-muted-foreground uppercase tracking-widest">
          <p>&copy; 2024 Aurelia. All rights reserved.</p>
          <p>Fine Jewelry for the Refined Soul.</p>
        </div>
      </footer>
    </div>
  );
}
