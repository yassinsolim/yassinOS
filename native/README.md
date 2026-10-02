# yassinOS desktop bridge

Optional Tauri 2 wrapper. The website does not include it, and the website still cannot speak Moonlight.

The window loads three local files: `ui/index.html`, `ui/bridge.js`, and `ui/bridge.css`. It does not open a localhost server and it does not load remote pages. A navigation hook allows only the Tauri asset host and those file names.

Commands are allowlisted in `src-tauri/permissions/stream.toml`. The list is status, load, save, preview, launch, cancel, launch status, and a Lab stub. There is no shell plugin. The program path cannot be chosen by the page. Launch and save refuse to run unless `confirmed` is true.

Moonlight is discovered from fixed install paths. The command is the Moonlight binary, then `stream`, the host, and the app name. Preview prints that command and does not start it. Config stores a label, a host, and an app name. It rejects secret fields.

```sh
cargo test -p yassin-os-moonlight --manifest-path native/Cargo.toml
cargo build -p yassin-os-bridge --manifest-path native/Cargo.toml
```

Lab does not launch. Pairing stays in the Moonlight app.
