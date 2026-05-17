import { describe, it, expect } from 'vitest';
import { makeWhite, makePink, makeBrown } from '../src/lib/audio/noise-generators';

// Minimal mock — only what the generators read.
class FakeCtx {
	sampleRate = 8000;
	createBuffer(channels: number, length: number, _rate: number) {
		const data = new Float32Array(length);
		return {
			getChannelData: () => data
		} as unknown as AudioBuffer;
	}
}

function rms(buf: AudioBuffer): number {
	const d = (buf as unknown as { getChannelData: () => Float32Array }).getChannelData();
	let s = 0;
	for (let i = 0; i < d.length; i++) s += d[i] * d[i];
	return Math.sqrt(s / d.length);
}

describe('noise generators', () => {
	it('produce non-silent buffers', () => {
		const ctx = new FakeCtx() as unknown as BaseAudioContext;
		expect(rms(makeWhite(ctx, 1))).toBeGreaterThan(0.1);
		expect(rms(makePink(ctx, 1))).toBeGreaterThan(0.02);
		expect(rms(makeBrown(ctx, 1))).toBeGreaterThan(0.001);
	});

	it('buffer length matches seconds × sampleRate', () => {
		const ctx = new FakeCtx() as unknown as BaseAudioContext;
		const buf = makeWhite(ctx, 2);
		const d = (buf as unknown as { getChannelData: () => Float32Array }).getChannelData();
		expect(d.length).toBe(16000);
	});
});
