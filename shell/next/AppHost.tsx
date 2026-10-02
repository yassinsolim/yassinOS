import { useEffect, useMemo, useRef, useState } from "react";
import { manifestById } from "shell/manifest";
import { guestDocument } from "shell/next/guest";
import styles from "shell/next/desktop.module.css";
import {
  authorizeGuest,
  pauseMessage,
  replyToGuest,
  resumeMessage,
  SANDBOX_TOKENS,
} from "shell/sandbox";
import { WASM_STEP } from "shell/wasmStep";

const AppHost = ({
  appId,
  paused,
}: {
  appId: string;
  paused: boolean;
}): React.ReactElement => {
  const manifest = manifestById(appId);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [live, setLive] = useState(false);
  const documentHtml = useMemo(
    () => (manifest ? guestDocument(manifest) : ""),
    [manifest]
  );

  useEffect(() => {
    const onMessage = (event: MessageEvent<unknown>): void => {
      const frame = frameRef.current?.contentWindow;
      if (!manifest || !frame) return;

      const decision = authorizeGuest(
        event.data,
        { origin: event.origin, source: event.source },
        {
          appId: manifest.appId,
          contentWindow: frame,
          granted: manifest.capabilities,
        }
      );
      const reply = replyToGuest(decision, manifest.capabilities, WASM_STEP);

      if (!reply) return;

      if (decision.kind === "ready") setLive(true);

      // the guest origin is opaque, so the only address is this content window
      // eslint-disable-next-line sonarjs/post-message -- opaque sandbox origin
      frame.postMessage(reply, "*");
    };

    window.addEventListener("message", onMessage);

    return () => window.removeEventListener("message", onMessage);
  }, [manifest]);

  useEffect(() => {
    const frame = frameRef.current?.contentWindow;

    if (!live || !frame) return;

    // eslint-disable-next-line sonarjs/post-message -- opaque sandbox origin
    frame.postMessage(paused ? pauseMessage() : resumeMessage(), "*");
  }, [live, paused]);

  if (!manifest) return <p>Unknown app.</p>;

  return (
    <iframe
      ref={frameRef}
      className={styles.host}
      referrerPolicy="no-referrer"
      sandbox={SANDBOX_TOKENS}
      srcDoc={documentHtml}
      title={manifest.title}
    />
  );
};

export default AppHost;
