/**
 * Pure functions for game engine logic
 */

export const checkLogicCondition = (condition, inventory, history) => {
    if (!condition || condition === 'always_true') return true;
    if (condition === 'always_false') return false;

    // Check for boolean operators (simple implementation)
    if (condition.includes(' && ')) {
        return condition.split(' && ').every(c => checkLogicCondition(c.trim(), inventory, history));
    }
    if (condition.includes(' || ')) {
        return condition.split(' || ').some(c => checkLogicCondition(c.trim(), inventory, history));
    }

    // PREV keyword: Check if the previous node was completed
    if (condition === 'PREV' || condition === 'previous_task') {
        const prevNodeId = history[history.length - 1];
        return prevNodeId && inventory.has(prevNodeId);
    }

    // Check visited status
    if (condition.startsWith('visited:')) {
        const targetId = condition.split(':')[1];
        return history.includes(targetId);
    }

    // Check collected status (Inventory)
    if (condition.startsWith('has:')) {
        const targetId = condition.split(':')[1];
        return inventory.has(targetId);
    }

    // Legacy/Direct ID checks
    // Hardcoded check for tutorial/sample usage
    if (condition === 'has_usb_drive' && (inventory.has('evidence-1') || inventory.has('sample-evidence-usb') || Array.from(inventory).some(i => i.toLowerCase().includes('usb')))) return true;

    // Cyber Case Hardcode
    if (condition === 'keycard_match_ken') {
        // Logic: Needs Keycard OR Logs (providing Access Code)
        if (inventory.has('evidence-cctv') || inventory.has('term-logs')) return true;
    }

    // Default: Check if the condition string matches an item in inventory
    return inventory.has(condition);
};

export const evaluateLogic = (node, inventory, nodeOutputs) => {
    const { variable, operator, value, condition } = node.data;
    let isTrue = false;

    if (variable) {
        let actualValue = undefined;
        if (nodeOutputs[variable] !== undefined) actualValue = nodeOutputs[variable];
        else if (inventory.has(variable)) actualValue = true;

        if (actualValue === undefined) {
            isTrue = false;
        } else {
            const sVal = String(actualValue).toLowerCase();
            const tVal = String(value || '').toLowerCase();

            if (!value && (operator === '==' || !operator)) isTrue = true;
            else if (operator === '!=') isTrue = sVal != tVal;
            else if (operator === '>') isTrue = parseFloat(actualValue) > parseFloat(value);
            else if (operator === '<') isTrue = parseFloat(actualValue) < parseFloat(value);
            else if (operator === 'contains') isTrue = sVal.includes(tVal);
            else isTrue = sVal == tVal;
        }
    } else {
        // Check legacy condition against inventory
        if (!condition || condition === 'always_true') isTrue = true;
        else if (condition === 'always_false') isTrue = false;
        else if (condition.startsWith('has:')) isTrue = inventory.has(condition.split(':')[1]);
        else isTrue = inventory.has(condition);
    }
    return isTrue;
};

export const resolveNextNode = (startId, { nodes, edges, inventory, nodeOutputs, history, maxLoops = 20 }) => {
    let currId = startId;
    let currNode = nodes.find(n => n.id === currId);
    let loopCount = 0;
    const intermediateIds = [];
    const localInventory = new Set(inventory);
    const localOutputs = { ...nodeOutputs };
    let stateChanged = false;
    let audioToPlay = null;

    while (currNode && (['music', 'logic', 'setter'].includes(currNode.type)) && loopCount < maxLoops) {
        loopCount++;
        intermediateIds.push(currNode.id);

        // Handle Music
        if (currNode.type === 'music') {
            if (currNode.data.url) {
                audioToPlay = {
                    url: currNode.data.url,
                    volume: currNode.data.volume ?? 0.5
                };
            }
            const outEdges = edges.filter(e => e.source === currNode.id);
            if (outEdges.length > 0) {
                currId = outEdges[0].target;
                currNode = nodes.find(n => n.id === currId);
            } else break;
        }
        // Handle Setter
        else if (currNode.type === 'setter') {
            const { variableId, operation, value } = currNode.data;
            if (variableId) {
                stateChanged = true;
                let valToSet = value;

                // Parse boolean strings
                if (String(value).toLowerCase() === 'true') valToSet = true;
                if (String(value).toLowerCase() === 'false') valToSet = false;

                // Check current value
                const currentVal = localOutputs[variableId] !== undefined ? localOutputs[variableId] : (localInventory.has(variableId) ? true : undefined);

                if (operation === 'toggle') {
                    valToSet = !currentVal;
                } else if (operation === 'increment') {
                    valToSet = (parseInt(currentVal) || 0) + (parseInt(value) || 1);
                } else if (operation === 'decrement') {
                    valToSet = (parseInt(currentVal) || 0) - (parseInt(value) || 1);
                }

                // Update Local State
                localOutputs[variableId] = valToSet;
                // Sync Inventory for boolean flags
                if (valToSet === true) localInventory.add(variableId);
                else if (valToSet === false) localInventory.delete(variableId);
            }

            const outEdges = edges.filter(e => e.source === currNode.id);
            if (outEdges.length > 0) {
                currId = outEdges[0].target;
                currNode = nodes.find(n => n.id === currId);
            } else break;
        }
        // Handle Logic
        else if (currNode.type === 'logic') {
            const isTrue = evaluateLogic(currNode, localInventory, localOutputs);
            const nodeOptions = edges.filter(e => e.source === currNode.id);

            if (currNode.data.logicType === 'while' && !isTrue) {
                break;
            }

            const trueEdge = nodeOptions.find(e => e.sourceHandle === 'true' || e.label === 'True' || e.label === 'true');
            const falseEdge = nodeOptions.find(e => e.sourceHandle === 'false' || e.label === 'False' || e.label === 'false');

            let nextEdge = isTrue ? trueEdge : falseEdge;

            if (!nextEdge && nodeOptions.length > 0) {
                nextEdge = isTrue ? nodeOptions[0] : (nodeOptions.length > 1 ? nodeOptions[1] : null);
            }

            if (nextEdge) {
                currId = nextEdge.target;
                currNode = nodes.find(n => n.id === currId);
            } else {
                break; // Dead end
            }
        }
    }

    return {
        nodeId: currId,
        node: currNode,
        intermediateIds,
        localInventory,
        localOutputs,
        stateChanged,
        audioToPlay
    };
};

export const resolveEdgeTarget = (edge, { nodes, edges, inventory, nodeOutputs, history, processedLogicNodes = new Set() }) => {
    // 1. Evidence-based visibility: If edge label or data matches an evidence ID or label, 
    // it's ONLY enabled if that evidence has been acquired.
    const isEvidenceLink = nodes.some(n =>
        (n.type === 'evidence' || n.type === 'email') && (
            edge.label?.toLowerCase() === n.data.label?.toLowerCase() ||
            edge.data?.evidenceId === n.id ||
            edge.label === n.id
        )
    );

    if (isEvidenceLink) {
        // Find the specific evidence ID to check against inventory
        const evidenceNode = nodes.find(n =>
            (n.type === 'evidence' || n.type === 'email') && (
                edge.label?.toLowerCase() === n.data.label?.toLowerCase() ||
                edge.data?.evidenceId === n.id ||
                edge.label === n.id
            )
        );
        if (evidenceNode && !inventory.has(evidenceNode.id)) {
            return null; // Evidence not found yet, path is hidden
        }
    }

    const targetNode = nodes.find(n => n.id === edge.target);
    if (!targetNode) return null;

    // Atomic Node (Terminal, Visible Node) -> Return as is
    if (!['logic', 'music', 'setter'].includes(targetNode.type)) {
        return edge;
    }

    // Logic/Music Node -> Evaluate and continue
    if (targetNode.type === 'logic') {
        if (processedLogicNodes.has(targetNode.id)) return null; // Cycle guard
        processedLogicNodes.add(targetNode.id);

        const isTrue = evaluateLogic(targetNode, inventory, nodeOutputs);

        // Find next edge based on result
        const logicEdges = edges.filter(e => e.source === targetNode.id);
        const trueEdge = logicEdges.find(e => e.sourceHandle === 'true' || e.label === 'True' || e.label === 'true');
        const falseEdge = logicEdges.find(e => e.sourceHandle === 'false' || e.label === 'False' || e.label === 'false');

        let nextEdge = isTrue ? trueEdge : falseEdge;
        // Fallback
        if (!nextEdge && logicEdges.length > 0) {
            nextEdge = isTrue ? logicEdges[0] : (logicEdges.length > 1 ? logicEdges[1] : null);
        }

        if (nextEdge) return resolveEdgeTarget(nextEdge, { nodes, edges, inventory, nodeOutputs, history, processedLogicNodes });
        return null; // Dead end logic path (Hidden option)
    }

    if (targetNode.type === 'music' || targetNode.type === 'setter') {
        // Music/Setter always passes through
        const outEdges = edges.filter(e => e.source === targetNode.id);
        if (outEdges.length > 0) return resolveEdgeTarget(outEdges[0], { nodes, edges, inventory, nodeOutputs, history, processedLogicNodes });
        return null;
    }

    return edge;
};
