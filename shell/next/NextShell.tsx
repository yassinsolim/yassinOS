import { useEffect, useMemo, useState } from "react";
import {
  checkStreamApp,
  checkStreamHost,
  checkStreamLabel,
  readNativeBridge,
  tauriInvoke,
  type NativeBridgeView,
} from "shell/nativeBridge";
import NextDesktop from "shell/next/NextDesktop";
import SessionPicker from "shell/next/SessionPicker";
import { useParentSession } from "shell/next/useParentSession";
import { useSessionPrefs } from "shell/next/useSessionPrefs";
import {
  confirmLaunch,
  decideLaunch,
  describeProviders,
  HANDOFF_FAILED,
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
  const [nativeView, setNativeView] = useState<NativeBridgeView>();
  const [nativeDraft, setNativeDraft] = useState({
    app: "",
    host: "",
    hostLabel: "",
  });
  const [nativePreview, setNativePreview] = useState("");
  const [promptSave, setPromptSave] = useState(false);
  const { bridge, pinnedOrigin, report } = useParentSession();
  const liveViews = useMemo(
    () =>
      describeProviders({
        bridge,
        handlers: SHELL_HANDLERS,
        labEndpoint: prefs.labEndpoint,
        nativeStream: nativeView?.available
          ? {
              configured: nativeView.configured,
              installed: nativeView.installed,
            }
          : undefined,
        streamHandler: prefs.streamHandler,
      }),
    [
      bridge,
      nativeView?.available,
      nativeView?.configured,
      nativeView?.installed,
      prefs,
    ]
  );

  useEffect(() => {
    if (!pinnedOrigin || window.parent === window) return;

    window.parent.postMessage(sessionCatalogMessage(liveViews), pinnedOrigin);
  }, [liveViews, pinnedOrigin]);

  useEffect(() => {
    const invoke = tauriInvoke(window);

    if (!invoke) return;

    readNativeBridge(invoke)
      .then((view) => {
        if (!view.available) return;

        setNativeView(view);
        setNativeDraft({
          app: view.app,
          host: view.host,
          hostLabel: view.hostLabel,
        });
      })
      .catch(() => {
        // a failed probe leaves Stream on the website path
      });
  }, []);

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
      launchNative: () => {
        const invoke = tauriInvoke(window);

        if (!invoke) throw new Error("missing bridge");

        invoke("launch_stream", { args: { confirmed: true } }).catch(() => {
          setAttempt({
            message: HANDOFF_FAILED,
            name: "error",
            providerId: "stream",
          });
        });
      },
      nativeStream: nativeView?.available
        ? {
            configured: nativeView.configured,
            installed: nativeView.installed,
          }
        : undefined,
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
      native={
        nativeView?.available
          ? {
              app: nativeDraft.app,
              host: nativeDraft.host,
              hostLabel: nativeDraft.hostLabel,
              onApp: (value) =>
                setNativeDraft((current) => ({ ...current, app: value })),
              onCancelSave: () => setPromptSave(false),
              onConfirmSave: () => {
                const invoke = tauriInvoke(window);
                const host = checkStreamHost(nativeDraft.host);
                const appName = checkStreamApp(nativeDraft.app);
                const hostLabel = checkStreamLabel(nativeDraft.hostLabel);
                const problem =
                  ("error" in host && host.error) ||
                  ("error" in appName && appName.error) ||
                  ("error" in hostLabel && hostLabel.error) ||
                  "";

                if (
                  !invoke ||
                  !("value" in host) ||
                  !("value" in appName) ||
                  !("value" in hostLabel)
                ) {
                  setNativePreview(
                    problem || "The desktop bridge is not available."
                  );
                  setPromptSave(false);
                  return;
                }

                invoke("save_target", {
                  args: {
                    appName: appName.value,
                    confirmed: true,
                    host: host.value,
                    hostLabel: hostLabel.value,
                  },
                })
                  .then(() => readNativeBridge(invoke))
                  .then((view) => {
                    setNativeView(view);
                    setPromptSave(false);
                    setNativePreview(
                      "Saved the host and app. No password was stored."
                    );
                  })
                  .catch(() => {
                    setNativePreview("Could not save the target.");
                    setPromptSave(false);
                  });
              },
              onHost: (value) =>
                setNativeDraft((current) => ({ ...current, host: value })),
              onHostLabel: (value) =>
                setNativeDraft((current) => ({ ...current, hostLabel: value })),
              onPreview: () => {
                const invoke = tauriInvoke(window);

                if (!invoke) return;

                invoke("preview_launch", {
                  args: { appName: nativeDraft.app, host: nativeDraft.host },
                })
                  .then((preview) => {
                    if (
                      typeof preview === "object" &&
                      preview &&
                      "program" in preview &&
                      "args" in preview &&
                      Array.isArray(preview.args)
                    ) {
                      setNativePreview(
                        `${String(preview.program)}\n${preview.args.join(" ")}`
                      );
                      return;
                    }

                    setNativePreview("Could not preview the launch.");
                  })
                  .catch(() => {
                    setNativePreview("Could not preview the launch.");
                  });
              },
              onSave: () => setPromptSave(true),
              preview: nativePreview,
              promptSave,
            }
          : undefined
      }
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
