export interface TimeCalculation {
  design: {
    polo: number;
    poloMangaLarga: number;
    short: number;
    faldaShort: number;
    pantaloneta: number;
  };
  production: {
    polo: { impresion: number; cortado: number; planchado: number; control: number; imprevisto: number; };
    poloMangaLarga: { impresion: number; cortado: number; planchado: number; control: number; imprevisto: number; };
    short: { impresion: number; cortado: number; planchado: number; control: number; imprevisto: number; };
    faldaShort: { impresion: number; cortado: number; planchado: number; control: number; imprevisto: number; };
    pantaloneta: { impresion: number; cortado: number; planchado: number; control: number; imprevisto: number; };
  };
}

export interface OrderItem {
  prenda: 'polo' | 'poloMangaLarga' | 'short' | 'faldaShort' | 'pantaloneta';
  cantidad: number;
}

export interface Order {
  id: string;
  nombrePedido: string;
  clienteId?: string;
  cliente: string; // Nombre del cliente para retrocompatibilidad
  items: OrderItem[];
  tiempoDiseno: number; // in hours
  tiempoTotal: number; // in minutes
  fechaCreacion: Date;
  fechaEntregaEstimada: Date;
  status: 'pending' | 'in-design' | 'in-production' | 'in-planchado' | 'completed' | 'archived';
  descripcionPedido?: string;
  diseñador?: string;
  semanaArchivo?: string; // Formato: "2025-W01"
  imagenDiseño?: string; // Base64 or URL
  fotosLista?: string[]; // Hasta 4 fotos - Base64 or URL
  archivosImpresion?: string[]; // Array of Base64 or URLs
  procesos: {
    diseno: { inicio?: Date; fin?: Date; completado: boolean; };
    impresion: { inicio?: Date; fin?: Date; completado: boolean; };
    cortado: { inicio?: Date; fin?: Date; completado: boolean; };
    planchado: { inicio?: Date; fin?: Date; completado: boolean; };
    control: { inicio?: Date; fin?: Date; completado: boolean; };
  };
}

export interface WorkSchedule {
  startHour: number; // 8 AM
  endHour: number; // 6 PM
  lunchStart: number; // 1 PM
  lunchEnd: number; // 2 PM
}