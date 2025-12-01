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
  padding: 18px 20px 24px;
  width: 100%;

  header {
    align-items: center;
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
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
  }

  .card {
    background: rgb(255 255 255 / 4%);
    border: 1px solid rgb(255 255 255 / 7%);
    border-radius: 14px;
    box-shadow: 0 16px 35px rgb(0 0 0 / 30%);
    padding: 14px 16px;
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
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
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
    margin: 8px 0 0 14px;
  }

  .sections {
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
`;

export default StyledPortfolio;
