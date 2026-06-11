import { type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import logo from "@/assets/logo.png";

interface StorefrontLayoutProps {
  children: ReactNode;
}

export function StorefrontLayout({ children }: StorefrontLayoutProps) {
  const { data: st = {} } = useQuery<Record<string, string>>({
    queryKey: ["storefront-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("key, value");
      if (!data) return {};
      const map: Record<string, string> = {};
      for (const row of data) {
        const v = row.value;
        map[row.key] = typeof v === "string" ? v.replace(/^"|"$/g, "") : v === null ? "" : String(v);
      }
      return map;
    },
    staleTime: 60_000,
  });

  const { data: ann } = useQuery({
    queryKey: ["storefront-announcement"],
    queryFn: async () => {
      const { data } = await supabase
        .from("homepage_sections")
        .select("key, value")
        .eq("section", "announcement");
      if (!data) return null;
      const map: Record<string, unknown> = {};
      for (const row of data) map[row.key] = row.value;
      return map;
    },
    staleTime: 60_000,
  });

  const announcementEnabled = ann?.enabled !== false;
  const announcementText =
    (ann?.text as string)?.replace(/^"|"$/g, "") ??
    "New arrivals every week · Delivery all over Pakistan 🇵🇰";

  const WHATSAPP = st.whatsapp_number
    ? `https://wa.me/${st.whatsapp_number}`
    : "https://wa.me/923364246604";
  const INSTAGRAM = st.instagram_url || "https://www.instagram.com/byareeqaan/";
  const TIKTOK = st.tiktok_url || "https://www.tiktok.com/@by_areeqan";
  const FACEBOOK = st.facebook_url || "https://www.facebook.com/ByAreeqan/";

  return (
    <div
      className="min-h-screen bg-background text-foreground antialiased"
      style={{ fontFamily: "var(--font-body)" }}
    >
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
      <nav
        className="sticky top-0 z-50 w-full bg-background/85 backdrop-blur-md border-b border-foreground/5 px-6 flex justify-between items-center"
        style={{ height: "64px" }}
      >
        <Link to="/" className="flex items-center">
          <img
            src={logo}
            alt="By Areeqaan"
            width={150}
            height={40}
            style={{ height: "40px", width: "auto" }}
            className="block"
            decoding="async"
          />
        </Link>
        <div className="hidden md:flex gap-8 text-[11px] font-medium uppercase tracking-widest">
          <Link to="/shop" className="hover:text-[var(--brand)] transition-colors [&.active]:text-[var(--brand)] [&.active]:border-b [&.active]:border-[var(--brand)]">Shop</Link>
          <Link to="/collections" className="hover:text-[var(--brand)] transition-colors [&.active]:text-[var(--brand)] [&.active]:border-b [&.active]:border-[var(--brand)]">Collections</Link>
          <Link to="/story" className="hover:text-[var(--brand)] transition-colors [&.active]:text-[var(--brand)] [&.active]:border-b [&.active]:border-[var(--brand)]">Story</Link>
          <Link to="/contact" className="hover:text-[var(--brand)] transition-colors [&.active]:text-[var(--brand)] [&.active]:border-b [&.active]:border-[var(--brand)]">Contact</Link>
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

      {/* Page content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-background border-t border-foreground/5 py-16 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-12">
          <div className="space-y-4 max-w-xs">
            <img
              src={logo}
              alt="By Areeqaan"
              width={220}
              height={60}
              loading="lazy"
              decoding="async"
              className="h-16 w-auto"
            />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Fashion accessories made for the everyday. Trendy, minimal, and affordable luxe —
              handpicked with love in Pakistan.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-12 md:gap-24">
            <div className="space-y-4">
              <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: "var(--brand)" }}>
                Explore
              </p>
              <ul className="text-[11px] text-muted-foreground space-y-2">
                <li><Link to="/shop" className="hover:text-foreground">All Pieces</Link></li>
                <li><Link to="/collections" className="hover:text-foreground">Collections</Link></li>
                <li><Link to="/story" className="hover:text-foreground">Our Story</Link></li>
                <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: "var(--brand)" }}>
                Connect
              </p>
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
          <p>© {new Date().getFullYear()} By Areeqaan. All rights reserved.</p>
          <p>Tiny details · Big statements</p>
        </div>
      </footer>
    </div>
  );
}
