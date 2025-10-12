// Costos de producción basados en tallas y materiales
export interface CostBySize {
  talla: string;
  metrosXUnidad: number;
  precioTinta: number;
  precioPapel: number;
  costoTotal: number;
}

export interface ProductionCosts {
  polo: CostBySize[];
  short: CostBySize[];
  poloMangaLarga: CostBySize[];
  faldaShort: CostBySize[];
  pantaloneta: CostBySize[];
}

export const costData: ProductionCosts = {
  polo: [
    { talla: '4', metrosXUnidad: 0.4, precioTinta: 0.38, precioPapel: 0.77, costoTotal: 1.15 },
    { talla: '6', metrosXUnidad: 0.5, precioTinta: 0.45, precioPapel: 0.91, costoTotal: 1.36 },
    { talla: '8', metrosXUnidad: 0.5, precioTinta: 0.50, precioPapel: 1.00, costoTotal: 1.50 },
    { talla: '10', metrosXUnidad: 0.6, precioTinta: 0.63, precioPapel: 1.25, costoTotal: 1.88 },
    { talla: '12', metrosXUnidad: 0.6, precioTinta: 0.63, precioPapel: 1.25, costoTotal: 1.88 },
    { talla: '14', metrosXUnidad: 0.7, precioTinta: 0.71, precioPapel: 1.43, costoTotal: 2.14 },
    { talla: '16', metrosXUnidad: 0.7, precioTinta: 0.71, precioPapel: 1.43, costoTotal: 2.14 },
    { talla: 'S', metrosXUnidad: 0.7, precioTinta: 0.71, precioPapel: 1.43, costoTotal: 2.14 },
    { talla: 'M', metrosXUnidad: 0.9, precioTinta: 0.91, precioPapel: 1.82, costoTotal: 2.73 },
    { talla: 'L', metrosXUnidad: 1.0, precioTinta: 1.00, precioPapel: 2.00, costoTotal: 3.00 },
    { talla: 'XL', metrosXUnidad: 1.0, precioTinta: 1.00, precioPapel: 2.00, costoTotal: 3.00 },
    { talla: 'XXL', metrosXUnidad: 1.3, precioTinta: 1.25, precioPapel: 2.50, costoTotal: 3.75 }
  ],
  short: [
    { talla: '4', metrosXUnidad: 0.4, precioTinta: 0.38, precioPapel: 0.77, costoTotal: 1.15 },
    { talla: '6', metrosXUnidad: 0.5, precioTinta: 0.45, precioPapel: 0.91, costoTotal: 1.36 },
    { talla: '8', metrosXUnidad: 0.5, precioTinta: 0.50, precioPapel: 1.00, costoTotal: 1.50 },
    { talla: '10', metrosXUnidad: 0.5, precioTinta: 0.50, precioPapel: 1.00, costoTotal: 1.50 },
    { talla: '12', metrosXUnidad: 0.5, precioTinta: 0.50, precioPapel: 1.00, costoTotal: 1.50 },
    { talla: '14', metrosXUnidad: 0.5, precioTinta: 0.50, precioPapel: 1.00, costoTotal: 1.50 },
    { talla: '16', metrosXUnidad: 0.6, precioTinta: 0.56, precioPapel: 1.11, costoTotal: 1.67 },
    { talla: 'S', metrosXUnidad: 0.6, precioTinta: 0.63, precioPapel: 1.25, costoTotal: 1.88 },
    { talla: 'M', metrosXUnidad: 0.6, precioTinta: 0.63, precioPapel: 1.25, costoTotal: 1.88 },
    { talla: 'L', metrosXUnidad: 0.8, precioTinta: 0.83, precioPapel: 1.67, costoTotal: 2.50 },
    { talla: 'XL', metrosXUnidad: 0.9, precioTinta: 0.86, precioPapel: 1.72, costoTotal: 2.59 },
    { talla: 'XXL', metrosXUnidad: 0.9, precioTinta: 0.91, precioPapel: 1.82, costoTotal: 2.73 }
  ],
  // Para las otras prendas, usamos costos similares a polo por defecto
  poloMangaLarga: [
    { talla: 'M', metrosXUnidad: 1.0, precioTinta: 1.00, precioPapel: 2.00, costoTotal: 3.00 }
  ],
  faldaShort: [
    { talla: 'M', metrosXUnidad: 0.8, precioTinta: 0.83, precioPapel: 1.67, costoTotal: 2.50 }
  ],
  pantaloneta: [
    { talla: 'M', metrosXUnidad: 0.7, precioTinta: 0.71, precioPapel: 1.43, costoTotal: 2.14 }
  ]
};

// Función para obtener costo promedio por tipo de prenda
export const getAverageCost = (prenda: keyof ProductionCosts): number => {
  const costs = costData[prenda];
  const total = costs.reduce((sum, cost) => sum + cost.costoTotal, 0);
  return total / costs.length;
};
