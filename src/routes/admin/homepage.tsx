import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Globe,
  Megaphone,
  Image as ImageIcon,
  Star,
  BookOpen,
  Phone,
  Save,
  Loader2,
  Eye,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  GripVertical,
} from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/homepage")({
  component: HomepagePage,
});

interface SectionData {
  [key: string]: unknown;
}

function HomepagePage() {
  const qc = useQueryClient();
  const [saving, setSaving] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    announcement: true,
    hero: true,
    features: false,
    story: false,
    contact: false,
  });

  const { data: sections, isLoading } = useQuery({
    queryKey: ["homepage-sections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homepage_sections")
        .select("*")
        .order("section")
        .order("position");
      if (error) throw error;
      // Group by section
      const grouped: Record<string, Record<string, unknown>> = {};
      for (const row of data ?? []) {
        if (!grouped[row.section]) grouped[row.section] = {};
        grouped[row.section][row.key] = row.value;
      }
      return grouped;
    },
    staleTime: 10_000,
  });

  async function saveSection(section: string, updates: Record<string, unknown>) {
    setSaving(section);
    try {
      const upserts = Object.entries(updates).map(([key, value]) => ({
        section,
        key,
        value: value as never,
        type: typeof value === "boolean" ? "boolean" : Array.isArray(value) ? "json" : "text",
        position: 0,
      }));

      const { error } = await supabase
        .from("homepage_sections")
        .upsert(upserts, { onConflict: "section,key" });

      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["homepage-sections"] });
      toast.success(`${section.charAt(0).toUpperCase() + section.slice(1)} section saved`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(null);
    }
  }

  function toggle(section: string) {
    setExpanded((p) => ({ ...p, [section]: !p[section] }));
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 size={24} className="animate-spin text-violet-600" />
      </div>
    );
  }

  const data = sections ?? {};

  return (
    <div>
      <AdminHeader
        title="Homepage Editor"
        subtitle="Edit all sections of your storefront"
        actions={
          <a href="/" target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm" className="gap-1.5 text-gray-600">
              <Eye size={14} /> Preview
            </Button>
          </a>
        }
      />

      <div className="p-4 sm:p-6 space-y-4 max-w-3xl">
        {/* Announcement Banner */}
        <SectionCard
          title="Announcement Banner"
          icon={<Megaphone size={15} />}
          expanded={expanded.announcement}
          onToggle={() => toggle("announcement")}
        >
          <AnnouncementEditor
            data={data.announcement ?? {}}
            onSave={(d) => saveSection("announcement", d)}
            saving={saving === "announcement"}
          />
        </SectionCard>

        {/* Hero */}
        <SectionCard
          title="Hero Section"
          icon={<ImageIcon size={15} />}
          expanded={expanded.hero}
          onToggle={() => toggle("hero")}
        >
          <HeroEditor
            data={data.hero ?? {}}
            onSave={(d) => saveSection("hero", d)}
            saving={saving === "hero"}
          />
        </SectionCard>

        {/* Features */}
        <SectionCard
          title="Features Strip"
          icon={<Star size={15} />}
          expanded={expanded.features}
          onToggle={() => toggle("features")}
          hint="4 feature highlights below hero"
        >
          <FeaturesEditor
            data={data.features ?? {}}
            onSave={(d) => saveSection("features", d)}
            saving={saving === "features"}
          />
        </SectionCard>

        {/* Story */}
        <SectionCard
          title="Brand Story"
          icon={<BookOpen size={15} />}
          expanded={expanded.story}
          onToggle={() => toggle("story")}
        >
          <StoryEditor
            data={data.story ?? {}}
            onSave={(d) => saveSection("story", d)}
            saving={saving === "story"}
          />
        </SectionCard>

        {/* Contact */}
        <SectionCard
          title="Contact Section"
          icon={<Phone size={15} />}
          expanded={expanded.contact}
          onToggle={() => toggle("contact")}
        >
          <ContactEditor
            data={data.contact ?? {}}
            onSave={(d) => saveSection("contact", d)}
            saving={saving === "contact"}
          />
        </SectionCard>
      </div>
    </div>
  );
}

// ─── Sub-editors ─────────────────────────────────────────────

function AnnouncementEditor({
  data,
  onSave,
  saving,
}: {
  data: SectionData;
  onSave: (d: SectionData) => void;
  saving: boolean;
}) {
  const [text, setText] = useState(String(data.text ?? ""));
  const [enabled, setEnabled] = useState(Boolean(data.enabled ?? true));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-medium">Show banner</Label>
          <p className="text-xs text-gray-400">Display the announcement bar at the top</p>
        </div>
        <Switch checked={enabled} onCheckedChange={setEnabled} />
      </div>
      <div>
        <Label className="text-sm font-medium mb-1.5 block">Banner Text</Label>
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="✦ New arrivals every week ✦"
          className="h-10"
        />
        <p className="text-xs text-gray-400 mt-1">Use ✦ or · as separators between messages</p>
      </div>
      <SaveButton onClick={() => onSave({ text, enabled })} saving={saving} />
    </div>
  );
}

function HeroEditor({
  data,
  onSave,
  saving,
}: {
  data: SectionData;
  onSave: (d: SectionData) => void;
  saving: boolean;
}) {
  const [title, setTitle] = useState(String(data.title ?? ""));
  const [subtitle, setSubtitle] = useState(String(data.subtitle ?? ""));
  const [description, setDescription] = useState(String(data.description ?? ""));
  const [ctaText, setCtaText] = useState(String(data.cta_text ?? ""));
  const [ctaLink, setCtaLink] = useState(String(data.cta_link ?? ""));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium mb-1.5 block">Headline (line 1)</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tiny details." className="h-10" />
        </div>
        <div>
          <Label className="text-sm font-medium mb-1.5 block">Headline (line 2)</Label>
          <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Big statements." className="h-10" />
        </div>
      </div>
      <div>
        <Label className="text-sm font-medium mb-1.5 block">Tagline / Subheading</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Trendy · Minimal · Affordable Luxe" className="h-10" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium mb-1.5 block">CTA Button Text</Label>
          <Input value={ctaText} onChange={(e) => setCtaText(e.target.value)} placeholder="Shop the Edit" className="h-10" />
        </div>
        <div>
          <Label className="text-sm font-medium mb-1.5 block">CTA Button Link</Label>
          <Input value={ctaLink} onChange={(e) => setCtaLink(e.target.value)} placeholder="#products" className="h-10" />
        </div>
      </div>
      <SaveButton onClick={() => onSave({ title, subtitle, description, cta_text: ctaText, cta_link: ctaLink })} saving={saving} />
    </div>
  );
}

function FeaturesEditor({
  data,
  onSave,
  saving,
}: {
  data: SectionData;
  onSave: (d: SectionData) => void;
  saving: boolean;
}) {
  const raw = data.items;
  const initial: Array<{ label: string; text: string }> =
    Array.isArray(raw) ? (raw as Array<{ label: string; text: string }>) : [];
  const [items, setItems] = useState(
    initial.length > 0 ? initial : [{ label: "", text: "" }]
  );

  function update(i: number, field: "label" | "text", value: string) {
    setItems((prev) => prev.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)));
  }

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2 bg-gray-50 rounded-xl p-3">
          <GripVertical size={14} className="text-gray-300 mt-2.5 cursor-grab shrink-0" />
          <div className="flex-1 grid grid-cols-2 gap-2">
            <Input
              value={item.label}
              onChange={(e) => update(i, "label", e.target.value)}
              placeholder="Label (e.g. Shipping)"
              className="h-8 text-sm"
            />
            <Input
              value={item.text}
              onChange={(e) => update(i, "text", e.target.value)}
              placeholder="Text (e.g. All over Pakistan)"
              className="h-8 text-sm"
            />
          </div>
          <button
            onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}
            className="p-1.5 text-gray-300 hover:text-red-400 mt-0.5 shrink-0"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setItems((prev) => [...prev, { label: "", text: "" }])}
        className="gap-1.5 border-dashed text-gray-500 hover:text-violet-600"
      >
        <Plus size={13} /> Add Feature
      </Button>
      <SaveButton onClick={() => onSave({ items })} saving={saving} />
    </div>
  );
}

function StoryEditor({
  data,
  onSave,
  saving,
}: {
  data: SectionData;
  onSave: (d: SectionData) => void;
  saving: boolean;
}) {
  const [title, setTitle] = useState(String(data.title ?? ""));
  const [content, setContent] = useState(String(data.content ?? ""));

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium mb-1.5 block">Section Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Our Story" className="h-10" />
      </div>
      <div>
        <Label className="text-sm font-medium mb-1.5 block">Story Content</Label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Your brand story…"
          rows={4}
          className="resize-none"
        />
      </div>
      <SaveButton onClick={() => onSave({ title, content })} saving={saving} />
    </div>
  );
}

function ContactEditor({
  data,
  onSave,
  saving,
}: {
  data: SectionData;
  onSave: (d: SectionData) => void;
  saving: boolean;
}) {
  const [title, setTitle] = useState(String(data.title ?? ""));
  const [content, setContent] = useState(String(data.content ?? ""));

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium mb-1.5 block">Section Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Get in Touch" className="h-10" />
      </div>
      <div>
        <Label className="text-sm font-medium mb-1.5 block">Contact Message</Label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Reach out on WhatsApp or Instagram…"
          rows={3}
          className="resize-none"
        />
      </div>
      <SaveButton onClick={() => onSave({ title, content })} saving={saving} />
    </div>
  );
}

// ─── Shared components ────────────────────────────────────────

function SectionCard({
  title,
  icon,
  hint,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  icon: React.ReactNode;
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
        {hint && <span className="text-xs text-gray-400 hidden sm:inline">{hint}</span>}
        <span className="ml-auto text-gray-400">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>
      {expanded && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

function SaveButton({ onClick, saving }: { onClick: () => void; saving: boolean }) {
  return (
    <div className="flex justify-end pt-2">
      <Button
        type="button"
        onClick={onClick}
        disabled={saving}
        className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
        size="sm"
      >
        {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
        Save Section
      </Button>
    </div>
  );
}
