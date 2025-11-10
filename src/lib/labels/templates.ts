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

export type LabelData = { qr: string; name: string; id: string };

const defaultQrPositions = [
  { x: 819, y: 175 },
  { x: 595, y: 175 },
  { x: 372, y: 175 },
  { x: 148, y: 175 },
];

const defaultNameTextPositions = [
  { x: 811, y: 96 },
  { x: 587, y: 96 },
  { x: 364, y: 96 },
  { x: 140, y: 96 },
];

const defaultIdTextPositions = [
  { x: 811, y: 66 },
  { x: 587, y: 66 },
  { x: 364, y: 66 },
  { x: 140, y: 66 },
];

const defaultOptions: Required<TscLabelOptions> = {
  widthMm: 108,
  heightMm: 25,
  gapMm: 3,
  speed: 5,
  density: 7,
  ribbonOn: true,
  tearOn: true,
  codepage: 1252,
  qrPositions: defaultQrPositions,
  textPositions: defaultNameTextPositions,
  idTextPositions: defaultIdTextPositions,
  nameTextPositions: defaultNameTextPositions,
  qrModel: "L",
  qrSize: 4,
  qrRotation: 180,
  qrMask: "M2",
  qrErrorLevel: "S7",
  textFont: "ROMAN.TTF",
  textRotation: 180,
  textXMul: 1,
  textYMul: 8,
  nameTextFont: "0",
  nameTextRotation: 180,
  nameTextXMul: 9,
  nameTextYMul: 9,
};

function appendWithBlank(lines: string[], value: string) {
  lines.push(value);
  lines.push("");
}

function finalizeTemplateLines(lines: string[]): string {
  if (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }
  return lines.join("\n");
}

function headerBlock(opts: Required<TscLabelOptions>): string {
  const lines: string[] = [];
  appendWithBlank(
    lines,
    `<xpml><page quantity='0' pitch='${opts.heightMm.toFixed(
      1
    )} mm'></xpml>SIZE ${opts.widthMm} mm, ${opts.heightMm} mm`
  );
  appendWithBlank(lines, `GAP ${opts.gapMm} mm, 0 mm`);
  appendWithBlank(lines, `SPEED ${opts.speed}`);
  appendWithBlank(lines, `DENSITY ${opts.density}`);
  appendWithBlank(lines, `SET RIBBON ${opts.ribbonOn ? "ON" : "OFF"}`);
  appendWithBlank(lines, `DIRECTION 0,0`);
  appendWithBlank(lines, `REFERENCE 0,0`);
  appendWithBlank(lines, `OFFSET 0 mm`);
  appendWithBlank(lines, `SET PEEL OFF`);
  appendWithBlank(lines, `SET CUTTER OFF`);
  appendWithBlank(lines, `SET PARTIAL_CUTTER OFF`);
  appendWithBlank(lines, `<xpml></page></xpml>`);
  return finalizeTemplateLines(lines);
}

function pageBlock(values: string[], opts: Required<TscLabelOptions>): string {
  const lines: string[] = [];
  appendWithBlank(
    lines,
    `<xpml><page quantity='1' pitch='${opts.heightMm.toFixed(
      1
    )} mm'></xpml>SET TEAR ${opts.tearOn ? "ON" : "OFF"}`
  );
  appendWithBlank(lines, "CLS");

  for (let i = 0; i < values.length; i++) {
    const pos = opts.qrPositions[i];
    if (!pos) break;
    const rawValue = values[i];
    const qrv = sanitizeTsplValue(rawValue);
    appendWithBlank(
      lines,
      `QRCODE ${pos.x},${pos.y},${opts.qrModel},${opts.qrSize},A,${opts.qrRotation},${opts.qrMask},${opts.qrErrorLevel},"${qrv}"`
    );
    if (i === 0) {
      appendWithBlank(lines, `CODEPAGE ${opts.codepage}`);
    }
    const textPos = opts.textPositions[i];
    if (!textPos) continue;
    appendWithBlank(
      lines,
      `TEXT ${textPos.x},${textPos.y},"${opts.textFont}",${opts.textRotation},${opts.textXMul},${opts.textYMul},"${qrv}"`
    );
  }

  appendWithBlank(lines, "PRINT 1,1");
  appendWithBlank(lines, "<xpml></page></xpml>");
  return finalizeTemplateLines(lines);
}

export function buildTscTxtFromValues(
  values: string[],
  options?: TscLabelOptions
): string {
  const opts = {
    ...defaultOptions,
    ...(options || {}),
  } as Required<TscLabelOptions>;
  const head = headerBlock(opts);
  const pages: string[] = [];
  for (let i = 0; i < values.length; i += 4) {
    const slice = values.slice(i, i + 4);
    pages.push(pageBlock(slice, opts));
  }
  const endTag = `<xpml><end/></xpml>`;
  return [head, ...pages, endTag].join("");
}

function sanitizeTsplValue(value: string): string {
  // Remove newlines and replace double quotes to avoid TSPL parsing issues
  return value.replace(/[\r\n]+/g, " ").replace(/"/g, "'");
}

function pageBlockForLabels(
  items: LabelData[],
  opts: Required<TscLabelOptions>
): string {
  const lines: string[] = [];
  appendWithBlank(
    lines,
    `<xpml><page quantity='1' pitch='${opts.heightMm.toFixed(
      1
    )} mm'></xpml>SET TEAR ${opts.tearOn ? "ON" : "OFF"}`
  );
  appendWithBlank(lines, "CLS");

  const namePositions = opts.nameTextPositions ?? opts.textPositions;
  const nameFont = opts.nameTextFont ?? opts.textFont;
  const nameRotation = opts.nameTextRotation ?? opts.textRotation;
  const nameXMul = opts.nameTextXMul ?? opts.textXMul;
  const nameYMul = opts.nameTextYMul ?? opts.textYMul;

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const qrPos = opts.qrPositions[i];
    if (!qrPos) break;
    const qrv = sanitizeTsplValue(it.qr);
    appendWithBlank(
      lines,
      `QRCODE ${qrPos.x},${qrPos.y},${opts.qrModel},${opts.qrSize},A,${opts.qrRotation},${opts.qrMask},${opts.qrErrorLevel},"${qrv}"`
    );
    if (i === 0) {
      appendWithBlank(lines, `CODEPAGE ${opts.codepage}`);
    }

    const idPos = opts.idTextPositions[i];
    if (idPos) {
      const id = sanitizeTsplValue(it.id);
      appendWithBlank(
        lines,
        `TEXT ${idPos.x},${idPos.y},"${opts.textFont}",${opts.textRotation},${opts.textXMul},${opts.textYMul},"${id}"`
      );
    }

    const namePos = namePositions[i];
    if (namePos) {
      const name = sanitizeTsplValue(it.name);
      appendWithBlank(
        lines,
        `TEXT ${namePos.x},${namePos.y},"${nameFont}",${nameRotation},${nameXMul},${nameYMul},"${name}"`
      );
    }
  }

  appendWithBlank(lines, "PRINT 1,1");
  appendWithBlank(lines, "<xpml></page></xpml>");
  return finalizeTemplateLines(lines);
}

export function buildTscTxtFromLabelData(
  labels: LabelData[],
  options?: TscLabelOptions
): string {
  const opts = {
    ...defaultOptions,
    ...(options || {}),
  } as Required<TscLabelOptions>;
  const head = headerBlock(opts);
  const pages: string[] = [];
  for (let i = 0; i < labels.length; i += 4) {
    const slice = labels.slice(i, i + 4);
    pages.push(pageBlockForLabels(slice, opts));
  }
  const endTag = `<xpml><end/></xpml>`;
  return [head, ...pages, endTag].join("");
}
