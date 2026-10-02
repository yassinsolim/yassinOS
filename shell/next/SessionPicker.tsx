import {
  type ProviderView,
  type SessionAttempt,
  type SessionKind,
} from "shell/session";
import styles from "shell/next/desktop.module.css";

const SessionPicker = ({
  attempt,
  labDraft,
  onCancel,
  onConfirm,
  onLabDraft,
  onOpen,
  onRetry,
  onSaveLab,
  onSaveStream,
  onStreamDraft,
  streamDraft,
  views,
}: {
  attempt: SessionAttempt;
  labDraft: string;
  onCancel: () => void;
  onConfirm: () => void;
  onLabDraft: (value: string) => void;
  onOpen: (providerId: SessionKind) => void;
  onRetry: () => void;
  onSaveLab: () => void;
  onSaveStream: () => void;
  onStreamDraft: (value: string) => void;
  streamDraft: string;
  views: readonly ProviderView[];
}): React.ReactElement => (
  <main className={styles.picker}>
    <h1>Choose a session</h1>
    <p className={styles.note}>
      Local runs in this browser. Stream and Lab stay off until a real handoff
      is configured. Nothing here stores a password.
    </p>
    <ul className={styles.choices}>
      {views.map((entry) => (
        <li key={entry.id} className={styles.choice}>
          <h2>{entry.title}</h2>
          <p className={styles.note}>{entry.privacy}</p>
          <p className={styles.note} id={`${entry.id}-reason`}>
            {entry.reason}
          </p>
          {entry.id === "stream" && (
            <label className={styles.field}>
              Handoff id
              <input
                onChange={(event) => onStreamDraft(event.target.value)}
                spellCheck={false}
                value={streamDraft}
              />
            </label>
          )}
          {entry.id === "lab" && (
            <label className={styles.field}>
              HTTPS page
              <input
                onChange={(event) => onLabDraft(event.target.value)}
                spellCheck={false}
                type="url"
                value={labDraft}
              />
            </label>
          )}
          <p>
            {entry.id === "stream" && (
              <button
                className={styles.quiet}
                onClick={onSaveStream}
                type="button"
              >
                Save handoff id
              </button>
            )}
            {entry.id === "lab" && (
              <button
                className={styles.quiet}
                onClick={onSaveLab}
                type="button"
              >
                Save address
              </button>
            )}
            <button
              aria-describedby={`${entry.id}-reason`}
              aria-disabled={!entry.enabled}
              onClick={() => {
                if (entry.enabled) onOpen(entry.id);
              }}
              type="button"
            >
              {entry.id === "local" ? "Open Local" : `Open ${entry.title}`}
            </button>
          </p>
        </li>
      ))}
    </ul>
    {attempt.name === "confirm" && (
      <section className={styles.choice}>
        <h2>Leave this page?</h2>
        <p className={styles.note}>
          Confirm to hand off {attempt.providerId}. This page does not send a
          password.
        </p>
        <p>
          <button onClick={onConfirm} type="button">
            Confirm handoff
          </button>
          <button className={styles.quiet} onClick={onCancel} type="button">
            Cancel
          </button>
        </p>
      </section>
    )}
    {attempt.name === "error" && (
      <section className={styles.choice}>
        <h2>Handoff failed</h2>
        <p className={styles.note} role="status">
          {attempt.message}
        </p>
        <p>
          <button onClick={onRetry} type="button">
            Retry
          </button>
          <button className={styles.quiet} onClick={onCancel} type="button">
            Back
          </button>
        </p>
      </section>
    )}
    {(attempt.name === "handoff" || attempt.name === "resumed") && (
      <section className={styles.choice}>
        <h2>{attempt.name === "resumed" ? "Session resumed" : "Handed off"}</h2>
        <p className={styles.note} role="status">
          {attempt.name === "resumed"
            ? "The bridge resumed this session."
            : `Waiting on the ${attempt.providerId} handoff.`}
        </p>
        <button className={styles.quiet} onClick={onCancel} type="button">
          Back
        </button>
      </section>
    )}
  </main>
);

export default SessionPicker;
