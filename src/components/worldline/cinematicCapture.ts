import { preferredCaptureMimeType } from './flagshipSequence';

type CapturableCanvas = HTMLCanvasElement & {
  captureStream?: (frameRate?: number) => MediaStream;
};

export async function captureFlagshipWebM(
  canvas: HTMLCanvasElement,
  compact: boolean,
  runFlight: () => Promise<boolean>,
): Promise<'downloaded' | 'empty'> {
  const capturable = canvas as CapturableCanvas;
  const Recorder = typeof MediaRecorder === 'undefined' ? null : MediaRecorder;
  const mimeType = Recorder
    ? preferredCaptureMimeType((candidate) => Recorder.isTypeSupported(candidate))
    : null;

  if (!capturable.captureStream || !Recorder || !mimeType) {
    throw new Error('WebM capture is unavailable in this browser.');
  }

  const stream = capturable.captureStream(30);
  const chunks: BlobPart[] = [];
  try {
    const recorder = new Recorder(stream, {
      mimeType,
      videoBitsPerSecond: compact ? 5_000_000 : 9_000_000,
    });
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    const stopped = new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
    });

    recorder.start(1000);
    await runFlight();
    if (recorder.state !== 'inactive') recorder.stop();
    await stopped;

    if (chunks.length === 0) return 'empty';
    const blob = new Blob(chunks, { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'worldgen-new-bedford-flagship.webm';
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    return 'downloaded';
  } finally {
    stream.getTracks().forEach((track) => track.stop());
  }
}
