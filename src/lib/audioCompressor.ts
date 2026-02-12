import lamejs from 'lamejs';

const TARGET_KBPS = 128;
const SAMPLE_BLOCK_SIZE = 1152;

/**
 * Compress an audio file to 128kbps MP3.
 * Uses Web Audio API to decode any format, then re-encodes via lamejs.
 */
export async function compressAudioToMp3(
  file: File,
  onProgress?: (percent: number) => void
): Promise<File> {
  // If already a small file (< 1MB), skip compression
  if (file.size < 1024 * 1024) {
    return file;
  }

  const arrayBuffer = await file.arrayBuffer();
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

  let audioBuffer: AudioBuffer;
  try {
    audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  } finally {
    await audioContext.close();
  }

  const channels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const isStereo = channels >= 2;

  const mp3encoder = new lamejs.Mp3Encoder(isStereo ? 2 : 1, sampleRate, TARGET_KBPS);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mp3Data: any[] = [];

  // Get channel data as Float32Array and convert to Int16Array
  const leftFloat = audioBuffer.getChannelData(0);
  const rightFloat = isStereo ? audioBuffer.getChannelData(1) : null;

  const totalSamples = leftFloat.length;
  const left = floatTo16Bit(leftFloat);
  const right = rightFloat ? floatTo16Bit(rightFloat) : null;

  for (let i = 0; i < totalSamples; i += SAMPLE_BLOCK_SIZE) {
    const leftChunk = left.subarray(i, i + SAMPLE_BLOCK_SIZE);

    let mp3buf: Int8Array;
    if (right) {
      const rightChunk = right.subarray(i, i + SAMPLE_BLOCK_SIZE);
      mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
    } else {
      mp3buf = mp3encoder.encodeBuffer(leftChunk);
    }

    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }

    if (onProgress && i % (SAMPLE_BLOCK_SIZE * 100) === 0) {
      onProgress(Math.min(99, Math.round((i / totalSamples) * 100)));
    }
  }

  const mp3End = mp3encoder.flush();
  if (mp3End.length > 0) {
    mp3Data.push(mp3End);
  }

  onProgress?.(100);

  const blob = new Blob(mp3Data, { type: 'audio/mp3' });
  const compressedName = file.name.replace(/\.[^/.]+$/, '') + '.mp3';
  return new File([blob], compressedName, { type: 'audio/mp3' });
}

function floatTo16Bit(float32: Float32Array): Int16Array {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return int16;
}
