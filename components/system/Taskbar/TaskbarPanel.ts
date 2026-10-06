import { type RuleSet, css } from "styled-components";
import { LOW_POWER_CLASS, TASKBAR_HEIGHT } from "utils/constants";

// a backdrop blur has a weak gpu (or chrome's software path) redraw everything
// behind it every frame, so on a low power device the panels go solid instead
export const SolidOnLowPower = css`
  html.${LOW_POWER_CLASS} & {
    backdrop-filter: none;
    background-color: hsl(0 0% 13% / 95%);
  }
`;

const TaskbarPanel = (
  height: number,
  width: number,
  left = 0,
  hasBorder = false
): RuleSet<object> => css`
  background-color: hsl(0 0% 13% / 95%);
  border: ${hasBorder ? "1px solid hsla(0, 0%, 25%, 75%)" : "none"};
  border-bottom-width: 0;
  bottom: ${TASKBAR_HEIGHT}px;
  box-shadow: 3px 0 10px 3px hsl(0 0% 10% / 50%);
  contain: strict;
  display: flex;
  height: 100%;
  left: ${left}px;
  max-height: ${height}px;
  max-width: ${width}px;
  position: absolute;
  width: calc(100% - ${left}px);
  z-index: 10000;

  @supports ((-webkit-backdrop-filter: none) or (backdrop-filter: none)) {
    background-color: hsl(0 0% 13% / 70%);
  }

  ${SolidOnLowPower}
`;

export default TaskbarPanel;
