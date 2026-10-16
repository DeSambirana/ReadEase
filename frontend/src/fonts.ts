// Hanya mencari font yang sudah terpasang; tidak mengambil atau membundel font berlisensi.
let localFont: Promise<boolean> | undefined;
export function loadDyslexie(): Promise<boolean> {
  localFont ??= (async () => {
    try {
      const faces = await document.fonts.load('16px "Aksara Dyslexie Local"');
      return faces.length > 0;
    } catch { return false; }
  })();
  return localFont;
}
export const fontFamilies = {
  sans: 'Arial, sans-serif',
  serif: 'Georgia, serif',
  dyslexie: '"Aksara Dyslexie Local", Arial, sans-serif',
};
