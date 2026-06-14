import { Link } from "@tanstack/react-router";

export interface ProductCardItem {
  id: string;
  name: string;
  slug?: string | null;
  material?: string | null;
  price: number;
  compare_price?: number | null;
  img?: string | null;
}

interface ProductCardProps {
  product: ProductCardItem;
  /**
   * "featured" — homepage editorial card (4:5, shows material + compare price)
   *   with an "Order via DM" WhatsApp CTA. Requires `whatsappHref`.
   * "catalog" — shop grid card (3:4) that links through to the product detail page.
   */
  variant?: "featured" | "catalog";
  /** WhatsApp order link — used by the "featured" variant's CTA button. */
  whatsappHref?: string;
}

function ImagePlaceholder() {
  return (
    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
      <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    </div>
  );
}

export function ProductCard({ product, variant = "catalog", whatsappHref }: ProductCardProps) {
  if (variant === "featured") {
    return (
      <article className="group bg-background p-4 flex flex-col">
        <div className="aspect-[4/5] overflow-hidden mb-6" style={{ background: "var(--brand-soft)" }}>
          {product.img ? (
            <img
              src={product.img}
              alt={product.name}
              loading="lazy"
              decoding="async"
              width={400}
              height={500}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <ImagePlaceholder />
          )}
        </div>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-sm font-medium">{product.name}</h3>
            {product.material && <p className="text-xs text-muted-foreground mt-1">{product.material}</p>}
          </div>
          <div className="text-right">
            <p className="text-sm" style={{ fontFamily: "var(--font-mono)", color: "var(--brand)" }}>
              Rs {product.price.toLocaleString()}
            </p>
            {product.compare_price && (
              <p className="text-xs text-muted-foreground line-through">
                Rs {product.compare_price.toLocaleString()}
              </p>
            )}
          </div>
        </div>
        {whatsappHref && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="mt-6 w-full py-3 text-center border text-[10px] uppercase tracking-widest transition-colors text-[var(--brand)] border-[var(--brand)] hover:bg-[var(--brand)] hover:text-white hover:border-[var(--brand)]"
          >
            Order via DM
          </a>
        )}
      </article>
    );
  }

  // catalog
  return (
    <Link
      to="/products/$slug"
      params={{ slug: product.slug ?? product.id }}
      className="group block"
    >
      <div className="aspect-[3/4] bg-foreground/5 overflow-hidden relative mb-3">
        {product.img ? (
          <img
            src={product.img}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
            No image
          </div>
        )}
      </div>
      <p className="text-xs font-medium leading-tight">{product.name}</p>
      {product.price != null && (
        <p className="text-xs text-muted-foreground mt-0.5">PKR {product.price.toLocaleString()}</p>
      )}
    </Link>
  );
}
