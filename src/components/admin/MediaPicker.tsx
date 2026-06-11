import { useState, useEffect, useRef } from "react";
import { Search, Upload, Check, Loader2, X, Image as ImageIcon, Video } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface MediaFile {
  name: string;
  url: string;
  path: string;
  type: "image" | "video";
  created_at?: string;
}

interface MediaPickerProps {
  open: boolean;
  onClose: () => void;
  /** Called with the selected URL when not using multiple mode */
  onSelect: (url: string) => void;
  /** Allow selecting multiple images */
  multiple?: boolean;
  /** Called with all selected URLs when multiple=true and user confirms */
  onSelectMultiple?: (urls: string[]) => void;
  /** Currently selected URL(s) to show as checked */
  selected?: string | string[] | null;
  accept?: "image" | "video" | "all";
}

export async function listAllFiles(folder = "", depth = 0): Promise<MediaFile[]> {
  if (depth > 2) return [];
  const { data, error } = await supabase.storage.from("products").list(folder, {
    sortBy: { column: "created_at", order: "desc" },
    limit: 300,
  });
  if (error || !data) return [];

  const files: MediaFile[] = [];
  const subFolderPromises: Promise<MediaFile[]>[] = [];

  for (const item of data) {
    if (item.name === ".emptyFolderPlaceholder") continue;
    const path = folder ? `${folder}/${item.name}` : item.name;
    const isFolder = item.id === null || !item.name.includes(".");
    if (isFolder) {
      subFolderPromises.push(listAllFiles(path, depth + 1));
    } else {
      const { data: { publicUrl } } = supabase.storage.from("products").getPublicUrl(path);
      const isVideo = /\.(mp4|mov|avi|webm)$/i.test(item.name);
      files.push({
        name: item.name,
        path,
        url: publicUrl,
        type: isVideo ? "video" : "image",
        created_at: item.created_at ?? undefined,
      });
    }
  }

  const subFiles = (await Promise.all(subFolderPromises)).flat();
  return [...files, ...subFiles];
}

export function MediaPicker({
  open,
  onClose,
  onSelect,
  multiple = false,
  onSelectMultiple,
  selected,
  accept = "image",
}: MediaPickerProps) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "image" | "video">(accept === "all" ? "all" : accept);

  const initialSelected = selected
    ? Array.isArray(selected) ? selected : [selected]
    : [];
  const [picked, setPicked] = useState<string[]>(initialSelected);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setSearch("");
      setPicked(initialSelected);
      loadFiles();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function loadFiles() {
    setLoading(true);
    try {
      const all = await listAllFiles();
      // Deduplicate
      const seen = new Set<string>();
      setFiles(all.filter(f => {
        if (seen.has(f.url)) return false;
        seen.add(f.url);
        return true;
      }));
    } catch {
      toast.error("Failed to load media library");
    }
    setLoading(false);
  }

  async function handleUpload(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    const uploaded: MediaFile[] = [];
    for (const file of Array.from(fileList)) {
      try {
        const ext = file.name.split(".").pop();
        const path = `library/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { data, error } = await supabase.storage
          .from("products")
          .upload(path, file, { cacheControl: "3600" });
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from("products").getPublicUrl(data.path);
        const isVideo = /\.(mp4|mov|avi|webm)$/i.test(file.name);
        uploaded.push({ name: file.name, path, url: publicUrl, type: isVideo ? "video" : "image" });
      } catch {
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    if (uploaded.length > 0) {
      toast.success(`Uploaded ${uploaded.length} file${uploaded.length > 1 ? "s" : ""}`);
      setFiles(prev => [...uploaded, ...prev]);
      if (!multiple && uploaded[0]) {
        onSelect(uploaded[0].url);
        onClose();
        setUploading(false);
        return;
      }
    }
    setUploading(false);
  }

  function toggle(url: string) {
    if (multiple) {
      setPicked(prev =>
        prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
      );
    } else {
      onSelect(url);
      onClose();
    }
  }

  function confirmMultiple() {
    if (onSelectMultiple) onSelectMultiple(picked);
    onClose();
  }

  const filtered = files
    .filter(f => typeFilter === "all" || f.type === typeFilter)
    .filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  const selectedSet = new Set(picked);

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-3xl h-[85vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-0 shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-semibold">Media Library</DialogTitle>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept={accept === "video" ? "video/*" : accept === "all" ? "image/*,video/*" : "image/*"}
                multiple
                className="hidden"
                onChange={e => handleUpload(e.target.files)}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="gap-1.5 h-8 text-xs"
              >
                {uploading
                  ? <Loader2 size={12} className="animate-spin" />
                  : <Upload size={12} />}
                Upload New
              </Button>
              {multiple && picked.length > 0 && (
                <Button
                  size="sm"
                  onClick={confirmMultiple}
                  className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5 h-8 text-xs"
                >
                  <Check size={12} />
                  Use {picked.length} image{picked.length > 1 ? "s" : ""}
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3 pb-3 border-b border-gray-100">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search files…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
            {accept === "all" && (
              <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
                {(["all", "image", "video"] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors",
                      typeFilter === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-400 shrink-0">{filtered.length} files</p>
          </div>
        </DialogHeader>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 size={22} className="animate-spin text-violet-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
              <ImageIcon size={28} className="text-gray-200" />
              <p className="text-sm">
                {search ? "No files match your search" : "No media in library yet"}
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-violet-600 hover:underline"
              >
                Upload your first image →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {filtered.map(file => {
                const isSelected = selectedSet.has(file.url);
                return (
                  <button
                    key={file.path}
                    type="button"
                    onClick={() => toggle(file.url)}
                    className={cn(
                      "relative aspect-square rounded-xl overflow-hidden border-2 transition-all group",
                      isSelected
                        ? "border-violet-500 ring-2 ring-violet-200"
                        : "border-gray-100 hover:border-violet-300"
                    )}
                  >
                    {file.type === "image" ? (
                      <img src={file.url} alt={file.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                        <Video size={20} className="text-white/60" />
                      </div>
                    )}

                    {/* Selected overlay */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-violet-600/20 flex items-start justify-end p-1.5">
                        <div className="w-5 h-5 bg-violet-600 rounded-full flex items-center justify-center shadow">
                          <Check size={10} className="text-white" />
                        </div>
                      </div>
                    )}

                    {/* Hover filename */}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-1.5 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <p className="text-[9px] text-white truncate leading-tight">{file.name}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer for multiple selection */}
        {multiple && (
          <div className="shrink-0 px-5 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/80">
            <p className="text-xs text-gray-500">
              {picked.length === 0
                ? "Click images to select"
                : `${picked.length} image${picked.length > 1 ? "s" : ""} selected`}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs">
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={confirmMultiple}
                disabled={picked.length === 0}
                className="bg-violet-600 hover:bg-violet-700 text-white h-8 text-xs"
              >
                {picked.length === 0 ? "Select images" : `Insert ${picked.length} image${picked.length > 1 ? "s" : ""}`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
