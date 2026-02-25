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
  type DragEndEvent,
  type DragMoveEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { GRID_COLS, GRID_ROWS, canPlace, rebuildOccupancy, type PlacedItem } from '../logic/grid';
import { exportLayout } from '../logic/exportPreview';

type ModuleId = 'tilt' | 'chest' | 'bloom' | 'grid' | 'split' | 'cub' | 'nest';

type ModuleVisual = {
  id: ModuleId;
  name: string;
  price: string;
  w: 1 | 2;
};

type QuotePayload = {
  generatedAt: string;
  mode: 'builder-only';
  summary: {
    modulesCount: number;
    uniqueTypes: number;
    legsEnabled: boolean;
    estimatedTotal: number;
    currency: 'EUR';
  };
  modules: Array<{
    type: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
  layout: ReturnType<typeof exportLayout>;
  quotePayloadText?: string;
  previewImageUrl?: string;
  previewImageWidth?: number;
  previewImageHeight?: number;
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
  key: 'low' | 'med' | 'high' | 'max';
  image: string;
  width: number;
  height: number;
  gridX: number;
  gridY: number;
  colWidth: number;
  rowHeight: number;
  feetHeight: number;
};

const withBase = (path: string): string => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;

const BACKGROUNDS: BackgroundGeometry[] = [
  {
    key: 'low',
    image: withBase('/images/backgrounds/bckg_low.png'),
    width: 934,
    height: 602,
    gridX: 150,
    gridY: 30,
    colWidth: 105,
    rowHeight: 118,
    feetHeight: 20,
  },
  {
    key: 'med',
    image: withBase('/images/backgrounds/bckg_med.png'),
    width: 1401,
    height: 903,
    gridX: 226,
    gridY: 45,
    colWidth: 158,
    rowHeight: 177,
    feetHeight: 30,
  },
  {
    key: 'high',
    image: withBase('/images/backgrounds/bckg_high.png'),
    width: 1868,
    height: 1204,
    gridX: 301,
    gridY: 60,
    colWidth: 211,
    rowHeight: 236,
    feetHeight: 40,
  },
  {
    key: 'max',
    image: withBase('/images/backgrounds/bckg_max.png'),
    width: 2802,
    height: 1806,
    gridX: 451,
    gridY: 90,
    colWidth: 317,
    rowHeight: 354,
    feetHeight: 60,
  },
];

const MODULES: ModuleVisual[] = [
  { id: 'tilt', name: 'Tilt', price: '€920', w: 2 },
  { id: 'chest', name: 'Chest', price: '€995', w: 2 },
  { id: 'bloom', name: 'Bloom', price: '€825', w: 1 },
  { id: 'grid', name: 'Grid', price: '€535', w: 1 },
  { id: 'split', name: 'Split', price: '€485', w: 1 },
  { id: 'cub', name: 'Cub', price: '€460', w: 1 },
  { id: 'nest', name: 'Nest', price: '€115', w: 1 },
];

const MODULE_PRICES: Record<ModuleId, number> = {
  tilt: 920,
  chest: 995,
  bloom: 825,
  grid: 535,
  split: 485,
  cub: 460,
  nest: 115,
};

const CLOUDINARY_CLOUD_NAME = 'dnzdunl2d';
const CLOUDINARY_UNSIGNED_PRESET = 'groovaly_quotes_unsigned';
const SCREENSHOT_MAX_WIDTH = 900;
const SCREENSHOT_JPEG_QUALITY = 0.68;

function moduleById(id: ModuleId): ModuleVisual {
  return MODULES.find((moduleItem) => moduleItem.id === id) ?? MODULES[0];
}

function rangesOverlap(aCol: number, aW: number, bCol: number, bW: number): boolean {
  return aCol < bCol + bW && bCol < aCol + aW;
}

function isNestPlacementValid(
  candidate: { typeId: ModuleId; col: number; row: number; w: 1 | 2 },
  items: PlacedItem[],
): boolean {
  if (candidate.typeId === 'nest' && candidate.row === 0) return false;

  for (const item of items) {
    if (item.typeId !== 'nest') continue;
    if (item.row < candidate.row && rangesOverlap(item.col, item.w, candidate.col, candidate.w)) {
      return false;
    }
  }

  if (candidate.typeId === 'nest') {
    for (const item of items) {
      if (item.row > candidate.row && rangesOverlap(item.col, item.w, candidate.col, candidate.w)) {
        return false;
      }
    }
  }

  return true;
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
  return geometry.gridY + (GRID_ROWS - 1 - row) * geometry.rowHeight;
}

function resolveBackground(sceneWidthCss: number, dpr: number): BackgroundGeometry {
  if (sceneWidthCss <= 0) return BACKGROUNDS[2];
  const targetPixels = sceneWidthCss * Math.max(1, dpr);
  return BACKGROUNDS.find((background) => background.width >= targetPixels) ?? BACKGROUNDS[BACKGROUNDS.length - 1];
}

function selectionSrc(moduleId: ModuleId, hires: boolean): string {
  return withBase(`/images/selection/${moduleId}_select${hires ? '-hires' : ''}.png`);
}

function gridModuleSrc(moduleId: ModuleId, hires: boolean): string {
  return withBase(`/images/grid/${moduleId}_grid${hires ? '-hires' : ''}.png`);
}

function feetSrc(width: 1 | 2, hires: boolean): string {
  return withBase(`/images/grid/feets_${width === 2 ? 'duo' : 'mono'}_grid${hires ? '-hires' : ''}.png`);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Image failed to load: ${src}`));
    image.src = src;
  });
}

function buildReadableQuotePayload(layout: ReturnType<typeof exportLayout>): string {
  const modules = [...layout.modules].sort(
    (a, b) => a.y - b.y || a.x - b.x || a.type.localeCompare(b.type),
  );

  if (modules.length === 0) {
    return ['---', 'Composition details (0 modules):', '- No modules', '---', 'Composition summary (0 modules):', '- No modules', '---'].join('\n');
  }

  const minX = modules.reduce((min, moduleItem) => Math.min(min, moduleItem.x), Number.POSITIVE_INFINITY);

  const detailLines = modules.map((moduleItem) => {
    const colStart = moduleItem.x - minX + 1;
    const colEnd = colStart + moduleItem.w - 1;
    const colLabel = colStart === colEnd ? `Col${colStart}` : `Col${colStart}-${colEnd}`;
    const feet = moduleItem.feet ? 'Yes' : 'No';
    return `1x ${moduleItem.type} - Quantity: 1 ; Position: Row${moduleItem.y + 1}/${colLabel} ; Color: White Pearl ; Feet: ${feet}`;
  });

  const grouped = new Map<string, { type: string; feet: 'Yes' | 'No'; quantity: number }>();
  for (const moduleItem of modules) {
    const feet = moduleItem.feet ? 'Yes' : 'No';
    const key = `${moduleItem.type}|${feet}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.quantity += 1;
      continue;
    }
    grouped.set(key, { type: moduleItem.type, feet, quantity: 1 });
  }

  const summaryLines = Array.from(grouped.values())
    .sort(
      (a, b) =>
        b.quantity - a.quantity ||
        a.type.localeCompare(b.type) ||
        (a.feet === b.feet ? 0 : a.feet === 'Yes' ? -1 : 1),
    )
    .map((line) => `${line.quantity}x ${line.type} - Quantity:${line.quantity} ; Color: White Pearl ; Feet: ${line.feet}`);

  return [
    '-',
    '---',
    `Composition details (${modules.length} modules):`,
    ...detailLines,
    '---',
    `Composition summary (${modules.length} modules):`,
    ...summaryLines,
    '---',
  ].join('\n');
}

function PaletteCard({ moduleItem, hires }: { moduleItem: ModuleVisual; hires: boolean }): JSX.Element {
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({
    id: `palette-${moduleItem.id}`,
    data: {
      source: 'palette',
      typeId: moduleItem.id,
      w: moduleItem.w,
      h: 1,
    },
  });

  return (
    <button
      ref={setNodeRef}
      type="button"
      className={`mb-card ${isDragging ? 'is-dragging' : ''}`}
      style={isDragging ? ({ opacity: 0.8 } as CSSProperties) : undefined}
      {...listeners}
      {...attributes}
    >
      <img src={selectionSrc(moduleItem.id, hires)} alt={moduleItem.name} className="mb-card-image" draggable={false} />
      <div className="mb-card-meta">
        <span className="mb-card-label">{moduleItem.name}</span>
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
  hires,
  addFeet,
  onToggleFeet,
  onRemove,
}: {
  item: PlacedItem;
  geometry: BackgroundGeometry;
  scale: number;
  hires: boolean;
  addFeet: boolean;
  onToggleFeet: () => void;
  onRemove: (id: string) => void;
}): JSX.Element {
  const moduleItem = moduleById(item.typeId as ModuleId);
  const top = rowTop(item.row, geometry) * scale;
  const left = (geometry.gridX + item.col * geometry.colWidth) * scale;
  const height = geometry.rowHeight * scale;
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
      className={`mb-placed ${item.row === 0 ? 'is-bottom-row' : ''}`}
      style={{
        left,
        top,
        width,
        height,
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        opacity: isDragging ? 0.55 : 1,
      }}
      {...listeners}
      {...attributes}
    >
      <img src={gridModuleSrc(moduleItem.id, hires)} alt={moduleItem.name} className="mb-placed-image" draggable={false} />

      {item.row === 0 ? (
        <button
          type="button"
          className="mb-feet-toggle"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onToggleFeet();
          }}
          aria-label="Toggle add feet"
        >
          <span className="mb-feet-check" aria-hidden="true">
            <span className={addFeet ? 'is-on' : ''} />
          </span>
          <span className="mb-feet-label">add feet</span>
        </button>
      ) : null}

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
        <img src={withBase('/images/icons/icon_remove.png')} alt="" aria-hidden="true" />
      </button>
    </div>
  );
}

function DragModulePreview({ moduleId, width, height, hires }: { moduleId: ModuleId; width: number; height: number; hires: boolean }): JSX.Element {
  const moduleItem = moduleById(moduleId);
  return (
    <div className="mb-overlay" style={{ width, height }}>
      <img src={gridModuleSrc(moduleItem.id, hires)} alt={moduleItem.name} className="mb-overlay-image" draggable={false} />
    </div>
  );
}

type GhostRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

function toGhostRect(rect: { left: number; top: number; width: number; height: number } | null | undefined): GhostRect | null {
  if (!rect) return null;
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };
}

function isRectOutsideSceneCenter(rect: GhostRect, scene: HTMLDivElement | null): boolean {
  if (!scene) return false;
  const bounds = scene.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  return centerX < bounds.left || centerX > bounds.right || centerY < bounds.top || centerY > bounds.bottom;
}

type ModuleBuilderProps = {
  showHeader?: boolean;
  showDebug?: boolean;
  embedMode?: boolean;
};

export function ModuleBuilder({
  showHeader: _showHeader = true,
  showDebug = false,
  embedMode = false,
}: ModuleBuilderProps): JSX.Element {
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);
  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null);
  const [candidate, setCandidate] = useState<CandidatePlacement | null>(null);
  const [isGhostOutsideScene, setIsGhostOutsideScene] = useState(false);
  const [dismissGhost, setDismissGhost] = useState<(GhostRect & { moduleId: ModuleId; hires: boolean }) | null>(null);
  const [sceneWidth, setSceneWidth] = useState(0);
  const [dpr, setDpr] = useState(1);
  const [addFeet, setAddFeet] = useState(false);
  const [quotePayload, setQuotePayload] = useState<QuotePayload | null>(null);
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [isQuoteSubmitting, setIsQuoteSubmitting] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [debugExports, setDebugExports] = useState(false);
  const [actionsMounted, setActionsMounted] = useState(false);
  const [actionsVisible, setActionsVisible] = useState(false);

  const sceneRef = useRef<HTMLDivElement | null>(null);
  const lastGhostRectRef = useRef<GhostRect | null>(null);
  const dismissGhostTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const actionsHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const actionsShowRafRef = useRef<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }),
  );

  const hires = dpr >= 1.5;
  const background = useMemo(() => resolveBackground(sceneWidth, dpr), [sceneWidth, dpr]);
  const sceneHeight = sceneWidth > 0 ? (sceneWidth / background.width) * background.height : 0;
  const scale = sceneWidth > 0 ? sceneWidth / background.width : 1;

  useEffect(() => {
    if (!sceneRef.current) return;

    const updateDpr = () => {
      if (typeof window !== 'undefined') {
        setDpr(window.devicePixelRatio || 1);
      }
    };

    updateDpr();

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      setSceneWidth(width);
      updateDpr();
    });
    observer.observe(sceneRef.current);

    window.addEventListener('resize', updateDpr);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateDpr);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (dismissGhostTimerRef.current) {
        clearTimeout(dismissGhostTimerRef.current);
      }
      if (actionsHideTimerRef.current) {
        clearTimeout(actionsHideTimerRef.current);
      }
      if (actionsShowRafRef.current) {
        cancelAnimationFrame(actionsShowRafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const hasModules = placedItems.length > 0;

    if (hasModules) {
      if (actionsHideTimerRef.current) {
        clearTimeout(actionsHideTimerRef.current);
        actionsHideTimerRef.current = null;
      }
      setActionsMounted(true);
      actionsShowRafRef.current = requestAnimationFrame(() => {
        setActionsVisible(true);
      });
      return;
    }

    setActionsVisible(false);
    if (actionsHideTimerRef.current) {
      clearTimeout(actionsHideTimerRef.current);
    }
    actionsHideTimerRef.current = setTimeout(() => {
      setActionsMounted(false);
    }, 180);
  }, [placedItems.length]);

  const handleDragStart = (event: DragStartEvent): void => {
    const data = event.active.data.current;
    if (!data) return;
    setIsGhostOutsideScene(false);
    lastGhostRectRef.current = toGhostRect(event.active.rect.current.initial);

    setActiveDrag({
      source: data.source as 'palette' | 'grid',
      typeId: data.typeId as ModuleId,
      w: data.w as 1 | 2,
      placedId: data.placedId as string | undefined,
    });
  };

  const handleDragMove = (event: DragMoveEvent): void => {
    const translatedRect = toGhostRect(event.active.rect.current.translated);
    if (translatedRect) {
      lastGhostRectRef.current = translatedRect;
    }

    if (!activeDrag || activeDrag.source !== 'grid') {
      setIsGhostOutsideScene(false);
      return;
    }

    if (!translatedRect) {
      setIsGhostOutsideScene(false);
      return;
    }

    const outside = isRectOutsideSceneCenter(translatedRect, sceneRef.current);
    setIsGhostOutsideScene(outside);
    if (outside) {
      setCandidate(null);
    }
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

    const validationItems =
      activeDrag.source === 'grid' && activeDrag.placedId
        ? placedItems.filter((item) => item.id !== activeDrag.placedId)
        : placedItems;

    const validationOccupancy = rebuildOccupancy(validationItems);

    const baseValid = canPlace(cell.col, cell.row, activeDrag.w, validationOccupancy);
    const nestValid = isNestPlacementValid(
      { typeId: activeDrag.typeId, col: cell.col, row: cell.row, w: activeDrag.w },
      validationItems,
    );

    setCandidate({ col: cell.col, row: cell.row, w: activeDrag.w, valid: baseValid && nestValid });
  };

  const handleDragEnd = (event: DragEndEvent): void => {
    if (!activeDrag) {
      setIsGhostOutsideScene(false);
      setActiveDrag(null);
      setCandidate(null);
      return;
    }

    const endRect = toGhostRect(event.active.rect.current.translated) ?? lastGhostRectRef.current;
    const shouldRemoveFromOutsideScene =
      activeDrag.source === 'grid' &&
      Boolean(activeDrag.placedId) &&
      ((Boolean(endRect) && isRectOutsideSceneCenter(endRect as GhostRect, sceneRef.current)) || isGhostOutsideScene);

    if (shouldRemoveFromOutsideScene && activeDrag.placedId) {
      setPlacedItems((current) => current.filter((item) => item.id !== activeDrag.placedId));

      if (endRect) {
        setDismissGhost({
          ...endRect,
          moduleId: activeDrag.typeId,
          hires,
        });
        if (dismissGhostTimerRef.current) {
          clearTimeout(dismissGhostTimerRef.current);
        }
        dismissGhostTimerRef.current = setTimeout(() => {
          setDismissGhost(null);
        }, 120);
      }

      setIsGhostOutsideScene(false);
      setActiveDrag(null);
      setCandidate(null);
      return;
    }

    if (!candidate || !candidate.valid) {
      setIsGhostOutsideScene(false);
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

    setIsGhostOutsideScene(false);
    setActiveDrag(null);
    setCandidate(null);
  };

  const handleDragCancel = (): void => {
    setIsGhostOutsideScene(false);
    setActiveDrag(null);
    setCandidate(null);
  };

  const candidateRect = useMemo(() => {
    if (!candidate || sceneWidth <= 0) return null;
    const top = rowTop(candidate.row, background) * scale;
    const left = (background.gridX + candidate.col * background.colWidth) * scale;
    const width = background.colWidth * candidate.w * scale;
    const height = background.rowHeight * scale;
    return { top, left, width, height, valid: candidate.valid };
  }, [candidate, sceneWidth, background, scale]);

  const previewSize = useMemo(() => {
    if (!activeDrag) return { width: 120, height: 120 };
    const width = Math.max(110, background.colWidth * activeDrag.w * Math.max(scale, 0.35));
    const height = Math.max(105, background.rowHeight * Math.max(scale, 0.35));
    return { width, height };
  }, [activeDrag, background, scale]);

  const feetModules = useMemo(() => {
    if (!addFeet) return [];
    return placedItems.filter((item) => item.row === 0);
  }, [addFeet, placedItems]);

  const buildQuotePayload = (): QuotePayload => {
    const counts = new Map<ModuleId, number>();
    for (const item of placedItems) {
      const key = item.typeId as ModuleId;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    const lines = Array.from(counts.entries())
      .map(([type, quantity]) => {
        const unitPrice = MODULE_PRICES[type] ?? 0;
        return {
          type: type.toUpperCase(),
          quantity,
          unitPrice,
          subtotal: unitPrice * quantity,
        };
      })
      .sort((a, b) => a.type.localeCompare(b.type));

    const estimatedTotal = lines.reduce((sum, line) => sum + line.subtotal, 0);

    return {
      generatedAt: new Date().toISOString(),
      mode: 'builder-only',
      summary: {
        modulesCount: placedItems.length,
        uniqueTypes: lines.length,
        legsEnabled: addFeet,
        estimatedTotal,
        currency: 'EUR',
      },
      modules: lines,
      layout: exportLayout(placedItems, addFeet, GRID_COLS, GRID_ROWS, 'BUILDER_ONLY'),
    };
  };

  const buildSceneScreenshotBlob = async (): Promise<{ blob: Blob; width: number; height: number } | null> => {
    if (sceneWidth <= 0) return null;

    const scaleRatio = Math.min(1, SCREENSHOT_MAX_WIDTH / background.width);
    const targetWidth = Math.max(1, Math.round(background.width * scaleRatio));
    const targetHeight = Math.max(1, Math.round(background.height * scaleRatio));

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const context = canvas.getContext('2d');
    if (!context) return null;

    const imageCache = new Map<string, Promise<HTMLImageElement>>();
    const loadCachedImage = (src: string): Promise<HTMLImageElement> => {
      const cached = imageCache.get(src);
      if (cached) return cached;
      const promise = loadImage(src);
      imageCache.set(src, promise);
      return promise;
    };

    const toX = (value: number) => value * scaleRatio;
    const toY = (value: number) => value * scaleRatio;

    const backgroundImage = await loadImage(background.image);
    context.drawImage(backgroundImage, 0, 0, targetWidth, targetHeight);

    if (addFeet) {
      const feetTasks = placedItems
        .filter((item) => item.row === 0)
        .map(async (item) => {
          const feetImage = await loadCachedImage(feetSrc(item.w, false));
          const left = toX(background.gridX + item.col * background.colWidth);
          const top = toY(background.gridY + GRID_ROWS * background.rowHeight);
          const width = toX(item.w * background.colWidth);
          const height = toY(background.feetHeight);
          context.drawImage(feetImage, left, top, width, height);
        });
      await Promise.all(feetTasks);
    }

    const moduleTasks = placedItems.map(async (item) => {
      const moduleImage = await loadCachedImage(gridModuleSrc(item.typeId as ModuleId, false));
      const left = toX(background.gridX + item.col * background.colWidth);
      const top = toY(rowTop(item.row, background));
      const width = toX(item.w * background.colWidth);
      const height = toY(background.rowHeight);
      context.drawImage(moduleImage, left, top, width, height);
    });
    await Promise.all(moduleTasks);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', SCREENSHOT_JPEG_QUALITY);
    });
    if (!blob) return null;
    return { blob, width: canvas.width, height: canvas.height };
  };

  const uploadQuotePreviewToCloudinary = async (
    screenshot: { blob: Blob; width: number; height: number },
  ): Promise<{ secureUrl: string; width: number; height: number } | null> => {
    const formData = new FormData();
    formData.append('file', screenshot.blob, `groovaly-quote-${Date.now()}.jpg`);
    formData.append('upload_preset', CLOUDINARY_UNSIGNED_PRESET);
    formData.append('folder', 'groovaly/quotes');

    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Cloudinary upload failed (${response.status})`);
    }

    const json = (await response.json()) as { secure_url?: string };
    if (!json.secure_url) return null;

    return {
      secureUrl: json.secure_url,
      width: screenshot.width,
      height: screenshot.height,
    };
  };

  const handleRequestQuote = async (): Promise<void> => {
    if (placedItems.length === 0 || isQuoteSubmitting) return;

    setQuoteError(null);
    setIsQuoteSubmitting(true);

    try {
      const payload = buildQuotePayload();
      if (embedMode && typeof window !== 'undefined' && window.parent && window.parent !== window) {
        window.parent.postMessage(
          {
            type: 'GROOVALY_QUOTE_STARTED',
            payload: {
              generatedAt: payload.generatedAt,
              summary: payload.summary,
            },
          },
          '*',
        );
      }

      const screenshot = await buildSceneScreenshotBlob();

      if (screenshot) {
        try {
          const uploaded = await uploadQuotePreviewToCloudinary(screenshot);
          if (uploaded) {
            payload.previewImageUrl = uploaded.secureUrl;
            payload.previewImageWidth = uploaded.width;
            payload.previewImageHeight = uploaded.height;
          }
        } catch (error) {
          console.warn('[Groovaly builder-only] Cloudinary upload failed, payload will be sent without image.', error);
          setQuoteError('Preview upload failed. Quote payload is still available without image.');
        }
      }

      payload.quotePayloadText = buildReadableQuotePayload(payload.layout);

      setQuotePayload(payload);
      if (!embedMode) {
        setIsQuoteOpen(true);
      }

      if (embedMode && typeof window !== 'undefined' && window.parent && window.parent !== window) {
        window.parent.postMessage(
          {
            type: 'GROOVALY_QUOTE_READY',
            payload,
          },
          '*',
        );
      }

      if (debugExports) {
        console.log('[Groovaly builder-only] Quote payload', payload);
      }
    } finally {
      setIsQuoteSubmitting(false);
    }
  };

  const topRow = MODULES.filter((moduleItem) => moduleItem.id === 'tilt' || moduleItem.id === 'chest');
  const midRow = MODULES.filter(
    (moduleItem) => moduleItem.id === 'bloom' || moduleItem.id === 'grid' || moduleItem.id === 'split',
  );
  const bottomRow = MODULES.filter((moduleItem) => moduleItem.id === 'cub' || moduleItem.id === 'nest');

  return (
    <section className="mb-builder" aria-label="Module setup builder">
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
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
                      height: background.rowHeight * scale,
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

            {feetModules.map((item) => (
              <div
                key={`feet-${item.id}`}
                className="mb-feet"
                style={{
                  left: (background.gridX + item.col * background.colWidth) * scale,
                  top: (background.gridY + GRID_ROWS * background.rowHeight) * scale,
                  width: item.w * background.colWidth * scale,
                  height: background.feetHeight * scale,
                }}
              >
                <img src={feetSrc(item.w, hires)} alt="" aria-hidden="true" className="mb-feet-image" draggable={false} />
              </div>
            ))}

            {placedItems.map((item) => (
              <PlacedModule
                key={item.id}
                item={item}
                geometry={background}
                scale={scale}
                hires={hires}
                addFeet={addFeet}
                onToggleFeet={() => setAddFeet((current) => !current)}
                onRemove={(id) => setPlacedItems((current) => current.filter((entry) => entry.id !== id))}
              />
            ))}

            {actionsMounted ? (
              <div className={`mb-actions ${actionsVisible ? 'is-visible' : 'is-hidden'}`}>
                <div className="mb-actions-left">
                  <button
                    type="button"
                    className="mb-btn mb-btn-preorder"
                    onClick={handleRequestQuote}
                    disabled={placedItems.length === 0 || isQuoteSubmitting}
                  >
                    {isQuoteSubmitting ? 'Uploading preview...' : 'Request a quote'}
                  </button>
                  <button
                    type="button"
                    className="mb-reset-link"
                    onClick={() => {
                      setPlacedItems([]);
                      setAddFeet(false);
                      setQuotePayload(null);
                      setIsQuoteOpen(false);
                    }}
                  >
                    <img src={withBase('/images/icons/icon_reset.png')} alt="" aria-hidden="true" />
                    Reset grid
                  </button>
                </div>
              </div>
            ) : null}
          </div>
          {showDebug ? (
            <div id="module-builder-debug" className="mb-preview-debug" aria-live="polite">
              <label className="mb-preview-debug-toggle">
                <input
                  type="checkbox"
                  checked={debugExports}
                  onChange={(event) => setDebugExports(event.target.checked)}
                />
                Debug exports (download local files)
              </label>
              <button
                type="button"
                className="mb-preview-debug-action"
                onClick={handleRequestQuote}
                disabled={placedItems.length === 0 || isQuoteSubmitting}
              >
                {isQuoteSubmitting ? 'Uploading preview...' : 'Generate quote payload (debug)'}
              </button>
              {placedItems.length === 0 ? <p className="mb-preview-hint">Add at least one module to request a quote.</p> : null}
              {quoteError ? <p className="mb-preview-hint">{quoteError}</p> : null}
              {quotePayload ? <pre className="mb-preview-response">{JSON.stringify(quotePayload, null, 2)}</pre> : null}
            </div>
          ) : null}
        </div>

        <aside className="mb-side" aria-label="Modules panel">
          <h2 className="mb-side-title">Modules</h2>
          <div className="mb-side-subtitle">
            <img src={withBase('/images/icons/icon_drag.png')} alt="" aria-hidden="true" />
            <span>Drag any module onto the grid</span>
          </div>
          <div className="mb-catalog mb-catalog-row-1">
            {topRow.map((moduleItem) => (
              <PaletteCard key={moduleItem.id} moduleItem={moduleItem} hires={hires} />
            ))}
          </div>
          <div className="mb-catalog mb-catalog-row-2">
            {midRow.map((moduleItem) => (
              <PaletteCard key={moduleItem.id} moduleItem={moduleItem} hires={hires} />
            ))}
          </div>
          <div className="mb-catalog mb-catalog-row-3">
            {bottomRow.map((moduleItem) => (
              <PaletteCard key={moduleItem.id} moduleItem={moduleItem} hires={hires} />
            ))}
          </div>
        </aside>

        <DragOverlay dropAnimation={null}>
          {activeDrag ? (
            <div className={`mb-overlay-shell ${isGhostOutsideScene ? 'is-remove-target' : ''}`}>
              <DragModulePreview moduleId={activeDrag.typeId} width={previewSize.width} height={previewSize.height} hires={hires} />
              {isGhostOutsideScene && activeDrag.source === 'grid' ? (
                <span className="mb-overlay-remove-icon" aria-hidden="true">
                  <img src={withBase('/images/icons/icon_remove.png')} alt="" />
                </span>
              ) : null}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      {dismissGhost ? (
        <div
          className="mb-dismiss-ghost"
          style={{
            left: dismissGhost.left,
            top: dismissGhost.top,
            width: dismissGhost.width,
            height: dismissGhost.height,
          }}
          aria-hidden="true"
        >
          <img src={gridModuleSrc(dismissGhost.moduleId, dismissGhost.hires)} alt="" className="mb-dismiss-ghost-image" />
          <span className="mb-overlay-remove-icon">
            <img src={withBase('/images/icons/icon_remove.png')} alt="" />
          </span>
        </div>
      ) : null}
      {!embedMode && isQuoteOpen && quotePayload ? (
        <div className="mb-quote-modal-backdrop" role="dialog" aria-modal="true" aria-label="Quote payload">
          <div className="mb-quote-modal">
            <div className="mb-quote-head">
              <h3>Quote payload</h3>
              <button type="button" className="mb-quote-close" onClick={() => setIsQuoteOpen(false)} aria-label="Close quote payload">
                ×
              </button>
            </div>
            <pre className="mb-quote-json">{JSON.stringify(quotePayload, null, 2)}</pre>
            {quoteError ? <p className="mb-quote-error">{quoteError}</p> : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
