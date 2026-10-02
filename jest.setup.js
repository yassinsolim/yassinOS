const { TextDecoder, TextEncoder } = require("node:util");

if (typeof globalThis.TextEncoder !== "function") {
  globalThis.TextEncoder = TextEncoder;
  globalThis.TextDecoder = TextDecoder;
}
