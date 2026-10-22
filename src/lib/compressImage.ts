/**
 * Client-side image compression via Canvas.
 * Resizes to maxWidth and re-encodes as WebP (fallback JPEG), lowering
 * quality/size until the result fits within maxBytes.
 */
export async function compressImage(file: File, maxWidth: number, maxBytes: number): Promise<File> {
  const bitmap = await loadImage(file);
  let width = Math.min(maxWidth, bitmap.width);
  const ratio = bitmap.height / bitmap.width;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  const supportsWebp = canvas.toDataURL("image/webp").startsWith("data:image/webp");
  const type = supportsWebp ? "image/webp" : "image/jpeg";
  const ext = supportsWebp ? "webp" : "jpg";

  let best: Blob | null = null;
  for (let attempt = 0; attempt < 8; attempt++) {
    canvas.width = Math.round(width);
    canvas.height = Math.round(width * ratio);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    for (const q of [0.85, 0.75, 0.65, 0.55, 0.45]) {
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, type, q));
      if (!blob) continue;
      best = blob;
      if (blob.size <= maxBytes) {
        return new File([blob], file.name.replace(/\.[^.]+$/, "") + "." + ext, { type });
      }
    }
    width *= 0.8;
  }
  if (!best) return file;
  return new File([best], file.name.replace(/\.[^.]+$/, "") + "." + ext, { type });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Não foi possível ler a imagem.")); };
    img.src = url;
  });
}
