import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ShoppingBag,
  Archive,
  Star,
  X,
  FolderOpen,
} from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabase";
import { StatusBadge, EmptyState } from "../index";
import { toast } from "sonner";
import type { Product } from "@/lib/database.types";

type StatusFilter = "all" | "published" | "draft" | "archived";
type SortKey = "newest" | "oldest" | "price_desc" | "price_asc" | "name";

export const Route = createFileRoute("/admin/products/")({
  validateSearch: (search: Record<string, unknown>) => ({
    collection: typeof search.collection === "string" ? search.collection : undefined,
    status: ["all", "published", "draft", "archived"].includes(search.status as string)
      ? (search.status as StatusFilter)
      : undefined,
    q: typeof search.q === "string" ? search.q : undefined,
    sort: ["newest", "oldest", "price_desc", "price_asc", "name"].includes(search.sort as string)
      ? (search.sort as SortKey)
      : undefined,
  }),
  component: ProductsPage,
});

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_price: number | null;
  status: string;
  featured: boolean;
  material: string | null;
  created_at: string;
  product_images: Array<{ url: string; is_primary: boolean }>;
  product_collections: Array<{ collection_id: string; collections: { id: string; name: string; slug: string } | null }>;
};

function ProductsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { collection, status, q, sort } = Route.useSearch();

  const statusFilter: StatusFilter = status ?? "all";
  const search = q ?? "";
  const sortKey: SortKey = sort ?? "newest";

  // Update one or more search params, preserving the rest.
  function setParams(patch: Partial<{ collection: string; status: StatusFilter; q: string; sort: SortKey }>) {
    navigate({
      to: "/admin/products",
      search: (prev) => {
        const next: Record<string, unknown> = { ...prev, ...patch };
        // Drop "empty"/default values so the URL stays clean.
        if (!next.collection) delete next.collection;
        if (!next.q) delete next.q;
        if (next.status === "all") delete next.status;
        if (next.sort === "newest") delete next.sort;
        return next;
      },
      replace: true,
    });
  }

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-products", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select(
          "id, name, slug, price, compare_price, status, featured, material, created_at, product_images(url, is_primary), product_collections(collection_id, collections(id, name, slug))"
        )
        .order("created_at", { ascending: false });
      if (statusFilter !== "all") query = query.eq("status", statusFilter);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as ProductRow[];
    },
    staleTime: 15_000,
  });

  const { data: collections = [] } = useQuery({
    queryKey: ["admin-collections-list"],
    queryFn: async () => {
      const { data } = await supabase.from("collections").select("id, name, slug").order("name");
      return (data ?? []) as unknown as Array<{ id: string; name: string; slug: string }>;
    },
    staleTime: 60_000,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("products").update({ status } as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Product status updated");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const toggleFeatured = useMutation({
    mutationFn: async ({ id, featured }: { id: string; featured: boolean }) => {
      const { error } = await supabase.from("products").update({ featured } as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: () => toast.error("Failed to update product"),
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Product deleted");
    },
    onError: () => toast.error("Failed to delete product"),
  });

  const activeCollection = collection
    ? collections.find((c) => c.slug === collection)
    : undefined;

  const filtered = products
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    .filter((p) =>
      collection
        ? p.product_collections?.some((pc) => pc.collections?.slug === collection)
        : true
    )
    .sort((a, b) => {
      switch (sortKey) {
        case "oldest":
          return a.created_at.localeCompare(b.created_at);
        case "price_desc":
          return b.price - a.price;
        case "price_asc":
          return a.price - b.price;
        case "name":
          return a.name.localeCompare(b.name);
        case "newest":
        default:
          return b.created_at.localeCompare(a.created_at);
      }
    });

  const statusTabs: { label: string; value: StatusFilter }[] = [
    { label: "All", value: "all" },
    { label: "Published", value: "published" },
    { label: "Draft", value: "draft" },
    { label: "Archived", value: "archived" },
  ];

  return (
    <div>
      <AdminHeader
        title="Products"
        subtitle={`${products.length} total`}
        actions={
          <Link to="/admin/products/new">
            <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5">
              <Plus size={15} />
              <span className="hidden sm:inline">Add Product</span>
            </Button>
          </Link>
        }
      />

      <div className="p-4 sm:p-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search products…"
              value={search}
              onChange={(e) => setParams({ q: e.target.value })}
              className="pl-9 bg-white border-gray-200 rounded-xl h-9"
            />
          </div>

          {/* Collection filter */}
          <div className="relative shrink-0">
            <FolderOpen size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <select
              value={collection ?? "all"}
              onChange={(e) => setParams({ collection: e.target.value === "all" ? "" : e.target.value })}
              className="h-9 pl-9 pr-8 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-200"
            >
              <option value="all">All collections</option>
              {collections.map((c) => (
                <option key={c.id} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="shrink-0">
            <select
              value={sortKey}
              onChange={(e) => setParams({ sort: e.target.value as SortKey })}
              className="h-9 px-3 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-200"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="price_desc">Price: High → Low</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 overflow-x-auto w-full sm:w-fit">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setParams({ status: tab.value })}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                statusFilter === tab.value
                  ? "bg-violet-600 text-white"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Active collection notice */}
        {collection && (
          <div className="flex items-center justify-between gap-3 bg-violet-50 border border-violet-100 rounded-xl px-4 py-2.5">
            <p className="text-sm text-violet-700">
              <FolderOpen size={14} className="inline mr-1.5 -mt-0.5" />
              Showing <span className="font-semibold">{filtered.length}</span> product
              {filtered.length !== 1 ? "s" : ""} in{" "}
              <span className="font-semibold">{activeCollection?.name ?? collection}</span>
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setParams({ collection: "" })}
              className="h-7 px-2 text-xs text-violet-700 hover:text-violet-900 hover:bg-violet-100 gap-1"
            >
              <X size={13} /> Clear
            </Button>
          </div>
        )}

        {/* Products list */}
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3 animate-pulse">
                <div className="w-12 h-12 bg-gray-100 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-gray-100 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                </div>
                <div className="h-3 bg-gray-100 rounded w-16" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="No products found"
            desc={
              collection
                ? "This collection has no matching products yet"
                : search
                  ? "Try a different search term"
                  : "Add your first jewelry product"
            }
            action={!search && !collection ? { label: "Add Product", href: "/admin/products/new" } : undefined}
          />
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50 overflow-hidden">
            {/* Column header (desktop) */}
            <div className="hidden md:flex items-center gap-4 px-4 py-2.5 bg-gray-50/60 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              <span className="w-12 shrink-0">Item</span>
              <span className="flex-1">Product</span>
              <span className="w-40 shrink-0">Collections</span>
              <span className="w-28 shrink-0 text-right">Price</span>
              <span className="w-24 shrink-0 text-center">Status</span>
              <span className="w-24 shrink-0" />
            </div>

            {filtered.map((product) => {
              const primaryImage =
                product.product_images?.find((i) => i.is_primary)?.url ??
                product.product_images?.[0]?.url;
              const cols = (product.product_collections ?? [])
                .map((pc) => pc.collections)
                .filter(Boolean) as Array<{ id: string; name: string; slug: string }>;

              return (
                <div
                  key={product.id}
                  className="flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3 hover:bg-gray-50 transition-colors group"
                >
                  {/* Thumbnail */}
                  <div className="relative w-12 h-12 rounded-xl bg-gray-50 overflow-hidden shrink-0">
                    {primaryImage ? (
                      <img src={primaryImage} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag size={18} className="text-gray-200" />
                      </div>
                    )}
                  </div>

                  {/* Name + meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Link
                        to="/admin/products/$productSlug"
                        params={{ productSlug: product.id }}
                        className="text-sm font-medium text-gray-900 truncate hover:text-violet-600 transition-colors"
                      >
                        {product.name}
                      </Link>
                      {product.featured && (
                        <Star size={13} className="text-amber-400 fill-amber-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate">
                      {product.material || <span className="font-mono">{product.slug}</span>}
                    </p>
                    {/* Collections + status inline on mobile */}
                    <div className="flex items-center gap-1.5 mt-1 md:hidden">
                      <StatusBadge status={product.status} />
                      <span className="text-xs font-medium text-gray-700">
                        Rs {product.price.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Collections (desktop) */}
                  <div className="hidden md:flex w-40 shrink-0 flex-wrap gap-1">
                    {cols.length > 0 ? (
                      cols.slice(0, 2).map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setParams({ collection: c.slug })}
                          className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 hover:bg-violet-100 transition-colors truncate max-w-full"
                          title={`Filter by ${c.name}`}
                        >
                          {c.name}
                        </button>
                      ))
                    ) : (
                      <span className="text-[10px] text-gray-300">—</span>
                    )}
                    {cols.length > 2 && (
                      <span className="text-[10px] text-gray-400 px-1 py-0.5">+{cols.length - 2}</span>
                    )}
                  </div>

                  {/* Price (desktop) */}
                  <div className="hidden md:block w-28 shrink-0 text-right">
                    <p className="text-sm font-semibold text-gray-900">Rs {product.price.toLocaleString()}</p>
                    {product.compare_price && (
                      <p className="text-xs text-gray-400 line-through">
                        Rs {product.compare_price.toLocaleString()}
                      </p>
                    )}
                  </div>

                  {/* Status (desktop) */}
                  <div className="hidden md:flex w-24 shrink-0 justify-center">
                    <StatusBadge status={product.status} />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0 md:w-24 md:justify-end">
                    <Link to="/admin/products/$productSlug" params={{ productSlug: product.id }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-violet-600 hover:text-violet-700 hover:bg-violet-50 h-8 px-2 text-xs gap-1"
                      >
                        <Pencil size={13} /> <span className="hidden sm:inline">Edit</span>
                      </Button>
                    </Link>
                    <ProductMenu
                      product={product as unknown as Product}
                      onStatusChange={(status) => updateStatus.mutate({ id: product.id, status })}
                      onToggleFeatured={() =>
                        toggleFeatured.mutate({ id: product.id, featured: !product.featured })
                      }
                      onDelete={() => {
                        if (confirm(`Delete "${product.name}"?`)) deleteProduct.mutate(product.id);
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ProductMenu({
  product,
  onStatusChange,
  onToggleFeatured,
  onDelete,
}: {
  product: Product;
  onStatusChange: (s: string) => void;
  onToggleFeatured: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          <MoreVertical size={15} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <Link to="/admin/products/$productSlug" params={{ productSlug: product.id }}>
          <DropdownMenuItem>
            <Pencil size={14} className="mr-2" /> Edit product
          </DropdownMenuItem>
        </Link>
        <DropdownMenuItem onClick={onToggleFeatured}>
          <Star size={14} className={`mr-2 ${product.featured ? "text-amber-400 fill-amber-400" : "text-gray-500"}`} />
          {product.featured ? "Unfeature" : "Mark featured"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {product.status !== "published" && (
          <DropdownMenuItem onClick={() => onStatusChange("published")}>
            <Eye size={14} className="mr-2 text-emerald-600" />
            Publish
          </DropdownMenuItem>
        )}
        {product.status !== "draft" && (
          <DropdownMenuItem onClick={() => onStatusChange("draft")}>
            <EyeOff size={14} className="mr-2 text-gray-500" />
            Set as draft
          </DropdownMenuItem>
        )}
        {product.status !== "archived" && (
          <DropdownMenuItem onClick={() => onStatusChange("archived")}>
            <Archive size={14} className="mr-2 text-amber-600" />
            Archive
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onDelete}
          className="text-red-600 focus:text-red-600 focus:bg-red-50"
        >
          <Trash2 size={14} className="mr-2" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
