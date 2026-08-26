/**
 * Utility for calculating dynamic contrast and opposite colors
 * ensuring Edit and Delete action buttons are always maximally visible
 * based on the background color of their cell/container.
 */

export interface ActionColors {
  editColor: string;
  deleteColor: string;
  buttonBg: string;
  buttonBgHover: string;
  borderColor: string;
  isDarkBg: boolean;
}

// Convert Hex to RGB
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  if (!hex) return null;
  let c = hex.replace('#', '').trim();
  if (c.startsWith('rgba') || c.startsWith('rgb')) {
    const match = c.match(/\d+/g);
    if (match && match.length >= 3) {
      return { r: parseInt(match[0], 10), g: parseInt(match[1], 10), b: parseInt(match[2], 10) };
    }
  }
  if (c.length === 3) {
    c = c.split('').map((x) => x + x).join('');
  }
  if (c.length === 6 || c.length === 8) {
    const num = parseInt(c.slice(0, 6), 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
    };
  }
  return null;
}

// Calculate relative luminance (WCAG standard formula)
export function getRelativeLuminance(r: number, g: number, b: number): number {
  const [sR, sG, sB] = [r, g, b].map((val) => {
    const v = val / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * sR + 0.7152 * sG + 0.0722 * sB;
}

/**
 * Returns dynamic, opposite/contrasting colors for Edit and Delete buttons
 * based on the container's background color and completed state.
 */
export function getDynamicActionColors(
  bgColor?: string,
  isCompleted: boolean = false,
  fallbackDarkBg: string = '#131c3c'
): ActionColors {
  // If not completed or no explicit color, background is dark navy/slate
  const effectiveHex = isCompleted && bgColor ? bgColor : fallbackDarkBg;
  const rgb = hexToRgb(effectiveHex) || { r: 19, g: 28, b: 60 };
  const luminance = getRelativeLuminance(rgb.r, rgb.g, rgb.b);

  // If background is bright (Luminance > 0.35, e.g. Yellow, Green, Pink, Cyan, Amber, White)
  if (luminance > 0.35) {
    return {
      editColor: '#0f172a', // Deep dark slate / navy for crisp opposite visibility
      deleteColor: '#991b1b', // Deep crimson red for clear destructive signal
      buttonBg: 'rgba(255, 255, 255, 0.45)', // Frosted bright pill
      buttonBgHover: 'rgba(255, 255, 255, 0.85)',
      borderColor: 'rgba(0, 0, 0, 0.15)',
      isDarkBg: false,
    };
  }

  // If background is medium-dark (e.g. Purple #8b5cf6, Blue #3b82f6)
  if (isCompleted && luminance > 0.15) {
    return {
      editColor: '#ffffff', // Crisp pure white
      deleteColor: '#fecdd3', // Soft bright rose/white
      buttonBg: 'rgba(0, 0, 0, 0.28)', // Dark contrast pill
      buttonBgHover: 'rgba(0, 0, 0, 0.45)',
      borderColor: 'rgba(255, 255, 255, 0.25)',
      isDarkBg: true,
    };
  }

  // If background is very dark (default uncompleted item, dark navy, dark card header)
  return {
    editColor: '#38bdf8', // Bright luminous Sky/Cyan
    deleteColor: '#fb7185', // Bright luminous Rose/Coral
    buttonBg: 'rgba(255, 255, 255, 0.08)',
    buttonBgHover: 'rgba(255, 255, 255, 0.18)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    isDarkBg: true,
  };
}
