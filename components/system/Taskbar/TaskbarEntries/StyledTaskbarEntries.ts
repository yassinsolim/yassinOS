import styled from "styled-components";

type StyledTaskbarEntriesProps = {
  $clockWidth: number;
  $hasAI: boolean;
  $pinnedCount: number;
};

const StyledTaskbarEntries = styled.ol<StyledTaskbarEntriesProps>`
  column-gap: 1px;
  display: flex;
  height: 100%;
  left: ${({ $pinnedCount, theme }) =>
    theme.sizes.taskbar.button.width * (2 + $pinnedCount)}px;
  margin: 0 3px;
  overflow: hidden;
  position: absolute;
  right: ${({ $clockWidth, $hasAI, theme }) =>
    `calc(${$clockWidth}px + ${theme.sizes.clock.padding * 2}px + ${$hasAI ? theme.sizes.taskbar.ai.buttonWidth : "0px"})`};
`;

export default StyledTaskbarEntries;
