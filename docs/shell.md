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

The opt-in compositor, when framed with `embed=1`, uses the same parser. It answers hello with `ready` and a state for `frame-monitor`, and it honors pause and resume. It ignores `open`. It does not import `utils/embedBridge.ts`.

## What `?shell=next` draws

One dark surface and one window. The window comes from the `frame-monitor` manifest: a frame-time readout from `requestAnimationFrame` and `performance.now()`, plus `hardwareConcurrency`, `deviceMemory` when the browser exposes it, and a WebGPU adapter name when `navigator.gpu` works. Missing APIs stay missing. Arrow keys move the window. Shift and an arrow key resizes it. Drag the title. Drag the corner. The window is one keyboard stop.

Local is the session this page actually runs. Stream and Lab are labels and do nothing. There is no Moonlight client here.

The chrome is original. It does not import `components/system` or `contexts/process`.

## Later, not this change

1. More than one app, behind a sandbox, still off the default boot.
2. An origin-private file area and a layout snapshot for the new shell only.
3. A real session picker. Stream only when a Moonlight client is actually integrated. Lab only as a launcher for a machine he is already allowed to use.
4. Leave the fork network only after a cold load no longer imports `components/system` or `contexts/process`, and any leftover daedalOS tree is a credited vendor folder with Dustin Brett's notice still on it.
