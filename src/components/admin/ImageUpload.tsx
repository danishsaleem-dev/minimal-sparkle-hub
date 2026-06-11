import { useState, useRef } from "react";
import { Upload, X, Loader2, Images } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MediaPicker } from "@/components/admin/MediaPicker";

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  bucket?: string;
  folder?: string;
  aspectRatio?: "square" | "wide" | "auto";
  placeholder?: string;
  className?: string;
}

export function ImageUpload({
  value,
  onChange,
  bucket = "products",
  folder = "library",
  aspectRatio = "wide",
  placeholder = "Upload image",
  className,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
      onChange(publicUrl);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {value ? (
        <div className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
          <img
            src={value}
            alt=""
            className={cn(
              "w-full object-cover",
              aspectRatio === "square" && "aspect-square",
              aspectRatio === "wide" && "aspect-video max-h-48",
              aspectRatio === "auto" && "max-h-32"
            )}
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="px-3 py-1.5 bg-white text-gray-900 text-xs font-medium rounded-lg hover:bg-gray-50"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="px-3 py-1.5 bg-white text-gray-900 text-xs font-medium rounded-lg hover:bg-gray-50"
            >
              Library
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-full border-2 border-dashed border-gray-200 hover:border-violet-300 rounded-xl p-6 flex flex-col items-center gap-2 text-gray-400 hover:text-violet-500 transition-colors disabled:opacity-50"
          >
            {uploading
              ? <Loader2 size={20} className="animate-spin" />
              : <Upload size={20} />}
            <span className="text-sm">{uploading ? "Uploading…" : placeholder}</span>
          </button>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-violet-600 transition-colors py-1"
          >
            <Images size={12} />
            Choose from library
          </button>
        </div>
      )}

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={url => onChange(url)}
        selected={value}
      />
    </div>
  );
}
