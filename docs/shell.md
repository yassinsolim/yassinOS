# yassinOS shell

The desktop that boots on `/` is still daedalOS. `?shell=next` is an opt-in compositor. This repository stays in the daedalOS fork network.

## What a cold load does

daedalOS provides the window manager, the taskbar, BrowserFS, and the process directory. `pages/index.tsx` does not import `shell/`. `pages/_app.tsx` still wraps that page in the classic providers. The site is a static export, so a request cannot be rewritten. A script at the start of the document checks the query before daedalOS boots. Exact `shell=next` on `/` goes to `/next` and keeps the rest of the query. Any other visit continues into the classic page. `/next` does not mount the daedalOS providers.

`LICENSE` names Dustin Brett for the original work and Yassin Soliman for the modifications.

## Room messages

`utils/embedBridge.ts` checks parent messages with `shell/protocol`. The classic bridge still owns posting, the early hello, pause, and which daedalOS app opens. The accepted shapes are unchanged:

- `yassinos:hello` with an integer `protocol` of 1 or higher, display `main` or omitted, a positive size, and tier `high` or `low`.
- `yassinos:pause`, `yassinos:resume`, and `yassinos:open`.

`acceptRoomHello` is stricter and only accepts protocol 1. The running embed parser does not use that strict check, so a newer hello still gets through.

The opt-in compositor, when framed with `embed=1`, uses the same parser. It answers hello with `ready` and a state for the apps that are actually open. It honors pause and resume by telling each guest to stop. It ignores `open`. It does not import `utils/embedBridge.ts`.

## What `?shell=next` draws

A dark surface, a launcher, and a task row. Each app comes from a manifest in `shell/manifest.ts`: a stable id, a short title, a letter mark, an entry type (`dom` or `worker`), the capabilities it may ask for, and the window's starting size. Manifests are checked when the registry loads and again in tests.

Three apps ship:

- Frame time, a `dom` guest. After the parent grants `frame-time`, it samples `requestAnimationFrame` inside the frame and reads cores, device memory, and whether WebGPU is present. Missing APIs stay missing.
- Wasm pace, a `worker` guest. The parent keeps a small original Wasm module (`step`, one multiply-add). The guest may run it only after the parent grants `wasm-bench` and sends those bytes. The worker is created inside the guest, then the guest reports steps, milliseconds, and the checksum.
- Files, a `dom` guest. It lists, reads, writes, and deletes text files in its own namespace. It can also read one shared note. It cannot see another app's files.

Launch, hide, restore, and close are on the shell. Arrow keys move the focused window. Shift and an arrow key resizes it. Drag the title. Drag the corner. Local is the session this page runs. Stream and Lab are labels and do nothing. There is no Moonlight client here.

The chrome is original. It does not import `components/system` or `contexts/process`.

## Sandbox

Each window hosts one iframe. The sandbox token is `allow-scripts` only. `allow-same-origin` is not set, so the guest origin is opaque (`null`) and is not the parent origin. The guest document is `srcdoc` written by the shell. It is not a remote page.

The guest talks to the shell with protocol 1 messages (`shell:ready`, `shell:request`, `shell:grant`, `shell:result`, `shell:deny`, `shell:pause`, `shell:resume`). The shell accepts a message only when all of these hold:

- `event.source` is that iframe's `contentWindow`
- `event.origin` is `null`
- `protocol` is exactly 1 and the payload matches the schema
- a request names a capability on that app's manifest

Anything else is dropped. A request for a capability the manifest does not list is answered with `shell:deny` and no Wasm bytes.

Parent to guest uses `postMessage` on that content window with target origin `*`, because an opaque origin has no stable name. The call is not a broadcast. Guest to parent uses the parent's real origin.

What this stops: the guest reading the parent DOM, parent cookies, or parent storage, and navigating the top window. The Wasm module is not in the guest document. A denied request does not receive it. File bytes stay in the parent. The guest receives text, not a `FileSystemHandle`.

## Files and layout

The shell store is named `yassinos-shell`, version 1. It uses the origin-private file system when `navigator.storage.getDirectory` exists, IndexedDB otherwise, and an in-memory map if both fail. It does not open, read, or write daedalOS BrowserFS data. There is no cloud sync. A storage failure still boots the desktop.

Each file name is one segment: letters, numbers, dot, underscore, or hyphen. `..`, slashes, and backslashes are rejected. Keys look like `v1/apps/<appId>/<name>`. The shared note is `v1/shared/readme.txt` and is read-only. A file is at most 64 KB. An app is at most 32 files and 256 KB. A file message larger than 80 KB is dropped. While the room has paused the shell, file operations return `paused`.

The layout snapshot is `v1/layout.json`, version 1. It stores app ids, process ids, bounds, hidden state, z-order, and focus. It does not store iframe objects. On boot the shell clamps bounds to the current display, skips unknown apps and invalid numbers, and ignores any snapshot whose version is not 1. Reset layout clears that snapshot. Reset storage deletes the shell prefix, including files and the snapshot, after a confirmation. Neither reset touches BrowserFS.

What this does not stop:

- The guest can still use browser APIs the browser gives an opaque origin, including a timer loop. `frame-time` is cooperative for that reason. The Wasm bytes are the part the parent can actually withhold.
- Pause is a message. A guest that ignores `shell:pause` keeps running until the window is closed and the iframe is destroyed.
- This is same-process isolation, not a virtual machine. It does not stop a guest from using CPU.
- The guest document is shell-authored. The boundary is for that guest code, not a loader for third-party URLs.

## Later, not this change

1. A real session picker. Stream only when a Moonlight client is actually integrated. Lab only as a launcher for a machine he is already allowed to use.
2. Leave the fork network only after a cold load no longer imports `components/system` or `contexts/process`, and any leftover daedalOS tree is a credited vendor folder with Dustin Brett's notice still on it.
