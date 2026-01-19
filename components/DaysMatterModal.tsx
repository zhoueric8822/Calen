"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Image as ImageIcon, Upload, Spinner, X, Check, ArrowsOut } from "@phosphor-icons/react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";

import { Modal } from "@/components/Modal";
import type { DaysMatterItem } from "@/lib/types";
import { useCalenStore } from "@/stores/useCalenStore";

// Max dimensions for the final image
const MAX_WIDTH = 800;
const MAX_HEIGHT = 600;
const ASPECT_RATIO = 4 / 3;

type MediaSize = {
  width: number;
  height: number;
  naturalWidth: number;
  naturalHeight: number;
};

const getInitialCropPixels = (media: MediaSize): Area => {
  const mediaWidth = media.naturalWidth || media.width;
  const mediaHeight = media.naturalHeight || media.height;

  let cropWidth = mediaWidth;
  let cropHeight = cropWidth / ASPECT_RATIO;

  if (cropHeight > mediaHeight) {
    cropHeight = mediaHeight;
    cropWidth = cropHeight * ASPECT_RATIO;
  }

  const x = Math.max(0, (mediaWidth - cropWidth) / 2);
  const y = Math.max(0, (mediaHeight - cropHeight) / 2);

  return { x, y, width: cropWidth, height: cropHeight };
};

// Helper to create cropped image as data URL
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area
): Promise<string> {
  const image = await createImage(imageSrc);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  // Validate crop dimensions first
  if (!pixelCrop || isNaN(pixelCrop.width) || isNaN(pixelCrop.height) || pixelCrop.width <= 0 || pixelCrop.height <= 0) {
    throw new Error(`Invalid crop dimensions: width=${pixelCrop?.width}, height=${pixelCrop?.height}`);
  }

  // Ensure we have valid crop dimensions
  const cropWidth = Math.max(10, Math.round(pixelCrop.width));
  const cropHeight = Math.max(10, Math.round(pixelCrop.height));
  const cropX = Math.max(0, Math.round(pixelCrop.x));
  const cropY = Math.max(0, Math.round(pixelCrop.y));
  
  // Validate dimensions are valid numbers
  if (isNaN(cropWidth) || isNaN(cropHeight) || cropWidth <= 0 || cropHeight <= 0) {
    throw new Error(`Invalid calculated dimensions: width=${cropWidth}, height=${cropHeight}`);
  }

  // Calculate the output size (respecting max dimensions)
  let outputWidth = cropWidth;
  let outputHeight = cropHeight;

  if (outputWidth > MAX_WIDTH) {
    outputHeight = Math.round((MAX_WIDTH / outputWidth) * outputHeight);
    outputWidth = MAX_WIDTH;
  }
  if (outputHeight > MAX_HEIGHT) {
    outputWidth = Math.round((MAX_HEIGHT / outputHeight) * outputWidth);
    outputHeight = MAX_HEIGHT;
  }

  // Ensure minimum dimensions
  outputWidth = Math.max(10, outputWidth);
  outputHeight = Math.max(10, outputHeight);

  canvas.width = outputWidth;
  canvas.height = outputHeight;

  // Fill with white background first (for transparency)
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, outputWidth, outputHeight);

  ctx.drawImage(
    image,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    outputWidth,
    outputHeight
  );

  // Return as data URL (stored directly, no server upload needed)
  return canvas.toDataURL("image/jpeg", 0.8);
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = url;
  });
}

export const DaysMatterModal = () => {
  const isOpen = useCalenStore((state) => state.modals.daysMatter);
  const editItemId = useCalenStore((state) => state.modals.editDaysMatter);
  const daysMatterItems = useCalenStore((state) => state.daysMatterItems);
  const closeModal = useCalenStore((state) => state.closeModal);
  const closeEditDaysMatter = useCalenStore((state) => state.closeEditDaysMatter);
  const addDaysMatterItem = useCalenStore((state) => state.addDaysMatterItem);
  const updateDaysMatterItem = useCalenStore((state) => state.updateDaysMatterItem);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const editingItem = editItemId
    ? daysMatterItems.find((item) => item.id === editItemId)
    : null;
  const isEditing = !!editingItem;
  const isModalOpen = isOpen || !!editItemId;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [type, setType] = useState<"countdown" | "countup">("countdown");
  const [imageUrl, setImageUrl] = useState("");
  const [isUploadedImage, setIsUploadedImage] = useState(false); // Track if image is from upload
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Cropper state
  const [cropperImage, setCropperImage] = useState<string | null>(null);
  const [cropperBlobUrl, setCropperBlobUrl] = useState<string | null>(null); // Store blob URL for cleanup
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [cropperReady, setCropperReady] = useState(false);

  // Cleanup blob URL on unmount or when cropper closes
  useEffect(() => {
    return () => {
      if (cropperBlobUrl) {
        URL.revokeObjectURL(cropperBlobUrl);
      }
    };
  }, [cropperBlobUrl]);

  // Reset cropper ready state when image changes
  useEffect(() => {
    if (cropperImage) {
      setCropperReady(false);
      setCroppedAreaPixels(null);
    }
  }, [cropperImage]);

  useEffect(() => {
    if (editingItem) {
      setTitle(editingItem.title);
      setDescription(editingItem.description ?? "");
      setTargetDate(editingItem.targetDate.slice(0, 10));
      setType(editingItem.type);
      setImageUrl(editingItem.imageUrl ?? "");
    } else {
      reset();
    }
  }, [editingItem]);

  const canSubmit = useMemo(
    () => title.trim().length > 0 && targetDate.length > 0 && !isUploading && !cropperImage,
    [title, targetDate, isUploading, cropperImage]
  );

  const reset = () => {
    setTitle("");
    setDescription("");
    setTargetDate("");
    setType("countdown");
    setImageUrl("");
    setIsUploadedImage(false);
    setUploadError(null);
    // Cleanup blob URL
    if (cropperBlobUrl) {
      URL.revokeObjectURL(cropperBlobUrl);
    }
    setCropperImage(null);
    setCropperBlobUrl(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleClose = () => {
    reset();
    if (editItemId) {
      closeEditDaysMatter();
    } else {
      closeModal("daysMatter");
    }
  };

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    // Always set the crop area pixels (react-easy-crop manages this)
    setCroppedAreaPixels(croppedAreaPixels);
    
    // Validate the crop area before marking as ready
    if (
      croppedAreaPixels &&
      !isNaN(croppedAreaPixels.width) &&
      !isNaN(croppedAreaPixels.height) &&
      croppedAreaPixels.width > 0 &&
      croppedAreaPixels.height > 0
    ) {
      setCropperReady(true);
      setUploadError(null); // Clear any previous errors
    } else {
      setCropperReady(false);
    }
  }, []);

  const onMediaLoaded = useCallback((mediaSize: MediaSize) => {
    // Image has loaded - clear any stale error and set an initial crop area
    setUploadError(null);
    if (mediaSize?.naturalWidth && mediaSize?.naturalHeight) {
      setCroppedAreaPixels(getInitialCropPixels(mediaSize));
      setCropperReady(true);
    }
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file");
      return;
    }

    // Validate file size (max 10MB for original - will be compressed after crop)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Image must be less than 10MB");
      return;
    }

    setUploadError(null);

    // Clean up previous blob URL if any
    if (cropperBlobUrl) {
      URL.revokeObjectURL(cropperBlobUrl);
    }

    // Create blob URL for cropper (avoids CORS issues)
    const blobUrl = URL.createObjectURL(file);
    setCropperBlobUrl(blobUrl);
    setCropperImage(blobUrl);
    setCropperReady(false); // Reset ready state when new image is loaded
    setCroppedAreaPixels(null); // Reset crop area

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCropConfirm = async () => {
    if (!cropperImage) {
      setUploadError("No image to crop");
      return;
    }
    
    if (!croppedAreaPixels) {
      setUploadError("Please wait for crop area to be calculated");
      return;
    }

    if (!cropperReady) {
      setUploadError("Please wait for the image to load completely");
      return;
    }

    if (
      !croppedAreaPixels.width || 
      !croppedAreaPixels.height || 
      isNaN(croppedAreaPixels.width) || 
      isNaN(croppedAreaPixels.height) ||
      croppedAreaPixels.width <= 0 || 
      croppedAreaPixels.height <= 0
    ) {
      setUploadError("Please adjust the crop area - invalid dimensions");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const croppedDataUrl = await getCroppedImg(cropperImage, croppedAreaPixels);

      // Clean up blob URL
      if (cropperBlobUrl) {
        URL.revokeObjectURL(cropperBlobUrl);
      }

      // Update state in correct order
      setImageUrl(croppedDataUrl);
      setIsUploadedImage(true);
      setCropperImage(null);
      setCropperBlobUrl(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setUploadError(`Failed to crop image: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCropCancel = () => {
    // Clean up blob URL
    if (cropperBlobUrl) {
      URL.revokeObjectURL(cropperBlobUrl);
    }
    setCropperImage(null);
    setCropperBlobUrl(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCropperReady(false);
    setCroppedAreaPixels(null);
  };

  const handleSubmit = () => {
    if (!canSubmit) return;

    const itemData = {
      title: title.trim(),
      description: description.trim() || undefined,
      targetDate: new Date(targetDate).toISOString(),
      type,
      imageUrl: imageUrl.trim() || undefined,
    };

    if (isEditing) {
      updateDaysMatterItem(editingItem.id, itemData);
    } else {
      const item: DaysMatterItem = {
        id: crypto.randomUUID(),
        ...itemData,
        createdAt: new Date().toISOString(),
      };
      addDaysMatterItem(item);
    }

    handleClose();
  };

  return (
    <Modal
      isOpen={isModalOpen}
      onClose={handleClose}
      title={isEditing ? "Edit Event" : "New Days Matter Event"}
      footer={
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Track important dates and milestones.
          </p>
          <button
            className="rounded-full bg-[#007AFF] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#0066d6] disabled:opacity-40"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {isEditing ? "Save changes" : "Create event"}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Type Toggle */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase text-zinc-400 dark:text-zinc-500">
            Type
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType("countdown")}
              className={`flex-1 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                type === "countdown"
                  ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                  : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-white/5"
              }`}
            >
              Countdown
            </button>
            <button
              type="button"
              onClick={() => setType("countup")}
              className={`flex-1 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                type === "countup"
                  ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                  : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-white/5"
              }`}
            >
              Count Up
            </button>
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            {type === "countdown"
              ? "Count down to a future event"
              : "Count up from a past date (anniversary, milestone)"}
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase text-zinc-400 dark:text-zinc-500">
            Title
          </label>
          <input
            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none ring-0 focus:border-zinc-400 dark:border-white/10 dark:bg-white/5 dark:text-zinc-50"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={type === "countdown" ? "Wedding Day" : "Together Since"}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase text-zinc-400 dark:text-zinc-500">
            Description (Optional)
          </label>
          <textarea
            className="h-20 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-white/10 dark:bg-white/5 dark:text-zinc-50"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Add any notes or details..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase text-zinc-400 dark:text-zinc-500">
            {type === "countdown" ? "Target Date" : "Start Date"}
          </label>
          <input
            type="date"
            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-white/10 dark:bg-white/5 dark:text-zinc-50"
            value={targetDate}
            onChange={(event) => setTargetDate(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase text-zinc-400 dark:text-zinc-500">
            Cover Image (Optional)
          </label>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Show cropper OR image controls */}
          {cropperImage ? (
            <div className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/5">
              {/* Cropper area */}
              <div className="relative h-56 overflow-hidden rounded-xl bg-zinc-900">
                <Cropper
                  key={cropperImage}
                  image={cropperImage}
                  crop={crop}
                  zoom={zoom}
                  aspect={ASPECT_RATIO}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onMediaLoaded={onMediaLoaded}
                  onZoomChange={setZoom}
                  cropShape="rect"
                  showGrid
                  style={{
                    containerStyle: { borderRadius: "0.75rem" },
                    cropAreaStyle: { borderRadius: "0.5rem" },
                  }}
                />
              </div>

              {/* Zoom slider */}
              <div className="flex items-center gap-3">
                <ArrowsOut className="h-4 w-4 text-zinc-400 dark:text-zinc-500" weight="bold" />
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 accent-[#007AFF]"
                />
                <span className="w-10 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {zoom.toFixed(1)}x
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleCropCancel}
                  disabled={isUploading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white py-2.5 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  <X className="h-4 w-4" weight="bold" />
                  Cancel
                </button>
                <button
                  onClick={handleCropConfirm}
                  disabled={isUploading || !cropperReady || !croppedAreaPixels}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#007AFF] py-2.5 text-sm font-semibold text-white transition hover:bg-[#0066d6] disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Spinner className="h-4 w-4 animate-spin" weight="bold" />
                      Uploading...
                    </>
                  ) : !cropperReady ? (
                    <>
                      <Spinner className="h-4 w-4 animate-spin" weight="bold" />
                      Initializing...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" weight="bold" />
                      Crop & Upload
                    </>
                  )}
                </button>
              </div>

              <p className="text-center text-xs text-zinc-400 dark:text-zinc-500">
                Drag to reposition • Slide to zoom • 4:3 ratio
              </p>

              {uploadError && (
                <p className="text-center text-xs text-red-500">{uploadError}</p>
              )}
            </div>
          ) : (
            <>
              {/* Show preview if image exists, otherwise show upload controls */}
              {imageUrl ? (
                <div className="relative overflow-hidden rounded-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="h-40 w-full object-cover"
                    draggable={false}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                      <Check className="h-3 w-3" weight="bold" />
                      {isUploadedImage ? "Image uploaded" : "Image added"}
                    </span>
                    <button
                      onClick={() => {
                        setImageUrl("");
                        setIsUploadedImage(false);
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60"
                    >
                      <X className="h-4 w-4" weight="bold" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Upload button and URL input */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="flex h-11 items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
                    >
                      <Upload className="h-4 w-4" weight="bold" />
                      Upload
                    </button>
                    <div className="relative flex-1">
                      <ImageIcon
                        className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
                        weight="bold"
                      />
                      <input
                        className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-3 pl-11 pr-4 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-white/10 dark:bg-white/5 dark:text-zinc-50"
                        value={isUploadedImage ? "" : imageUrl}
                        onChange={(event) => {
                          setImageUrl(event.target.value);
                          setIsUploadedImage(false);
                        }}
                        placeholder="Or paste image URL..."
                      />
                    </div>
                  </div>

                  {/* Error message */}
                  {uploadError && (
                    <p className="text-xs text-red-500">{uploadError}</p>
                  )}

                  {/* Quick tip */}
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    Upload an image (4:3 crop, max 800×600px) or paste a URL
                  </p>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};
