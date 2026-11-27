// what the Game Ports app says. taken from the ports' READMEs
// (github.com/yassinsolim/mw3-recomp and its three siblings): keep the frame
// rates and the devices in step with their "Supported devices" tables

const GITHUB = "https://github.com/yassinsolim";

export const links = {
  discord: "https://yassin.app/discord",
  github: `${GITHUB}?tab=repositories&q=recomp`,
};

export const intro = {
  lede: "Four Xbox 360 Call of Duty games running natively on Android handhelds, at about 120 FPS on an AYN Thor and 60 on a Retroid Pocket Flip 2.",
  text: "Not an emulator, and nothing is streamed. The console's PowerPC code is translated ahead of time into C++ and compiled for ARM64, with a small runtime standing in for the console: Vulkan graphics, audio and controllers. Each player builds the game from their own disc.",
};

export const pipeline = [
  { detail: "The game's code, from your own disc", name: "Xbox 360 PowerPC" },
  { detail: "XenonRecomp-based, ahead of time", name: "Static recompiler" },
  { detail: "Generated source, compiled with clang", name: "C++" },
  {
    detail: "Native code and a Vulkan renderer",
    name: "ARM64 Android + Vulkan",
  },
];

export const devices = [
  {
    chip: "Snapdragon 8 Gen 2 · Adreno 740 · 120 Hz screen",
    fps: "~120",
    id: "thor",
    name: "AYN Thor",
  },
  {
    chip: "Snapdragon 865 · Adreno 650 · 60 Hz screen",
    fps: "60",
    id: "flip",
    name: "Retroid Pocket Flip 2",
  },
] as const;

export const ports = [
  {
    flip: "59.5 to 60",
    modes: "Campaign and multiplayer",
    name: "Call of Duty 4: Modern Warfare",
    repo: `${GITHUB}/cod4-recomp`,
    thor: "117 to 119",
    year: "2007",
  },
  {
    flip: "60",
    modes: "Campaign, Special Ops and multiplayer",
    name: "Modern Warfare 2",
    note: "The heaviest views: 102 to 112 FPS on the Thor, 53 to 59 on the Flip 2.",
    repo: `${GITHUB}/mw2-recomp`,
    thor: "119",
    year: "2009",
  },
  {
    flip: "60",
    modes: "Campaign, Special Ops and multiplayer",
    name: "Modern Warfare 3",
    note: "Also builds for Windows PC.",
    repo: `${GITHUB}/mw3-recomp`,
    thor: "118 to 119",
    year: "2011",
  },
  {
    flip: "60",
    modes: "Campaign, multiplayer and Exo Survival",
    name: "Advanced Warfare",
    note: "Built from the game's two discs. The newest port and the least played.",
    repo: `${GITHUB}/aw-recomp`,
    thor: "115 to 119",
    year: "2014",
  },
];

export const upcoming = {
  name: "Advanced Warfare for Nintendo Switch",
  status: "In progress",
};

export const setup = {
  steps: [
    {
      alt: "The launcher's first setup screen, Pick your disc image, with the button Use this file",
      caption: "Pick your disc image",
      src: "/Program Files/GamePorts/setup-1.webp",
    },
    {
      alt: "The launcher's second setup screen, Build the game, with one progress bar",
      caption: "Build the game",
      src: "/Program Files/GamePorts/setup-2.webp",
    },
    {
      alt: "The launcher's last setup screen, Ready to play, with the button Play",
      caption: "Play",
      src: "/Program Files/GamePorts/setup-3.webp",
    },
  ],
  text: "No PC is needed. The app asks for your own disc image, builds the game on the device and starts it. Building Modern Warfare 3 takes about 5 minutes on the AYN Thor and 8 on the Retroid Pocket Flip 2.",
};

export const features = [
  "A guided setup in the app: pick your disc image, build the game, play.",
  "Your own map packs (DLC), copied from your console, are added in the app.",
  "Online play through the project's relay server (not Xbox LIVE), System Link on your own Wi-Fi, and bots in matches your device hosts.",
  "The app updates itself, and rebuilds the game code when an update needs it.",
  "No game files are included or downloaded: you build the game from your own disc.",
];

export const credits =
  "Built on XenonRecomp (hedge-dev), mw2-recompiled (Paul Combal and contributors) and the mw2-android layer. The full credits are in each repository's README.";

export const disclaimer =
  "Unofficial fan projects; not affiliated with Activision, Infinity Ward, Sledgehammer Games, Microsoft or Nintendo. Players use their own copies.";
