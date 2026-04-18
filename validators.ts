import { Op, Operation } from './operation';
import { KonvaNodeConfig, KonvaLayerConfig } from './snapshot';

export interface ValidationResult {
	valid: boolean;
	errors: string[];
}

type OperationValidator = (op: any) => ValidationResult;
type OperationValidatorMap = Record<Operation['op'], OperationValidator>;

function ok(): ValidationResult {
	return { valid: true, errors: [] };
}

function fail(...errors: string[]): ValidationResult {
	return { valid: false, errors };
}

function isNonEmptyString(v: unknown): v is string {
	return typeof v === 'string' && v.trim().length > 0;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
	return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function validateNode(node: unknown, path = 'node'): string[] {
	if (!isPlainObject(node)) return [`${path} must be an object`];
	const errors: string[] = [];
	const n = node as unknown as KonvaNodeConfig;
	if (!isNonEmptyString(n.className))
		errors.push(`${path}.className must be a non-empty string`);
	if (!isPlainObject(n.attrs))
		errors.push(`${path}.attrs must be an object`);
	return errors;
}

function validateLayer(layer: unknown, path = 'layer'): string[] {
	const errors = validateNode(layer, path);
	if (!isPlainObject(layer)) return errors;
	const l = layer as unknown as KonvaLayerConfig;
	if (!Array.isArray(l.children))
		errors.push(`${path}.children must be an array`);
	return errors;
}

const operationValidators: OperationValidatorMap = {
	[Op.ADD]: (op) => {
		const errors: string[] = [];
		if (!isNonEmptyString(op.parentId)) errors.push('parentId must be a non-empty string');
		errors.push(...validateNode(op.node));
		return errors.length ? fail(...errors) : ok();
	},

	[Op.UPDATE]: (op) => {
		const errors: string[] = [];
		if (!isNonEmptyString(op.id)) errors.push('id must be a non-empty string');
		if (!isPlainObject(op.props)) errors.push('props must be an object');
		return errors.length ? fail(...errors) : ok();
	},

	[Op.DELETE]: (op) => {
		if (!isNonEmptyString(op.id)) return fail('id must be a non-empty string');
		return ok();
	},

	[Op.REORDER]: (op) => {
		const errors: string[] = [];
		if (!isNonEmptyString(op.id)) errors.push('id must be a non-empty string');
		if (typeof op.newIndex !== 'number' || op.newIndex < 0)
			errors.push('newIndex must be a non-negative number');
		return errors.length ? fail(...errors) : ok();
	},

	[Op.MOVE_TO_LAYER]: (op) => {
		const errors: string[] = [];
		if (!isNonEmptyString(op.id)) errors.push('id must be a non-empty string');
		if (!isNonEmptyString(op.layerId)) errors.push('layerId must be a non-empty string');
		return errors.length ? fail(...errors) : ok();
	},

	[Op.ADD_LAYER]: (op) => {
		const errors = validateLayer(op.layer);
		return errors.length ? fail(...errors) : ok();
	},

	[Op.UPDATE_LAYER]: (op) => {
		const errors: string[] = [];
		if (!isNonEmptyString(op.id)) errors.push('id must be a non-empty string');
		if (!isPlainObject(op.props)) errors.push('props must be an object');
		return errors.length ? fail(...errors) : ok();
	},

	[Op.DELETE_LAYER]: (op) => {
		if (!isNonEmptyString(op.id)) return fail('id must be a non-empty string');
		return ok();
	},

	[Op.REORDER_LAYER]: (op) => {
		const errors: string[] = [];
		if (!isNonEmptyString(op.id)) errors.push('id must be a non-empty string');
		if (typeof op.newIndex !== 'number' || op.newIndex < 0)
			errors.push('newIndex must be a non-negative number');
		return errors.length ? fail(...errors) : ok();
	},

	[Op.UPDATE_STAGE]: (op) => {
		if (!isPlainObject(op.props)) return fail('props must be an object');
		return ok();
	},
};

/**
 * Validates a single operation object.
 *
 * Accepts `unknown` because the data may come from the network or user input.
 * Checks that `op` field exists and is a known operation type, then validates
 * the required fields for that specific operation.
 *
 * @param op - The operation to validate.
 * @returns `{ valid: true }` or `{ valid: false, errors: string[] }`.
 */
export function validateOperation(op: unknown): ValidationResult {
	if (!isPlainObject(op)) return fail('operation must be an object');
	const operation = op as Record<string, unknown>;
	if (!isNonEmptyString(operation.op)) return fail('op must be a non-empty string');
	const validator = operationValidators[operation.op as Operation['op']];
	if (!validator) return fail(`unknown op: "${operation.op}"`);
	return validator(operation);
}

/**
 * Validates an array of operations before sending a commit.
 *
 * Validates each operation individually and collects all errors prefixed with
 * the index (e.g. `[2] id must be a non-empty string`).
 *
 * @param changes - The array of operations to validate.
 * @returns `{ valid: true }` or `{ valid: false, errors: string[] }`.
 */
export function validateCommitChanges(changes: unknown): ValidationResult {
	if (!Array.isArray(changes)) return fail('changes must be an array');
	if (changes.length === 0) return fail('changes must not be empty');
	const errors: string[] = [];
	changes.forEach((op, i) => {
		const result = validateOperation(op);
		if (!result.valid) errors.push(...result.errors.map((e) => `[${i}] ${e}`));
	});
	return errors.length ? fail(...errors) : ok();
}
