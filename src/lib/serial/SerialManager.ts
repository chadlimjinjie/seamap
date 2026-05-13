import { AISParser } from '../ais/parser';
import type { AISVessel } from '../ais/types';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface SerialStats {
  sentences: number;
  vessels: number;
  errors: number;
  bytesReceived: number;
}

export class SerialManager {
  private port: SerialPort | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private parser: AISParser;
  private running = false;
  private lineBuffer = '';

  public state: ConnectionState = 'disconnected';
  public stats: SerialStats = { sentences: 0, vessels: 0, errors: 0, bytesReceived: 0 };

  private onStateChange: (state: ConnectionState) => void;
  private onStatsChange: (stats: SerialStats) => void;
  private onVessel: (vessel: Partial<AISVessel>) => void;

  constructor(
    onVessel: (vessel: Partial<AISVessel>) => void,
    onStateChange: (state: ConnectionState) => void,
    onStatsChange: (stats: SerialStats) => void
  ) {
    this.onVessel = onVessel;
    this.onStateChange = onStateChange;
    this.onStatsChange = onStatsChange;
    this.parser = new AISParser((vessel) => {
      this.stats.vessels++;
      this.onVessel(vessel);
      this.onStatsChange({ ...this.stats });
    });
  }

  isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  async connect(baudRate = 38400): Promise<void> {
    if (!this.isSupported()) throw new Error('Web Serial API not supported in this browser.');

    this.setState('connecting');
    try {
      this.port = await navigator.serial.requestPort();
      await this.port.open({ baudRate, dataBits: 8, stopBits: 1, parity: 'none' });
      this.setState('connected');
      this.running = true;
      this.stats = { sentences: 0, vessels: 0, errors: 0, bytesReceived: 0 };
      this.readLoop();
    } catch (err) {
      this.setState('error');
      throw err;
    }
  }

  async disconnect(): Promise<void> {
    this.running = false;
    try {
      await this.reader?.cancel();
    } catch {}
    this.reader = null;
    try {
      await this.port?.close();
    } catch {}
    this.port = null;
    this.lineBuffer = '';
    this.setState('disconnected');
  }

  private async readLoop(): Promise<void> {
    if (!this.port?.readable) return;
    const decoder = new TextDecoder();

    try {
      this.reader = this.port.readable.getReader();
      while (this.running) {
        const { value, done } = await this.reader.read();
        if (done) break;

        this.stats.bytesReceived += value.byteLength;
        const text = decoder.decode(value, { stream: true });
        this.lineBuffer += text;

        const lines = this.lineBuffer.split(/\r?\n/);
        this.lineBuffer = lines.pop() ?? '';

        for (const line of lines) {
          if (line.trim()) {
            this.stats.sentences++;
            this.parser.parseLine(line);
            this.onStatsChange({ ...this.stats });
          }
        }
      }
    } catch (err) {
      if (this.running) {
        this.setState('error');
      }
    } finally {
      this.reader = null;
      if (this.running) {
        this.running = false;
        this.setState('disconnected');
      }
    }
  }

  private setState(state: ConnectionState): void {
    this.state = state;
    this.onStateChange(state);
  }
}
