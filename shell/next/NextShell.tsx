import { useEffect, useMemo, useState } from "react";
import NextDesktop from "shell/next/NextDesktop";
import SessionPicker from "shell/next/SessionPicker";
import { useParentSession } from "shell/next/useParentSession";
import { useSessionPrefs } from "shell/next/useSessionPrefs";
import {
  confirmLaunch,
  decideLaunch,
  describeProviders,
  type HandoffMessage,
  performHandoff,
  reduceShellRoute,
  sessionCatalogMessage,
  sessionFromSearch,
  SHELL_HANDLERS,
  type SessionAttempt,
  type SessionKind,
  type SessionPreferences,
} from "shell/session";

const openLabTab = (href: string): boolean =>
  Boolean(window.open(href, "_blank", "noopener,noreferrer"));

const NextShell = (): React.ReactElement => {
  const { prefs, save } = useSessionPrefs();
  const [route, setRoute] = useState<"local" | "picker">("picker");
  const [attempt, setAttempt] = useState<SessionAttempt>({ name: "idle" });
  const [labDraft, setLabDraft] = useState("");
  const [streamDraft, setStreamDraft] = useState("");
  const { bridge, pinnedOrigin, report } = useParentSession();
  const liveViews = useMemo(
    () =>
      describeProviders({
        bridge,
        handlers: SHELL_HANDLERS,
        labEndpoint: prefs.labEndpoint,
        streamHandler: prefs.streamHandler,
      }),
    [bridge, prefs]
  );

  useEffect(() => {
    if (!pinnedOrigin || window.parent === window) return;

    window.parent.postMessage(sessionCatalogMessage(liveViews), pinnedOrigin);
  }, [liveViews, pinnedOrigin]);

  useEffect(() => {
    if (sessionFromSearch(window.location.search) === "local") {
      setRoute(reduceShellRoute("picker", "direct-local"));
    }
  }, []);

  useEffect(() => {
    setLabDraft(prefs.labEndpoint);
    setStreamDraft(prefs.streamHandler);
  }, [prefs]);

  useEffect(() => {
    if (!report || route === "local") return;

    if (report.status === "resumed") {
      setAttempt({ name: "resumed", providerId: report.provider });
      return;
    }

    setAttempt({
      message: report.detail || "The bridge reported an error.",
      name: "error",
      providerId: report.provider,
    });
  }, [report, route]);

  const remember = (next: SessionPreferences): void => {
    save(next);
  };

  const openLocal = (): void => {
    const url = new URL(window.location.href);

    url.searchParams.set("session", "local");
    window.history.replaceState({}, "", url);
    remember({ ...prefs, providerId: "local" });
    setRoute(reduceShellRoute(route, "open-local"));
  };

  const back = (): void => {
    const url = new URL(window.location.href);

    url.searchParams.delete("session");
    window.history.replaceState({}, "", url);
    setAttempt({ name: "idle" });
    setRoute(reduceShellRoute(route, "back"));
  };

  const notify = (message: HandoffMessage): void => {
    if (!pinnedOrigin || window.parent === window) return;

    window.parent.postMessage(message, pinnedOrigin);
  };

  const runHandoff = (providerId: "lab" | "stream"): void => {
    const decision = confirmLaunch({
      confirmed: true,
      gesture: true,
      providerId,
      views: liveViews,
    });

    if (decision.kind === "denied") {
      setAttempt({
        message: decision.reason,
        name: "error",
        providerId,
      });
      return;
    }

    const result = performHandoff({
      bridge,
      handlers: SHELL_HANDLERS,
      labEndpoint: prefs.labEndpoint,
      notify,
      openLab: openLabTab,
      openStream: () => {
        throw new Error("missing handler");
      },
      providerId,
      streamHandler: prefs.streamHandler,
    });

    setAttempt(
      result.ok
        ? { name: "handoff", providerId }
        : { message: result.reason, name: "error", providerId }
    );
  };

  const onOpen = (providerId: SessionKind): void => {
    const decision = decideLaunch({
      gesture: true,
      providerId,
      views: liveViews,
    });

    if (decision.kind === "denied") {
      setAttempt({
        message: decision.reason,
        name: "error",
        providerId: providerId === "local" ? "stream" : providerId,
      });
      return;
    }

    if (decision.kind === "local") {
      openLocal();
      return;
    }

    setAttempt({ name: "confirm", providerId: decision.providerId });
  };

  if (route === "local") return <NextDesktop onSessions={back} />;

  return (
    <SessionPicker
      attempt={attempt}
      labDraft={labDraft}
      onCancel={() => setAttempt({ name: "idle" })}
      onConfirm={() => {
        if (attempt.name === "confirm") runHandoff(attempt.providerId);
      }}
      onLabDraft={setLabDraft}
      onOpen={onOpen}
      onRetry={() => {
        if (attempt.name === "error") runHandoff(attempt.providerId);
      }}
      onSaveLab={() => {
        remember({ ...prefs, labEndpoint: labDraft.trim() });
      }}
      onSaveStream={() => {
        remember({ ...prefs, streamHandler: streamDraft.trim() });
      }}
      onStreamDraft={setStreamDraft}
      streamDraft={streamDraft}
      views={liveViews}
    />
  );
};

export default NextShell;
