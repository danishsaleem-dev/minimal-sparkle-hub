import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  FolderOpen,
  Pencil,
  Trash2,
  Loader2,
  Check,
  Package,
  ArrowRight,
} from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { EmptyState } from "./index";
import type { Collection } from "@/lib/database.types";

export const Route = createFileRoute("/admin/collections")({
  component: CollectionsPage,
});

const collectionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  image_url: z.string().optional(),
});

type CollectionForm = z.infer<typeof collectionSchema>;

function CollectionsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Collection | null>(null);

  const { data: collections = [], isLoading } = useQuery({
    queryKey: ["admin-collections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("*")
        .order("position");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Product counts per collection (collection_id → number of products).
  const { data: counts = {} } = useQuery({
    queryKey: ["admin-collection-counts"],
    queryFn: async () => {
      const { data } = await supabase.from("product_collections").select("collection_id");
      const map: Record<string, number> = {};
      for (const row of (data ?? []) as Array<{ collection_id: string }>) {
        map[row.collection_id] = (map[row.collection_id] ?? 0) + 1;
      }
      return map;
    },
    staleTime: 30_000,
  });

  const form = useForm<CollectionForm>({
    resolver: zodResolver(collectionSchema),
    defaultValues: { name: "", slug: "", description: "", image_url: "" },
  });

  function openNew() {
    setEditing(null);
    form.reset({ name: "", slug: "", description: "", image_url: "" });
    setDialogOpen(true);
  }

  function openEdit(col: Collection) {
    setEditing(col);
    form.reset({
      name: col.name,
      slug: col.slug,
      description: col.description ?? "",
      image_url: col.image_url ?? "",
    });
    setDialogOpen(true);
  }

  const save = useMutation({
    mutationFn: async (values: CollectionForm) => {
      if (editing) {
        const { error } = await supabase
          .from("collections")
          .update({ ...values, description: values.description || null, image_url: values.image_url || null } as never)
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("collections").insert({
          name: values.name,
          slug: values.slug,
          description: values.description || null,
          image_url: values.image_url || null,
          position: collections.length,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-collections"] });
      toast.success(editing ? "Collection updated" : "Collection created");
      setDialogOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteCol = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("collections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-collections"] });
      toast.success("Collection deleted");
    },
    onError: () => toast.error("Failed to delete"),
  });

  function generateSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
  }

  return (
    <div>
      <AdminHeader
        title="Collections"
        subtitle="Organise products into groups"
        actions={
          <Button
            size="sm"
            onClick={openNew}
            className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5"
          >
            <Plus size={15} /> New Collection
          </Button>
        }
      />

      <div className="p-4 sm:p-6">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 h-28 animate-pulse" />
            ))}
          </div>
        ) : collections.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="No collections yet"
            desc="Create your first collection to organise products"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {collections.map((col) => (
              <div
                key={col.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate({ to: "/admin/products", search: { collection: col.slug } })}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate({ to: "/admin/products", search: { collection: col.slug } });
                  }
                }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md hover:border-violet-200 transition-all cursor-pointer flex flex-col text-left focus:outline-none focus:ring-2 focus:ring-violet-300"
              >
                <div className="relative">
                  {col.image_url ? (
                    <div className="h-28 bg-gray-50">
                      <img src={col.image_url} alt={col.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="h-28 bg-gradient-to-br from-violet-50 to-purple-50 flex items-center justify-center">
                      <FolderOpen size={28} className="text-violet-200" />
                    </div>
                  )}
                  {/* Product count badge */}
                  <span className="absolute top-2 left-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm text-gray-700 text-[11px] font-semibold px-2 py-0.5 rounded-full shadow-sm">
                    <Package size={11} className="text-violet-500" />
                    {counts[col.id] ?? 0}
                  </span>
                  {/* Edit / delete */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-7 w-7 bg-white/90 backdrop-blur-sm border border-gray-200 text-gray-500 hover:text-violet-600 shadow-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(col);
                      }}
                    >
                      <Pencil size={13} />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-7 w-7 bg-white/90 backdrop-blur-sm border border-gray-200 text-gray-500 hover:text-red-500 shadow-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete "${col.name}"?`)) deleteCol.mutate(col.id);
                      }}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>
                <div className="p-3 flex-1 flex flex-col">
                  <p className="font-semibold text-sm text-gray-900">{col.name}</p>
                  <p className="text-xs text-gray-400 font-mono">{col.slug}</p>
                  {col.description && (
                    <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{col.description}</p>
                  )}
                  <div className="flex items-center gap-1 mt-3 pt-2 border-t border-gray-50 text-xs font-medium text-violet-600 group-hover:gap-2 transition-all">
                    View products <ArrowRight size={13} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Collection" : "New Collection"}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit((v) => save.mutate(v))}
            className="space-y-4 mt-2"
          >
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Name</Label>
              <Input
                {...form.register("name", {
                  onBlur: () => {
                    if (!form.getValues("slug")) {
                      form.setValue("slug", generateSlug(form.getValues("name")));
                    }
                  },
                })}
                placeholder="e.g. Earrings"
                className="h-10"
              />
              {form.formState.errors.name && (
                <p className="text-xs text-red-500 mt-1">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Slug</Label>
              <Input {...form.register("slug")} placeholder="earrings" className="h-10 font-mono text-sm" />
            </div>
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Description</Label>
              <Textarea {...form.register("description")} placeholder="Brief description…" rows={2} className="resize-none" />
            </div>
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Collection Image</Label>
              <Controller
                name="image_url"
                control={form.control}
                render={({ field }) => (
                  <ImageUpload
                    value={field.value ?? null}
                    onChange={url => field.onChange(url ?? "")}
                    folder="collections"
                    aspectRatio="wide"
                    placeholder="Upload collection image"
                  />
                )}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={save.isPending}
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                {save.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                <span className="ml-2">{editing ? "Update" : "Create"}</span>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
