import { Commit } from './commit';
import { validateOperation } from './validators';
import { applyOperation } from './handlers';

export interface KonvaNodeConfig {
	className: string;
	attrs: Record<string, unknown>;
	children?: KonvaNodeConfig[];
}

export interface KonvaStageConfig extends KonvaNodeConfig {
	className: 'Stage';
	children: KonvaLayerConfig[];
}

export interface KonvaLayerConfig extends KonvaNodeConfig {
	className: 'Layer';
	children: KonvaNodeConfig[];
}

/**
 * Applies a list of commits on top of a snapshot and returns the resulting stage.
 *
 * The input snapshot is never mutated — a deep clone is made before applying changes.
 * Invalid operations are skipped with a console warning instead of throwing.
 *
 * @param snapshot - The base Konva stage to start from.
 * @param commits - Ordered list of commits to apply.
 * @returns A new `KonvaStageConfig` representing the state after all commits.
 */
export function buildSnapshot(snapshot: KonvaStageConfig, commits: Commit[]): KonvaStageConfig {
	const stage: KonvaStageConfig = JSON.parse(JSON.stringify(snapshot));

	for (const commit of commits) {
		for (const change of commit.changes) {
			const result = validateOperation(change);
			if (!result.valid) {
				console.warn(`Skipping invalid operation in commit ${commit.number}:`, result.errors);
				continue;
			}
			applyOperation(stage, change);
		}
	}

	return stage;
}
