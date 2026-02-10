import { useMemo, type CSSProperties } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { RoughGenerator } from 'roughjs/bin/generator';
import type { ModuleType } from '../logic/grid';

type ModulePaletteProps = {
  moduleTypes: ModuleType[];
};

type RoughPath = {
  d: string;
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
};

function buildThumbnail(w: 1 | 2): RoughPath[] {
  const g = new RoughGenerator();
  const width = w === 2 ? 62 : 42;
  const height = 32;

  const frame = g.rectangle(5, 5, width, height, {
    stroke: 'var(--gb-text)',
    strokeWidth: 1.2,
    roughness: 1.1,
  });

  const paths = [...g.toPaths(frame)];

  const lineA = g.line(10, 15, width - 2, 15, { stroke: 'var(--gb-muted)', roughness: 1.3 });
  const lineB = g.line(12, 26, width - 5, 26, { stroke: 'var(--gb-muted)', roughness: 1.3 });
  paths.push(...g.toPaths(lineA), ...g.toPaths(lineB));

  return paths;
}

function PaletteItem({ moduleType }: { moduleType: ModuleType }): JSX.Element {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${moduleType.id}`,
    data: {
      source: 'palette',
      typeId: moduleType.id,
      w: moduleType.w,
      h: 1,
    },
  });

  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const paths = useMemo(() => buildThumbnail(moduleType.w), [moduleType.w]);

  return (
    <div
      ref={setNodeRef}
      className="gb-palette-item"
      style={style}
      {...listeners}
      {...attributes}
      role="button"
      tabIndex={0}
    >
      <svg className="gb-palette-thumb" width={80} height={46} viewBox="0 0 80 46" aria-hidden="true">
        {paths.map((path, idx) => (
          <path
            key={`${moduleType.id}-${idx}`}
            d={path.d}
            fill={path.fill ?? 'none'}
            stroke={path.stroke ?? 'var(--gb-text)'}
            strokeWidth={path.strokeWidth ?? 1}
          />
        ))}
      </svg>
      <div className="gb-palette-meta">
        <span className="gb-palette-name">{moduleType.name}</span>
        <span className="gb-palette-size">{moduleType.w}x1</span>
      </div>
    </div>
  );
}

export function ModulePalette({ moduleTypes }: ModulePaletteProps): JSX.Element {
  return (
    <aside className="gb-palette-panel" aria-label="Module palette">
      <h2 className="gb-panel-title">Modules</h2>
      <p className="gb-panel-copy">Drag any module onto the 4x3 setup grid.</p>
      <div className="gb-palette-list">
        {moduleTypes.map((moduleType) => (
          <PaletteItem key={moduleType.id} moduleType={moduleType} />
        ))}
      </div>
    </aside>
  );
}
