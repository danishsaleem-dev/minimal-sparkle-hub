import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { ProductForm, type ProductFormValues, type Collection } from "@/components/admin/ProductForm";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/products/new")({
  component: NewProductPage,
});

function NewProductPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();

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
    media: Array<{ url: string; alt?: string; is_primary: boolean; type: "image" | "video"; thumbnail_url?: string; title?: string }>,
    collectionIds: string[]
  ) {
    setIsSubmitting(true);
    try {
      const { data: product, error: productError } = await supabase
        .from("products")
        .insert({
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
        })
        .select()
        .single();

      if (productError) throw productError;

      const images = media.filter((m) => m.type === "image");
      if (images.length > 0) {
        await supabase.from("product_images").insert(
          images.map((img, i) => ({
            product_id: product.id,
            url: img.url,
            alt: img.alt ?? null,
            position: i,
            is_primary: img.is_primary,
          }))
        );
      }

      const videos = media.filter((m) => m.type === "video");
      if (videos.length > 0) {
        await supabase.from("product_videos").insert(
          videos.map((vid, i) => ({
            product_id: product.id,
            url: vid.url,
            thumbnail_url: vid.thumbnail_url ?? null,
            title: vid.title ?? null,
            position: i,
          }))
        );
      }

      if (values.variants && values.variants.length > 0) {
        await supabase.from("product_variants").insert(
          values.variants.map((v, i) => ({
            product_id: product.id,
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

      if (collectionIds.length > 0) {
        await supabase.from("product_collections").insert(
          collectionIds.map((collection_id) => ({ product_id: product.id, collection_id }))
        );
      }

      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("Product created successfully!");
      navigate({ to: "/admin/products/$productSlug", params: { productSlug: product.slug } });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to create product: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <AdminHeader
        title="New Product"
        subtitle="Add a jewelry product to your store"
        actions={
          <Link to="/admin/products">
            <Button variant="ghost" size="sm" className="gap-1 text-gray-600">
              <ChevronLeft size={15} /> Back
            </Button>
          </Link>
        }
      />
      <div className="p-4 sm:p-6">
        <ProductForm
          collections={collections}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitLabel="Create Product"
        />
      </div>
    </div>
  );
}
