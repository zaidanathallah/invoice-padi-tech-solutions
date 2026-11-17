/**
 * Client-Side Image Compression & Optimization Utility
 * 
 * 1. Checks file size limit (max 2MB).
 * 2. Compresses image using HTML Canvas to crisp HD WebP/PNG format.
 * 3. Converts to lightweight Data URI string (~20KB-80KB) for offline IndexedDB & MySQL storage.
 */
export function processCompanyLogoFile(
  file: File,
  maxSizeBytes: number = 2 * 1024 * 1024 // 2MB limit
): Promise<{ success: boolean; dataUri?: string; error?: string }> {
  return new Promise((resolve) => {
    // 1. Check size limit
    if (file.size > maxSizeBytes) {
      return resolve({
        success: false,
        error: `Ukuran logo melebihi batas maksimal 2MB (Ukuran file: ${(file.size / (1024 * 1024)).toFixed(2)} MB).`,
      });
    }

    const reader = new FileReader();
    reader.onerror = () => {
      resolve({ success: false, error: "Gagal membaca file gambar logo." });
    };

    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => {
        resolve({ success: false, error: "Format gambar tidak valid." });
      };

      img.onload = () => {
        // High Definition Max Dimensions (e.g. 400px x 400px HD logo scaling)
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return resolve({ success: false, error: "Gagal memproses canvas gambar." });
        }

        // Draw image on canvas with high quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas to optimized WebP Data URI with high quality
        let compressedDataUri = canvas.toDataURL("image/webp", 0.9);

        // Fallback to PNG if webp is empty or unsupported
        if (!compressedDataUri || !compressedDataUri.startsWith("data:image/")) {
          compressedDataUri = canvas.toDataURL("image/png");
        }

        resolve({
          success: true,
          dataUri: compressedDataUri,
        });
      };

      img.src = event.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}
