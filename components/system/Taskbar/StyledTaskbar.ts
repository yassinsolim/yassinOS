import styled from "styled-components";
import { TASKBAR_HEIGHT } from "utils/constants";

const TASKBAR_Z_INDEX = 100000;

// no backdrop blur: one that's always on screen has chrome redraw everything
// behind it every frame, which is what brings a weak gpu (or chrome's software
// path) to a crawl, and over the dark desktop a darker bar looks the same
const StyledTaskbar = styled.nav`
  background-color: ${({ theme }) => theme.colors.taskbar.barBackground};
  bottom: 0;
  contain: size layout;
  height: ${TASKBAR_HEIGHT}px;
  left: 0;
  position: absolute;
  right: 0;
  width: 100vw;
  z-index: ${TASKBAR_Z_INDEX};
`;

export default StyledTaskbar;
