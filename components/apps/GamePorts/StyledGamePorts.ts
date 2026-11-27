import styled from "styled-components";

// the Portfolio app's paper (components/apps/Portfolio/StyledPortfolio.ts):
// white page, near black ink, hairlines. the launcher's own navy and orange
// only show in its screenshots
const StyledGamePorts = styled.div`
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
  ol,
  ul {
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

  .page {
    display: flex;
    flex-direction: column;
    gap: 48px;
    margin: 0 auto;
    max-width: 860px;
    padding: 44px 44px 56px;
  }

  .eyebrow {
    color: var(--faint);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.12em;
    margin-bottom: 8px;
    text-transform: uppercase;
  }

  h1 {
    font-size: 26px;
    font-weight: 600;
    letter-spacing: -0.015em;
    line-height: 1.15;
  }

  .lede {
    font-size: 17px;
    line-height: 1.5;
    margin-top: 14px;
  }

  .body {
    color: var(--body);
  }

  .lede + .body {
    margin-top: 10px;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 20px;
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

  .label {
    align-items: center;
    color: var(--muted);
    display: flex;
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

  .count {
    color: var(--faint);
    font-weight: 500;
    letter-spacing: 0.04em;
  }

  .flow {
    align-items: stretch;
    display: grid;
    gap: 8px;
    grid-template-columns: 1fr auto 1fr auto 1fr auto 1fr;
    list-style: none;
    padding: 0;
  }

  .stage {
    --detail: var(--muted);

    border: 1px solid var(--line);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 14px;

    &:last-child {
      --detail: rgb(255 255 255 / 72%);

      background: var(--ink);
      border-color: var(--ink);
      color: #fff;
    }
  }

  .stage-name {
    font-size: 13.5px;
    font-weight: 600;
    line-height: 1.3;
  }

  .stage-detail {
    color: var(--detail);
    font-size: 12px;
    line-height: 1.4;
  }

  .arrow {
    align-self: center;
    display: flex;

    svg {
      fill: none;
      height: 18px;
      stroke: var(--faint);
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-width: 1.6;
      width: 18px;
    }
  }

  .devices {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .device {
    align-items: center;
    border: 1px solid var(--line);
    border-radius: 12px;
    display: flex;
    gap: 18px;
    padding: 16px 18px;
  }

  .handheld {
    fill: none;
    flex: none;
    height: 84px;
    stroke: var(--ink);
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 1.6;
    width: 84px;

    .screen {
      fill: var(--fill);
      stroke-width: 1.2;
    }
  }

  .fps {
    font-size: 30px;
    font-variant-numeric: tabular-nums;
    font-weight: 600;
    letter-spacing: -0.02em;
    line-height: 1.1;

    span {
      color: var(--faint);
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.1em;
    }
  }

  h3 {
    font-size: 15px;
    font-weight: 600;
    line-height: 1.35;
  }

  .device h3 {
    margin-top: 4px;
  }

  .chip {
    color: var(--muted);
    font-size: 12.5px;
  }

  .table-wrap {
    margin-top: 18px;
    overflow-x: auto;
  }

  table {
    border-collapse: collapse;
    font-size: 13.5px;
    font-variant-numeric: tabular-nums;
    width: 100%;
  }

  th,
  td {
    border-bottom: 1px solid var(--line);
    padding: 9px 12px 9px 0;
    text-align: left;
  }

  thead th {
    color: var(--faint);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  tbody th {
    font-weight: 500;
  }

  tbody td {
    color: var(--body);
    white-space: nowrap;
  }

  .note {
    color: var(--faint);
    font-size: 12.5px;
  }

  .table-wrap + .note {
    margin-top: 12px;
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
    gap: 6px;
    padding: 16px 16px 10px;
    transition: border-color 120ms ease;

    &:hover {
      border-color: var(--line-strong);
    }

    .body {
      font-size: 13.5px;
    }
  }

  .card.upcoming {
    border-style: dashed;
    padding-bottom: 16px;
  }

  .card-head {
    align-items: baseline;
    display: flex;
    flex-wrap: wrap;
    gap: 2px 16px;
    justify-content: space-between;
  }

  .date {
    color: var(--faint);
    font-size: 12.5px;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .status {
    background: var(--fill);
    border-radius: 6px;
    color: #3a3a3c;
    font-size: 11.5px;
    line-height: 1.5;
    padding: 2px 8px;
    white-space: nowrap;
  }

  .links {
    display: flex;
    flex-wrap: wrap;
    gap: 2px 16px;
    margin-top: 2px;
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

  .shots {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    list-style: none;
    margin-top: 16px;
    padding: 0;

    li {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    img {
      aspect-ratio: 12 / 5;
      background: #0b1120;
      border: 1px solid var(--line-strong);
      border-radius: 10px;
      cursor: zoom-in;
      display: block;
      height: auto;
      width: 100%;
    }
  }

  .shot {
    background: none;
    border: 0;
    border-radius: 10px;
    cursor: zoom-in;
    padding: 0;
  }

  .caption {
    align-items: center;
    display: flex;
    font-size: 13px;
    font-weight: 500;
    gap: 8px;
  }

  .step {
    align-items: center;
    background: var(--ink);
    border-radius: 999px;
    color: #fff;
    display: inline-flex;
    flex: none;
    font-size: 11px;
    font-weight: 600;
    height: 18px;
    justify-content: center;
    width: 18px;
  }

  .points {
    color: var(--body);
    display: flex;
    flex-direction: column;
    font-size: 13.5px;
    gap: 6px;
    list-style: disc;
    padding-left: 18px;

    li::marker {
      color: var(--faint);
    }
  }

  .foot {
    border-top: 1px solid var(--line);
    color: var(--faint);
    display: flex;
    flex-direction: column;
    font-size: 12px;
    gap: 6px;
    line-height: 1.6;
    padding-top: 18px;
  }

  /* a narrow window or a phone: one column, and the pipeline reads down */
  @container (width < 640px) {
    .page {
      gap: 36px;
      padding: 24px 20px 40px;
    }

    .flow {
      grid-template-columns: minmax(0, 1fr);
    }

    .arrow {
      justify-self: center;

      svg {
        transform: rotate(90deg);
      }
    }

    .devices,
    .shots {
      grid-template-columns: minmax(0, 1fr);
    }
  }
`;

export default StyledGamePorts;
