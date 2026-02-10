import {
  canPlace,
  createEmptyOccupancy,
  getFootprint,
  isOverlapping,
  isSupported,
  rebuildOccupancy,
  type PlacedItem,
} from './grid';

describe('grid logic', () => {
  test('supports bottom row placements', () => {
    const occupancy = createEmptyOccupancy();
    expect(canPlace(0, 0, 1, occupancy)).toBe(true);
    expect(canPlace(2, 0, 2, occupancy)).toBe(true);
  });

  test('requires support above bottom row', () => {
    const occupancy = createEmptyOccupancy();
    expect(canPlace(0, 1, 1, occupancy)).toBe(false);
    expect(canPlace(1, 1, 2, occupancy)).toBe(false);
  });

  test('checks support for full 2x1 footprint', () => {
    const base: PlacedItem[] = [
      { id: 'a', typeId: 'cub', w: 1, h: 1, col: 1, row: 0 },
      { id: 'b', typeId: 'cub', w: 1, h: 1, col: 2, row: 0 },
    ];
    const occupancy = rebuildOccupancy(base);
    expect(canPlace(1, 1, 2, occupancy)).toBe(true);
  });

  test('detects overlap and supports ignore self', () => {
    const items: PlacedItem[] = [
      { id: 'a', typeId: 'cub', w: 1, h: 1, col: 0, row: 0 },
      { id: 'b', typeId: 'bloom', w: 2, h: 1, col: 1, row: 0 },
    ];
    const occupancy = rebuildOccupancy(items);

    expect(isOverlapping(getFootprint(1, 0, 1), occupancy)).toBe(true);
    expect(isOverlapping(getFootprint(1, 0, 1), occupancy, 'b')).toBe(false);
  });

  test('isSupported validates below cells for all footprint cells', () => {
    const occupancy = createEmptyOccupancy();
    occupancy[0][0].occupiedBy = 'x';
    occupancy[1][0].occupiedBy = 'y';

    expect(isSupported(getFootprint(0, 1, 2), occupancy)).toBe(true);

    occupancy[1][0].occupiedBy = null;
    expect(isSupported(getFootprint(0, 1, 2), occupancy)).toBe(false);
  });
});
