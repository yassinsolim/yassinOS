import { useEffect, useMemo, useRef, useState } from "react";
import { manifestById } from "shell/manifest";
import { guestDocument } from "shell/next/guest";
import styles from "shell/next/desktop.module.css";
import {
  authorizeGuest,
  pauseMessage,
  type ParentReply,
  replyToGuest,
  resumeMessage,
  SANDBOX_PROTOCOL,
  SANDBOX_TOKENS,
} from "shell/sandbox";
import {
  fileResult,
  parseFileRequest,
  runFileOp,
  type StorageDriver,
} from "shell/storage";
import { WASM_STEP } from "shell/wasmStep";

const fileReply = async (
  appId: string,
  capability: string,
  id: string,
  body: unknown,
  paused: boolean,
  sharedRead: boolean,
  store: StorageDriver | undefined
): Promise<ParentReply> => {
  const parsed = parseFileRequest(body);
  const denied: ParentReply = {
    capability,
    id,
    protocol: SANDBOX_PROTOCOL,
    type: "shell:deny",
  };

  if (parsed === "too-large" || parsed === "malformed") {
    return fileResult(id, {
      error: parsed === "too-large" ? "too-large" : "malformed",
      ok: false,
    });
  }

  if (capability === "shared-read" && parsed.op !== "read-shared") {
    return denied;
  }

  if (parsed.op === "read-shared" && !sharedRead) return denied;
  if (!store) return fileResult(id, { error: "unavailable", ok: false });

  return fileResult(
    id,
    await runFileOp(store, appId, parsed, { paused, sharedRead })
  );
};

const AppHost = ({
  appId,
  paused,
  store,
}: {
  appId: string;
  paused: boolean;
  store: StorageDriver | undefined;
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

      if (decision.kind === "ready") setLive(true);

      const send = (message: ParentReply): void => {
        // the guest origin is opaque, so the only address is this content window
        // eslint-disable-next-line sonarjs/post-message -- opaque sandbox origin
        frame.postMessage(message, "*");
      };

      if (
        decision.kind === "allow" &&
        (decision.capability === "files" ||
          decision.capability === "shared-read")
      ) {
        fileReply(
          manifest.appId,
          decision.capability,
          decision.id,
          decision.body,
          paused,
          manifest.capabilities.includes("shared-read"),
          store
        )
          .then(send)
          .catch(() => {
            send(fileResult(decision.id, { error: "unavailable", ok: false }));
          });

        return;
      }

      const reply = replyToGuest(decision, manifest.capabilities, WASM_STEP);

      if (reply) send(reply);
    };

    window.addEventListener("message", onMessage);

    return () => window.removeEventListener("message", onMessage);
  }, [manifest, paused, store]);

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
