/**
 * Generate one-shot noise buffers (white / pink / brown) once at startup
 * and play them back via AudioBufferSourceNode loops. Far cheaper than a
 * live filter chain on a continuous source.
 *
 * Pink: Paul Kellet's economy filter.
 * Brown: random walk normalized to ~unit RMS.
 */
export type NoiseColor = 'white' | 'pink' | 'brown';

const BUFFER_SECONDS = 4;

export function makeWhite(ctx: BaseAudioContext, seconds = BUFFER_SECONDS): AudioBuffer {
	const len = ctx.sampleRate * seconds;
	const buf = ctx.createBuffer(1, len, ctx.sampleRate);
	const data = buf.getChannelData(0);
	for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
	return buf;
}

export function makePink(ctx: BaseAudioContext, seconds = BUFFER_SECONDS): AudioBuffer {
	const len = ctx.sampleRate * seconds;
	const buf = ctx.createBuffer(1, len, ctx.sampleRate);
	const data = buf.getChannelData(0);
	let b0 = 0,
		b1 = 0,
		b2 = 0,
		b3 = 0,
		b4 = 0,
		b5 = 0,
		b6 = 0;
	for (let i = 0; i < len; i++) {
		const white = Math.random() * 2 - 1;
		b0 = 0.99886 * b0 + white * 0.0555179;
		b1 = 0.99332 * b1 + white * 0.0750759;
		b2 = 0.969 * b2 + white * 0.153852;
		b3 = 0.8665 * b3 + white * 0.3104856;
		b4 = 0.55 * b4 + white * 0.5329522;
		b5 = -0.7616 * b5 - white * 0.016898;
		data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
		b6 = white * 0.115926;
	}
	return buf;
}

export function makeBrown(ctx: BaseAudioContext, seconds = BUFFER_SECONDS): AudioBuffer {
	const len = ctx.sampleRate * seconds;
	const buf = ctx.createBuffer(1, len, ctx.sampleRate);
	const data = buf.getChannelData(0);
	let last = 0;
	for (let i = 0; i < len; i++) {
		const white = Math.random() * 2 - 1;
		last = (last + 0.02 * white) / 1.02;
		data[i] = last * 3.5;
	}
	return buf;
}

export function generate(ctx: BaseAudioContext, color: NoiseColor): AudioBuffer {
	switch (color) {
		case 'white':
			return makeWhite(ctx);
		case 'pink':
			return makePink(ctx);
		case 'brown':
			return makeBrown(ctx);
	}
}
