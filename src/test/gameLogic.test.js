import { describe, it, expect } from 'vitest';
import { checkLogicCondition, evaluateLogic, resolveNextNode, resolveEdgeTarget } from '../lib/gameLogic';

describe('gameLogic utilities', () => {
    describe('checkLogicCondition', () => {
        it('should return true for always_true', () => {
            expect(checkLogicCondition('always_true', new Set(), [])).toBe(true);
        });

        it('should return false for always_false', () => {
            expect(checkLogicCondition('always_false', new Set(), [])).toBe(false);
        });

        it('should check inventory for basic conditions', () => {
            const inventory = new Set(['key1', 'key2']);
            expect(checkLogicCondition('key1', inventory, [])).toBe(true);
            expect(checkLogicCondition('key3', inventory, [])).toBe(false);
        });

        it('should handle AND logic', () => {
            const inventory = new Set(['key1']);
            expect(checkLogicCondition('key1 && key2', inventory, [])).toBe(false);
            inventory.add('key2');
            expect(checkLogicCondition('key1 && key2', inventory, [])).toBe(true);
        });

        it('should handle OR logic', () => {
            const inventory = new Set(['key1']);
            expect(checkLogicCondition('key1 || key2', inventory, [])).toBe(true);
            expect(checkLogicCondition('key3 || key2', inventory, [])).toBe(false);
        });

        it('should handle visited prefix', () => {
            const history = ['node1', 'node2'];
            expect(checkLogicCondition('visited:node1', new Set(), history)).toBe(true);
            expect(checkLogicCondition('visited:node3', new Set(), history)).toBe(false);
        });

        it('should handle has prefix', () => {
            const inventory = new Set(['item1']);
            expect(checkLogicCondition('has:item1', inventory, [])).toBe(true);
            expect(checkLogicCondition('has:item2', inventory, [])).toBe(false);
        });
    });

    describe('evaluateLogic', () => {
        it('should evaluate numeric comparisons', () => {
            const node = { data: { variable: 'score', operator: '>', value: '10' } };
            const nodeOutputs = { score: 15 };
            expect(evaluateLogic(node, new Set(), nodeOutputs)).toBe(true);

            node.data.value = '20';
            expect(evaluateLogic(node, new Set(), nodeOutputs)).toBe(false);
        });

        it('should evaluate string equality', () => {
            const node = { data: { variable: 'name', operator: '==', value: 'Alice' } };
            const nodeOutputs = { name: 'Alice' };
            expect(evaluateLogic(node, new Set(), nodeOutputs)).toBe(true);
        });

        it('should evaluate contains', () => {
            const node = { data: { variable: 'msg', operator: 'contains', value: 'hello' } };
            const nodeOutputs = { msg: 'hello world' };
            expect(evaluateLogic(node, new Set(), nodeOutputs)).toBe(true);
        });
    });

    describe('resolveNextNode', () => {
        const nodes = [
            { id: 'start', type: 'story' },
            { id: 'logic1', type: 'logic', data: { condition: 'has_key' } },
            { id: 'true_end', type: 'story' },
            { id: 'false_end', type: 'story' },
            { id: 'setter1', type: 'setter', data: { variableId: 'score', operation: 'increment', value: '5' } },
            { id: 'next_story', type: 'story' }
        ];
        const edges = [
            { id: 'e1', source: 'logic1', target: 'true_end', sourceHandle: 'true' },
            { id: 'e2', source: 'logic1', target: 'false_end', sourceHandle: 'false' },
            { id: 'e3', source: 'setter1', target: 'next_story' }
        ];

        it('should resolve logic nodes correctly', () => {
            const inventory = new Set(['has_key']);
            const result = resolveNextNode('logic1', { nodes, edges, inventory, nodeOutputs: {}, history: [] });
            expect(result.nodeId).toBe('true_end');
        });

        it('should handle setter nodes and update local state', () => {
            const result = resolveNextNode('setter1', { nodes, edges, inventory: new Set(), nodeOutputs: { score: 10 }, history: [] });
            expect(result.nodeId).toBe('next_story');
            expect(result.localOutputs.score).toBe(15);
            expect(result.stateChanged).toBe(true);
        });
    });
});
