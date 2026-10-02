export type AppManifest = {
  appId: string;
  height: number;
  title: string;
  width: number;
};

export const FRAME_MONITOR: AppManifest = {
  appId: "frame-monitor",
  height: 280,
  title: "Frame time",
  width: 360,
};
