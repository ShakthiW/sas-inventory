import { type LabelData, type TscLabelOptions } from "./templates/types";
import { generate25x25 } from "./templates/size_25x25";
import { generate100x50 } from "./templates/size_100x50";
import { generate100x150 } from "./templates/size_100x150";

export type { LabelData, TscLabelOptions };

export type LabelSize = "25x25" | "100x50" | "100x150";

export function buildTscTxtFromLabelData(
  labels: LabelData[],
  options?: TscLabelOptions,
  size: LabelSize = "25x25"
): string {
  switch (size) {
    case "100x50":
      return generate100x50(labels, options);
    case "100x150":
      return generate100x150(labels, options);
    case "25x25":
    default:
      return generate25x25(labels, options);
  }
}
