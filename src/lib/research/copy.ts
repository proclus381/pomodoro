/**
 * Microcopy with a research citation. Each line in the app traces to a finding.
 * Keep tone calm, non-judgemental, kind.
 */

export const breakActivities = [
	{
		title: 'Stand and stretch',
		body: 'Roll your shoulders back. Reach for the ceiling. Movement restores attention more than sitting still.',
		why: 'Microbreak research (Mark, UCI): brief physical resets reduce fatigue more than passive rest.'
	},
	{
		title: 'Look 20 feet away for 20 seconds',
		body: 'Find the furthest thing you can see. Soften your gaze. Let your eyes relax.',
		why: '20-20-20 rule (American Optometric Association): reduces digital eye strain.'
	},
	{
		title: 'Drink some water',
		body: 'Even mild dehydration measurably reduces cognitive performance. Top up before the next block.',
		why: 'Studies on hydration and cognition (e.g. Adan, 2012) show small fluid deficits impair attention.'
	},
	{
		title: 'Walk to a window',
		body: 'Sixty seconds of looking at something natural — sky, trees, distance — is a real reset.',
		why: 'Attention Restoration Theory (Kaplan): nature views replenish directed attention.'
	},
	{
		title: 'Box breathe: 4-4-4-4',
		body: 'In for 4. Hold for 4. Out for 4. Hold for 4. Three rounds is enough.',
		why: 'Slow paced breathing increases HRV and parasympathetic tone, lowering arousal for sustained focus.'
	},
	{
		title: 'Just sit and let your mind wander',
		body: 'Don\'t pick up your phone. Let yourself be bored. This is when ideas surface.',
		why: 'Mind-wandering (Smallwood) restores attention; scrolling competes with the work you just did.'
	}
] as const;

export const dontDoOnBreak =
	'Try not to open social media, news, or chat. They use the same attention you just spent — your brain doesn\'t rest.';

export const ritualIntention =
	'Implementation intentions ("when X, I will Y") roughly double follow-through (Gollwitzer 1999).';

export const parkItExplain =
	'Capturing intrusive thoughts frees up working memory (Zeigarnik). Review them in the break.';

export const softBellExplain =
	'A quieter chime at 80% so you can finish a thought instead of being yanked out of flow.';

export const dndExplain =
	'Re-focusing after an interruption takes around 23 minutes (Mark, UCI). Worth protecting the block.';

export const compassionateStreak =
	'Misses happen. Rest days are part of the practice. Streaks that shame you break first.';

export function randomBreakActivity(seedHint?: number) {
	const idx =
		(seedHint ?? Math.floor(Math.random() * breakActivities.length)) % breakActivities.length;
	return breakActivities[idx];
}
