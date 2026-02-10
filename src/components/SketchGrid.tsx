import { useMemo } from 'react';
import { RoughGenerator } from 'roughjs/bin/generator';
import type { Options as RoughOptions } from 'roughjs/bin/core';

type SketchGridProps = {
  cols: number;
  rows: number;
  cellSize: number;
};

type RoughPath = {
  d: string;
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
};

function toPaths(width: number, height: number, cols: number, rows: number): RoughPath[] {
  const g = new RoughGenerator();
  const options: RoughOptions = {
    roughness: 1.2,
    bowing: 1,
    stroke: 'var(--gb-border)',
    strokeWidth: 1.1,
    fillStyle: 'solid',
  };

  const paths: RoughPath[] = [];
  const wall = g.rectangle(1, 1, Math.max(width - 2, 0), Math.max(height - 2, 0), {
    ...options,
    strokeWidth: 1.4,
  });
  paths.push(...g.toPaths(wall));

  for (let c = 0; c < cols; c += 1) {
    for (let r = 0; r < rows; r += 1) {
      const y = (rows - 1 - r) * (height / rows);
      const x = c * (width / cols);
      const rect = g.rectangle(x + 2, y + 2, width / cols - 4, height / rows - 4, options);
      paths.push(...g.toPaths(rect));
    }
  }

  return paths;
}

export function SketchGrid({ cols, rows, cellSize }: SketchGridProps): JSX.Element {
  const width = cols * cellSize;
  const height = rows * cellSize;

  const paths = useMemo(() => toPaths(width, height, cols, rows), [width, height, cols, rows]);

  return (
    <svg
      className="gb-sketch-grid"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="presentation"
      aria-hidden="true"
    >
      {paths.map((path, idx) => (
        <path
          key={`${path.d.slice(0, 24)}-${idx}`}
          d={path.d}
          fill={path.fill ?? 'none'}
          stroke={path.stroke ?? 'var(--gb-border)'}
          strokeWidth={path.strokeWidth ?? 1}
        />
      ))}
    </svg>
  );
}
