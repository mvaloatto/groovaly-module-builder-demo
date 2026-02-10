export const GRID_COLS = 6;
export const GRID_ROWS = 4;

export type Cell = { occupiedBy: string | null };
export type Occupancy = Cell[][];

export type ModuleWidth = 1 | 2;

export type ModuleType = {
  id: string;
  name: string;
  w: ModuleWidth;
  h: 1;
};

export type PlacedItem = {
  id: string;
  typeId: string;
  w: ModuleWidth;
  h: 1;
  col: number;
  row: number;
};

export type GridCellPos = { c: number; r: number };

export function createEmptyOccupancy(cols = GRID_COLS, rows = GRID_ROWS): Occupancy {
  return Array.from({ length: cols }, () =>
    Array.from({ length: rows }, () => ({ occupiedBy: null })),
  );
}

export function getFootprint(col: number, row: number, w: ModuleWidth): GridCellPos[] {
  if (w === 1) return [{ c: col, r: row }];
  return [
    { c: col, r: row },
    { c: col + 1, r: row },
  ];
}

export function isInBounds(col: number, row: number, w: ModuleWidth): boolean {
  return col >= 0 && row >= 0 && row < GRID_ROWS && col + w - 1 < GRID_COLS;
}

export function isOverlapping(
  footprint: GridCellPos[],
  occupancy: Occupancy,
  ignorePlacedId?: string,
): boolean {
  return footprint.some(({ c, r }) => {
    const occupiedBy = occupancy[c]?.[r]?.occupiedBy;
    return occupiedBy !== null && occupiedBy !== ignorePlacedId;
  });
}

export function isSupported(footprint: GridCellPos[], occupancy: Occupancy): boolean {
  if (footprint.length === 0) return false;
  if (footprint[0].r === 0) return true;

  return footprint.every(({ c, r }) => occupancy[c]?.[r - 1]?.occupiedBy !== null);
}

export function rebuildOccupancy(items: PlacedItem[]): Occupancy {
  const occupancy = createEmptyOccupancy();

  for (const item of items) {
    const footprint = getFootprint(item.col, item.row, item.w);
    for (const cell of footprint) {
      if (occupancy[cell.c]?.[cell.r]) {
        occupancy[cell.c][cell.r].occupiedBy = item.id;
      }
    }
  }

  return occupancy;
}

export function canPlace(
  col: number,
  row: number,
  w: ModuleWidth,
  occupancy: Occupancy,
  ignorePlacedId?: string,
): boolean {
  if (!isInBounds(col, row, w)) return false;

  const footprint = getFootprint(col, row, w);
  if (isOverlapping(footprint, occupancy, ignorePlacedId)) return false;

  return isSupported(footprint, occupancy);
}
