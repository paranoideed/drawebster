import { Op, Operation } from './operation';
import { KonvaNodeConfig, KonvaLayerConfig } from './snapshot';

/**
 * Factory functions for creating typed canvas operations.
 *
 * Use these on the frontend to build the `changes` array before sending a commit.
 * Each method returns a fully typed operation object ready to be passed to the WebSocket.
 *
 * @example
 * const changes = [
 *   Changes.add('layer1', { className: 'Rect', attrs: { id: '1', x: 0, y: 0 } }),
 *   Changes.update('1', { x: 100 }),
 * ];
 * socket.emit('commit', { canva_id, previous, changes });
 */
export const Changes = {
	/** Adds a node to a parent (layer or group) by its id. */
	add(parentId: string, node: KonvaNodeConfig): Extract<Operation, { op: typeof Op.ADD }> {
		return { op: Op.ADD, parentId, node };
	},

	/** Updates attrs of a node by its id. */
	update(id: string, props: Record<string, unknown>): Extract<Operation, { op: typeof Op.UPDATE }> {
		return { op: Op.UPDATE, id, props };
	},

	/** Removes a node by its id. */
	delete(id: string): Extract<Operation, { op: typeof Op.DELETE }> {
		return { op: Op.DELETE, id };
	},

	/** Moves a node to a new index within its layer. */
	reorder(id: string, newIndex: number): Extract<Operation, { op: typeof Op.REORDER }> {
		return { op: Op.REORDER, id, newIndex };
	},

	/** Moves a node to a different layer. */
	moveToLayer(id: string, layerId: string): Extract<Operation, { op: typeof Op.MOVE_TO_LAYER }> {
		return { op: Op.MOVE_TO_LAYER, id, layerId };
	},

	/** Adds a new layer to the stage. */
	addLayer(layer: KonvaLayerConfig): Extract<Operation, { op: typeof Op.ADD_LAYER }> {
		return { op: Op.ADD_LAYER, layer };
	},

	/** Updates attrs of a layer by its id. */
	updateLayer(id: string, props: Record<string, unknown>): Extract<Operation, { op: typeof Op.UPDATE_LAYER }> {
		return { op: Op.UPDATE_LAYER, id, props };
	},

	/** Removes a layer by its id. */
	deleteLayer(id: string): Extract<Operation, { op: typeof Op.DELETE_LAYER }> {
		return { op: Op.DELETE_LAYER, id };
	},

	/** Moves a layer to a new index within the stage. */
	reorderLayer(id: string, newIndex: number): Extract<Operation, { op: typeof Op.REORDER_LAYER }> {
		return { op: Op.REORDER_LAYER, id, newIndex };
	},

	/** Updates attrs of the stage itself (e.g. width, height). */
	updateStage(props: Record<string, unknown>): Extract<Operation, { op: typeof Op.UPDATE_STAGE }> {
		return { op: Op.UPDATE_STAGE, props };
	},
};
