import { type VantaWavesConfig } from "components/system/Desktop/Wallpapers/vantaWaves/types";

export const config: VantaWavesConfig = {
  backgroundColor: "#000000",
  camera: {
    far: 400,
    fov: 30,
    near: 0.1,
  },
  color: "#909090",
  colorCycleSpeed: 6,
  forceAnimate: true,
  hh: 50,
  hue: 0,
  lightness: 40,
  material: {
    options: {
      fog: false,
      wireframe: false,
    },
  },
  saturation: 0,
  shininess: 35,
  waveHeight: 20,
  waveSpeed: 0.25,
  ww: 50,
};

export const disableControls = {
  gyroControls: false,
  mouseControls: false,
  mouseEase: false,
  touchControls: false,
};
