import { Operation } from './operation';

export interface Commit {
	number: number;
	previous: number;
	changes: Operation[];
}
