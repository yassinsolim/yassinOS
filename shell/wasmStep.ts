// a tiny original module: one i32 multiply-add, exported as step.
// bytes are the whole binary. guests do not get a copy until the parent allows it.
export const WASM_STEP: readonly number[] = [
  0, 97, 115, 109, 1, 0, 0, 0, 1, 6, 1, 96, 1, 127, 1, 127, 3, 2, 1, 0, 7, 8, 1,
  4, 115, 116, 101, 112, 0, 0, 10, 17, 1, 15, 0, 32, 0, 65, 141, 243, 101, 108,
  65, 223, 230, 187, 99, 106, 11,
];

export const WASM_STEP_OF_ONE = 4234702060;

export const runWasmStep = async (value: number): Promise<number> => {
  const compiled = await WebAssembly.instantiate(Uint8Array.from(WASM_STEP));
  const exported = compiled.instance.exports.step;

  if (typeof exported !== "function") throw new Error("missing step");

  const next: unknown = Reflect.apply(exported, undefined, [value]);

  if (typeof next !== "number") throw new Error("step did not return a number");

  return next < 0 ? next + 2 ** 32 : next;
};
export const WASM_BENCH_STEPS = 200000;

export const WASM_WORKER_SOURCE = [
  "self.onmessage = async (event) => {",
  "  const data = event.data;",
  '  if (!data || data.type !== "run" || !Array.isArray(data.module)) {',
  '    self.postMessage({ type: "fail" });',
  "    return;",
  "  }",
  "  try {",
  "    const compiled = await WebAssembly.instantiate(new Uint8Array(data.module));",
  "    const step = compiled.instance.exports.step;",
  '    if (typeof step !== "function") throw new Error("missing step");',
  `    const steps = ${WASM_BENCH_STEPS};`,
  "    let value = 1;",
  "    const started = performance.now();",
  "    for (let index = 0; index < steps; index += 1) value = step(value);",
  "    self.postMessage({",
  "      elapsed: performance.now() - started,",
  "      sample: value >>> 0,",
  "      steps,",
  '      type: "done"',
  "    });",
  "  } catch (error) {",
  '    self.postMessage({ type: "fail" });',
  "  }",
  "};",
].join("\n");
