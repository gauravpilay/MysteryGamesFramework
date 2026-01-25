import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import GamePreview from '../components/GamePreview';
import React from 'react';

// Mock child components that might be complex or have side effects
vi.mock('../components/EvidenceBoard', () => ({
    default: () => <div data-testid="evidence-board">Evidence Board</div>
}));
vi.mock('../components/AdvancedTerminal', () => ({
    default: () => <div data-testid="advanced-terminal">Terminal</div>
}));
vi.mock('../components/AIInterrogation', () => ({
    default: () => <div data-testid="ai-interrogation">AI Interrogation</div>
}));

const mockNodes = [
    {
        id: 'start-node',
        type: 'story',
        data: { label: 'Start Node', story: '' },
        position: { x: 0, y: 0 }
    },
    {
        id: 'next-node',
        type: 'story',
        data: { label: 'Next Node', story: '' },
        position: { x: 100, y: 0 }
    }
];

const mockEdges = [
    { id: 'e1', source: 'start-node', target: 'next-node', label: 'Go Forward', isAction: true }
];

describe('GamePreview Component', () => {
    it('renders the start node', async () => {
        render(
            <GamePreview
                nodes={mockNodes}
                edges={mockEdges}
                onClose={() => { }}
                gameMetadata={{}}
            />
        );

        // Should show start node label
        expect(await screen.findByText(/Start Node/i)).toBeInTheDocument();
    });

    it('transitions to the next node on option click', async () => {
        render(
            <GamePreview
                nodes={mockNodes}
                edges={mockEdges}
                onClose={() => { }}
                gameMetadata={{}}
            />
        );

        const button = await screen.findByTestId('option-next-node');
        fireEvent.click(button);

        // Should show next node label
        expect(await screen.findByText(/Next Node/i)).toBeInTheDocument();
    });

    it('shows the terminal when current node is terminal type', async () => {
        const terminalNodes = [
            { id: 'term', type: 'terminal', data: { label: 'Hack me' }, position: { x: 0, y: 0 } }
        ];
        render(
            <GamePreview
                nodes={terminalNodes}
                edges={[]}
                onClose={() => { }}
                gameMetadata={{}}
            />
        );

        expect(await screen.findByTestId('advanced-terminal')).toBeInTheDocument();
    });
});
