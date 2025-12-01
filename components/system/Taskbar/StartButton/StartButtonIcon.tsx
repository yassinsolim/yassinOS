import { memo } from "react";

const StartButtonIcon = memo(() => (
  <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(60 60) scale(1.8, 1.6) translate(-60 -60)">
      <path
        d="M28 28h20l12 24 12-24h20l-24 44v20H52V72Z"
        fill="#fff"
        stroke="#fff"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </g>
  </svg>
));

export default StartButtonIcon;
