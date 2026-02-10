import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GRID_COLS, GRID_ROWS, canPlace, rebuildOccupancy, type PlacedItem } from '../logic/grid';

type ModuleId = 'tilt' | 'chest' | 'bloom' | 'grid' | 'split' | 'cub' | 'nest';

type ModuleVisual = {
  id: ModuleId;
  name: string;
  price: string;
  w: 1 | 2;
  paletteSrc: string;
  gridUpSrc: string;
  gridBottomSrc: string;
};

type ActiveDrag = {
  source: 'palette' | 'grid';
  typeId: ModuleId;
  w: 1 | 2;
  placedId?: string;
};

type CandidatePlacement = {
  col: number;
  row: number;
  w: 1 | 2;
  valid: boolean;
};

type BackgroundGeometry = {
  key: '100' | '150';
  image: string;
  width: number;
  height: number;
  gridX: number;
  gridY: number;
  colWidth: number;
  rowHeights: [number, number, number, number];
};

const BACKGROUNDS: Record<'100' | '150', BackgroundGeometry> = {
  '100': {
    key: '100',
    image: '/images/bckg_100.png',
    width: 1868,
    height: 1204,
    gridX: 254,
    gridY: 40,
    colWidth: 236,
    rowHeights: [243, 236, 236, 236],
  },
  '150': {
    key: '150',
    image: '/images/bckg_150.png',
    width: 2802,
    height: 1806,
    gridX: 381,
    gridY: 60,
    colWidth: 354,
    rowHeights: [364, 354, 354, 354],
  },
};

const MODULES: ModuleVisual[] = [
  {
    id: 'tilt',
    name: 'Tilt',
    price: '€920',
    w: 2,
    paletteSrc: '/images/selection/tilt_front-select.png',
    gridUpSrc: '/images/grid/tilt_grid-up.png',
    gridBottomSrc: '/images/grid/tilt_grid-bottom.png',
  },
  {
    id: 'chest',
    name: 'Chest',
    price: '€995',
    w: 2,
    paletteSrc: '/images/selection/chest_front-select.png',
    gridUpSrc: '/images/grid/chest_grid-up.png',
    gridBottomSrc: '/images/grid/chest_grid-bottom.png',
  },
  {
    id: 'bloom',
    name: 'Bloom',
    price: '€825',
    w: 1,
    paletteSrc: '/images/selection/bloom_front-select.png',
    gridUpSrc: '/images/grid/bloom_grid-up.png',
    gridBottomSrc: '/images/grid/bloom_grid-bottom.png',
  },
  {
    id: 'grid',
    name: 'Grid',
    price: '€535',
    w: 1,
    paletteSrc: '/images/selection/grid_front-select.png',
    gridUpSrc: '/images/grid/grid_grid-up.png',
    gridBottomSrc: '/images/grid/grid_grid-bottom.png',
  },
  {
    id: 'split',
    name: 'Split',
    price: '€485',
    w: 1,
    paletteSrc: '/images/selection/split_front-select.png',
    gridUpSrc: '/images/grid/split_grid-up.png',
    gridBottomSrc: '/images/grid/split_grid-bottom.png',
  },
  {
    id: 'cub',
    name: 'Cub',
    price: '€460',
    w: 1,
    paletteSrc: '/images/selection/cub_front-select.png',
    gridUpSrc: '/images/grid/cub_grid-up.png',
    gridBottomSrc: '/images/grid/cub_grid-bottom.png',
  },
  {
    id: 'nest',
    name: 'Nest',
    price: '€115',
    w: 1,
    paletteSrc: '/images/selection/nest_front-select.png',
    gridUpSrc: '/images/grid/nest_grid-up.png',
    gridBottomSrc: '/images/grid/nest_grid-bottom.png',
  },
];

function moduleById(id: ModuleId): ModuleVisual {
  return MODULES.find((moduleItem) => moduleItem.id === id) ?? MODULES[0];
}

function parseCellId(id: string): { col: number; row: number } | null {
  if (!id.startsWith('scene-cell-')) return null;
  const [, , colPart, rowPart] = id.split('-');
  const col = Number(colPart);
  const row = Number(rowPart);
  if (Number.isNaN(col) || Number.isNaN(row)) return null;
  return { col, row };
}

function rowTop(row: number, geometry: BackgroundGeometry): number {
  let y = geometry.gridY;
  for (let r = GRID_ROWS - 1; r > row; r -= 1) {
    y += geometry.rowHeights[r];
  }
  return y;
}

function rowHeight(row: number, geometry: BackgroundGeometry): number {
  return geometry.rowHeights[row];
}

function pickBackground(): '100' | '150' {
  if (typeof window === 'undefined') return '100';
  const wide = window.innerWidth >= 1650;
  const retina = window.devicePixelRatio >= 1.5 && window.innerWidth >= 1200;
  return wide || retina ? '150' : '100';
}

function PaletteCard({ moduleItem }: { moduleItem: ModuleVisual }): JSX.Element {
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({
    id: `palette-${moduleItem.id}`,
    data: {
      source: 'palette',
      typeId: moduleItem.id,
      w: moduleItem.w,
      h: 1,
    },
  });

  const style: CSSProperties | undefined = isDragging ? { opacity: 0.8 } : undefined;

  return (
    <button
      ref={setNodeRef}
      type="button"
      className={`mb-card ${isDragging ? 'is-dragging' : ''}`}
      style={style}
      {...listeners}
      {...attributes}
    >
      <img src={moduleItem.paletteSrc} alt={moduleItem.name} className="mb-card-image" draggable={false} />
      <div className="mb-card-meta">
        <span className="mb-card-label">{moduleItem.name}</span>
        <span className="mb-card-price">{moduleItem.price}</span>
      </div>
    </button>
  );
}

function GridCellDrop({ col, row, rect }: { col: number; row: number; rect: { left: number; top: number; width: number; height: number } }): JSX.Element {
  const { setNodeRef } = useDroppable({
    id: `scene-cell-${col}-${row}`,
    data: { col, row },
  });

  return (
    <div
      ref={setNodeRef}
      className="mb-drop-cell"
      style={{
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      }}
    />
  );
}

function PlacedModule({
  item,
  geometry,
  scale,
  onRemove,
}: {
  item: PlacedItem;
  geometry: BackgroundGeometry;
  scale: number;
  onRemove: (id: string) => void;
}): JSX.Element {
  const moduleItem = moduleById(item.typeId as ModuleId);
  const source = item.row === 0 ? moduleItem.gridBottomSrc : moduleItem.gridUpSrc;
  const top = rowTop(item.row, geometry) * scale;
  const left = (geometry.gridX + item.col * geometry.colWidth) * scale;
  const height = rowHeight(item.row, geometry) * scale;
  const width = geometry.colWidth * item.w * scale;

  const { setNodeRef, listeners, attributes, transform, isDragging } = useDraggable({
    id: `placed-${item.id}`,
    data: {
      source: 'grid',
      placedId: item.id,
      typeId: item.typeId,
      w: item.w,
      h: 1,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className="mb-placed"
      style={{
        left,
        top,
        width,
        height,
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
      }}
      {...listeners}
      {...attributes}
    >
      <img src={source} alt={moduleItem.name} className="mb-placed-image" draggable={false} />
      <button
        type="button"
        className="mb-remove"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          onRemove(item.id);
        }}
        aria-label={`Remove ${moduleItem.name}`}
      >
        <img src="/images/icon_remove.png" alt="" aria-hidden="true" />
      </button>
    </div>
  );
}

function DragModulePreview({ moduleId, width, height }: { moduleId: ModuleId; width: number; height: number }): JSX.Element {
  const moduleItem = moduleById(moduleId);
  return (
    <div className="mb-overlay" style={{ width, height }}>
      <img src={moduleItem.gridUpSrc} alt={moduleItem.name} className="mb-overlay-image" draggable={false} />
    </div>
  );
}

type ModuleBuilderProps = {
  showHeader?: boolean;
};

export function ModuleBuilder({ showHeader: _showHeader = true }: ModuleBuilderProps): JSX.Element {
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);
  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null);
  const [candidate, setCandidate] = useState<CandidatePlacement | null>(null);
  const [backgroundKey, setBackgroundKey] = useState<'100' | '150'>(() => pickBackground());
  const [sceneWidth, setSceneWidth] = useState(0);

  const sceneRef = useRef<HTMLDivElement | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }),
  );

  const occupancy = useMemo(() => rebuildOccupancy(placedItems), [placedItems]);
  const background = BACKGROUNDS[backgroundKey];
  const sceneHeight = sceneWidth > 0 ? (sceneWidth / background.width) * background.height : 0;
  const scale = sceneWidth > 0 ? sceneWidth / background.width : 1;

  useEffect(() => {
    if (!sceneRef.current) return;

    const onResizeWindow = () => setBackgroundKey(pickBackground());
    onResizeWindow();

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      setSceneWidth(width);
    });
    observer.observe(sceneRef.current);

    window.addEventListener('resize', onResizeWindow);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', onResizeWindow);
    };
  }, []);

  const handleDragStart = (event: DragStartEvent): void => {
    const data = event.active.data.current;
    if (!data) return;

    setActiveDrag({
      source: data.source as 'palette' | 'grid',
      typeId: data.typeId as ModuleId,
      w: data.w as 1 | 2,
      placedId: data.placedId as string | undefined,
    });
  };

  const handleDragOver = (event: DragOverEvent): void => {
    if (!activeDrag) {
      setCandidate(null);
      return;
    }

    const overId = event.over?.id;
    if (typeof overId !== 'string') {
      setCandidate(null);
      return;
    }

    const cell = parseCellId(overId);
    if (!cell) {
      setCandidate(null);
      return;
    }

    const validationOccupancy =
      activeDrag.source === 'grid' && activeDrag.placedId
        ? rebuildOccupancy(placedItems.filter((item) => item.id !== activeDrag.placedId))
        : occupancy;

    const valid = canPlace(cell.col, cell.row, activeDrag.w, validationOccupancy);
    setCandidate({ col: cell.col, row: cell.row, w: activeDrag.w, valid });
  };

  const handleDragEnd = (): void => {
    if (!activeDrag || !candidate || !candidate.valid) {
      setActiveDrag(null);
      setCandidate(null);
      return;
    }

    if (activeDrag.source === 'palette') {
      const id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `placed-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      setPlacedItems((current) => [
        ...current,
        {
          id,
          typeId: activeDrag.typeId,
          w: activeDrag.w,
          h: 1,
          col: candidate.col,
          row: candidate.row,
        },
      ]);
    }

    if (activeDrag.source === 'grid' && activeDrag.placedId) {
      setPlacedItems((current) =>
        current.map((item) =>
          item.id === activeDrag.placedId
            ? {
                ...item,
                col: candidate.col,
                row: candidate.row,
              }
            : item,
        ),
      );
    }

    setActiveDrag(null);
    setCandidate(null);
  };

  const handleDragCancel = (): void => {
    setActiveDrag(null);
    setCandidate(null);
  };

  const candidateRect = useMemo(() => {
    if (!candidate || sceneWidth <= 0) return null;
    const top = rowTop(candidate.row, background) * scale;
    const left = (background.gridX + candidate.col * background.colWidth) * scale;
    const width = background.colWidth * candidate.w * scale;
    const height = rowHeight(candidate.row, background) * scale;
    return { top, left, width, height, valid: candidate.valid };
  }, [candidate, sceneWidth, background, scale]);

  const topRow = MODULES.filter((moduleItem) => moduleItem.id === 'tilt' || moduleItem.id === 'chest');
  const midRow = MODULES.filter(
    (moduleItem) => moduleItem.id === 'bloom' || moduleItem.id === 'grid' || moduleItem.id === 'split',
  );
  const bottomRow = MODULES.filter((moduleItem) => moduleItem.id === 'cub' || moduleItem.id === 'nest');

  const previewSize = useMemo(() => {
    if (!activeDrag) return { width: 120, height: 120 };
    const width = Math.max(110, background.colWidth * activeDrag.w * Math.max(scale, 0.35));
    const height = Math.max(105, rowHeight(1, background) * Math.max(scale, 0.35));
    return { width, height };
  }, [activeDrag, background, scale]);

  return (
    <section className="mb-builder" aria-label="Module setup builder">
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="mb-scene-wrap">
          <div className="mb-scene" ref={sceneRef} style={{ height: sceneHeight || undefined }}>
            <img src={background.image} alt="Living room setup background" className="mb-background" draggable={false} />

            {sceneWidth > 0 ? (
              <div className="mb-grid-layer" aria-hidden="true">
                {Array.from({ length: GRID_ROWS }).map((_, row) =>
                  Array.from({ length: GRID_COLS }).map((__, col) => {
                    const rect = {
                      left: (background.gridX + col * background.colWidth) * scale,
                      top: rowTop(row, background) * scale,
                      width: background.colWidth * scale,
                      height: rowHeight(row, background) * scale,
                    };
                    return <GridCellDrop key={`cell-${col}-${row}`} col={col} row={row} rect={rect} />;
                  }),
                )}
              </div>
            ) : null}

            {candidateRect ? (
              <div
                className={`mb-candidate ${candidateRect.valid ? 'is-valid' : 'is-invalid'}`}
                style={{
                  top: candidateRect.top,
                  left: candidateRect.left,
                  width: candidateRect.width,
                  height: candidateRect.height,
                }}
              />
            ) : null}

            {placedItems.map((item) => (
              <PlacedModule
                key={item.id}
                item={item}
                geometry={background}
                scale={scale}
                onRemove={(id) => setPlacedItems((current) => current.filter((entry) => entry.id !== id))}
              />
            ))}

            <div className="mb-actions">
              <div className="mb-actions-left">
                <button type="button" className="mb-btn mb-btn-preview">
                  <img src="/images/icon_generate.png" alt="" aria-hidden="true" />
                  Generate a preview
                </button>
                <button type="button" className="mb-reset-link" onClick={() => setPlacedItems([])}>
                  <img src="/images/icon_reset.png" alt="" aria-hidden="true" />
                  Reset grid
                </button>
              </div>
              <button type="button" className="mb-btn mb-btn-preorder">
                Request a quote
              </button>
            </div>
          </div>
        </div>

        <aside className="mb-side" aria-label="Modules panel">
          <h2 className="mb-side-title">Modules</h2>
          <div className="mb-side-subtitle">
            <img src="/images/icon_drag.png" alt="" aria-hidden="true" />
            <span>Drag any module onto the grid</span>
          </div>
          <div className="mb-catalog mb-catalog-row-1">
            {topRow.map((moduleItem) => (
              <PaletteCard key={moduleItem.id} moduleItem={moduleItem} />
            ))}
          </div>
          <div className="mb-catalog mb-catalog-row-2">
            {midRow.map((moduleItem) => (
              <PaletteCard key={moduleItem.id} moduleItem={moduleItem} />
            ))}
          </div>
          <div className="mb-catalog mb-catalog-row-3">
            {bottomRow.map((moduleItem) => (
              <PaletteCard key={moduleItem.id} moduleItem={moduleItem} />
            ))}
          </div>
        </aside>

        <DragOverlay dropAnimation={null}>
          {activeDrag ? (
            <DragModulePreview moduleId={activeDrag.typeId} width={previewSize.width} height={previewSize.height} />
          ) : null}
        </DragOverlay>
      </DndContext>
    </section>
  );
}
