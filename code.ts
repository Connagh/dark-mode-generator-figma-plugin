// Function to adjust the luminance of a color using extreme inversion
function extremeAdjustLuminance(color: RGB): RGB {
  // Convert RGB to HSL
  const { h, s, l } = rgbToHsl(color.r, color.g, color.b);

  // Extreme adjustment: invert the luminance to make dark colors light and light colors dark
  const invertedL = 1 - l; // Invert luminance to make darks light and lights dark
  
  // Apply a curve to pale/fade the colors, making all colors lighter or darker
  // Make bright colors more faded and dark colors brighter, but shift towards extremes
  const fadedLuminance = Math.pow(invertedL, 2); // This will make the darks really light and lights very dark

  // Ensure luminance is clamped between 0 and 1
  const newLuminance = clamp(fadedLuminance);

  // Reduce saturation to fade the colors and make them pale
  const fadedSaturation = s * 0.3; // Reduce saturation to 30% for a faded effect

  // Convert back to RGB and return
  return hslToRgb(h, fadedSaturation, newLuminance);
}

// Convert RGB to HSL
function rgbToHsl(r: number, g: number, b: number) {
  r /= 1; g /= 1; b /= 1;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return { h, s, l };
}

// Convert HSL back to RGB
function hslToRgb(h: number, s: number, l: number): RGB {
  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 3) return q;
      if (t < 1 / 2) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  // Clamp the RGB values to be between 0 and 1
  return {
    r: clamp(r),
    g: clamp(g),
    b: clamp(b)
  };
}

// Recursive function to process all layers in a frame
function processLayers(node: SceneNode) {
  if ("fills" in node && node.fills && Array.isArray(node.fills)) {
    const fills = node.fills.map((fill) => {
      if (fill.type === "SOLID") {
        const newColor = extremeAdjustLuminance(fill.color);
        return {
          ...fill,
          color: newColor,
        };
      }
      return fill;
    });
    node.fills = fills;
  }

  if ("children" in node && node.children) {
    node.children.forEach((child) => processLayers(child));
  }
}

// Main plugin logic
figma.showUI(__html__, { width: 300, height: 100 });

figma.ui.onmessage = (msg) => {
  if (msg.type === 'apply-dark-mode') {
    const selectedNodes = figma.currentPage.selection;

    if (selectedNodes.length > 0) {
      selectedNodes.forEach((node) => processLayers(node));
      figma.notify('Extreme contrast colors have been applied!');
    } else {
      figma.notify('Please select a frame or layers.');
    }

    figma.closePlugin();
  }
};

// Function to clamp values between 0 and 1
function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}