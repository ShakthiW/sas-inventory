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
  { x: 831, y: 38 },
  { x: 607, y: 38 },
  { x: 384, y: 38 },
  { x: 160, y: 38 },
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
  qrSize: 5,
  qrRotation: 180,
  qrMask: "M2",
  qrErrorLevel: "S7",
  textFont: "ROMAN.TTF",
  textRotation: 180,
  textXMul: 1,
  textYMul: 8,
  nameTextFont: "0",
  nameTextRotation: 180,
  nameTextXMul: 10,
  nameTextYMul: 10,
};

function headerBlock(opts: Required<TscLabelOptions>): string {
  return [
    `<xpml><page quantity='0' pitch='${opts.heightMm.toFixed(
      1
    )} mm'></xpml>SIZE ${opts.widthMm} mm, ${opts.heightMm} mm`,
    `GAP ${opts.gapMm} mm, 0 mm`,
    `SPEED ${opts.speed}`,
    `DENSITY ${opts.density}`,
    `SET RIBBON ${opts.ribbonOn ? "ON" : "OFF"}`,
    `DIRECTION 0,0`,
    `REFERENCE 0,0`,
    `OFFSET 0 mm`,
    `SET PEEL OFF`,
    `SET CUTTER OFF`,
    `SET PARTIAL_CUTTER OFF`,
    `<xpml></page></xpml>`,
  ].join("\n\n");
}

function pageBlock(values: string[], opts: Required<TscLabelOptions>): string {
  const lines: string[] = [];
  lines.push(
    `<xpml><page quantity='1' pitch='${opts.heightMm.toFixed(
      1
    )} mm'></xpml>SET TEAR ${opts.tearOn ? "ON" : "OFF"}`
  );
  lines.push("CLS");

  for (let i = 0; i < values.length; i++) {
    const pos = opts.qrPositions[i];
    if (!pos) break;
    const rawValue = values[i];
    const qrv = sanitizeTsplValue(rawValue);
    lines.push(
      `QRCODE ${pos.x},${pos.y},${opts.qrModel},${opts.qrSize},A,${opts.qrRotation},${opts.qrMask},${opts.qrErrorLevel},"${qrv}"`
    );
    if (i === 0) {
      lines.push(`CODEPAGE ${opts.codepage}`);
    }
    const textPos = opts.textPositions[i];
    if (!textPos) continue;
    lines.push(
      `TEXT ${textPos.x},${textPos.y},"${opts.textFont}",${opts.textRotation},${opts.textXMul},${opts.textYMul},"${qrv}"`
    );
  }

  lines.push("PRINT 1,1");
  lines.push("<xpml></page></xpml>");
  return lines.join("\n\n");
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
  lines.push(
    `<xpml><page quantity='1' pitch='${opts.heightMm.toFixed(
      1
    )} mm'></xpml>SET TEAR ${opts.tearOn ? "ON" : "OFF"}`
  );
  lines.push("CLS");

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
    lines.push(
      `QRCODE ${qrPos.x},${qrPos.y},${opts.qrModel},${opts.qrSize},A,${opts.qrRotation},${opts.qrMask},${opts.qrErrorLevel},"${qrv}"`
    );
    if (i === 0) {
      lines.push(`CODEPAGE ${opts.codepage}`);
    }

    const idPos = opts.idTextPositions[i];
    if (idPos) {
      const id = sanitizeTsplValue(it.id);
      lines.push(
        `TEXT ${idPos.x},${idPos.y},"${opts.textFont}",${opts.textRotation},${opts.textXMul},${opts.textYMul},"${id}"`
      );
    }

    const namePos = namePositions[i];
    if (namePos) {
      const name = sanitizeTsplValue(it.name);
      lines.push(
        `TEXT ${namePos.x},${namePos.y},"${nameFont}",${nameRotation},${nameXMul},${nameYMul},"${name}"`
      );
    }
  }

  lines.push("PRINT 1,1");
  lines.push("<xpml></page></xpml>");
  return lines.join("\n\n");
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
