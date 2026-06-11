import { useState, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Upload, Image as ImageIcon, Video, Trash2, Copy, Check,
  Loader2, Grid3X3, List, Search, X, ExternalLink,
} from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { listAllFiles, type MediaFile } from "@/components/admin/MediaPicker";

export const Route = createFileRoute("/admin/media")({
  component: MediaPage,
});

function MediaPage() {
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [typeFilter, setTypeFilter] = useState<"all" | "image" | "video">("all");
  const [selected, setSelected] = useState<MediaFile | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: files = [], isLoading } = useQuery({
    queryKey: ["media-library"],
    queryFn: async () => {
      const all = await listAllFiles();
      const seen = new Set<string>();
      return all.filter(f => {
        if (seen.has(f.url)) return false;
        seen.add(f.url);
        return true;
      });
    },
    staleTime: 30_000,
  });

  async function handleUpload(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    let success = 0;
    for (const file of Array.from(fileList)) {
      try {
        const ext = file.name.split(".").pop();
        const path = `library/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage
          .from("products")
          .upload(path, file, { cacheControl: "3600" });
        if (error) throw error;
        success++;
      } catch {
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    if (success > 0) {
      toast.success(`Uploaded ${success} file${success > 1 ? "s" : ""}`);
      qc.invalidateQueries({ queryKey: ["media-library"] });
    }
    setUploading(false);
  }

  async function deleteFile(file: MediaFile) {
    const { error } = await supabase.storage.from("products").remove([file.path]);
    if (error) {
      toast.error("Failed to delete");
      return;
    }
    if (selected?.path === file.path) setSelected(null);
    qc.invalidateQueries({ queryKey: ["media-library"] });
    toast.success("File deleted");
  }

  async function copyUrl(url: string) {
    await navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  }

  const filtered = files
    .filter(f => typeFilter === "all" || f.type === typeFilter)
    .filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  const imageCount = files.filter(f => f.type === "image").length;
  const videoCount = files.filter(f => f.type === "video").length;

  return (
    <div className="flex flex-col h-full">
      <AdminHeader
        title="Media Library"
        subtitle={`${imageCount} image${imageCount !== 1 ? "s" : ""} · ${videoCount} video${videoCount !== 1 ? "s" : ""}`}
        actions={
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={e => handleUpload(e.target.files)}
            />
            <Button
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5"
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              Upload
            </Button>
          </>
        }
      />

      <div className="flex flex-1 min-h-0">
        {/* Main panel */}
        <div className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Toolbar */}
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[180px]">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search files…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 h-9 bg-white border-gray-200 rounded-xl text-sm"
              />
            </div>

            <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1">
              {(["all", "image", "video"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize",
                    typeFilter === t
                      ? "bg-violet-600 text-white"
                      : "text-gray-500 hover:text-gray-900"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1">
              <button
                onClick={() => setView("grid")}
                className={cn("p-1.5 rounded-lg transition-colors", view === "grid" ? "bg-violet-600 text-white" : "text-gray-400 hover:text-gray-700")}
              >
                <Grid3X3 size={14} />
              </button>
              <button
                onClick={() => setView("list")}
                className={cn("p-1.5 rounded-lg transition-colors", view === "list" ? "bg-violet-600 text-white" : "text-gray-400 hover:text-gray-700")}
              >
                <List size={14} />
              </button>
            </div>
          </div>

          {/* Drop zone */}
          <div
            className="border-2 border-dashed border-gray-200 hover:border-violet-300 rounded-2xl p-5 text-center cursor-pointer transition-colors group"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleUpload(e.dataTransfer.files); }}
          >
            <div className="flex items-center justify-center gap-2 text-gray-400 group-hover:text-violet-500 transition-colors">
              <Upload size={16} />
              <p className="text-sm">Drag & drop or click to upload</p>
            </div>
          </div>

          {/* Files */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={22} className="animate-spin text-violet-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-14 text-gray-400">
              <ImageIcon size={36} className="mx-auto mb-3 text-gray-200" />
              <p className="text-sm">{search ? "No files match your search" : "No media files yet"}</p>
            </div>
          ) : view === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filtered.map(file => (
                <div
                  key={file.path}
                  className={cn(
                    "group relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all",
                    selected?.path === file.path
                      ? "border-violet-500 ring-2 ring-violet-200"
                      : "border-gray-100 hover:border-violet-300"
                  )}
                  onClick={() => setSelected(f => f?.path === file.path ? null : file)}
                >
                  <div className="aspect-square bg-gray-100">
                    {file.type === "image" ? (
                      <img src={file.url} alt={file.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-900">
                        <Video size={22} className="text-white/60" />
                      </div>
                    )}
                  </div>
                  {/* Quick actions on hover */}
                  <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={e => { e.stopPropagation(); copyUrl(file.url); }}
                      className="p-1 bg-white/90 text-gray-700 rounded-lg hover:bg-white shadow-sm"
                      title="Copy URL"
                    >
                      {copiedUrl === file.url ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); if (confirm(`Delete ${file.name}?`)) deleteFile(file); }}
                      className="p-1 bg-red-500 text-white rounded-lg hover:bg-red-600 shadow-sm"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <p className="mt-1 text-[10px] text-gray-400 truncate px-0.5 pb-1">{file.name}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
              {filtered.map(file => (
                <div
                  key={file.path}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer group transition-colors",
                    selected?.path === file.path && "bg-violet-50"
                  )}
                  onClick={() => setSelected(f => f?.path === file.path ? null : file)}
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                    {file.type === "image"
                      ? <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center bg-gray-900"><Video size={14} className="text-white" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                    <p className="text-xs text-gray-400 font-mono truncate">{file.path}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); copyUrl(file.url); }}>
                      {copiedUrl === file.url ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-red-500" onClick={e => { e.stopPropagation(); if (confirm(`Delete ${file.name}?`)) deleteFile(file); }}>
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail sidebar */}
        {selected && (
          <aside className="w-64 shrink-0 border-l border-gray-100 bg-white overflow-y-auto">
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">File Details</p>
                <button onClick={() => setSelected(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
                  <X size={14} />
                </button>
              </div>

              {/* Preview */}
              <div className="rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                {selected.type === "image"
                  ? <img src={selected.url} alt={selected.name} className="w-full aspect-square object-cover" />
                  : <div className="w-full aspect-square flex items-center justify-center bg-gray-900"><Video size={28} className="text-white/60" /></div>}
              </div>

              {/* Info */}
              <div className="space-y-2">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Filename</p>
                  <p className="text-xs text-gray-700 font-mono break-all">{selected.name}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Path</p>
                  <p className="text-xs text-gray-500 font-mono break-all">{selected.path}</p>
                </div>
                {selected.created_at && (
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Uploaded</p>
                    <p className="text-xs text-gray-600">{new Date(selected.created_at).toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5 text-xs h-8"
                  onClick={() => copyUrl(selected.url)}
                >
                  {copiedUrl === selected.url ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  {copiedUrl === selected.url ? "Copied!" : "Copy URL"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5 text-xs h-8"
                  onClick={() => window.open(selected.url, "_blank")}
                >
                  <ExternalLink size={12} />
                  Open in new tab
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5 text-xs h-8 text-red-500 hover:text-red-600 hover:border-red-200"
                  onClick={() => {
                    if (confirm(`Delete ${selected.name}?`)) deleteFile(selected);
                  }}
                >
                  <Trash2 size={12} />
                  Delete file
                </Button>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
