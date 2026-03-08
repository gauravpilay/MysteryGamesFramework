import { createContext, useContext } from 'react';

/**
 * EditorContext — provides canvas-level data to all node components
 * without requiring it to be stored in node.data (which bloats Firestore).
 *
 * Available fields:
 *   learningObjectives: Array<{ id, category, objectives[] }>
 */
export const EditorContext = createContext({
    learningObjectives: [],
    projectId: null,
});

export const useEditorContext = () => useContext(EditorContext);
