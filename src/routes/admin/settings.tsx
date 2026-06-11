import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Store,
  Share2,
  Phone,
  FileText,
  Save,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({
  component: SettingsPage,
});

type SettingsMap = Record<string, string | null>;

function SettingsPage() {
  const qc = useQueryClient();
  const [saving, setSaving] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    brand: true,
    social: true,
    contact: false,
    policy: false,
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*");
      if (error) throw error;
      const map: SettingsMap = {};
      for (const row of data ?? []) {
        const v = row.value;
        map[row.key] = typeof v === "string" ? v.replace(/^"|"$/g, "") : v === null ? null : String(v);
      }
      return map;
    },
    staleTime: 30_000,
  });

  async function saveGroup(group: string, keys: string[], values: SettingsMap) {
    setSaving(group);
    try {
      const upserts = keys.map((key) => ({
        key,
        value: JSON.stringify(values[key] ?? null) as unknown as never,
        type: "text",
        group,
        label: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      }));

      const { error } = await supabase
        .from("site_settings")
        .upsert(upserts, { onConflict: "key" });

      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["site-settings"] });
      toast.success("Settings saved");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(null);
    }
  }

  function toggle(key: string) {
    setExpanded((p) => ({ ...p, [key]: !p[key] }));
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 size={24} className="animate-spin text-violet-600" />
      </div>
    );
  }

  const s = settings ?? {};

  return (
    <div>
      <AdminHeader title="Settings" subtitle="Configure your store" />

      <div className="p-4 sm:p-6 space-y-4 max-w-3xl">
        {/* Brand */}
        <SettingsSection
          title="Brand"
          icon={<Store size={15} />}
          expanded={expanded.brand}
          onToggle={() => toggle("brand")}
        >
          <BrandSettings
            initial={s}
            onSave={(v) => saveGroup("brand", ["site_name", "tagline", "logo_url", "favicon_url"], v)}
            saving={saving === "brand"}
          />
        </SettingsSection>

        {/* Social */}
        <SettingsSection
          title="Social Media"
          icon={<Share2 size={15} />}
          expanded={expanded.social}
          onToggle={() => toggle("social")}
        >
          <SocialSettings
            initial={s}
            onSave={(v) =>
              saveGroup("social", ["instagram_url", "tiktok_url", "facebook_url", "whatsapp_number"], v)
            }
            saving={saving === "social"}
          />
        </SettingsSection>

        {/* Contact */}
        <SettingsSection
          title="Contact Info"
          icon={<Phone size={15} />}
          expanded={expanded.contact}
          onToggle={() => toggle("contact")}
        >
          <ContactSettings
            initial={s}
            onSave={(v) => saveGroup("contact", ["contact_email", "contact_phone"], v)}
            saving={saving === "contact"}
          />
        </SettingsSection>

        {/* Policies */}
        <SettingsSection
          title="Policies"
          icon={<FileText size={15} />}
          expanded={expanded.policy}
          onToggle={() => toggle("policy")}
        >
          <PolicySettings
            initial={s}
            onSave={(v) => saveGroup("policy", ["shipping_policy", "return_policy"], v)}
            saving={saving === "policy"}
          />
        </SettingsSection>

        {/* Supabase Info */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-sm font-semibold text-amber-800 mb-1">Supabase Setup Required</p>
          <p className="text-xs text-amber-700">
            Set <code className="bg-amber-100 px-1 rounded">VITE_SUPABASE_URL</code> and{" "}
            <code className="bg-amber-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> in your{" "}
            <code className="bg-amber-100 px-1 rounded">.env</code> file, then run{" "}
            <code className="bg-amber-100 px-1 rounded">supabase/schema.sql</code> in your Supabase SQL editor.
            Also create a storage bucket named <code className="bg-amber-100 px-1 rounded">products</code> (public).
          </p>
        </div>
      </div>
    </div>
  );
}

function BrandSettings({
  initial,
  onSave,
  saving,
}: {
  initial: SettingsMap;
  onSave: (v: SettingsMap) => void;
  saving: boolean;
}) {
  const [vals, setVals] = useState<SettingsMap>({
    site_name: initial.site_name ?? "",
    tagline: initial.tagline ?? "",
    logo_url: initial.logo_url ?? "",
    favicon_url: initial.favicon_url ?? "",
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SettingField label="Site Name">
          <Input value={vals.site_name ?? ""} onChange={(e) => setVals((p) => ({ ...p, site_name: e.target.value }))} placeholder="By Areeqaan" className="h-10" />
        </SettingField>
        <SettingField label="Tagline">
          <Input value={vals.tagline ?? ""} onChange={(e) => setVals((p) => ({ ...p, tagline: e.target.value }))} placeholder="Trendy · Minimal · Affordable Luxe" className="h-10" />
        </SettingField>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SettingField label="Logo URL">
          <Input value={vals.logo_url ?? ""} onChange={(e) => setVals((p) => ({ ...p, logo_url: e.target.value }))} placeholder="https://…" className="h-10" />
        </SettingField>
        <SettingField label="Favicon URL">
          <Input value={vals.favicon_url ?? ""} onChange={(e) => setVals((p) => ({ ...p, favicon_url: e.target.value }))} placeholder="https://…/favicon.ico" className="h-10" />
        </SettingField>
      </div>
      <SaveBtn saving={saving} onClick={() => onSave(vals)} />
    </div>
  );
}

function SocialSettings({
  initial,
  onSave,
  saving,
}: {
  initial: SettingsMap;
  onSave: (v: SettingsMap) => void;
  saving: boolean;
}) {
  const [vals, setVals] = useState<SettingsMap>({
    instagram_url: initial.instagram_url ?? "",
    tiktok_url: initial.tiktok_url ?? "",
    facebook_url: initial.facebook_url ?? "",
    whatsapp_number: initial.whatsapp_number ?? "",
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SettingField label="Instagram URL">
          <Input value={vals.instagram_url ?? ""} onChange={(e) => setVals((p) => ({ ...p, instagram_url: e.target.value }))} placeholder="https://instagram.com/…" className="h-10" />
        </SettingField>
        <SettingField label="TikTok URL">
          <Input value={vals.tiktok_url ?? ""} onChange={(e) => setVals((p) => ({ ...p, tiktok_url: e.target.value }))} placeholder="https://tiktok.com/@…" className="h-10" />
        </SettingField>
        <SettingField label="Facebook URL">
          <Input value={vals.facebook_url ?? ""} onChange={(e) => setVals((p) => ({ ...p, facebook_url: e.target.value }))} placeholder="https://facebook.com/…" className="h-10" />
        </SettingField>
        <SettingField label="WhatsApp Number">
          <Input value={vals.whatsapp_number ?? ""} onChange={(e) => setVals((p) => ({ ...p, whatsapp_number: e.target.value }))} placeholder="923364246604 (no +)" className="h-10" />
        </SettingField>
      </div>
      <SaveBtn saving={saving} onClick={() => onSave(vals)} />
    </div>
  );
}

function ContactSettings({
  initial,
  onSave,
  saving,
}: {
  initial: SettingsMap;
  onSave: (v: SettingsMap) => void;
  saving: boolean;
}) {
  const [vals, setVals] = useState<SettingsMap>({
    contact_email: initial.contact_email ?? "",
    contact_phone: initial.contact_phone ?? "",
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SettingField label="Contact Email">
          <Input value={vals.contact_email ?? ""} onChange={(e) => setVals((p) => ({ ...p, contact_email: e.target.value }))} placeholder="hello@byareeqaan.com" type="email" className="h-10" />
        </SettingField>
        <SettingField label="Contact Phone">
          <Input value={vals.contact_phone ?? ""} onChange={(e) => setVals((p) => ({ ...p, contact_phone: e.target.value }))} placeholder="+92 336 4246604" className="h-10" />
        </SettingField>
      </div>
      <SaveBtn saving={saving} onClick={() => onSave(vals)} />
    </div>
  );
}

function PolicySettings({
  initial,
  onSave,
  saving,
}: {
  initial: SettingsMap;
  onSave: (v: SettingsMap) => void;
  saving: boolean;
}) {
  const [vals, setVals] = useState<SettingsMap>({
    shipping_policy: initial.shipping_policy ?? "",
    return_policy: initial.return_policy ?? "",
  });

  return (
    <div className="space-y-4">
      <SettingField label="Shipping Policy">
        <Textarea value={vals.shipping_policy ?? ""} onChange={(e) => setVals((p) => ({ ...p, shipping_policy: e.target.value }))} placeholder="Delivery all over Pakistan…" rows={3} className="resize-none" />
      </SettingField>
      <SettingField label="Return Policy">
        <Textarea value={vals.return_policy ?? ""} onChange={(e) => setVals((p) => ({ ...p, return_policy: e.target.value }))} placeholder="Easy returns within 7 days…" rows={3} className="resize-none" />
      </SettingField>
      <SaveBtn saving={saving} onClick={() => onSave(vals)} />
    </div>
  );
}

function SettingsSection({
  title,
  icon,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  icon: React.ReactNode;
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
        <span className="ml-auto text-gray-400">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>
      {expanded && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

function SettingField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-sm font-medium text-gray-700 mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}

function SaveBtn({ saving, onClick }: { saving: boolean; onClick: () => void }) {
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
        Save
      </Button>
    </div>
  );
}
