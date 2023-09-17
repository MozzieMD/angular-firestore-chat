export function isImage(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    let img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });
}
