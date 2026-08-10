import { LAYER_PATHS } from "@core/config";

export const regulatoryLayer = {
  name: "regulatory",
  basePath: LAYER_PATHS.regulatory,
  owner: "compliance-platform"
} as const;
