import { useState, useCallback, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Upload,
  X,
  Plus,
  Trash2,
  GripVertical,
  Image as ImageIcon,
  Video,
  Tag,
  Layers,
  Info,
  ChevronDown,
  ChevronUp,
  Star,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const variantSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Required"),
  sku: z.string().optional(),
  price: z.coerce.number().optional(),
  compare_price: z.coerce.number().optional(),
  inventory_quantity: z.coerce.number().default(0),
  available: z.boolean().default(true),
});

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  short_description: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be positive"),
  compare_price: z.coerce.number().optional(),
  status: z.enum(["draft", "published", "archived"]),
  featured: z.boolean().default(false),
  material: z.string().optional(),
  weight_grams: z.coerce.number().optional(),
  sku: z.string().optional(),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  variants: z.array(variantSchema).default([]),
});

export type ProductFormValues = z.infer<typeof productSchema>;

interface MediaItem {
  id?: string;
  url: string;
  alt?: string;
  is_primary: boolean;
  type: "image" | "video";
  thumbnail_url?: string;
  title?: string;
  uploading?: boolean;
}

interface ProductFormProps {
  defaultValues?: Partial<ProductFormValues>;
  mediaItems?: MediaItem[];
  onSubmit: (values: ProductFormValues, media: MediaItem[]) => Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export function ProductForm({
  defaultValues,
  mediaItems: initialMedia = [],
  onSubmit,
  isSubmitting,
  submitLabel = "Save Product",
}: ProductFormProps) {
  const [media, setMedia] = useState<MediaItem[]>(initialMedia);
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    media: true,
    variants: false,
    seo: false,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      slug: "",
      status: "draft",
      featured: false,
      price: 0,
      variants: [],
      ...defaultValues,
    },
  });

  const { fields: variantFields, append, remove } = useFieldArray({
    control: form.control,
    name: "variants",
  });

  const nameValue = form.watch("name");

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  }

  function handleNameBlur() {
    const current = form.getValues("slug");
    if (!current) {
      form.setValue("slug", generateSlug(form.getValues("name")));
    }
  }

  function toggleSection(key: keyof typeof expandedSections) {
    setExpandedSections((s) => ({ ...s, [key]: !s[key] }));
  }

  async function handleFileUpload(files: FileList | null, type: "image" | "video") {
    if (!files || files.length === 0) return;

    const uploadPromises = Array.from(files).map(async (file) => {
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const tempItem: MediaItem = {
        url: URL.createObjectURL(file),
        is_primary: media.length === 0 && type === "image",
        type,
        uploading: true,
      };

      setMedia((prev) => [...prev, tempItem]);

      try {
        const ext = file.name.split(".").pop();
        const path = `${type}s/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const bucket = "products";

        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(path, file, { cacheControl: "3600", upsert: false });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(data.path);

        setMedia((prev) =>
          prev.map((m) =>
            m.url === tempItem.url
              ? { ...m, url: publicUrl, uploading: false }
              : m
          )
        );
      } catch {
        toast.error(`Failed to upload ${file.name}. Check your Supabase storage bucket.`);
        setMedia((prev) => prev.filter((m) => m.url !== tempItem.url));
      }
    });

    await Promise.all(uploadPromises);
  }

  function removeMedia(index: number) {
    setMedia((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (prev[index].is_primary && next.length > 0) {
        next[0].is_primary = true;
      }
      return next;
    });
  }

  function setPrimary(index: number) {
    setMedia((prev) =>
      prev.map((m, i) => ({ ...m, is_primary: i === index }))
    );
  }

  async function handleSubmit(values: ProductFormValues) {
    await onSubmit(values, media);
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      {/* Basic Info */}
      <Section
        title="Basic Information"
        icon={<Info size={15} />}
        expanded={expandedSections.basic}
        onToggle={() => toggleSection("basic")}
      >
        <div className="space-y-4">
          <Field label="Product Name" error={form.formState.errors.name?.message}>
            <Input
              {...form.register("name", { onBlur: handleNameBlur })}
              placeholder="e.g. Petal Hoop Earrings"
              className="h-10"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="URL Slug" error={form.formState.errors.slug?.message}>
              <Input
                {...form.register("slug")}
                placeholder="petal-hoop-earrings"
                className="h-10 font-mono text-sm"
              />
            </Field>
            <Field label="Material">
              <Input
                {...form.register("material")}
                placeholder="e.g. Gold-plated brass"
                className="h-10"
              />
            </Field>
          </div>

          <Field label="Short Description">
            <Textarea
              {...form.register("short_description")}
              placeholder="Brief description shown in product cards…"
              rows={2}
              className="resize-none"
            />
          </Field>

          <Field label="Full Description">
            <Textarea
              {...form.register("description")}
              placeholder="Detailed product description, care instructions, story…"
              rows={5}
              className="resize-none"
            />
          </Field>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Field label="Price (Rs)" error={form.formState.errors.price?.message}>
              <Input
                type="number"
                step="0.01"
                {...form.register("price")}
                className="h-10"
              />
            </Field>
            <Field label="Compare Price">
              <Input
                type="number"
                step="0.01"
                {...form.register("compare_price")}
                placeholder="0"
                className="h-10"
              />
            </Field>
            <Field label="SKU">
              <Input
                {...form.register("sku")}
                placeholder="ARQ-001"
                className="h-10"
              />
            </Field>
            <Field label="Weight (g)">
              <Input
                type="number"
                step="0.01"
                {...form.register("weight_grams")}
                placeholder="0"
                className="h-10"
              />
            </Field>
          </div>

          <div className="flex flex-wrap gap-6">
            <Field label="Status">
              <Select
                value={form.watch("status")}
                onValueChange={(v) =>
                  form.setValue("status", v as "draft" | "published" | "archived")
                }
              >
                <SelectTrigger className="h-10 w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <div className="flex items-center gap-3 pt-5">
              <Switch
                id="featured"
                checked={form.watch("featured")}
                onCheckedChange={(v) => form.setValue("featured", v)}
              />
              <Label htmlFor="featured" className="text-sm font-medium cursor-pointer">
                Featured product
              </Label>
            </div>
          </div>
        </div>
      </Section>

      {/* Media */}
      <Section
        title="Images & Videos"
        icon={<ImageIcon size={15} />}
        badge={media.length > 0 ? String(media.length) : undefined}
        expanded={expandedSections.media}
        onToggle={() => toggleSection("media")}
      >
        <div className="space-y-4">
          {/* Upload buttons */}
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files, "image")}
            />
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              multiple
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files, "video")}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-1.5 border-dashed border-violet-300 text-violet-600 hover:bg-violet-50 hover:border-violet-400"
            >
              <Upload size={14} /> Upload Images
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => videoInputRef.current?.click()}
              className="gap-1.5 border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400"
            >
              <Video size={14} /> Upload Videos
            </Button>
          </div>

          {/* Media grid */}
          {media.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {media.map((item, i) => (
                <div key={i} className="relative group">
                  <div
                    className={cn(
                      "aspect-square rounded-xl overflow-hidden bg-gray-100 border-2 transition-all",
                      item.is_primary && item.type === "image"
                        ? "border-violet-500 ring-2 ring-violet-200"
                        : "border-transparent"
                    )}
                  >
                    {item.uploading ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <Loader2 size={20} className="animate-spin text-gray-400" />
                      </div>
                    ) : item.type === "image" ? (
                      <img
                        src={item.url}
                        alt={item.alt ?? ""}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-900">
                        <Video size={24} className="text-white" />
                      </div>
                    )}
                  </div>

                  {/* Overlay actions */}
                  {!item.uploading && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
                      {item.type === "image" && !item.is_primary && (
                        <button
                          type="button"
                          onClick={() => setPrimary(i)}
                          title="Set as primary"
                          className="p-1.5 bg-amber-400 text-white rounded-lg hover:bg-amber-500"
                        >
                          <Star size={12} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeMedia(i)}
                        className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}

                  {item.is_primary && item.type === "image" && (
                    <div className="absolute bottom-1.5 left-1.5 bg-violet-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">
                      Primary
                    </div>
                  )}
                </div>
              ))}

              {/* Drop zone */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-violet-300 hover:bg-violet-50 transition-colors flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-violet-500"
              >
                <Plus size={20} />
                <span className="text-xs">Add more</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-200 hover:border-violet-300 rounded-xl p-10 flex flex-col items-center gap-3 text-gray-400 hover:text-violet-500 transition-colors"
            >
              <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center">
                <Upload size={20} />
              </div>
              <div className="text-center">
                <p className="font-medium text-sm">Drop images here</p>
                <p className="text-xs mt-0.5">or click to browse</p>
              </div>
            </button>
          )}
        </div>
      </Section>

      {/* Variants */}
      <Section
        title="Variants"
        icon={<Layers size={15} />}
        badge={variantFields.length > 0 ? String(variantFields.length) : undefined}
        expanded={expandedSections.variants}
        onToggle={() => toggleSection("variants")}
        hint="Add size, color or other options"
      >
        <div className="space-y-3">
          {variantFields.map((field, index) => (
            <div key={field.id} className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <GripVertical size={14} className="text-gray-300 cursor-grab" />
                <span className="text-xs font-medium text-gray-500">
                  Variant {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="ml-auto p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <Label className="text-xs text-gray-600 mb-1 block">Title *</Label>
                  <Input
                    {...form.register(`variants.${index}.title`)}
                    placeholder="e.g. Gold / Size 7"
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600 mb-1 block">SKU</Label>
                  <Input
                    {...form.register(`variants.${index}.sku`)}
                    placeholder="ARQ-001-G7"
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600 mb-1 block">Price Override</Label>
                  <Input
                    type="number"
                    {...form.register(`variants.${index}.price`)}
                    placeholder="Same as base"
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600 mb-1 block">Inventory</Label>
                  <Input
                    type="number"
                    {...form.register(`variants.${index}.inventory_quantity`)}
                    defaultValue={0}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <Switch
                    id={`available-${index}`}
                    checked={form.watch(`variants.${index}.available`)}
                    onCheckedChange={(v) =>
                      form.setValue(`variants.${index}.available`, v)
                    }
                  />
                  <Label htmlFor={`available-${index}`} className="text-xs cursor-pointer">
                    Available
                  </Label>
                </div>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({
                title: "",
                available: true,
                inventory_quantity: 0,
              })
            }
            className="gap-1.5 border-dashed text-gray-600 hover:text-violet-600 hover:border-violet-300"
          >
            <Plus size={14} /> Add Variant
          </Button>
        </div>
      </Section>

      {/* SEO */}
      <Section
        title="SEO"
        icon={<Tag size={15} />}
        expanded={expandedSections.seo}
        onToggle={() => toggleSection("seo")}
        hint="Optional — improves search ranking"
      >
        <div className="space-y-4">
          <Field label="SEO Title">
            <Input
              {...form.register("seo_title")}
              placeholder="Page title for search engines"
              className="h-10"
            />
          </Field>
          <Field label="SEO Description">
            <Textarea
              {...form.register("seo_description")}
              placeholder="150-160 character description for search results…"
              rows={3}
              className="resize-none"
            />
          </Field>
        </div>
      </Section>

      {/* Submit */}
      <div className="flex justify-end gap-3 pt-2 pb-6">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-violet-600 hover:bg-violet-700 text-white min-w-[120px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={14} className="mr-2 animate-spin" /> Saving…
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  );
}

function Section({
  title,
  icon,
  badge,
  hint,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  badge?: string;
  hint?: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="text-violet-600">{icon}</span>
        <span className="font-semibold text-sm text-gray-900">{title}</span>
        {badge && (
          <span className="ml-1 text-[10px] font-bold bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full">
            {badge}
          </span>
        )}
        {hint && (
          <span className="text-xs text-gray-400 hidden sm:inline">{hint}</span>
        )}
        <span className="ml-auto text-gray-400">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>
      {expanded && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="text-sm font-medium text-gray-700 mb-1.5 block">{label}</Label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
