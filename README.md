# yassinOS

A web-based “desktop OS” experience that powers the inner environment of my personal portfolio: **[yassin.app](https://yassin.app)**.

Live (when deployed): **os.yassin.app**

---

## Overview

**yassinOS** is an interactive, browser-based OS-style UI (windows, apps, draggable/resizable panels, etc.). It is designed to be explored on a **computer** (mouse/keyboard).

---

## Tech Stack

- **Next.js / React**
- **TypeScript**
- **CSS / UI components** (project-specific)

---

## Getting Started (Local)

### Prerequisites
- **Node.js** (recommended: current LTS)
- **npm** (or your preferred package manager)

### Install dependencies
```bash
npm install
```

### Run the dev server
```bash
npm run dev
```

Then open the local URL shown in your terminal.

---

## Production Build

```bash
npm run build
npm run start
```

---

## Docker (Optional)

If your repo includes a Dockerfile, you can build and run locally like this:

```bash
docker build -t yassinos .
docker run --rm -p 3000:3000 yassinos
```

Then visit:
- `http://localhost:3000`

---

## Relationship to yassin.app

This repo is the **inner site** used by my portfolio’s outer layer:

- Outer site repo: **yassin.app** (the “computer/scene” layer)
- Inner site repo: **yassinOS** (this repo)

---

## Credits

- **Based on** [daedalOS](https://github.com/DustinBrett/daedalOS) by **Dustin Brett**: https://github.com/DustinBrett

---

## Notes

- Best experienced on a **computer** (mouse + keyboard).
- If you find bugs or have ideas for improvements, feel free to open an issue or message me.
