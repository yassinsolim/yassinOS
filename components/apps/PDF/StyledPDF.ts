import styled from "styled-components";
import Message from "styles/common/Message";
import ScrollBars from "styles/common/ScrollBars";

const StyledPDF = styled.div`
  ${ScrollBars()};

  contain: strict;
  display: block;
  overflow: auto;
  position: relative;
  text-align: center;
  top: 40px;

  && {
    height: ${({ theme }) =>
      `calc(100% - ${theme.sizes.titleBar.height}px - 40px)`};
  }

  .page {
    box-shadow: 0 0 5px hsl(0 0% 10% / 50%);
    display: inline-block;
    margin: 4px 4px 0;
    position: relative;
  }

  canvas {
    display: block;
  }

  /* pdf.js text layer: the document's real text, laid transparently over the
     canvas so it can be selected, copied and found with the browser's search.
     The camelCase class names below are pdf.js's own and cannot be renamed. */
  /* stylelint-disable selector-class-pattern */
  .textLayer {
    forced-color-adjust: none;
    inset: 0;
    line-height: 1;
    opacity: 100%;
    overflow: hidden;
    position: absolute;
    text-align: initial;
    text-size-adjust: none;
    transform-origin: 0 0;

    /* GlobalStyle sets user-select: none for the OS chrome; the document's
       text has to opt back in so it can actually be selected and copied. */
    user-select: text;
  }

  .textLayer span,
  .textLayer br {
    color: transparent;
    cursor: text;
    margin: 0;
    position: absolute;
    transform-origin: 0 0;
    user-select: text;
    white-space: pre;
  }

  .textLayer span.markedContent {
    height: 0;
    top: 0;
  }

  .textLayer ::selection {
    background: hsl(218 100% 55% / 30%);
  }

  .textLayer .endOfContent {
    cursor: default;
    display: block;
    inset: 100% 0 0;
    position: absolute;
    user-select: none;
    z-index: -1;
  }

  .textLayer .endOfContent.active {
    top: 0;
  }

  /* stylelint-enable selector-class-pattern */

  &.drop {
    ${Message("Drop PDF file here", "#fff")};
  }
`;

export default StyledPDF;
