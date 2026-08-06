import {
  isCurrentWallpaperRun,
  nextWallpaperRun,
} from "components/system/Desktop/Wallpapers/constants";
import { type WallpaperConfig } from "components/system/Desktop/Wallpapers/types";
import {
  config as vantaConfig,
  disableControls,
} from "components/system/Desktop/Wallpapers/vantaWaves/config";
import { type VantaWavesConfig } from "components/system/Desktop/Wallpapers/vantaWaves/types";
import { loadFiles } from "utils/functions";

export const libs = [
  "/System/Vanta.js/three.min.js",
  "/System/Vanta.js/vanta.waves.min.js",
];

const vantaWaves = (
  el: HTMLElement | null,
  config?: WallpaperConfig,
  fallback?: () => void
): void => {
  const runId = nextWallpaperRun();
  const isStale = (): boolean => !isCurrentWallpaperRun(runId);
  const { VANTA: { current: currentEffect } = {} } = window;

  try {
    currentEffect?.destroy();
  } catch {
    // Failed to cleanup effect
  }

  if (!el || typeof WebGLRenderingContext === "undefined") return;

  loadFiles(libs, true)
    .then(() => {
      if (isStale()) return;

      const { VANTA: { WAVES } = {} } = window;

      if (!WAVES) {
        fallback?.();

        return;
      }

      try {
        const { material, waveSpeed } = config as VantaWavesConfig;
        const wavesConfig = {
          ...vantaConfig,
          waveSpeed: vantaConfig.waveSpeed * waveSpeed,
        };

        wavesConfig.material.options.wireframe = material.options.wireframe;

        const effect = WAVES({
          el,
          ...disableControls,
          ...wavesConfig,
        });
        const destroyEffect = (): void => {
          try {
            effect.destroy();
          } catch {
            // Failed to cleanup effect
          }
        };

        // A newer wallpaper took over while WAVES was initializing.
        if (isStale()) {
          destroyEffect();

          return;
        }

        window.WallpaperDestroy = () => {
          destroyEffect();
          window.WallpaperDestroy = undefined;
        };
      } catch {
        if (!isStale()) fallback?.();
      }
    })
    .catch(() => {
      if (!isStale()) fallback?.();
    });
};

export default vantaWaves;
