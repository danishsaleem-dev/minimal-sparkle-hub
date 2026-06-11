import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Loader2, AlertCircle } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { ProductForm, type ProductFormValues, type Collection } from "@/components/admin/ProductForm";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { StatusBadge } from "@/routes/admin/index";

export const Route = createFileRoute("/admin/products/$productSlug")({
  component: EditProductPage,
});

function EditProductPage() {
  const { productSlug } = Route.useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-product", productSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`*, product_images(*), product_videos(*), product_variants(*), product_collections(collection_id)`)
        .eq("slug", productSlug)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: collections = [] } = useQuery<Collection[]>({
    queryKey: ["admin-collections-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("id, name, slug")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  async function handleSubmit(
    values: ProductFormValues,
    media: Array<{ id?: string; url: string; alt?: string; is_primary: boolean; type: "image" | "video"; thumbnail_url?: string; title?: string }>,
    collectionIds: string[]
  ) {
    if (!data) return;
    const productId = data.id;
    setIsSubmitting(true);
    try {
      const { error: productError } = await supabase
        .from("products")
        .update({
          name: values.name,
          slug: values.slug,
          description: values.description ?? null,
          short_description: values.short_description ?? null,
          price: values.price,
          compare_price: values.compare_price ?? null,
          status: values.status,
          featured: values.featured,
          material: values.material ?? null,
          weight_grams: values.weight_grams ?? null,
          sku: values.sku ?? null,
          seo_title: values.seo_title ?? null,
          seo_description: values.seo_description ?? null,
        } as never)
        .eq("id", productId);

      if (productError) throw productError;

      // Replace images
      await supabase.from("product_images").delete().eq("product_id", productId);
      const images = media.filter((m) => m.type === "image");
      if (images.length > 0) {
        await supabase.from("product_images").insert(
          images.map((img, i) => ({
            product_id: productId,
            url: img.url,
            alt: img.alt ?? null,
            position: i,
            is_primary: img.is_primary,
          }))
        );
      }

      // Replace videos
      await supabase.from("product_videos").delete().eq("product_id", productId);
      const videos = media.filter((m) => m.type === "video");
      if (videos.length > 0) {
        await supabase.from("product_videos").insert(
          videos.map((vid, i) => ({
            product_id: productId,
            url: vid.url,
            thumbnail_url: vid.thumbnail_url ?? null,
            title: vid.title ?? null,
            position: i,
          }))
        );
      }

      // Replace variants
      await supabase.from("product_variants").delete().eq("product_id", productId);
      if (values.variants && values.variants.length > 0) {
        await supabase.from("product_variants").insert(
          values.variants.map((v, i) => ({
            product_id: productId,
            title: v.title,
            sku: v.sku ?? null,
            price: v.price ?? null,
            compare_price: v.compare_price ?? null,
            inventory_quantity: v.inventory_quantity,
            available: v.available,
            position: i,
          }))
        );
      }

      // Replace collections
      await supabase.from("product_collections").delete().eq("product_id", productId);
      if (collectionIds.length > 0) {
        await supabase.from("product_collections").insert(
          collectionIds.map((collection_id) => ({ product_id: productId, collection_id }))
        );
      }

      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["admin-product", productSlug] });

      if (values.slug !== productSlug) {
        navigate({ to: "/admin/products/$productSlug", params: { productSlug: values.slug } });
      }

      toast.success("Product updated!");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to update: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 size={24} className="animate-spin text-violet-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-gray-500">
        <AlertCircle size={32} className="text-red-400" />
        <p className="font-medium">Product not found</p>
        <Link to="/admin/products">
          <Button variant="outline" size="sm">Back to Products</Button>
        </Link>
      </div>
    );
  }

  const selectedCollectionIds = (data.product_collections ?? []).map(
    (pc: { collection_id: string }) => pc.collection_id
  );

  const defaultValues: Partial<ProductFormValues> = {
    name: data.name,
    slug: data.slug,
    description: data.description ?? "",
    short_description: data.short_description ?? "",
    price: data.price,
    compare_price: data.compare_price ?? undefined,
    status: data.status,
    featured: data.featured,
    material: data.material ?? "",
    weight_grams: data.weight_grams ?? undefined,
    sku: data.sku ?? "",
    seo_title: data.seo_title ?? "",
    seo_description: data.seo_description ?? "",
    variants: (data.product_variants ?? []).map((v: {
      id: string; title: string; sku: string | null; price: number | null;
      compare_price: number | null; inventory_quantity: number; available: boolean;
    }) => ({
      id: v.id,
      title: v.title,
      sku: v.sku ?? "",
      price: v.price ?? undefined,
      compare_price: v.compare_price ?? undefined,
      inventory_quantity: v.inventory_quantity,
      available: v.available,
    })),
  };

  const mediaItems = [
    ...(data.product_images ?? []).map((img: { id: string; url: string; alt: string | null; is_primary: boolean }) => ({
      id: img.id,
      url: img.url,
      alt: img.alt ?? undefined,
      is_primary: img.is_primary,
      type: "image" as const,
    })),
    ...(data.product_videos ?? []).map((vid: { id: string; url: string; thumbnail_url: string | null; title: string | null }) => ({
      id: vid.id,
      url: vid.url,
      thumbnail_url: vid.thumbnail_url ?? undefined,
      title: vid.title ?? undefined,
      is_primary: false,
      type: "video" as const,
    })),
  ];

  return (
    <div>
      <AdminHeader
        title={data.name}
        subtitle={
          <span className="flex items-center gap-2">
            Edit product
            <StatusBadge status={data.status} />
          </span>
        }
        actions={
          <Link to="/admin/products">
            <Button variant="ghost" size="sm" className="gap-1 text-gray-600">
              <ChevronLeft size={15} /> Products
            </Button>
          </Link>
        }
      />
      <div className="p-4 sm:p-6">
        <ProductForm
          defaultValues={defaultValues}
          mediaItems={mediaItems}
          collections={collections}
          selectedCollectionIds={selectedCollectionIds}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitLabel="Update Product"
        />
      </div>
    </div>
  );
}
