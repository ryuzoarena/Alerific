import { LyricLine } from '@/types/music';

const LRC_PATTERN = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g;

export const isLRC = (text: string): boolean => {
  return /\[\d{1,2}:\d{2}/.test(text);
};

/**
 * Parse a lyrics blob into LyricLine[].
 * - LRC: extract timestamps, support multi-timestamp lines
 * - Plain: each non-empty line becomes a LyricLine with time=0
 */
export const parseLyrics = (text: string): LyricLine[] => {
  if (!text.trim()) return [];

  if (!isLRC(text)) {
    return text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => ({ time: 0, text: line }));
  }

  const lines: LyricLine[] = [];
  for (const raw of text.split(/\r?\n/)) {
    LRC_PATTERN.lastIndex = 0;
    const stamps: number[] = [];
    let match: RegExpExecArray | null;
    while ((match = LRC_PATTERN.exec(raw)) !== null) {
      const min = parseInt(match[1], 10);
      const sec = parseInt(match[2], 10);
      const ms = match[3] ? parseInt(match[3].padEnd(3, '0').slice(0, 3), 10) : 0;
      stamps.push(min * 60 + sec + ms / 1000);
    }
    const cleaned = raw.replace(LRC_PATTERN, '').trim();
    if (!cleaned) continue;
    if (stamps.length === 0) {
      lines.push({ time: 0, text: cleaned });
    } else {
      for (const t of stamps) lines.push({ time: t, text: cleaned });
    }
  }
  return lines.sort((a, b) => a.time - b.time);
};

export const stripTimestamps = (text: string): string => {
  return text
    .split(/\r?\n/)
    .map((l) => l.replace(LRC_PATTERN, '').trim())
    .filter(Boolean)
    .join('\n');
};
