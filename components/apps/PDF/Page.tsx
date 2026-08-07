import { useRef, useEffect, memo } from "react";
import { useProcesses } from "contexts/process";

type PageProps = {
  element: HTMLDivElement;
  id: string;
  page: number;
};

const Page: FC<PageProps> = ({ element, id, page }) => {
  const containerRef = useRef<HTMLLIElement | null>(null);
  const {
    argument,
    processes: { [id]: process },
  } = useProcesses();
  const { componentWindow } = process || {};

  useEffect(() => {
    if (element) containerRef.current?.append(element);

    return () => element?.remove();
  }, [element]);

  useEffect(() => {
    const container = containerRef.current;
    // eslint-disable-next-line no-undef-init, unicorn/no-useless-undefined
    let observer: IntersectionObserver | undefined = undefined;

    if (
      container instanceof HTMLElement &&
      componentWindow instanceof HTMLElement
    ) {
      observer = new IntersectionObserver(
        (entries) =>
          entries.forEach(
            ({ isIntersecting }) => isIntersecting && argument(id, "page", page)
          ),
        { root: componentWindow, threshold: 0.5 }
      );

      observer.observe(container);
    }

    return () => observer?.disconnect();
  }, [argument, componentWindow, id, page]);

  return <li ref={containerRef} />;
};

export default memo(Page);
