export type ModuleType = 'TILT' | 'CHEST' | 'BLOOM' | 'GRID' | 'SPLIT' | 'CUB' | 'NEST';

export type LayoutModule = {
  id: string;
  type: ModuleType;
  x: number;
  y: number;
  w: 1 | 2;
  h: 1;
  feet: boolean;
  variant: 'default';
};

export type LayoutPayload = {
  version: '1.0';
  canvas: { grid_cols: number; grid_rows: number };
  modules: LayoutModule[];
  preset: string;
  export_geometry?: {
    width: number;
    height: number;
    gridX: number;
    gridY: number;
    colWidth: number;
    rowHeight: number;
    gridCols: number;
    gridRows: number;
  };
};
