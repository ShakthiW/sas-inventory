export type LabelData = { qr: string; name: string; id: string };

export type TscLabelOptions = {
  // Physical page config
  widthMm?: number; // label width in mm
  heightMm?: number; // label height in mm
  gapMm?: number; // gap height in mm
  speed?: number; // print speed
  density?: number; // print density
  ribbonOn?: boolean;
  tearOn?: boolean;
  codepage?: number; // e.g., 1252
  itemsPerRow?: number; // dynamic override for items per row
  // Layout config for up to 4 labels per row (left->right)
  // Coordinates are printer dots by default for TSPL; values here follow the example
  qrPositions?: { x: number; y: number }[];
  // Name label positions
  textPositions?: { x: number; y: number }[];
  // Product ID label positions (second line)
  idTextPositions?: { x: number; y: number }[];
  nameTextPositions?: { x: number; y: number }[];
  qrModel?: string; // e.g., "L"
  qrSize?: number; // module size
  qrRotation?: number; // 0/90/180/270
  qrMask?: string; // e.g., "M2"
  qrErrorLevel?: string; // e.g., "S7"
  textFont?: string; // e.g., "ROMAN.TTF"
  textRotation?: number; // 0/90/180/270
  textXMul?: number; // horizontal scale
  textYMul?: number; // vertical scale
  nameTextFont?: string;
  nameTextRotation?: number;
  nameTextXMul?: number;
  nameTextYMul?: number;
};

export function sanitizeTsplValue(value: string): string {
  // Remove newlines and replace double quotes to avoid TSPL parsing issues
  return value.replace(/[\r\n]+/g, " ").replace(/"/g, "'");
}

export function appendWithBlank(lines: string[], value: string) {
  lines.push(value);
  lines.push("");
}

export function finalizeTemplateLines(lines: string[]): string {
  if (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }
  return lines.join("\n");
}
