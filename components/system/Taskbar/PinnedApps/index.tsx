import { memo, useCallback, useEffect, useMemo } from "react";
import StyledPinnedApps from "components/system/Taskbar/PinnedApps/StyledPinnedApps";
import { useProcesses } from "contexts/process";

const PINNED_APPS = [
  {
    icon: "/System/Icons/chromium.webp",
    id: "Browser",
    title: "Browser",
  },
  {
    icon: "/System/Icons/messenger.webp",
    id: "Messenger",
    title: "Messenger",
  },
  {
    icon: "/System/Icons/portfolio.png",
    id: "Portfolio",
    title: "portfolio.exe",
  },
];

const PinnedApps: FC<{ onChangePinnedCount?: (count: number) => void }> = ({
  onChangePinnedCount,
}) => {
  const { open } = useProcesses();
  const pinned = useMemo(() => PINNED_APPS, []);
  useEffect(() => {
    onChangePinnedCount?.(pinned.length);
  }, [onChangePinnedCount, pinned.length]);

  const handleLaunch = useCallback((id: string) => () => open(id), [open]);

  return (
    <StyledPinnedApps>
      {pinned.map(({ icon, id, title }) => (
        <li key={id}>
          <button onClick={handleLaunch(id)} title={title} type="button">
            <img alt={title} decoding="async" src={icon} />
          </button>
        </li>
      ))}
    </StyledPinnedApps>
  );
};

export { PINNED_APPS };
export default memo(PinnedApps);
