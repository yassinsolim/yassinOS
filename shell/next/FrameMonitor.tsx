import { useEffect, useState } from "react";
import styles from "shell/next/desktop.module.css";

type GpuAdapter = {
  info?: { description?: string; device?: string };
  requestAdapterInfo?: () => Promise<{
    description?: string;
    device?: string;
  }>;
};

type GpuNavigator = Navigator & {
  deviceMemory?: number;
  gpu?: {
    requestAdapter: () => Promise<GpuAdapter | undefined>;
  };
};

const SAMPLE_LIMIT = 30;

const readGpu = async (): Promise<string> => {
  const { gpu } = navigator as GpuNavigator;

  if (!gpu) return "WebGPU is not in this browser";

  try {
    const adapter = await gpu.requestAdapter();

    if (!adapter) return "No WebGPU adapter";

    const info = adapter.info ?? (await adapter.requestAdapterInfo?.());

    return info?.description || info?.device || "WebGPU adapter, name hidden";
  } catch {
    return "WebGPU adapter could not be read";
  }
};

const FrameMonitor = ({
  paused,
  reduceMotion,
}: {
  paused: boolean;
  reduceMotion: boolean;
}): React.ReactElement => {
  const [average, setAverage] = useState(0);
  const [spoken, setSpoken] = useState(0);
  const [gpu, setGpu] = useState("Checking WebGPU");
  const [cores, setCores] = useState(0);
  const [memory, setMemory] = useState(0);

  useEffect(() => {
    let cancelled = false;

    setCores(navigator.hardwareConcurrency || 0);
    setMemory((navigator as GpuNavigator).deviceMemory || 0);
    readGpu().then((name) => {
      if (!cancelled) setGpu(name);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let frame = 0;

    if (paused) return () => cancelAnimationFrame(frame);
    let previous = performance.now();
    let lastPublish = 0;
    const samples: number[] = [];
    const tick = (now: number): void => {
      const elapsed = now - previous;

      previous = now;
      samples.push(elapsed);
      if (samples.length > SAMPLE_LIMIT) samples.shift();

      let sum = 0;

      for (const sample of samples) sum += sample;
      const mean = sum / samples.length;

      if (!reduceMotion) setAverage(mean);

      if (now - lastPublish > 500 || lastPublish === 0) {
        lastPublish = now;
        setAverage(mean);
        setSpoken(mean);
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [paused, reduceMotion]);

  const width = Math.max(4, Math.min(100, average > 0 ? 1600 / average : 4));

  return (
    <>
      <p aria-hidden="true" className={styles.figure}>
        {average > 0 ? average.toFixed(1) : "0.0"} ms
      </p>
      <div aria-hidden="true" className={styles.meter}>
        <span style={{ width: `${width}%` }} />
      </div>
      <p aria-live="polite">
        {paused
          ? "Frame timer paused."
          : `About ${spoken > 0 ? spoken.toFixed(1) : "0"} milliseconds a frame.`}
      </p>
      <p>
        {cores > 0 ? `${cores} logical cores` : "Core count hidden"}
        {memory ? `, ${memory} GB device memory` : ""}. {gpu}.
      </p>
    </>
  );
};

export default FrameMonitor;
