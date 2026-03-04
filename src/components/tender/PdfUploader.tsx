import { useState, useCallback } from "react";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PdfUploaderProps {
  tenderId: string;
  onUploadComplete: (docIds: string[]) => void;
}

interface FileItem {
  file: File;
  id: string;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
}

const PdfUploader = ({ tenderId, onUploadComplete }: PdfUploaderProps) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const addFiles = useCallback((newFiles: File[]) => {
    const pdfs = newFiles.filter((f) => f.type === "application/pdf");
    if (pdfs.length !== newFiles.length) {
      toast({ title: "Solo se permiten archivos PDF", variant: "destructive" });
    }
    if (pdfs.length === 0) return;

    const items: FileItem[] = pdfs.map((file) => ({
      file,
      id: crypto.randomUUID(),
      progress: 0,
      status: "pending",
    }));
    setFiles((prev) => [...prev, ...items]);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      addFiles(Array.from(e.dataTransfer.files));
    },
    [addFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragOver(false), []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) addFiles(Array.from(e.target.files));
      e.target.value = "";
    },
    [addFiles]
  );

  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));

  const uploadAll = async () => {
    if (files.length === 0) return;
    setUploading(true);
    const docIds: string[] = [];

    for (const item of files) {
      if (item.status === "done") continue;

      setFiles((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: "uploading", progress: 10 } : f))
      );

      try {
        const filePath = `${tenderId}/${Date.now()}_${item.file.name}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from("tender-documents")
          .upload(filePath, item.file, { contentType: "application/pdf" });

        if (uploadError) throw uploadError;

        setFiles((prev) =>
          prev.map((f) => (f.id === item.id ? { ...f, progress: 60 } : f))
        );

        // Create document record
        const { data: doc, error: docError } = await supabase
          .from("tender_documents")
          .insert({
            tender_id: tenderId,
            file_name: item.file.name,
            file_path: filePath,
            file_size: item.file.size,
            mime_type: "application/pdf",
            uploaded_by: (await supabase.auth.getUser()).data.user?.id,
          })
          .select("id")
          .single();

        if (docError) throw docError;
        docIds.push(doc.id);

        setFiles((prev) =>
          prev.map((f) => (f.id === item.id ? { ...f, status: "done", progress: 100 } : f))
        );
      } catch (err: any) {
        console.error("Upload error:", err);
        setFiles((prev) =>
          prev.map((f) => (f.id === item.id ? { ...f, status: "error", progress: 0 } : f))
        );
        toast({ title: `Error subiendo ${item.file.name}`, description: err.message, variant: "destructive" });
      }
    }

    setUploading(false);
    if (docIds.length > 0) {
      onUploadComplete(docIds);
      toast({ title: `${docIds.length} documento(s) subido(s) correctamente` });
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
          isDragOver
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border hover:border-primary/50 hover:bg-muted/50"
        }`}
        onClick={() => document.getElementById("pdf-input")?.click()}
      >
        <input
          id="pdf-input"
          type="file"
          accept=".pdf,application/pdf"
          multiple
          className="hidden"
          onChange={handleFileInput}
        />
        <Upload size={40} className={`mx-auto mb-3 ${isDragOver ? "text-primary" : "text-muted-foreground"}`} />
        <p className="font-medium text-foreground">
          {isDragOver ? "Suelta los archivos aquí" : "Arrastra y suelta tus PDFs aquí"}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          o haz clic para seleccionar · Máximo 20MB por archivo
        </p>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((item) => (
            <div key={item.id} className="flex items-center gap-3 bg-card border border-border rounded-lg p-3">
              <FileText size={20} className="text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.file.name}</p>
                <p className="text-xs text-muted-foreground">{formatSize(item.file.size)}</p>
                {item.status === "uploading" && <Progress value={item.progress} className="mt-1 h-1.5" />}
              </div>
              <div className="shrink-0">
                {item.status === "done" && (
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">✓ Subido</span>
                )}
                {item.status === "error" && (
                  <span className="text-xs font-medium text-destructive bg-destructive/10 px-2 py-1 rounded-full">Error</span>
                )}
                {item.status === "uploading" && <Loader2 size={16} className="animate-spin text-primary" />}
                {(item.status === "pending" || item.status === "error") && (
                  <button onClick={() => removeFile(item.id)} className="text-muted-foreground hover:text-destructive">
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {files.some((f) => f.status === "pending" || f.status === "error") && (
        <Button onClick={uploadAll} disabled={uploading} className="w-full">
          {uploading ? (
            <>
              <Loader2 size={16} className="animate-spin mr-2" />
              Subiendo...
            </>
          ) : (
            <>
              <Upload size={16} className="mr-2" />
              Subir {files.filter((f) => f.status !== "done").length} documento(s)
            </>
          )}
        </Button>
      )}
    </div>
  );
};

export default PdfUploader;
