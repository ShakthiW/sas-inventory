import {
  type LabelData,
  type TscLabelOptions,
  appendWithBlank,
  finalizeTemplateLines,
  sanitizeTsplValue,
} from "./types";

const defaultQrPositions = [
  { x: 819, y: 175 },
  { x: 595, y: 175 },
  { x: 372, y: 175 },
  { x: 148, y: 175 },
];

const NAME_TEXT_OFFSET = { dx: 12, dy: -137 };

const defaultNameTextPositions = defaultQrPositions.map(({ x, y }) => ({
  x: x + NAME_TEXT_OFFSET.dx,
  y: y + NAME_TEXT_OFFSET.dy,
}));

const defaultIdTextPositions = defaultNameTextPositions;

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
  nameTextXMul: 10,
  nameTextYMul: 10,
  itemsPerRow: 4,
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

export function generate25x25(
  labels: LabelData[],
  options?: TscLabelOptions
): string {
  const opts = {
    ...defaultOptions,
    ...(options || {}),
  } as Required<TscLabelOptions>;
  
  // Default to 4 if not specified
  const itemsPerRow = options?.itemsPerRow || 4;
  
  const head = headerBlock(opts);
  const pages: string[] = [];
  for (let i = 0; i < labels.length; i += itemsPerRow) {
    const slice = labels.slice(i, i + itemsPerRow);
    pages.push(pageBlockForLabels(slice, opts));
  }
  const endTag = `<xpml><end/></xpml>`;
  return [head, ...pages, endTag].join("");
}
