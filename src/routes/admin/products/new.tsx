import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { ProductForm, type ProductFormValues } from "@/components/admin/ProductForm";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/products/new")({
  component: NewProductPage,
});

function NewProductPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();

  async function handleSubmit(
    values: ProductFormValues,
    media: Array<{ url: string; alt?: string; is_primary: boolean; type: "image" | "video"; thumbnail_url?: string; title?: string }>
  ) {
    setIsSubmitting(true);
    try {
      // Insert product
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

      // Insert images
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

      // Insert videos
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

      // Insert variants
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

      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("Product created successfully!");
      navigate({ to: "/admin/products/$productId", params: { productId: product.id } });
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
      <div className="p-4 sm:p-6 max-w-3xl">
        <ProductForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitLabel="Create Product"
        />
      </div>
    </div>
  );
}
