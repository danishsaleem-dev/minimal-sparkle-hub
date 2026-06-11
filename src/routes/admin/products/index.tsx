import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ShoppingBag,
  Archive,
  ChevronDown,
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

export const Route = createFileRoute("/admin/products/")({
  component: ProductsPage,
});

type StatusFilter = "all" | "published" | "draft" | "archived";

function ProductsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-products", statusFilter],
    queryFn: async () => {
      let q = supabase
        .from("products")
        .select(
          "id, name, slug, price, compare_price, status, featured, material, created_at, product_images(url, is_primary)"
        )
        .order("created_at", { ascending: false });
      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 15_000,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("products")
        .update({ status } as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Product status updated");
    },
    onError: () => toast.error("Failed to update status"),
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

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

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
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <Input
              placeholder="Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white border-gray-200 rounded-xl h-9"
            />
          </div>
          <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 overflow-x-auto shrink-0">
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
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
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 animate-pulse">
                <div className="w-full h-40 bg-gray-100 rounded-xl mb-3" />
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="No products found"
            desc={search ? "Try a different search term" : "Add your first jewelry product"}
            action={!search ? { label: "Add Product", href: "/admin/products/new" } : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((product) => {
              const primaryImage = (product.product_images as Array<{ url: string; is_primary: boolean }>)?.find(
                (i) => i.is_primary
              )?.url ?? (product.product_images as Array<{ url: string; is_primary: boolean }>)?.[0]?.url;

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md transition-shadow"
                >
                  {/* Image */}
                  <div className="relative h-44 bg-gray-50">
                    {primaryImage ? (
                      <img
                        src={primaryImage}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag size={32} className="text-gray-200" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ProductMenu
                        product={product as unknown as Product}
                        onStatusChange={(status) =>
                          updateStatus.mutate({ id: product.id, status })
                        }
                        onDelete={() => {
                          if (confirm(`Delete "${product.name}"?`))
                            deleteProduct.mutate(product.id);
                        }}
                      />
                    </div>
                    {product.featured && (
                      <div className="absolute top-2 left-2 bg-amber-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                        Featured
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{product.name}</p>
                        {product.material && (
                          <p className="text-xs text-gray-400 mt-0.5 truncate">{product.material}</p>
                        )}
                      </div>
                      <StatusBadge status={product.status} />
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-semibold text-gray-900">
                          Rs {product.price.toLocaleString()}
                        </span>
                        {product.compare_price && (
                          <span className="text-xs text-gray-400 line-through">
                            Rs {product.compare_price.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <Link to="/admin/products/$productId" params={{ productId: product.id }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-violet-600 hover:text-violet-700 hover:bg-violet-50 h-7 px-2 text-xs gap-1"
                        >
                          <Pencil size={12} /> Edit
                        </Button>
                      </Link>
                    </div>
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
  onDelete,
}: {
  product: Product;
  onStatusChange: (s: string) => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          size="icon"
          className="h-7 w-7 bg-white/90 backdrop-blur-sm border border-gray-200 hover:bg-white shadow-sm rounded-lg"
        >
          <MoreVertical size={13} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <Link to="/admin/products/$productId" params={{ productId: product.id }}>
          <DropdownMenuItem>
            <Pencil size={14} className="mr-2" /> Edit product
          </DropdownMenuItem>
        </Link>
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
