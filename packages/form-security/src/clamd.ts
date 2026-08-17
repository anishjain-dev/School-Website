// clamd INSTREAM client (WA-39 layer 4). Used by the scan poller against
// the local clamav container now, the India scan host later. Pure protocol
// over a socket factory so tests run against an in-process mock clamd.
import { connect as netConnect, type Socket } from 'node:net';

export interface ScanResult {
  status: 'clean' | 'infected' | 'failed';
  detail: string;
}

/** clamd INSTREAM: "zINSTREAM\0" then <4-byte BE length><chunk>… then
 *  zero-length terminator; reply "stream: OK" | "stream: <sig> FOUND". */
export function scanBytes(bytes: Uint8Array, host = '127.0.0.1', port = 3310, timeoutMs = 30_000): Promise<ScanResult> {
  return new Promise((resolve) => {
    let reply = '';
    const socket: Socket = netConnect({ host, port });
    const fail = (detail: string) => {
      socket.destroy();
      resolve({ status: 'failed', detail });
    };
    socket.setTimeout(timeoutMs, () => fail('clamd timeout'));
    socket.on('error', (e) => fail(`clamd error: ${e.message}`));
    socket.on('connect', () => {
      socket.write('zINSTREAM\0');
      const CHUNK = 64 * 1024;
      for (let i = 0; i < bytes.length; i += CHUNK) {
        const chunk = bytes.subarray(i, i + CHUNK);
        const len = Buffer.alloc(4);
        len.writeUInt32BE(chunk.length);
        socket.write(len);
        socket.write(chunk);
      }
      socket.write(Buffer.from([0, 0, 0, 0]));
    });
    socket.on('data', (d) => {
      reply += d.toString();
    });
    socket.on('close', () => {
      const text = reply.replace(/\0/g, '').trim();
      if (/\bOK$/.test(text)) resolve({ status: 'clean', detail: text });
      else if (/FOUND$/.test(text)) resolve({ status: 'infected', detail: text });
      else resolve({ status: 'failed', detail: text || 'no reply' });
    });
  });
}
