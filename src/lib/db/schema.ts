import Dexie, { type Table } from 'dexie';

export interface Session {
	id?: number;
	startedAt: number;
	endedAt: number | null;
	plannedDurationSec: number;
	actualDurationSec: number;
	type: 'work' | 'short-break' | 'long-break';
	preset: string;
	task: string;
	definitionOfDone: string;
	tag?: string;
	focusRating?: 1 | 2 | 3 | 4 | 5;
	difficultyRating?: 1 | 2 | 3 | 4 | 5;
	interruptionCount: number;
	taskStatus?: 'done' | 'continue' | 'abandon';
	note?: string;
	parkItNoteIds: number[];
	completed: boolean;
}

export interface ParkItNote {
	id?: number;
	sessionId: number;
	createdAt: number;
	text: string;
	resolution?: 'do-now' | 'schedule' | 'drop';
}

export interface BlocklistEntry {
	id?: number;
	pattern: string;
	createdAt: number;
	hitCount: number;
}

export interface RecentTask {
	id?: number;
	text: string;
	lastUsedAt: number;
	useCount: number;
	tag?: string;
}

export interface SettingValue {
	key: string;
	value: unknown;
}

export class PomodoroDB extends Dexie {
	sessions!: Table<Session, number>;
	parkItNotes!: Table<ParkItNote, number>;
	blocklist!: Table<BlocklistEntry, number>;
	recentTasks!: Table<RecentTask, number>;
	settings!: Table<SettingValue, string>;

	constructor() {
		super('pomodoro');
		this.version(1).stores({
			sessions: '++id, startedAt, type, tag, completed',
			parkItNotes: '++id, sessionId, createdAt',
			blocklist: '++id, &pattern',
			recentTasks: '++id, &text, lastUsedAt',
			settings: 'key'
		});
	}
}

let _db: PomodoroDB | null = null;

export function db(): PomodoroDB {
	if (!_db) _db = new PomodoroDB();
	return _db;
}

/** For tests: reset the singleton. */
export function _resetDb() {
	_db = null;
}
