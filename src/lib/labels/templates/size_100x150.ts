import {
  type LabelData,
  type TscLabelOptions,
  appendWithBlank,
  finalizeTemplateLines,
  sanitizeTsplValue,
} from "./types";

const defaultOptions: Required<TscLabelOptions> = {
  widthMm: 100.5,
  heightMm: 150,
  gapMm: 3,
  speed: 5,
  density: 7,
  ribbonOn: true,
  tearOn: true,
  codepage: 1252,
  // Single label per row
  qrPositions: [{ x: 698, y: 645 }],
  textPositions: [{ x: 696, y: 363 }],
  idTextPositions: [],
  nameTextPositions: [{ x: 696, y: 363 }],
  qrModel: "L",
  qrSize: 10,
  qrRotation: 180,
  qrMask: "M2",
  qrErrorLevel: "S7",
  textFont: "0",
  textRotation: 180,
  textXMul: 22,
  textYMul: 33,
  nameTextFont: "0",
  nameTextRotation: 180,
  nameTextXMul: 22,
  nameTextYMul: 33,
  itemsPerRow: 2,
};

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

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const qrPos = opts.qrPositions[i] || opts.qrPositions[0];
    const namePos = opts.nameTextPositions[i] || opts.nameTextPositions[0];
    
    const qrv = sanitizeTsplValue(item.qr);
    
    appendWithBlank(
      lines,
      `QRCODE ${qrPos.x},${qrPos.y},${opts.qrModel},${opts.qrSize},A,${opts.qrRotation},${opts.qrMask},${opts.qrErrorLevel},"${qrv}"`
    );
    
    if (i === 0) {
      appendWithBlank(lines, `CODEPAGE ${opts.codepage}`);
    }

    if (namePos) {
      const name = sanitizeTsplValue(item.name);
      appendWithBlank(
        lines,
        `TEXT ${namePos.x},${namePos.y},"${opts.nameTextFont}",${opts.nameTextRotation},${opts.nameTextXMul},${opts.nameTextYMul},"${name}"`
      );
    }
  }

  appendWithBlank(lines, "PRINT 1,1");
  appendWithBlank(lines, "<xpml></page></xpml>");
  return finalizeTemplateLines(lines);
}

export function generate100x150(
  labels: LabelData[],
  options?: TscLabelOptions
): string {
  const opts = {
    ...defaultOptions,
    ...(options || {}),
  } as Required<TscLabelOptions>;
  
  // Default to 2 if not specified
  const itemsPerRow = options?.itemsPerRow || 2;
  
  const head = headerBlock(opts);
  const pages: string[] = [];
  for (let i = 0; i < labels.length; i += itemsPerRow) {
    const slice = labels.slice(i, i + itemsPerRow);
    pages.push(pageBlockForLabels(slice, opts));
  }
  const endTag = `<xpml><end/></xpml>`;
  return [head, ...pages, endTag].join("");
}
