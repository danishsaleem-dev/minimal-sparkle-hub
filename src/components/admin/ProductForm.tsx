import { useState, useRef, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Upload, X, Plus, Trash2, GripVertical,
  Image as ImageIcon, Video, Tag, Layers, Info,
  ChevronDown, ChevronUp, Star, Loader2,
  Globe, FolderOpen, Eye, EyeOff, Archive,
  CheckSquare, Square, Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  price: z.coerce.number().min(0),
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

export interface Collection {
  id: string;
  name: string;
  slug: string;
}

interface ProductFormProps {
  defaultValues?: Partial<ProductFormValues>;
  mediaItems?: MediaItem[];
  selectedCollectionIds?: string[];
  onSubmit: (values: ProductFormValues, media: MediaItem[], collectionIds: string[]) => Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
}

function generateSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
}

export function ProductForm({
  defaultValues,
  mediaItems: initialMedia = [],
  selectedCollectionIds: initialCollectionIds = [],
  onSubmit,
  isSubmitting,
  submitLabel = "Save Product",
}: ProductFormProps) {
  const qc = useQueryClient();
  const [media, setMedia] = useState<MediaItem[]>(initialMedia);
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>(initialCollectionIds);
  const [collectionSearch, setCollectionSearch] = useState("");
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [creatingCollection, setCreatingCollection] = useState(false);
  const [expandedSections, setExpandedSections] = useState({ basic: true, media: true, variants: false, seo: false });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const { data: collections = [] } = useQuery<Collection[]>({
    queryKey: ["admin-collections-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("collections").select("id, name, slug").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: "", slug: "", status: "draft", featured: false, price: 0, variants: [], ...defaultValues },
  });

  const { fields: variantFields, append, remove } = useFieldArray({ control: form.control, name: "variants" });

  const nameValue = form.watch("name");
  const shortDescValue = form.watch("short_description");
  const materialValue = form.watch("material");
  const statusValue = form.watch("status");
  const featuredValue = form.watch("featured");
  const seoDescValue = form.watch("seo_description") ?? "";

  function buildSeoTitle(name: string, material?: string) {
    const mat = material?.trim();
    return mat
      ? `${name} – ${mat} | By Areeqaan`
      : `${name} | By Areeqaan – Trendy Minimal Jewelry`;
  }

  function buildSeoDescription(name: string, shortDesc?: string, material?: string) {
    const parts: string[] = [];
    parts.push(`Shop ${name} at By Areeqaan.`);
    if (shortDesc?.trim()) parts.push(shortDesc.trim().replace(/[.!?]$/, "") + ".");
    if (material?.trim()) parts.push(`Made from ${material.trim()}.`);
    parts.push("Delivery all over Pakistan.");
    return parts.join(" ").slice(0, 160);
  }

  function autoFillSeo() {
    const name = form.getValues("name");
    const short = form.getValues("short_description");
    const mat = form.getValues("material");
    if (name) {
      form.setValue("seo_title", buildSeoTitle(name, mat));
      form.setValue("seo_description", buildSeoDescription(name, short, mat));
    }
  }

  useEffect(() => {
    if (!nameValue) return;
    if (!form.getValues("seo_title")) form.setValue("seo_title", buildSeoTitle(nameValue, form.getValues("material")));
  }, [nameValue]);

  useEffect(() => {
    if (!shortDescValue && !nameValue) return;
    if (!form.getValues("seo_description"))
      form.setValue("seo_description", buildSeoDescription(form.getValues("name"), shortDescValue, form.getValues("material")));
  }, [shortDescValue]);

  function handleNameBlur() {
    if (!form.getValues("slug")) form.setValue("slug", generateSlug(form.getValues("name")));
  }

  function toggleSection(key: keyof typeof expandedSections) {
    setExpandedSections((s) => ({ ...s, [key]: !s[key] }));
  }

  function toggleCollection(id: string) {
    setSelectedCollectionIds((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);
  }

  async function handleCreateCollection() {
    const name = newCollectionName.trim();
    if (!name) return;
    setCreatingCollection(true);
    try {
      const slug = generateSlug(name);
      const { data, error } = await supabase.from("collections").insert({ name, slug }).select().single();
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["admin-collections-list"] });
      setSelectedCollectionIds((prev) => [...prev, data.id]);
      setNewCollectionName("");
      setShowNewCollection(false);
      toast.success(`Collection "${name}" created`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to create collection");
    } finally {
      setCreatingCollection(false);
    }
  }

  async function handleFileUpload(files: FileList | null, type: "image" | "video") {
    if (!files || files.length === 0) return;
    await Promise.all(Array.from(files).map(async (file) => {
      const tempItem: MediaItem = { url: URL.createObjectURL(file), is_primary: media.length === 0 && type === "image", type, uploading: true };
      setMedia((prev) => [...prev, tempItem]);
      try {
        const ext = file.name.split(".").pop();
        const path = `${type}s/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { data, error } = await supabase.storage.from("products").upload(path, file, { cacheControl: "3600", upsert: false });
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from("products").getPublicUrl(data.path);
        setMedia((prev) => prev.map((m) => m.url === tempItem.url ? { ...m, url: publicUrl, uploading: false } : m));
      } catch {
        toast.error(`Failed to upload ${file.name}`);
        setMedia((prev) => prev.filter((m) => m.url !== tempItem.url));
      }
    }));
  }

  function removeMedia(index: number) {
    setMedia((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (prev[index].is_primary && next.length > 0) next[0].is_primary = true;
      return next;
    });
  }

  function setPrimary(index: number) {
    setMedia((prev) => prev.map((m, i) => ({ ...m, is_primary: i === index })));
  }

  const filteredCollections = collections.filter((c) =>
    c.name.toLowerCase().includes(collectionSearch.toLowerCase())
  );

  const statusConfig = {
    published: { label: "Published", icon: <Eye size={12} />, active: "text-emerald-700 bg-emerald-50 border-emerald-200 font-semibold", inactive: "text-gray-400 hover:bg-gray-50 border-transparent" },
    draft: { label: "Draft", icon: <EyeOff size={12} />, active: "text-gray-700 bg-gray-100 border-gray-200 font-semibold", inactive: "text-gray-400 hover:bg-gray-50 border-transparent" },
    archived: { label: "Archived", icon: <Archive size={12} />, active: "text-amber-700 bg-amber-50 border-amber-200 font-semibold", inactive: "text-gray-400 hover:bg-gray-50 border-transparent" },
  };

  return (
    <form onSubmit={form.handleSubmit((v) => onSubmit(v, media, selectedCollectionIds))}>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-4 items-start">

        {/* ── LEFT ── */}
        <div className="space-y-3">

          <Section title="Basic Information" icon={<Info size={14} />} expanded={expandedSections.basic} onToggle={() => toggleSection("basic")}>
            <div className="space-y-3">
              <Field label="Product Name" error={form.formState.errors.name?.message}>
                <Input {...form.register("name", { onBlur: handleNameBlur })} placeholder="e.g. Petal Hoop Earrings" className="h-9" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Material">
                  <Input {...form.register("material")} placeholder="e.g. Gold-plated brass" className="h-9" />
                </Field>
                <Field label="SKU">
                  <Input {...form.register("sku")} placeholder="ARQ-001" className="h-9" />
                </Field>
              </div>
              <Field label="Short Description">
                <Textarea {...form.register("short_description")} placeholder="Brief description shown in product cards…" rows={2} className="resize-none text-sm" />
              </Field>
              <Field label="Full Description">
                <Textarea {...form.register("description")} placeholder="Detailed description, care instructions, story…" rows={4} className="resize-none text-sm" />
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Price (Rs)" error={form.formState.errors.price?.message}>
                  <Input type="number" step="0.01" {...form.register("price")} className="h-9" />
                </Field>
                <Field label="Compare Price">
                  <Input type="number" step="0.01" {...form.register("compare_price")} placeholder="0" className="h-9" />
                </Field>
                <Field label="Weight (g)">
                  <Input type="number" step="0.01" {...form.register("weight_grams")} placeholder="0" className="h-9" />
                </Field>
              </div>
            </div>
          </Section>

          <Section title="Images & Videos" icon={<ImageIcon size={14} />} badge={media.length > 0 ? String(media.length) : undefined} expanded={expandedSections.media} onToggle={() => toggleSection("media")}>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFileUpload(e.target.files, "image")} />
                <input ref={videoInputRef} type="file" accept="video/*" multiple className="hidden" onChange={(e) => handleFileUpload(e.target.files, "video")} />
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}
                  className="gap-1.5 border-dashed border-violet-300 text-violet-600 hover:bg-violet-50 text-xs h-8">
                  <Upload size={13} /> Images
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => videoInputRef.current?.click()}
                  className="gap-1.5 border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 text-xs h-8">
                  <Video size={13} /> Videos
                </Button>
              </div>
              {media.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
                  {media.map((item, i) => (
                    <div key={i} className="relative group">
                      <div className={cn("aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 transition-all",
                        item.is_primary && item.type === "image" ? "border-violet-500 ring-1 ring-violet-200" : "border-transparent")}>
                        {item.uploading ? (
                          <div className="w-full h-full flex items-center justify-center"><Loader2 size={16} className="animate-spin text-gray-400" /></div>
                        ) : item.type === "image" ? (
                          <img src={item.url} alt={item.alt ?? ""} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-900"><Video size={18} className="text-white" /></div>
                        )}
                      </div>
                      {!item.uploading && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1.5">
                          {item.type === "image" && !item.is_primary && (
                            <button type="button" onClick={() => setPrimary(i)} className="p-1 bg-amber-400 text-white rounded hover:bg-amber-500"><Star size={10} /></button>
                          )}
                          <button type="button" onClick={() => removeMedia(i)} className="p-1 bg-red-500 text-white rounded hover:bg-red-600"><X size={10} /></button>
                        </div>
                      )}
                      {item.is_primary && item.type === "image" && (
                        <div className="absolute bottom-1 left-1 bg-violet-600 text-white text-[8px] font-bold px-1 py-0.5 rounded uppercase">Primary</div>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-lg border-2 border-dashed border-gray-200 hover:border-violet-300 hover:bg-violet-50 transition-colors flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-violet-500">
                    <Plus size={16} /><span className="text-[10px]">Add</span>
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-200 hover:border-violet-300 rounded-xl p-8 flex flex-col items-center gap-2 text-gray-400 hover:text-violet-500 transition-colors">
                  <Upload size={18} />
                  <span className="text-sm font-medium">Drop images or click to browse</span>
                </button>
              )}
            </div>
          </Section>

          <Section title="Variants" icon={<Layers size={14} />} badge={variantFields.length > 0 ? String(variantFields.length) : undefined} expanded={expandedSections.variants} onToggle={() => toggleSection("variants")} hint="Size, color…">
            <div className="space-y-2">
              {variantFields.map((field, index) => (
                <div key={field.id} className="bg-gray-50 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <GripVertical size={12} className="text-gray-300 cursor-grab" />
                    <span className="text-xs font-medium text-gray-500">Variant {index + 1}</span>
                    <button type="button" onClick={() => remove(index)} className="ml-auto p-1 text-gray-400 hover:text-red-500"><Trash2 size={12} /></button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div className="col-span-2 sm:col-span-1">
                      <Label className="text-[11px] text-gray-500 mb-1 block">Title *</Label>
                      <Input {...form.register(`variants.${index}.title`)} placeholder="Gold / Size 7" className="h-7 text-xs" />
                    </div>
                    <div>
                      <Label className="text-[11px] text-gray-500 mb-1 block">SKU</Label>
                      <Input {...form.register(`variants.${index}.sku`)} placeholder="ARQ-001-G7" className="h-7 text-xs" />
                    </div>
                    <div>
                      <Label className="text-[11px] text-gray-500 mb-1 block">Price Override</Label>
                      <Input type="number" {...form.register(`variants.${index}.price`)} placeholder="Base" className="h-7 text-xs" />
                    </div>
                    <div>
                      <Label className="text-[11px] text-gray-500 mb-1 block">Inventory</Label>
                      <Input type="number" {...form.register(`variants.${index}.inventory_quantity`)} defaultValue={0} className="h-7 text-xs" />
                    </div>
                    <div className="flex items-center gap-2 pt-4">
                      <Switch id={`available-${index}`} checked={form.watch(`variants.${index}.available`)}
                        onCheckedChange={(v) => form.setValue(`variants.${index}.available`, v)} />
                      <Label htmlFor={`available-${index}`} className="text-xs cursor-pointer">Available</Label>
                    </div>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => append({ title: "", available: true, inventory_quantity: 0 })}
                className="gap-1.5 border-dashed text-gray-600 hover:text-violet-600 hover:border-violet-300 h-8 text-xs">
                <Plus size={12} /> Add Variant
              </Button>
            </div>
          </Section>

          <Section title="SEO" icon={<Tag size={14} />} expanded={expandedSections.seo} onToggle={() => toggleSection("seo")} hint="Optional">
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] text-gray-400">Auto-generated from product details</p>
                <button type="button" onClick={autoFillSeo}
                  className="text-[11px] text-violet-600 hover:text-violet-800 font-medium underline">
                  Regenerate
                </button>
              </div>
              <Field label="SEO Title">
                <Input {...form.register("seo_title")} placeholder="Product Name – Material | By Areeqaan" className="h-9" />
                <p className="text-[11px] text-gray-400 mt-1">
                  {(form.watch("seo_title") ?? "").length}/60 chars
                  {(form.watch("seo_title") ?? "").length > 60 && <span className="text-amber-500 ml-1">— too long, trim to 60</span>}
                </p>
              </Field>
              <Field label="SEO Description">
                <Textarea {...form.register("seo_description")} placeholder="Shop [product] at By Areeqaan…" rows={3} className="resize-none text-sm" />
                <p className={cn("text-[11px] mt-1", seoDescValue.length > 160 ? "text-red-500" : seoDescValue.length >= 140 ? "text-emerald-600" : "text-gray-400")}>
                  {seoDescValue.length}/160 chars
                  {seoDescValue.length > 160 && " — over limit"}
                  {seoDescValue.length >= 140 && seoDescValue.length <= 160 && " — ideal"}
                </p>
              </Field>
            </div>
          </Section>
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div className="space-y-3 lg:sticky lg:top-[68px]">

          {/* Publish */}
          <SideCard title="Publish" icon={<Eye size={13} />}>
            <div className="space-y-3">
              <div>
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1.5">Status</p>
                <div className="flex flex-col gap-1">
                  {(["published", "draft", "archived"] as const).map((s) => {
                    const cfg = statusConfig[s];
                    const active = statusValue === s;
                    return (
                      <button key={s} type="button" onClick={() => form.setValue("status", s)}
                        className={cn("flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-sm transition-all", active ? cfg.active : cfg.inactive)}>
                        {cfg.icon}{cfg.label}
                        {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-current opacity-70" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between py-0.5 border-t border-gray-50 pt-2">
                <div>
                  <p className="text-sm font-medium text-gray-800">Featured</p>
                  <p className="text-[11px] text-gray-400">Show on homepage</p>
                </div>
                <Switch checked={featuredValue} onCheckedChange={(v) => form.setValue("featured", v)} />
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full bg-violet-600 hover:bg-violet-700 text-white h-9 text-sm">
                {isSubmitting ? <><Loader2 size={13} className="mr-1.5 animate-spin" />Saving…</> : submitLabel}
              </Button>
            </div>
          </SideCard>

          {/* URL Slug */}
          <SideCard title="URL Slug" icon={<Globe size={13} />}>
            <p className="text-[11px] text-gray-400 mb-1">/products/</p>
            <Input {...form.register("slug")} placeholder="product-slug" className="h-9 font-mono text-sm" />
            {form.formState.errors.slug && <p className="text-[11px] text-red-500 mt-1">{form.formState.errors.slug.message}</p>}
            <button type="button" onClick={() => form.setValue("slug", generateSlug(form.getValues("name")))}
              className="text-[11px] text-violet-500 hover:text-violet-700 mt-1.5 underline block">
              Re-generate from name
            </button>
          </SideCard>

          {/* Collections */}
          <SideCard title="Collections" icon={<FolderOpen size={13} />} badge={selectedCollectionIds.length > 0 ? String(selectedCollectionIds.length) : undefined}>
            <div className="space-y-2">
              {/* Search */}
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  value={collectionSearch}
                  onChange={(e) => setCollectionSearch(e.target.value)}
                  placeholder="Search collections…"
                  className="h-8 pl-7 text-xs"
                />
              </div>

              {/* List */}
              <div className="space-y-0.5 max-h-44 overflow-y-auto">
                {filteredCollections.length === 0 && !collectionSearch ? (
                  <p className="text-xs text-gray-400 text-center py-2">No collections yet</p>
                ) : filteredCollections.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-2">No match for "{collectionSearch}"</p>
                ) : filteredCollections.map((col) => {
                  const selected = selectedCollectionIds.includes(col.id);
                  return (
                    <button key={col.id} type="button" onClick={() => toggleCollection(col.id)}
                      className={cn("w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-all text-left",
                        selected ? "bg-violet-50 text-violet-700 font-medium" : "text-gray-600 hover:bg-gray-50")}>
                      {selected ? <CheckSquare size={12} className="text-violet-600 shrink-0" /> : <Square size={12} className="text-gray-300 shrink-0" />}
                      <span className="truncate">{col.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Create new */}
              <div className="border-t border-gray-50 pt-2">
                {!showNewCollection ? (
                  <button type="button" onClick={() => setShowNewCollection(true)}
                    className="w-full flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-800 font-medium py-1">
                    <Plus size={12} /> New collection
                  </button>
                ) : (
                  <div className="space-y-1.5">
                    <Input
                      value={newCollectionName}
                      onChange={(e) => setNewCollectionName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleCreateCollection())}
                      placeholder="Collection name"
                      className="h-8 text-xs"
                      autoFocus
                    />
                    <div className="flex gap-1.5">
                      <Button type="button" size="sm" disabled={creatingCollection || !newCollectionName.trim()}
                        onClick={handleCreateCollection}
                        className="flex-1 h-7 text-xs bg-violet-600 hover:bg-violet-700 text-white">
                        {creatingCollection ? <Loader2 size={11} className="animate-spin" /> : "Create"}
                      </Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => { setShowNewCollection(false); setNewCollectionName(""); }}
                        className="h-7 text-xs text-gray-500">
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </SideCard>
        </div>
      </div>
    </form>
  );
}

function SideCard({ title, icon, badge, children }: { title: string; icon: React.ReactNode; badge?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-50">
        <span className="text-violet-600">{icon}</span>
        <span className="font-semibold text-sm text-gray-900">{title}</span>
        {badge && <span className="ml-auto text-[10px] font-bold bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full">{badge}</span>}
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

function Section({ title, icon, badge, hint, expanded, onToggle, children }: {
  title: string; icon: React.ReactNode; badge?: string; hint?: string;
  expanded: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button type="button" onClick={onToggle}
        className="w-full flex items-center gap-2.5 px-4 py-3 text-left hover:bg-gray-50 transition-colors">
        <span className="text-violet-600">{icon}</span>
        <span className="font-semibold text-sm text-gray-900">{title}</span>
        {badge && <span className="text-[10px] font-bold bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full">{badge}</span>}
        {hint && <span className="text-xs text-gray-400 hidden sm:inline">{hint}</span>}
        <span className="ml-auto text-gray-400">{expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</span>
      </button>
      {expanded && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs font-medium text-gray-600 mb-1.5 block">{label}</Label>
      {children}
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}
