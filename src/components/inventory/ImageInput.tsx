"use client";

import { Image as ImageIcon, X } from "lucide-react";
import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Image from "next/image";

type ImageInputProps = {
  onChange?: (file: File | null, previewUrl: string | null) => void;
};

export default function FileUploadImage({ onChange }: ImageInputProps) {
  const [uploadState, setUploadState] = useState<{
    file: File | null;
    progress: number;
    uploading: boolean;
  }>({
    file: null,
    progress: 0,
    uploading: false,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const isValidImageFile = (file: File) => file.type.startsWith("image/");

  const handleFile = (file: File | undefined) => {
    if (!file) return;

    if (isValidImageFile(file)) {
      setUploadState({ file, progress: 100, uploading: false });
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      onChange?.(file, objectUrl);
    } else {
      toast.error("Please upload an image file (PNG, JPG, JPEG, GIF, WEBP).", {
        position: "bottom-right",
        duration: 3000,
      });
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFile(event.target.files?.[0]);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    handleFile(event.dataTransfer.files?.[0]);
  };

  const resetFile = () => {
    setUploadState({ file: null, progress: 0, uploading: false });
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    onChange?.(null, null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getFileIcon = () => {
    return <ImageIcon className="h-5 w-5 text-foreground" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const { file } = uploadState;

  return (
    <div className="flex items-center justify-center w-full">
      <form className="w-full" onSubmit={(e) => e.preventDefault()}>
        <div
          className="flex justify-center rounded-md border border-dashed border-input px-6 py-12"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <div>
            <ImageIcon
              className="mx-auto h-12 w-12 text-muted-foreground"
              aria-hidden={true}
            />
            <div className="flex text-sm leading-6 text-muted-foreground">
              <p>Drag and drop or</p>
              <label
                htmlFor="file-upload-03"
                className="relative cursor-pointer rounded-sm pl-1 font-medium text-primary hover:underline hover:underline-offset-4"
              >
                <span>choose file</span>
                <input
                  id="file-upload-03"
                  name="file-upload-03"
                  type="file"
                  className="sr-only"
                  accept="image/*"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                />
              </label>
              <p className="pl-1">to upload</p>
            </div>
          </div>
        </div>

        <p className="mt-2 text-xs leading-5 text-muted-foreground sm:flex sm:items-center sm:justify-between">
          <span>Accepted file types: Images (PNG, JPG, JPEG, GIF, WEBP).</span>
          <span className="pl-1 sm:pl-0">Max. size: 10MB</span>
        </p>

        {file && (
          <Card className="relative mt-8 bg-muted p-4 gap-4">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1 h-8 w-8 text-muted-foreground hover:text-foreground"
              aria-label="Remove"
              onClick={resetFile}
            >
              <X className="h-5 w-5 shrink-0" aria-hidden={true} />
            </Button>

            <div className="flex items-center space-x-2.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-background shadow-sm ring-1 ring-inset ring-border overflow-hidden">
                {previewUrl ? (
                  <Image
                    src={previewUrl}
                    alt="Image preview"
                    className="h-10 w-10 object-cover"
                    width={40}
                    height={40}
                  />
                ) : (
                  getFileIcon()
                )}
              </span>
              <div>
                <p className="text-xs font-medium text-foreground">
                  {file?.name}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {file && formatFileSize(file.size)}
                </p>
              </div>
            </div>
          </Card>
        )}
      </form>
    </div>
  );
}
