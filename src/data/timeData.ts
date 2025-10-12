import { TimeCalculation } from '@/types/sublimation';

export const timeData: TimeCalculation = {
  design: {
    polo: 6,
    poloMangaLarga: 0,
    short: 0,
    faldaShort: 0,
    pantaloneta: 0
  },
  production: {
    polo: {
      // Cálculo basado en rendimiento por grupos de tallas (5m = 1 hora):
      // Grupo 1 (4-8): 10 polos/hora = 6 min/polo
      // Grupo 2 (10-14): 7 polos/hora = 8.57 min/polo  
      // Grupo 3 (16-XXL): 5 polos/hora = 12 min/polo (margen de seguridad)
      // Promedio: (6 + 8.57 + 12) / 3 = 8.86 min/polo
      impresion: 8.9,
      cortado: 1,
      planchado: 2.5,
      control: 1.0,
      imprevisto: 1.25
    },
    poloMangaLarga: {
      impresion: 10.0,
      cortado: 1,
      planchado: 3.0,
      control: 1.0,
      imprevisto: 1.5
    },
    short: {
      impresion: 6.5,
      cortado: 1,
      planchado: 2.0,
      control: 1.0,
      imprevisto: 1.05
    },
    faldaShort: {
      impresion: 8.0,
      cortado: 1,
      planchado: 2.5,
      control: 1.0,
      imprevisto: 1.25
    },
    pantaloneta: {
      impresion: 7.0,
      cortado: 1,
      planchado: 2.0,
      control: 1.0,
      imprevisto: 1.1
    }
  }
};