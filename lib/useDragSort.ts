'use client';

import { useState } from 'react';

/**
 * Minimal native HTML5 drag-to-reorder helper (no external dependency).
 *
 * Reordering happens live as the dragged row passes over its neighbours: on each
 * `onDragEnter` the item is spliced to the hovered index and `onReorder` is fired
 * with the new array. `onDrop` fires once when the drag ends (mouse released) —
 * use it to persist the final order.
 *
 * Spread `dragProps(id)` onto each sortable row.
 */
export function useDragSort<T>(
    items: T[],
    getId: (item: T) => number,
    onReorder: (next: T[]) => void,
    onDrop?: () => void,
) {
    const [draggingId, setDraggingId] = useState<number | null>(null);

    const move = (overId: number) => {
        if (draggingId === null || draggingId === overId) return;
        const from = items.findIndex((i) => getId(i) === draggingId);
        const to = items.findIndex((i) => getId(i) === overId);
        if (from === -1 || to === -1) return;

        const next = [...items];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        onReorder(next);
    };

    const dragProps = (id: number) => ({
        draggable: true,
        onDragStart: (e: React.DragEvent) => {
            setDraggingId(id);
            // Firefox needs data set for the drag to initiate.
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', String(id));
        },
        onDragEnter: () => move(id),
        onDragOver: (e: React.DragEvent) => e.preventDefault(),
        onDragEnd: () => {
            const didDrag = draggingId !== null;
            setDraggingId(null);
            if (didDrag) onDrop?.();
        },
    });

    return { draggingId, dragProps };
}
