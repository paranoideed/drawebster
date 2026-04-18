import { Op, Operation } from './operation';
import { KonvaStageConfig, KonvaNodeConfig, KonvaLayerConfig } from './snapshot';

function findNode(nodes: KonvaNodeConfig[], id: string): KonvaNodeConfig | null {
	for (const node of nodes) {
		if (node.attrs.id === id) return node;
		if (node.children) {
			const found = findNode(node.children, id);
			if (found) return found;
		}
	}
	return null;
}

function removeNode(nodes: KonvaNodeConfig[], id: string): KonvaNodeConfig | null {
	for (const node of nodes) {
		const idx = node.children?.findIndex((n) => n.attrs.id === id) ?? -1;
		if (idx !== -1) return node.children!.splice(idx, 1)[0];
		if (node.children) {
			const removed = removeNode(node.children, id);
			if (removed) return removed;
		}
	}
	return null;
}

/**
 * Applies a single operation to the stage in-place.
 *
 * Mutates `stage` directly — call this only on a deep-cloned stage (as `buildSnapshot` does).
 * If a referenced node or layer is not found, logs a warning and returns without throwing.
 *
 * @param stage - The Konva stage to modify.
 * @param change - The operation to apply.
 */
export function applyOperation(stage: KonvaStageConfig, change: Operation): void {
	switch (change.op) {
		case Op.ADD: {
			const parent =
				stage.children.find((l) => l.attrs.id === change.parentId) ??
				findNode(stage.children, change.parentId);
			if (!parent) { console.warn(`Parent "${change.parentId}" not found`); return; }
			parent.children = parent.children ?? [];
			parent.children.push(change.node);
			break;
		}

		case Op.UPDATE: {
			const node = findNode(stage.children, change.id);
			if (!node) { console.warn(`Node "${change.id}" not found`); return; }
			Object.assign(node.attrs, change.props);
			break;
		}

		case Op.DELETE: {
			removeNode(stage.children, change.id);
			break;
		}

		case Op.REORDER: {
			for (const layer of stage.children) {
				const idx = layer.children?.findIndex((n) => n.attrs.id === change.id) ?? -1;
				if (idx !== -1) {
					const [node] = layer.children!.splice(idx, 1);
					layer.children!.splice(change.newIndex, 0, node);
					break;
				}
			}
			break;
		}

		case Op.MOVE_TO_LAYER: {
			const node = removeNode(stage.children, change.id);
			if (!node) { console.warn(`Node "${change.id}" not found`); return; }
			const target = stage.children.find((l) => l.attrs.id === change.layerId);
			if (!target) { console.warn(`Layer "${change.layerId}" not found`); return; }
			target.children = target.children ?? [];
			target.children.push(node);
			break;
		}

		case Op.ADD_LAYER: {
			stage.children.push(change.layer);
			break;
		}

		case Op.UPDATE_LAYER: {
			const layer = stage.children.find((l) => l.attrs.id === change.id);
			if (!layer) { console.warn(`Layer "${change.id}" not found`); return; }
			Object.assign(layer.attrs, change.props);
			break;
		}

		case Op.DELETE_LAYER: {
			const idx = stage.children.findIndex((l) => l.attrs.id === change.id);
			if (idx !== -1) stage.children.splice(idx, 1);
			break;
		}

		case Op.REORDER_LAYER: {
			const idx = stage.children.findIndex((l) => l.attrs.id === change.id);
			if (idx !== -1) {
				const [layer] = stage.children.splice(idx, 1);
				stage.children.splice(change.newIndex, 0, layer);
			}
			break;
		}

		case Op.UPDATE_STAGE: {
			Object.assign(stage.attrs, change.props);
			break;
		}
	}
}
