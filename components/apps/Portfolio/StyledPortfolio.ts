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
  gap: 14px;
  height: 100%;
  overflow: auto;
  padding: 18px 20px 32px;
  width: 100%;

  .content {
    display: flex;
    flex-direction: column;
    gap: 18px;
    margin: 0 auto;
    max-width: 1180px;
    width: 100%;
  }

  header {
    align-items: stretch;
    display: grid;
    gap: 16px;
    grid-template-columns: 1.25fr 0.85fr;
  }

  @media (width <= 960px) {
    header {
      grid-template-columns: 1fr;
    }
  }

  h1 {
    font-size: 26px;
    letter-spacing: 0.3px;
    margin: 0;
  }

  h2 {
    color: #9fb3d1;
    font-size: 16px;
    letter-spacing: 0.15px;
    margin: 0 0 4px;
  }

  p {
    color: #d6deea;
    line-height: 1.5;
    margin: 0;
  }

  .pill-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: flex-start;
    width: 100%;
  }

  .contact-actions {
    margin-top: 10px;
  }

  .pill {
    align-items: center;
    background: rgb(255 255 255 / 8%);
    border: 1px solid rgb(255 255 255 / 8%);
    border-radius: 999px;
    color: #e8edf4;
    cursor: pointer;
    display: inline-flex;
    font-size: 13px;
    gap: 8px;
    padding: 8px 12px;
    text-decoration: none;
    transition:
      transform 120ms ease,
      border-color 120ms ease,
      background-color 120ms ease;

    &:hover {
      background: rgb(88 208 255 / 12%);
      border-color: rgb(88 208 255 / 60%);
      transform: translateY(-1px);
    }

    @media (width <= 560px) {
      justify-content: center;
      width: 100%;
    }
  }

  .card {
    background: rgb(255 255 255 / 4%);
    border: 1px solid rgb(255 255 255 / 7%);
    border-radius: 14px;
    box-shadow: 0 16px 35px rgb(0 0 0 / 30%);
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 0;
    overflow: hidden;
    padding: 16px 18px;
    width: 100%;
  }

  .hero-card {
    gap: 10px;
  }

  .eyebrow {
    color: #7ea2d6;
    font-size: 12px;
    letter-spacing: 1px;
    margin: 0;
    text-transform: uppercase;
  }

  .snapshot-card {
    gap: 10px;
  }

  .card h3 {
    font-size: 16px;
    margin: 0 0 6px;
  }

  .muted {
    color: #9fb3d1;
    font-size: 13px;
    margin-bottom: 8px;
  }

  .grid {
    align-items: stretch;
    display: grid;
    gap: 16px;
    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  }

  .tech {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 8px 0 0;
  }

  .badge {
    background: rgb(88 208 255 / 12%);
    border: 1px solid rgb(88 208 255 / 35%);
    border-radius: 10px;
    color: #b7e8ff;
    font-size: 12px;
    padding: 6px 10px;
  }

  .list {
    color: #d6deea;
    display: flex;
    flex-direction: column;
    gap: 6px;
    line-height: 1.45;
    margin: 8px 0 0;
    padding-left: 18px;
  }

  .sections {
    align-items: start;
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  }

  .section-title {
    align-items: center;
    color: #c6d6ed;
    display: flex;
    font-size: 15px;
    gap: 8px;
    letter-spacing: 0.15px;
    margin: 0 0 6px;
  }

  .section {
    background: rgb(255 255 255 / 4%);
    border: 1px solid rgb(255 255 255 / 6%);
    border-radius: 16px;
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / 6%),
      0 10px 25px rgb(0 0 0 / 25%);
    display: flex;
    flex-direction: column;
    gap: 14px;
    overflow: visible;
    padding: 16px;
  }

  .section-header {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: space-between;
  }

  .stack {
    display: grid;
    gap: 16px;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  }

  @media (width <= 720px) {
    .stack {
      grid-template-columns: 1fr;
    }
  }

  .grid-stack {
    align-items: stretch;
  }
`;

export default StyledPortfolio;
