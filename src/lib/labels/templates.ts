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
  qrModel?: string; // e.g., "L"
  qrSize?: number; // module size
  qrRotation?: number; // 0/90/180/270
  qrMask?: string; // e.g., "M2"
  qrErrorLevel?: string; // e.g., "S7"
  textFont?: string; // e.g., "ROMAN.TTF"
  textRotation?: number; // 0/90/180/270
  textXMul?: number; // horizontal scale
  textYMul?: number; // vertical scale
};

export type LabelData = { qr: string; name: string; id: string };

const defaultOptions: Required<TscLabelOptions> = {
  widthMm: 108,
  heightMm: 25,
  gapMm: 3,
  speed: 5,
  density: 7,
  ribbonOn: true,
  tearOn: true,
  codepage: 1252,
  qrPositions: [
    { x: 824, y: 170 },
    { x: 600, y: 170 },
    { x: 377, y: 170 },
    { x: 153, y: 170 },
  ],
  textPositions: [
    { x: 815, y: 61 },
    { x: 591, y: 61 },
    { x: 368, y: 61 },
    { x: 144, y: 61 },
  ],
  idTextPositions: [
    { x: 815, y: 90 },
    { x: 591, y: 90 },
    { x: 368, y: 90 },
    { x: 144, y: 90 },
  ],
  qrModel: "L",
  qrSize: 5,
  qrRotation: 180,
  qrMask: "M2",
  qrErrorLevel: "S7",
  textFont: "ROMAN.TTF",
  textRotation: 180,
  textXMul: 1,
  textYMul: 8,
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
  ].join("\n");
}

function pageBlock(values: string[], opts: Required<TscLabelOptions>): string {
  const lines: string[] = [];
  lines.push(
    `<xpml><page quantity='1' pitch='${opts.heightMm.toFixed(
      1
    )} mm'></xpml>SET TEAR ${opts.tearOn ? "ON" : "OFF"}`
  );
  lines.push("CLS");

  // QRCODEs
  for (let i = 0; i < values.length; i++) {
    const val = values[i];
    const pos = opts.qrPositions[i];
    if (!pos) break;
    lines.push(
      `QRCODE ${pos.x},${pos.y},${opts.qrModel},${opts.qrSize},A,${opts.qrRotation},${opts.qrMask},${opts.qrErrorLevel},"${val}"`
    );
  }

  lines.push(`CODEPAGE ${opts.codepage}`);

  // TEXT below each QR
  for (let i = 0; i < values.length; i++) {
    const val = values[i];
    const pos = opts.textPositions[i];
    if (!pos) break;
    lines.push(
      `TEXT ${pos.x},${pos.y},"${opts.textFont}",${opts.textRotation},${opts.textXMul},${opts.textYMul},"${val}"`
    );
  }

  lines.push("PRINT 1,1");
  lines.push("<xpml></page></xpml>");
  return lines.join("\n");
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
  return [head, ...pages, endTag].join("\n");
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

  // QRCODEs
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const pos = opts.qrPositions[i];
    if (!pos) break;
    const qrv = sanitizeTsplValue(it.qr);
    lines.push(
      `QRCODE ${pos.x},${pos.y},${opts.qrModel},${opts.qrSize},A,${opts.qrRotation},${opts.qrMask},${opts.qrErrorLevel},"${qrv}"`
    );
  }

  lines.push(`CODEPAGE ${opts.codepage}`);

  // Name text
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const pos = opts.textPositions[i];
    if (!pos) break;
    const name = sanitizeTsplValue(it.name);
    lines.push(
      `TEXT ${pos.x},${pos.y},"${opts.textFont}",${opts.textRotation},${opts.textXMul},${opts.textYMul},"${name}"`
    );
  }

  // Product ID text
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const pos = opts.idTextPositions[i];
    if (!pos) break;
    const id = sanitizeTsplValue(it.id);
    lines.push(
      `TEXT ${pos.x},${pos.y},"${opts.textFont}",${opts.textRotation},${opts.textXMul},${opts.textYMul},"${id}"`
    );
  }

  lines.push("PRINT 1,1");
  lines.push("<xpml></page></xpml>");
  return lines.join("\n");
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
  return [head, ...pages, endTag].join("\n");
}
