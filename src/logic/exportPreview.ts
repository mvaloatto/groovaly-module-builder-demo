import { RoughGenerator } from 'roughjs/bin/generator';
import type { PlacedItem } from './grid';
import type { LayoutModule, LayoutPayload, ModuleType } from '../types/layout';

type ExportGeometry = {
  width: number;
  height: number;
  gridX: number;
  gridY: number;
  colWidth: number;
  rowHeight: number;
  feetHeight: number;
};

const MODULE_TYPE_MAP: Record<string, ModuleType> = {
  tilt: 'TILT',
  chest: 'CHEST',
  bloom: 'BLOOM',
  grid: 'GRID',
  split: 'SPLIT',
  cub: 'CUB',
  nest: 'NEST',
};

function stableCompare(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

function stableSeed(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return Math.max(1, hash % 2147483647);
}

function toModuleType(typeId: string): ModuleType {
  const key = typeId.toLowerCase();
  return MODULE_TYPE_MAP[key] ?? key.toUpperCase() as ModuleType;
}

export function exportLayout(
  placedItems: PlacedItem[],
  addFeet: boolean,
  gridCols: number,
  gridRows: number,
  preset: string,
): LayoutPayload {
  const modules: LayoutModule[] = placedItems.map((item) => ({
    id: item.id,
    type: toModuleType(item.typeId),
    x: item.col,
    y: item.row,
    w: item.w,
    h: 1,
    feet: addFeet && item.row === 0,
    variant: 'default',
  }));

  modules.sort((a, b) => stableCompare(a.id, b.id));

  return {
    version: '1.0',
    canvas: { grid_cols: gridCols, grid_rows: gridRows },
    modules,
    preset,
  };
}

function rowTop(row: number, gridY: number, rowHeight: number, gridRows: number): number {
  return gridY + (gridRows - 1 - row) * rowHeight;
}

export function buildLineartSvgString(
  layout: LayoutPayload,
  geometry: ExportGeometry,
): string {
  const g = new RoughGenerator();
  const stroke = '#151515';
  const paths: string[] = [];

  const gridWidth = layout.canvas.grid_cols * geometry.colWidth;
  const gridHeight = layout.canvas.grid_rows * geometry.rowHeight;

  const frame = g.rectangle(geometry.gridX, geometry.gridY, gridWidth, gridHeight, {
    stroke,
    fill: 'none',
    roughness: 1.2,
    bowing: 1,
    strokeWidth: 1.2,
    seed: 1001,
  });

  for (const p of g.toPaths(frame)) {
    paths.push(`<path d="${p.d}" fill="none" stroke="${p.stroke ?? stroke}" stroke-width="${p.strokeWidth ?? 1}"/>`);
  }

  for (let col = 1; col < layout.canvas.grid_cols; col += 1) {
    const x = geometry.gridX + col * geometry.colWidth;
    const vLine = g.line(x, geometry.gridY, x, geometry.gridY + gridHeight, {
      stroke,
      roughness: 1,
      bowing: 0.8,
      strokeWidth: 0.9,
      seed: 1100 + col,
    });
    for (const p of g.toPaths(vLine)) {
      paths.push(`<path d="${p.d}" fill="none" stroke="${p.stroke ?? stroke}" stroke-width="${p.strokeWidth ?? 1}"/>`);
    }
  }

  for (let row = 1; row < layout.canvas.grid_rows; row += 1) {
    const y = geometry.gridY + row * geometry.rowHeight;
    const hLine = g.line(geometry.gridX, y, geometry.gridX + gridWidth, y, {
      stroke,
      roughness: 1,
      bowing: 0.8,
      strokeWidth: 0.9,
      seed: 1200 + row,
    });
    for (const p of g.toPaths(hLine)) {
      paths.push(`<path d="${p.d}" fill="none" stroke="${p.stroke ?? stroke}" stroke-width="${p.strokeWidth ?? 1}"/>`);
    }
  }

  for (const moduleItem of layout.modules) {
    const x = geometry.gridX + moduleItem.x * geometry.colWidth;
    const y = rowTop(moduleItem.y, geometry.gridY, geometry.rowHeight, layout.canvas.grid_rows);
    const w = moduleItem.w * geometry.colWidth;
    const h = geometry.rowHeight;
    const moduleSeed = stableSeed(moduleItem.id);

    const rect = g.rectangle(x, y, w, h, {
      stroke,
      fill: 'none',
      roughness: 1,
      bowing: 0.8,
      strokeWidth: 1.3,
      seed: moduleSeed,
    });

    for (const p of g.toPaths(rect)) {
      paths.push(`<path d="${p.d}" fill="none" stroke="${p.stroke ?? stroke}" stroke-width="${p.strokeWidth ?? 1}"/>`);
    }

    if (moduleItem.feet) {
      const feetRect = g.rectangle(
        x + 0.15 * geometry.colWidth,
        geometry.gridY + layout.canvas.grid_rows * geometry.rowHeight + 0.18 * geometry.feetHeight,
        w - 0.3 * geometry.colWidth,
        0.64 * geometry.feetHeight,
        {
          stroke,
          fill: 'none',
          roughness: 1,
          bowing: 0.7,
          strokeWidth: 1.1,
          seed: moduleSeed + 1,
        },
      );

      for (const p of g.toPaths(feetRect)) {
        paths.push(`<path d="${p.d}" fill="none" stroke="${p.stroke ?? stroke}" stroke-width="${p.strokeWidth ?? 1}"/>`);
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${geometry.width}" height="${geometry.height}" viewBox="0 0 ${geometry.width} ${geometry.height}">${paths.join('')}</svg>`;
}

export async function svgToPngBlob(
  svgString: string,
  options: { pixelRatio?: number; background?: string } = {},
): Promise<Blob> {
  const pixelRatio = options.pixelRatio ?? 2;
  const background = options.background ?? '#fff';

  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  const svg = doc.documentElement;
  const width = Number(svg.getAttribute('width') ?? 0);
  const height = Number(svg.getAttribute('height') ?? 0);

  if (!width || !height) {
    throw new Error('Invalid SVG dimensions for PNG export.');
  }

  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Unable to decode SVG image.'));
      img.src = svgUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * pixelRatio));
    canvas.height = Math.max(1, Math.round(height * pixelRatio));

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Unable to create 2D canvas context.');

    ctx.scale(pixelRatio, pixelRatio);
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to export PNG blob from canvas.'));
          return;
        }
        resolve(blob);
      }, 'image/png');
    });
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

export function downloadText(filename: string, text: string): void {
  const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
