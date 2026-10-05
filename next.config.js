// @ts-check

const isProduction = process.env.NODE_ENV === "production";

const bundleAnalyzer = process.env.npm_config_argv?.includes(
  "build:bundle-analyzer"
);

const path = require("path");
const webpack = require("webpack");

/**
 * @type {import("next").NextConfig}
 * */
const nextConfig = {
  allowedDevOrigins: [
    "http://100.82.50.78",
    "http://100.82.50.78:3000",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ],
  compiler: {
    reactRemoveProperties: isProduction,
    removeConsole: isProduction,
    styledComponents: {
      displayName: false,
      fileName: false,
      minify: isProduction,
      pure: true,
      ssr: true,
      transpileTemplateLiterals: true,
    },
  },
  devIndicators: false,
  headers: async () => [
    {
      source: "/:path*",
      headers: [
        {
          key: "Cross-Origin-Opener-Policy",
          value: "same-origin",
        },
        {
          key: "Cross-Origin-Embedder-Policy",
          value: "credentialless",
        },
      ],
    },
    // the room kit yassin.app loads (theme, span wallpaper, poster). public
    // files fetched without credentials, so any origin may read them
    {
      source: "/embed/:path*",
      headers: [
        {
          key: "Access-Control-Allow-Origin",
          value: "*",
        },
        {
          key: "Cross-Origin-Resource-Policy",
          value: "cross-origin",
        },
      ],
    },
    // icons, the room wallpaper and the favicons change rarely: a repeat visit
    // shows them from cache and checks for a newer copy in the background,
    // instead of asking about each one before it can draw
    ...[
      "/System/Icons/:path*",
      "/embed/:path*",
      "/favicon.ico",
      "/pfp.png",
    ].map((source) => ({
      source,
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=3600, stale-while-revalidate=604800",
        },
      ],
    })),
  ],
  output: "export",
  productionBrowserSourceMaps: false,
  reactProductionProfiling: false,
  reactStrictMode: !isProduction,
  webpack: (config) => {
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(/node:/, (resource) => {
        const mod = resource.request.replace(/^node:/, "");

        switch (mod) {
          case "buffer":
            resource.request = "buffer";
            break;
          case "stream":
            resource.request = "readable-stream";
            break;
          default:
            throw new Error(`Not found ${mod}`);
        }
      }),
      new webpack.DefinePlugin({
        __REACT_DEVTOOLS_GLOBAL_HOOK__: "({ isDisabled: true })",
      })
    );

    config.resolve.alias = config.resolve.alias || {};
    config.resolve.alias["MediaInfoModule.wasm"] = path.resolve(
      __dirname,
      "public/System/mediainfo.js/MediaInfoModule.wasm"
    );

    config.resolve.fallback = config.resolve.fallback || {};
    config.resolve.fallback.module = false;
    config.resolve.fallback.perf_hooks = false;

    config.module.parser.javascript = config.module.parser.javascript || {};
    config.module.parser.javascript.dynamicImportFetchPriority = "high";

    return config;
  },
};

module.exports = bundleAnalyzer
  ? require("@next/bundle-analyzer")({
      enabled: isProduction,
    })(nextConfig)
  : nextConfig;
