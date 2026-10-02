import { type AppManifest } from "shell/manifest";
import { WASM_WORKER_SOURCE } from "shell/wasmStep";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const HOST_SOURCE = [
  "const config = JSON.parse(document.getElementById('config').textContent);",
  "const out = document.getElementById('out');",
  "const run = document.getElementById('run');",
  "const meter = document.getElementById('meter');",
  "let granted = [];",
  "let paused = false;",
  "let frame = 0;",
  "let worker;",
  "let workerUrl = '';",
  "let pending = '';",
  "const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;",
  "const send = (message) => parent.postMessage(Object.assign({ protocol: 1 }, message), parent.origin);",
  "const stopWorker = () => {",
  "  if (worker) worker.terminate();",
  "  worker = undefined;",
  "  if (workerUrl) URL.revokeObjectURL(workerUrl);",
  "  workerUrl = '';",
  "};",
  "const writeFrame = (mean, cores, memory, gpu) => {",
  "  out.textContent = 'About ' + mean.toFixed(1) + ' ms a frame. ' + (cores ? cores + ' logical cores' : 'Core count hidden') + (memory ? ', ' + memory + ' GB' : '') + '. ' + gpu + '.';",
  "  meter.style.width = Math.max(4, Math.min(100, mean > 0 ? 1600 / mean : 4)) + '%';",
  "};",
  "const startFrames = () => {",
  "  cancelAnimationFrame(frame);",
  "  let previous = performance.now();",
  "  let lastPublish = 0;",
  "  const samples = [];",
  "  const cores = navigator.hardwareConcurrency || 0;",
  "  const memory = navigator.deviceMemory || 0;",
  "  let gpu = 'Checking WebGPU';",
  "  const tick = (now) => {",
  "    const elapsed = now - previous;",
  "    previous = now;",
  "    samples.push(elapsed);",
  "    if (samples.length > 30) samples.shift();",
  "    let sum = 0;",
  "    for (let index = 0; index < samples.length; index += 1) sum += samples[index];",
  "    const mean = sum / samples.length;",
  "    if (!reduceMotion || now - lastPublish > 500 || lastPublish === 0) {",
  "      lastPublish = now;",
  "      writeFrame(mean, cores, memory, gpu);",
  "    }",
  "    frame = requestAnimationFrame(tick);",
  "  };",
  "  frame = requestAnimationFrame(tick);",
  "  if (navigator.gpu) {",
  "    navigator.gpu.requestAdapter().then((adapter) => {",
  "      gpu = adapter ? 'WebGPU adapter present' : 'No WebGPU adapter';",
  "    }).catch(() => { gpu = 'WebGPU adapter could not be read'; });",
  "  } else {",
  "    gpu = 'WebGPU is not in this browser';",
  "  }",
  "};",
  "const runWorker = (module) => {",
  "  stopWorker();",
  "  workerUrl = URL.createObjectURL(new Blob([config.workerSource], { type: 'text/javascript' }));",
  "  worker = new Worker(workerUrl);",
  "  worker.onmessage = (event) => {",
  "    const data = event.data;",
  "    if (!data || data.type !== 'done') out.textContent = 'Wasm did not run.';",
  "    else {",
  "      const rate = data.elapsed > 0 ? Math.round(data.steps / data.elapsed) : 0;",
  "      out.textContent = data.steps + ' steps in ' + data.elapsed.toFixed(1) + ' ms (' + rate + ' steps/ms). Sample ' + data.sample + '.';",
  "    }",
  "    stopWorker();",
  "  };",
  "  worker.postMessage({ module, type: 'run' });",
  "};",
  "window.addEventListener('message', (event) => {",
  "  if (event.source !== parent) return;",
  "  const data = event.data;",
  "  if (!data || data.protocol !== 1) return;",
  "  if (data.type === 'shell:grant' && data.appId === config.appId && Array.isArray(data.capabilities)) {",
  "    granted = data.capabilities;",
  "    if (config.entry === 'worker') run.hidden = false;",
  "    else {",
  "      pending = 'boot';",
  "      send({ capability: config.capability, id: pending, type: 'shell:request' });",
  "    }",
  "  } else if (data.type === 'shell:pause') {",
  "    paused = true;",
  "    cancelAnimationFrame(frame);",
  "    stopWorker();",
  "    out.textContent = 'Paused.';",
  "  } else if (data.type === 'shell:resume') {",
  "    paused = false;",
  "    if (config.entry === 'dom' && granted.indexOf(config.capability) !== -1) startFrames();",
  "  } else if (data.type === 'shell:result' && data.ok && data.id === pending) {",
  "    if (config.entry === 'dom') startFrames();",
  "    else if (Array.isArray(data.module)) runWorker(data.module);",
  "    else out.textContent = 'Wasm module was not sent.';",
  "  } else if (data.type === 'shell:deny') {",
  "    out.textContent = 'Not granted.';",
  "  }",
  "});",
  "run.addEventListener('click', () => {",
  "  if (paused || granted.indexOf(config.capability) === -1) return;",
  "  pending = 'run-' + Date.now();",
  "  send({ capability: config.capability, id: pending, type: 'shell:request' });",
  "});",
  "send({ appId: config.appId, type: 'shell:ready' });",
].join("\n");

const FILES_SOURCE = [
  "const config = JSON.parse(document.getElementById('config').textContent);",
  "const out = document.getElementById('out');",
  "const list = document.getElementById('list');",
  "const nameInput = document.getElementById('name');",
  "const textInput = document.getElementById('text');",
  "let paused = false;",
  "let pending = '';",
  "const send = (message) => parent.postMessage(Object.assign({ protocol: 1 }, message), parent.origin);",
  "const ask = (capability, body) => {",
  "  if (paused) return;",
  "  pending = 'f-' + Date.now();",
  "  send({ body, capability, id: pending, type: 'shell:request' });",
  "};",
  "const showNames = (names) => {",
  "  list.textContent = '';",
  "  names.forEach((name) => {",
  "    const item = document.createElement('li');",
  "    item.textContent = name;",
  "    list.appendChild(item);",
  "  });",
  "  out.textContent = names.length + ' files in this app.';",
  "};",
  "window.addEventListener('message', (event) => {",
  "  if (event.source !== parent || !event.data || event.data.protocol !== 1) return;",
  "  const data = event.data;",
  "  if (data.type === 'shell:grant' && data.appId === config.appId) {",
  "    if (config.capabilities.indexOf('shared-read') !== -1) document.getElementById('shared').hidden = false;",
  "    ask('files', { op: 'list' });",
  "  } else if (data.type === 'shell:pause') {",
  "    paused = true;",
  "    out.textContent = 'Paused.';",
  "  } else if (data.type === 'shell:resume') {",
  "    paused = false;",
  "    ask('files', { op: 'list' });",
  "  } else if (data.type === 'shell:deny') {",
  "    out.textContent = 'Not granted.';",
  "  } else if (data.type === 'shell:result' && data.id === pending) {",
  "    if (Array.isArray(data.files)) showNames(data.files);",
  "    else if (typeof data.text === 'string') { textInput.value = data.text; out.textContent = 'Loaded.'; }",
  "    else if (data.ok) { out.textContent = 'Done.'; ask('files', { op: 'list' }); }",
  "    else out.textContent = data.error || 'Could not use files.';",
  "  }",
  "});",
  "document.getElementById('save').addEventListener('click', () => ask('files', { name: nameInput.value, op: 'write', text: textInput.value }));",
  "document.getElementById('load').addEventListener('click', () => ask('files', { name: nameInput.value, op: 'read' }));",
  "document.getElementById('drop').addEventListener('click', () => ask('files', { name: nameInput.value, op: 'delete' }));",
  "document.getElementById('shared').addEventListener('click', () => ask('shared-read', { name: 'readme.txt', op: 'read-shared' }));",
  "send({ appId: config.appId, type: 'shell:ready' });",
].join("\n");

const filesDocument = (manifest: AppManifest): string => {
  const config = JSON.stringify({
    appId: manifest.appId,
    capabilities: manifest.capabilities,
    title: manifest.title,
  }).replaceAll("<", String.raw`\u003c`);

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(manifest.title)}</title><style>
    body{margin:0;background:#221c16;color:#f4efe6;font:14px/1.45 system-ui,sans-serif}
    button,input,textarea{font:inherit;color:inherit;background:#14110e;border:1px solid #3a322a;border-radius:8px}
    button{border-radius:999px;padding:6px 10px}
    textarea{width:100%;min-height:72px;box-sizing:border-box}
    ul{padding-left:18px}
    @media (prefers-reduced-motion: reduce){*{transition:none;animation:none}}
  </style></head><body>
    <p id="out">Files in this app.</p>
    <label>Name <input id="name" value="note.txt"></label>
    <textarea id="text"></textarea>
    <p><button id="save" type="button">Save</button> <button id="load" type="button">Load</button> <button id="drop" type="button">Delete</button> <button id="shared" type="button" hidden>Read shared</button></p>
    <ul id="list"></ul>
    <script type="application/json" id="config">${config}</script>
    <script>${FILES_SOURCE}</script>
  </body></html>`;
};

export const guestDocument = (manifest: AppManifest): string => {
  if (manifest.capabilities.includes("files")) return filesDocument(manifest);

  const config = JSON.stringify({
    appId: manifest.appId,
    capability: manifest.capabilities[0] ?? "",
    entry: manifest.entry,
    title: manifest.title,
    workerSource: WASM_WORKER_SOURCE,
  }).replaceAll("<", String.raw`\u003c`);

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(manifest.title)}</title><style>
    body{margin:0;background:#221c16;color:#f4efe6;font:14px/1.45 system-ui,sans-serif}
    button{font:inherit;color:inherit;background:#14110e;border:1px solid #3a322a;border-radius:999px;padding:6px 10px}
    #track{height:8px;background:#3a322a;border-radius:99px;overflow:hidden;margin:8px 0}
    #meter{display:block;height:100%;width:4%;background:#e8ff6a}
    @media (prefers-reduced-motion: reduce){#meter{transition:none;animation:none}}
  </style></head><body>
    <p id="out">${manifest.entry === "worker" ? "Run a short Wasm loop in this sandbox." : "Asking for the frame timer."}</p>
    <div id="track" aria-hidden="true"><span id="meter"></span></div>
    <button id="run" type="button" hidden>Run</button>
    <script type="application/json" id="config">${config}</script>
    <script>${HOST_SOURCE}</script>
  </body></html>`;
};
