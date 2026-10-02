import { useEffect, useRef, useState } from "react";
import { type BridgeOffer, type SessionReport } from "shell/protocol";
import { readSessionEvent, type SessionAccess } from "shell/session";

const embedded = (): boolean =>
  window.parent !== window &&
  new URLSearchParams(window.location.search).get("embed") === "1";

export const useParentSession = (): {
  bridge: BridgeOffer | undefined;
  pinnedOrigin: string;
  report: SessionReport | undefined;
} => {
  const [bridge, setBridge] = useState<BridgeOffer>();
  const [pinnedOrigin, setPinnedOrigin] = useState("");
  const [report, setReport] = useState<SessionReport>();
  const pinnedRef = useRef("");

  pinnedRef.current = pinnedOrigin;

  useEffect(() => {
    const onMessage = (event: MessageEvent<unknown>): void => {
      const access: SessionAccess = {
        origin: event.origin,
        pinnedOrigin: pinnedRef.current,
        sourceIsParent: event.source === window.parent,
      };
      const next = readSessionEvent(event.data, access);

      if (next.kind === "ignore" || next.kind === "refused-launch") return;

      if (!pinnedRef.current) {
        pinnedRef.current = event.origin;
        setPinnedOrigin(event.origin);
      }

      if (next.kind === "bridge") setBridge(next.offer);
      if (next.kind === "report") setReport(next.report);
    };

    if (embedded()) window.addEventListener("message", onMessage);

    return () => window.removeEventListener("message", onMessage);
  }, []);

  return { bridge, pinnedOrigin, report };
};
