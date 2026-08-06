import styled from "styled-components";

const StyledPortfolio = styled.div`
  background:
    radial-gradient(circle at 20% 20%, #122244, #0a1224 38%),
    radial-gradient(circle at 80% 0%, #12324f, transparent 35%),
    linear-gradient(180deg, #0c1428 0%, #0a0f1f 100%);
  color: #e8edf4;
  display: flex;
  flex-direction: column;
  font-family:
    Inter,
    system-ui,
    -apple-system,
    "Segoe UI",
    sans-serif;
  height: 100%;
  overflow: auto;
  padding: 16px 18px 26px;
  width: 100%;

  .content {
    display: flex;
    flex-direction: column;
    gap: 14px;
    margin: 0 auto;
    max-width: 1400px;
    width: 100%;
  }

  header {
    align-items: stretch;
    display: grid;
    gap: 14px;
    grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
  }

  @media (width <= 900px) {
    header {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  h1 {
    font-size: 28px;
    letter-spacing: 0.3px;
    line-height: 1.1;
    margin: 0;
  }

  h2 {
    color: #9fb3d1;
    font-size: 15px;
    letter-spacing: 0.15px;
    margin: 0;
    white-space: pre-line;
  }

  p {
    color: #d6deea;
    line-height: 1.5;
    margin: 0;
  }

  .pill-row {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    width: 100%;
  }

  .contact-actions {
    margin-top: auto;
    padding-top: 10px;
  }

  .pill {
    align-items: center;
    background: rgb(255 255 255 / 8%);
    border: 1px solid rgb(255 255 255 / 8%);
    border-radius: 999px;
    color: #e8edf4;
    cursor: pointer;
    display: inline-flex;
    font-size: 12.5px;
    gap: 6px;
    padding: 6px 12px;
    text-decoration: none;
    transition:
      transform 120ms ease,
      border-color 120ms ease,
      background-color 120ms ease;
    white-space: nowrap;

    &:hover {
      background: rgb(88 208 255 / 12%);
      border-color: rgb(88 208 255 / 60%);
      transform: translateY(-1px);
    }
  }

  .pill.ghost {
    background: transparent;
    font-size: 12px;
    padding: 5px 10px;
  }

  .card {
    background: rgb(255 255 255 / 4%);
    border: 1px solid rgb(255 255 255 / 7%);
    border-radius: 12px;
    box-shadow: 0 14px 30px rgb(0 0 0 / 28%);
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 0;
    min-width: 0;
    padding: 14px 16px;
    width: 100%;
  }

  .hero-card {
    gap: 8px;
  }

  .eyebrow {
    color: #7ea2d6;
    font-size: 11px;
    letter-spacing: 1.2px;
    margin: 0;
    text-transform: uppercase;
  }

  .facts {
    display: grid;
    gap: 6px 12px;
    grid-template-columns: auto minmax(0, 1fr);
    margin-top: 4px;
  }

  .facts dt {
    color: #7ea2d6;
    font-size: 11px;
    letter-spacing: 0.6px;
    margin: 0;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .facts dd {
    color: #d6deea;
    font-size: 12.5px;
    line-height: 1.35;
    margin: 0;
  }

  .card h3 {
    font-size: 15px;
    margin: 0;
  }

  .card-head {
    align-items: baseline;
    display: flex;
    flex-wrap: wrap;
    gap: 4px 10px;
    justify-content: space-between;
  }

  .muted {
    color: #9fb3d1;
    font-size: 12px;
    margin: 0;
    white-space: nowrap;
  }

  .summary {
    color: #c3cfe0;
    font-size: 12.5px;
    line-height: 1.45;
  }

  .tech {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin: 0;
  }

  .badge {
    background: rgb(88 208 255 / 10%);
    border: 1px solid rgb(88 208 255 / 28%);
    border-radius: 8px;
    color: #b7e8ff;
    font-size: 11px;
    padding: 3px 8px;
  }

  .list {
    color: #d6deea;
    display: flex;
    flex-direction: column;
    font-size: 12.5px;
    gap: 5px;
    line-height: 1.45;
    margin: 2px 0 0;
    padding-left: 16px;
  }

  .section {
    background: rgb(255 255 255 / 3%);
    border: 1px solid rgb(255 255 255 / 6%);
    border-radius: 14px;
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / 6%),
      0 10px 25px rgb(0 0 0 / 22%);
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 14px;
  }

  .section-title {
    align-items: baseline;
    color: #c6d6ed;
    display: flex;
    font-size: 14px;
    gap: 8px;
    letter-spacing: 0.4px;
    margin: 0;
    text-transform: uppercase;
  }

  .section-title .count {
    color: #6f88ab;
    font-size: 11px;
    letter-spacing: 0.6px;
  }

  .grid {
    align-items: start;
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }

  .grid-wide {
    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  }

  .split {
    align-items: start;
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  }

  .skill-group + .skill-group {
    margin-top: 10px;
  }

  .skill-group h4 {
    color: #9fb3d1;
    font-size: 12px;
    letter-spacing: 0.4px;
    margin: 0 0 6px;
    text-transform: uppercase;
  }
`;

export default StyledPortfolio;
