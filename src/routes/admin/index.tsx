import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Package,
  FolderOpen,
  Image,
  Globe,
  TrendingUp,
  Eye,
  Star,
  ArrowRight,
  Plus,
  ShoppingBag,
} from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [products, collections, published] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("collections").select("id", { count: "exact", head: true }),
        supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("status", "published"),
      ]);
      return {
        products: products.count ?? 0,
        collections: collections.count ?? 0,
        published: published.count ?? 0,
      };
    },
    staleTime: 30_000,
  });

  const { data: recentProducts } = useQuery({
    queryKey: ["admin-recent-products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, price, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
    staleTime: 30_000,
  });

  const statCards = [
    {
      label: "Total Products",
      value: stats?.products ?? "—",
      icon: Package,
      color: "bg-violet-50 text-violet-600",
      change: "+0 this week",
    },
    {
      label: "Published",
      value: stats?.published ?? "—",
      icon: Eye,
      color: "bg-emerald-50 text-emerald-600",
      change: "Live on store",
    },
    {
      label: "Collections",
      value: stats?.collections ?? "—",
      icon: FolderOpen,
      color: "bg-amber-50 text-amber-600",
      change: "Product groups",
    },
    {
      label: "Featured",
      value: "—",
      icon: Star,
      color: "bg-pink-50 text-pink-600",
      change: "Highlighted items",
    },
  ];

  const quickActions = [
    {
      label: "Add Product",
      desc: "Upload jewelry with images & variants",
      href: "/admin/products/new",
      icon: Plus,
      color: "bg-violet-600 hover:bg-violet-700 text-white",
    },
    {
      label: "Edit Homepage",
      desc: "Update banners, content & sections",
      href: "/admin/homepage",
      icon: Globe,
      color: "bg-white border border-gray-200 hover:border-violet-300 hover:bg-violet-50 text-gray-700 hover:text-violet-700",
    },
    {
      label: "Manage Media",
      desc: "Upload & organise images and videos",
      href: "/admin/media",
      icon: Image,
      color: "bg-white border border-gray-200 hover:border-violet-300 hover:bg-violet-50 text-gray-700 hover:text-violet-700",
    },
  ];

  return (
    <div>
      <AdminHeader
        title="Dashboard"
        subtitle="Welcome back — By Areeqaan"
        actions={
          <Link to="/admin/products/new">
            <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5">
              <Plus size={15} />
              <span className="hidden sm:inline">New Product</span>
            </Button>
          </Link>
        }
      />

      <div className="p-4 sm:p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-gray-500 font-medium">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1 leading-none">
                    {card.value}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1.5">{card.change}</p>
                </div>
                <div className={cn("p-2 rounded-xl shrink-0", card.color)}>
                  <card.icon size={16} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {quickActions.map((action) => (
              <Link key={action.href} to={action.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-2xl transition-all duration-150 cursor-pointer",
                    action.color
                  )}
                >
                  <div className="p-2 rounded-xl bg-white/20">
                    <action.icon size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm leading-tight">{action.label}</p>
                    <p className="text-xs opacity-70 leading-tight mt-0.5 truncate">
                      {action.desc}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Products */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Recent Products
            </h2>
            <Link to="/admin/products">
              <Button variant="ghost" size="sm" className="text-violet-600 hover:text-violet-700 gap-1 text-xs h-7 px-2">
                View all <ArrowRight size={12} />
              </Button>
            </Link>
          </div>

          {recentProducts && recentProducts.length > 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
              {recentProducts.map((product) => (
                <Link
                  key={product.id}
                  to="/admin/products/$productId"
                  params={{ productId: product.id }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
                >
                  <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                    <ShoppingBag size={16} className="text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Rs {product.price.toLocaleString()}
                    </p>
                  </div>
                  <StatusBadge status={product.status as string} />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={ShoppingBag}
              title="No products yet"
              desc="Add your first jewelry product to get started"
              action={{ label: "Add Product", href: "/admin/products/new" }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    published: "bg-emerald-50 text-emerald-700 border-emerald-100",
    draft: "bg-gray-50 text-gray-600 border-gray-100",
    archived: "bg-red-50 text-red-600 border-red-100",
  };
  return (
    <span
      className={cn(
        "text-[11px] font-medium px-2 py-0.5 rounded-full border capitalize",
        styles[status] ?? styles.draft
      )}
    >
      {status}
    </span>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  desc,
  action,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
      <div className="mx-auto w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center mb-3">
        <Icon size={20} className="text-violet-400" />
      </div>
      <p className="font-medium text-gray-900">{title}</p>
      <p className="text-sm text-gray-500 mt-1">{desc}</p>
      {action && (
        <Link to={action.href}>
          <Button
            size="sm"
            className="mt-4 bg-violet-600 hover:bg-violet-700 text-white"
          >
            {action.label}
          </Button>
        </Link>
      )}
    </div>
  );
}
