export const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined) ?? "https://byareeqaan.com";
export const SITE_NAME = "By Areeqaan";
export const SITE_DESCRIPTION =
  "By Areeqaan crafts trendy, minimal & affordable luxe fashion accessories. Tiny details, big statements. Delivery all over Pakistan.";
export const SITE_TWITTER = "@byareeqaan";
export const BRAND_COLOR = "#6b21a8";

export const SOCIAL = {
  instagram: "https://www.instagram.com/byareeqaan/",
  tiktok: "https://www.tiktok.com/@by_areeqan",
  facebook: "https://www.facebook.com/ByAreeqan/",
  whatsapp: "https://wa.me/923364246604",
};

export function orgSchema(logoUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: logoUrl,
    description: SITE_DESCRIPTION,
    sameAs: Object.values(SOCIAL),
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+92-336-4246604",
      contactType: "customer service",
      availableLanguage: ["English", "Urdu"],
    },
    address: {
      "@type": "PostalAddress",
      addressCountry: "PK",
    },
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    publisher: { "@type": "Organization", name: SITE_NAME },
  };
}

export function productListSchema(
  products: Array<{ name: string; price: number; img: string | null; material?: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "By Areeqaan — Signature Pieces",
    numberOfItems: products.length,
    itemListElement: products.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Product",
        name: p.name,
        ...(p.img ? { image: p.img } : {}),
        ...(p.material ? { material: p.material } : {}),
        brand: { "@type": "Brand", name: SITE_NAME },
        offers: {
          "@type": "Offer",
          price: p.price,
          priceCurrency: "PKR",
          availability: "https://schema.org/InStock",
          url: SITE_URL,
          seller: { "@type": "Organization", name: SITE_NAME },
        },
      },
    })),
  };
}
