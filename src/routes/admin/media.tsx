import { useState, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Upload,
  Image as ImageIcon,
  Video,
  Trash2,
  Copy,
  Check,
  Loader2,
  Grid3X3,
  List,
  Search,
} from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/media")({
  component: MediaPage,
});

interface MediaFile {
  name: string;
  url: string;
  type: "image" | "video";
  size?: number;
  created_at?: string;
}

function MediaPage() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<"all" | "image" | "video">("all");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  async function loadFiles() {
    try {
      const { data, error } = await supabase.storage.from("products").list("", {
        sortBy: { column: "created_at", order: "desc" },
        limit: 100,
      });
      if (error) throw error;
      const mapped: MediaFile[] = (data ?? [])
        .filter((f) => f.name !== ".emptyFolderPlaceholder")
        .map((f) => {
          const isVideo = /\.(mp4|mov|avi|webm)$/i.test(f.name);
          const { data: { publicUrl } } = supabase.storage
            .from("products")
            .getPublicUrl(f.name);
          return {
            name: f.name,
            url: publicUrl,
            type: isVideo ? "video" : "image",
            size: f.metadata?.size,
            created_at: f.created_at,
          };
        });
      setFiles(mapped);
    } catch {
      toast.error("Could not load media. Check your Supabase storage bucket.");
    }
    setIsLoaded(true);
  }

  // Load on first render
  if (!isLoaded) {
    loadFiles();
  }

  async function handleUpload(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    let success = 0;
    for (const file of Array.from(fileList)) {
      try {
        const ext = file.name.split(".").pop();
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
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
      setIsLoaded(false);
    }
    setUploading(false);
  }

  async function deleteFile(name: string) {
    const { error } = await supabase.storage.from("products").remove([name]);
    if (error) {
      toast.error("Failed to delete");
      return;
    }
    setFiles((prev) => prev.filter((f) => f.name !== name));
    toast.success("File deleted");
  }

  async function copyUrl(url: string) {
    await navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  }

  const filtered = files
    .filter((f) => typeFilter === "all" || f.type === typeFilter)
    .filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <AdminHeader
        title="Media Library"
        subtitle={`${files.length} files`}
        actions={
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={(e) => handleUpload(e.target.files)}
            />
            <Button
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5"
            >
              {uploading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Upload size={14} />
              )}
              Upload
            </Button>
          </>
        }
      />

      <div className="p-4 sm:p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search files…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 bg-white border-gray-200 rounded-xl"
            />
          </div>

          <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1">
            {(["all", "image", "video"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                  typeFilter === t
                    ? "bg-violet-600 text-white"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1">
            <button
              onClick={() => setView("grid")}
              className={`p-1.5 rounded-lg transition-colors ${
                view === "grid" ? "bg-violet-600 text-white" : "text-gray-400 hover:text-gray-700"
              }`}
            >
              <Grid3X3 size={14} />
            </button>
            <button
              onClick={() => setView("list")}
              className={`p-1.5 rounded-lg transition-colors ${
                view === "list" ? "bg-violet-600 text-white" : "text-gray-400 hover:text-gray-700"
              }`}
            >
              <List size={14} />
            </button>
          </div>
        </div>

        {/* Upload drop zone */}
        <div
          className="border-2 border-dashed border-gray-200 hover:border-violet-300 rounded-2xl p-6 text-center cursor-pointer transition-colors group"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleUpload(e.dataTransfer.files);
          }}
        >
          <div className="flex items-center justify-center gap-3 text-gray-400 group-hover:text-violet-500 transition-colors">
            <Upload size={18} />
            <p className="text-sm">Drag & drop files here, or click to upload</p>
          </div>
        </div>

        {/* Media Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <ImageIcon size={40} className="mx-auto mb-3 text-gray-200" />
            <p className="text-sm">No media files found</p>
            {!isLoaded && <p className="text-xs mt-1 text-gray-300">Requires Supabase storage bucket "products"</p>}
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filtered.map((file) => (
              <div key={file.name} className="group relative">
                <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-100">
                  {file.type === "image" ? (
                    <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-900">
                      <Video size={24} className="text-white" />
                    </div>
                  )}
                </div>
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
                  <button
                    onClick={() => copyUrl(file.url)}
                    className="p-1.5 bg-white/90 text-gray-700 rounded-lg hover:bg-white text-xs font-medium"
                    title="Copy URL"
                  >
                    {copiedUrl === file.url ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete ${file.name}?`)) deleteFile(file.name);
                    }}
                    className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-gray-400 truncate px-1">{file.name}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
            {filtered.map((file) => (
              <div key={file.name} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 group">
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                  {file.type === "image" ? (
                    <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-900">
                      <Video size={14} className="text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-400 font-mono truncate">{file.url}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-gray-400 hover:text-violet-600"
                    onClick={() => copyUrl(file.url)}
                  >
                    {copiedUrl === file.url ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-gray-400 hover:text-red-500"
                    onClick={() => {
                      if (confirm(`Delete ${file.name}?`)) deleteFile(file.name);
                    }}
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
