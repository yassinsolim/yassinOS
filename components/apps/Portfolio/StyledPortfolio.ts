import styled from "styled-components";

// yassin.app's palette turned to paper: white page, near black ink, hairlines,
// and black for whatever is picked or pressed
const StyledPortfolio = styled.div`
  --ink: #0c0c0d;
  --body: #2c2c2e;
  --muted: #55555a;
  --faint: #6e6e73;
  --line: rgb(12 12 13 / 9%);
  --line-strong: rgb(12 12 13 / 22%);
  --fill: rgb(12 12 13 / 4.5%);

  background: #fff;
  color: var(--ink);
  container-type: inline-size;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue",
    Arial, sans-serif;
  font-size: 14px;
  height: 100%;
  line-height: 1.55;
  overflow: hidden;
  width: 100%;

  /* the desktop turns text selection off everywhere; this text should copy */
  *,
  *::before,
  *::after {
    cursor: auto;
    user-select: text;
  }

  h1,
  h2,
  h3,
  p,
  ul,
  dl,
  dd {
    margin: 0;
  }

  button {
    font: inherit;
  }

  button:focus-visible {
    border-radius: 6px;
    outline: 2px solid var(--ink);
    outline-offset: 2px;
  }

  .scroll {
    height: 100%;
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  .layout {
    display: grid;
    gap: 56px;
    grid-template-columns: 220px minmax(0, 1fr);
    margin: 0 auto;
    max-width: 1080px;
    padding: 44px 44px 72px;
  }

  .sidebar {
    align-self: start;
    display: flex;
    flex-direction: column;
    gap: 20px;
    position: sticky;
    top: 44px;
  }

  h1 {
    font-size: 26px;
    font-weight: 600;
    letter-spacing: -0.015em;
    line-height: 1.15;
  }

  .headline {
    color: var(--muted);
    font-size: 13.5px;
    line-height: 1.45;
    margin-top: 6px;
  }

  .headline + .headline {
    margin-top: 2px;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .button {
    align-items: center;
    background: #fff;
    border: 1px solid var(--line-strong);
    border-radius: 8px;
    color: var(--ink);
    cursor: pointer;
    display: inline-flex;
    font-size: 12.5px;
    height: 30px;
    padding: 0 12px;
    transition:
      background-color 120ms ease,
      border-color 120ms ease;

    &:hover {
      border-color: var(--ink);
    }
  }

  .button.primary {
    background: var(--ink);
    border-color: var(--ink);
    color: #fff;

    &:hover {
      background: #2c2c2e;
    }
  }

  .meta {
    color: var(--faint);
    font-size: 12px;
    line-height: 1.6;
  }

  .nav {
    display: flex;
    flex-direction: column;
  }

  .nav button {
    background: none;
    border: 0;
    border-left: 2px solid var(--line);
    color: var(--muted);
    cursor: pointer;
    font-size: 13px;
    padding: 6px 0 6px 14px;
    text-align: left;
    transition:
      border-color 120ms ease,
      color 120ms ease;

    &:hover {
      color: var(--ink);
    }
  }

  .nav button.active {
    border-left-color: var(--ink);
    color: var(--ink);
    font-weight: 600;
  }

  .main {
    display: flex;
    flex-direction: column;
    gap: 52px;
    min-width: 0;
  }

  .label {
    align-items: center;
    color: var(--muted);
    display: flex;
    flex: 1;
    font-size: 11.5px;
    font-weight: 600;
    gap: 12px;
    letter-spacing: 0.12em;
    margin-bottom: 18px;
    text-transform: uppercase;

    &::after {
      background: var(--line);
      content: "";
      flex: 1;
      height: 1px;
    }
  }

  .label-row {
    align-items: center;
    display: flex;
    gap: 14px;
    margin-bottom: 18px;

    .label {
      margin-bottom: 0;
    }
  }

  .count {
    color: var(--faint);
    font-weight: 500;
    letter-spacing: 0.04em;
  }

  .lede {
    font-size: 17px;
    line-height: 1.5;
  }

  .body {
    color: var(--body);
  }

  .lede + .body {
    margin-top: 10px;
  }

  .facts {
    display: grid;
    gap: 14px 24px;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    margin-top: 22px;
  }

  .facts dt,
  .skill-row dt {
    color: var(--faint);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .facts dd {
    font-size: 13.5px;
    margin-top: 2px;
  }

  .entries {
    display: flex;
    flex-direction: column;
  }

  .entry {
    border-top: 1px solid var(--line);
    padding: 22px 0;

    &:first-child {
      border-top: 0;
      padding-top: 0;
    }
  }

  .entry-head,
  .card-head {
    align-items: baseline;
    display: flex;
    flex-wrap: wrap;
    gap: 2px 16px;
    justify-content: space-between;
  }

  h3 {
    font-size: 15px;
    font-weight: 600;
    line-height: 1.35;
  }

  .org {
    color: var(--muted);
    font-size: 13px;
    margin-top: 2px;
  }

  .date {
    color: var(--faint);
    font-size: 12.5px;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .points {
    color: var(--body);
    display: flex;
    flex-direction: column;
    font-size: 13.5px;
    gap: 6px;
    list-style: disc;
    margin-top: 12px;
    padding-left: 18px;

    li::marker {
      color: var(--faint);
    }
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    list-style: none;
    margin-top: 12px;
    padding: 0;

    li {
      background: var(--fill);
      border-radius: 6px;
      color: #3a3a3c;
      font-size: 11.5px;
      line-height: 1.5;
      padding: 2px 8px;
    }
  }

  .links {
    display: flex;
    flex-wrap: wrap;
    gap: 2px 16px;
    margin-top: 10px;
  }

  .text-button {
    background: none;
    border: 0;
    color: var(--ink);
    cursor: pointer;
    font-size: 12.5px;
    font-weight: 500;
    padding: 4px 0;
    text-decoration: underline;
    text-decoration-color: var(--line-strong);
    text-underline-offset: 3px;
    white-space: nowrap;

    &:hover {
      text-decoration-color: var(--ink);
    }
  }

  .cards {
    align-items: start;
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }

  .card {
    border: 1px solid var(--line);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 16px 16px 10px;
    transition: border-color 120ms ease;

    &:hover {
      border-color: var(--line-strong);
    }

    .body {
      font-size: 13.5px;
    }

    .points,
    .tags,
    .links {
      margin-top: 2px;
    }
  }

  .skills {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .skill-row {
    display: grid;
    gap: 6px 20px;
    grid-template-columns: 150px minmax(0, 1fr);

    dt {
      padding-top: 4px;
    }

    .tags {
      margin-top: 0;
    }
  }

  .sub {
    color: var(--faint);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.1em;
    margin-top: 16px;
    text-transform: uppercase;
  }

  .sub + .tags {
    margin-top: 8px;
  }

  /* one column: the sidebar's parts join the page, and the section links
     stay on top as a row */
  @container (width < 760px) {
    .layout {
      gap: 0;
      grid-template-columns: minmax(0, 1fr);
      padding: 0 20px 48px;
    }

    .sidebar {
      display: contents;
    }

    .identity {
      padding-top: 24px;
    }

    .actions {
      margin-top: 14px;
    }

    .meta {
      margin-top: 10px;
    }

    .nav {
      backdrop-filter: blur(8px);
      background: rgb(255 255 255 / 92%);
      border-bottom: 1px solid var(--line);
      flex-direction: row;
      gap: 4px;
      margin: 14px -20px 24px;
      overflow-x: auto;
      padding: 8px 20px;
      position: sticky;
      scrollbar-width: none;
      top: 0;
      z-index: 1;
    }

    .nav button {
      border: 0;
      border-radius: 999px;
      flex: none;
      padding: 5px 11px;
    }

    .nav button.active {
      background: var(--ink);
      color: #fff;
    }

    .skill-row {
      grid-template-columns: minmax(0, 1fr);
    }
  }
`;

export default StyledPortfolio;
