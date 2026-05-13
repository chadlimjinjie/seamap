import { decodeMessage } from './decoder';
import type { AISVessel } from './types';

interface FragmentBuffer {
  total: number;
  parts: string[];
  padding: number;
  channel: 'A' | 'B';
  timestamp: number;
}

const FRAGMENT_TTL_MS = 5000;

export class AISParser {
  private fragments = new Map<string, FragmentBuffer>();
  private onVessel: (vessel: Partial<AISVessel>) => void;

  constructor(onVessel: (vessel: Partial<AISVessel>) => void) {
    this.onVessel = onVessel;
  }

  parseLine(line: string): void {
    line = line.trim();
    if (!line.startsWith('!')) return;

    // Validate checksum
    const starIdx = line.lastIndexOf('*');
    if (starIdx === -1) return;
    const body = line.slice(1, starIdx);
    const checksum = parseInt(line.slice(starIdx + 1, starIdx + 3), 16);
    let calc = 0;
    for (let i = 0; i < body.length; i++) calc ^= body.charCodeAt(i);
    if (calc !== checksum) return;

    const fields = body.split(',');
    if (fields.length < 7) return;

    const talker = fields[0]; // AIVDM or AIVDO
    if (!talker.includes('VDM') && !talker.includes('VDO')) return;

    const total = parseInt(fields[1]);
    const fragNum = parseInt(fields[2]);
    const seqId = fields[3];
    const channelRaw = fields[4].toUpperCase();
    const payload = fields[5];
    const paddingRaw = parseInt(fields[6].replace(/\*.*/, ''));
    const padding = isNaN(paddingRaw) ? 0 : paddingRaw;
    const channel: 'A' | 'B' = channelRaw === 'B' ? 'B' : 'A';

    // Purge stale fragments
    const now = Date.now();
    for (const [key, buf] of this.fragments) {
      if (now - buf.timestamp > FRAGMENT_TTL_MS) this.fragments.delete(key);
    }

    if (total === 1) {
      const vessel = decodeMessage(payload, padding, channel);
      if (vessel) this.onVessel(vessel);
      return;
    }

    // Multi-part message
    const key = `${seqId}-${channel}`;
    let buf = this.fragments.get(key);

    if (fragNum === 1 || !buf) {
      buf = { total, parts: new Array(total).fill(''), padding, channel, timestamp: now };
      this.fragments.set(key, buf);
    }

    buf.parts[fragNum - 1] = payload;
    buf.timestamp = now;

    if (buf.parts.every(p => p !== '')) {
      const fullPayload = buf.parts.join('');
      const vessel = decodeMessage(fullPayload, buf.padding, buf.channel);
      if (vessel) this.onVessel(vessel);
      this.fragments.delete(key);
    }
  }
}
