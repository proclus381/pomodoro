import { browser } from '$app/environment';
import { generate, type NoiseColor } from './noise-generators';

export type SoundId = NoiseColor;

interface Channel {
	source: AudioBufferSourceNode;
	gain: GainNode;
	volume: number;
}

class AudioManager {
	ctx: AudioContext | null = null;
	buffers = new Map<SoundId, AudioBuffer>();
	channels = new Map<SoundId, Channel>();
	master: GainNode | null = null;
	bellBuffer: AudioBuffer | null = null;
	softBellBuffer: AudioBuffer | null = null;

	async ensure() {
		if (!browser) return;
		if (this.ctx) {
			if (this.ctx.state === 'suspended') await this.ctx.resume();
			return;
		}
		const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
		this.ctx = new Ctx();
		this.master = this.ctx.createGain();
		this.master.gain.value = 1;
		this.master.connect(this.ctx.destination);
		this.bellBuffer = this.makeBell(this.ctx, 0.6, 660, 0.4);
		this.softBellBuffer = this.makeBell(this.ctx, 0.4, 880, 0.18);
	}

	private makeBell(
		ctx: AudioContext,
		duration: number,
		freq: number,
		amplitude: number
	): AudioBuffer {
		const len = Math.floor(ctx.sampleRate * duration);
		const buf = ctx.createBuffer(1, len, ctx.sampleRate);
		const data = buf.getChannelData(0);
		for (let i = 0; i < len; i++) {
			const t = i / ctx.sampleRate;
			const env = Math.exp(-3 * t);
			data[i] =
				amplitude *
				env *
				(Math.sin(2 * Math.PI * freq * t) + 0.4 * Math.sin(2 * Math.PI * freq * 2 * t));
		}
		return buf;
	}

	async play(id: SoundId, volume: number) {
		await this.ensure();
		if (!this.ctx || !this.master) return;
		this.stop(id);
		let buf = this.buffers.get(id);
		if (!buf) {
			buf = generate(this.ctx, id);
			this.buffers.set(id, buf);
		}
		const source = this.ctx.createBufferSource();
		source.buffer = buf;
		source.loop = true;
		const gain = this.ctx.createGain();
		gain.gain.value = volume;
		source.connect(gain);
		gain.connect(this.master);
		source.start();
		this.channels.set(id, { source, gain, volume });
	}

	setVolume(id: SoundId, volume: number) {
		const ch = this.channels.get(id);
		if (!ch) return;
		ch.gain.gain.value = volume;
		ch.volume = volume;
	}

	stop(id: SoundId) {
		const ch = this.channels.get(id);
		if (!ch) return;
		try {
			ch.source.stop();
		} catch {
			// already stopped
		}
		ch.source.disconnect();
		ch.gain.disconnect();
		this.channels.delete(id);
	}

	stopAll() {
		for (const id of [...this.channels.keys()]) this.stop(id);
	}

	async bell(kind: 'soft' | 'end', volume: number) {
		await this.ensure();
		if (!this.ctx || !this.master) return;
		const buf = kind === 'soft' ? this.softBellBuffer : this.bellBuffer;
		if (!buf) return;
		const source = this.ctx.createBufferSource();
		source.buffer = buf;
		const gain = this.ctx.createGain();
		gain.gain.value = volume;
		source.connect(gain);
		gain.connect(this.master);
		source.start();
	}

	isPlaying(id: SoundId): boolean {
		return this.channels.has(id);
	}
}

export const audio = new AudioManager();
