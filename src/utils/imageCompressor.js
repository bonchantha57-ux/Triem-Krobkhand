/**
 * Client-side Image Compression Utility
 * Resizes and compresses high-resolution photos from phones/PCs
 * to ensure smooth storage in Cloudflare D1 and fast loading over mobile 4G/5G networks.
 */

export function compressImageFile(file, maxWidth = 1200, maxHeight = 1200, quality = 0.78) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return reject(new Error('Invalid image file'));
    }

    // If already SVG or tiny file (< 80KB), return as is
    if (file.type === 'image/svg+xml' || file.size <= 80 * 1024) {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Calculate aspect ratio constraints
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target.result);
          return;
        }

        // Draw image smoothly
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Export as WebP if supported, fallback to PNG for transparent images or JPEG
        let dataUrl = '';
        const isPng = file.type === 'image/png';
        try {
          dataUrl = canvas.toDataURL('image/webp', quality);
          if (!dataUrl.startsWith('data:image/webp')) {
            dataUrl = canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', quality);
          }
        } catch {
          dataUrl = canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', quality);
        }

        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target.result); // Fallback to raw if decode fails
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
