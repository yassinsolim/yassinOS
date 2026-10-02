# yassinOS shell

Phase 1 only. The desktop that boots today is still daedalOS. Nothing in `pages/`, `components/`, `contexts/`, `hooks/`, `utils/`, or `styles/` imports `shell/`. Classic behavior stays as it is.

## What ships today

daedalOS provides the window manager, the taskbar, BrowserFS, and the process directory. The room embed (`utils/embedBridge.ts`) speaks protocol 1 with yassin.app. That bridge stays the running path.

`LICENSE` names Dustin Brett for the original work and Yassin Soliman for the modifications. This repository stays in the daedalOS fork network.

## What `shell/` is

A small model that does not mount a desktop:

- A session is `local`, `stream`, or `lab`. There is no Linux, Windows, or macOS theme.
- A process is an app id plus a title. A window is a rectangle, a z-order, and a focus flag on a display.
- `acceptRoomHello` checks a parent hello (protocol 1, display `main` or omitted, a positive size, tier `high` or `low`). It does not open windows and it does not import the embed bridge.

The default snapshot is one `main` display, session `local`, and no windows.

## Later, not this change

1. Point the room embed at `shell/` for message checks, still booting daedalOS.
2. An opt-in compositor (`?shell=next`) with its own chrome, focus, and snap. The room iframe can choose it. Classic remains the default until that compositor is the one a cold load paints.
3. A manifest and a sandbox for new apps. First app: a GPU frame-time monitor.
4. A small origin-private file area and a layout snapshot for the new shell only.
5. A boot picker: Local, Stream (a Moonlight or remote window), Lab (a launcher for a machine he is already allowed to use).

Leave the fork network only after a cold load no longer imports `components/system` or `contexts/process`, and any leftover daedalOS tree is a credited vendor folder with Dustin Brett's notice still on it.
