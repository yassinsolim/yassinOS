import styled from "styled-components";

const StyledPinnedApps = styled.ol`
  column-gap: 1px;
  display: flex;
  height: 100%;
  left: ${({ theme }) => theme.sizes.taskbar.button.width * 2}px;
  list-style: none;
  margin: 0;
  padding: 0;
  position: absolute;

  button {
    align-items: center;
    background: transparent;
    border: 0;
    display: flex;
    height: 100%;
    justify-content: center;
    padding: 0;
    width: ${({ theme }) => theme.sizes.taskbar.button.width}px;

    &:hover {
      background-color: ${({ theme }) => theme.colors.taskbar.hover};
    }

    img {
      height: ${({ theme }) => theme.sizes.taskbar.button.iconSize};
      width: ${({ theme }) => theme.sizes.taskbar.button.iconSize};
    }
  }
`;

export default StyledPinnedApps;
