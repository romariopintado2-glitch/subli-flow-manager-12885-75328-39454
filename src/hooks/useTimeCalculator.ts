import { OrderItem, WorkSchedule, TimeCalculation } from '@/types/sublimation';
import { timeData as defaultTimeData } from '@/data/timeData';

const getWorkSchedule = (): WorkSchedule => {
  const stored = localStorage.getItem('settings');
  if (stored) {
    try {
      const settings = JSON.parse(stored);
      if (settings.workSchedule) {
        return settings.workSchedule;
      }
    } catch (error) {
      console.error('Error loading work schedule:', error);
    }
  }
  return {
    startHour: 9,
    endHour: 18,
    lunchStart: 13,
    lunchEnd: 14,
    workDays: [1, 2, 3, 4, 5, 6]
  };
};

export const useTimeCalculator = () => {
  const getTimeData = (): TimeCalculation => {
    const stored = localStorage.getItem('settings');
    if (stored) {
      try {
        const settings = JSON.parse(stored);
        return settings.timeData || defaultTimeData;
      } catch (error) {
        console.error('Error loading time data:', error);
      }
    }
    return defaultTimeData;
  };

  const getAdvancedTimesBySize = () => {
    const stored = localStorage.getItem('settings');
    if (stored) {
      try {
        const settings = JSON.parse(stored);
        return settings.advancedTimesBySize || {};
      } catch (error) {
        console.error('Error loading advanced times:', error);
      }
    }
    return {};
  };

  const calculateOrderTimeFromExcel = (
    prenda: string,
    tallasCounts: { [talla: string]: number },
    designTime: number
  ) => {
    const advancedTimes = getAdvancedTimesBySize();
    let totalProductionTime = 0;

    // Calcular el tiempo usando los tiempos avanzados por talla
    Object.entries(tallasCounts).forEach(([talla, cantidad]) => {
      const timeForSize = advancedTimes[prenda]?.[talla];
      if (timeForSize) {
        const timePerUnit = 
          timeForSize.impresion + 
          timeForSize.cortado + 
          timeForSize.planchado + 
          timeForSize.control + 
          timeForSize.imprevisto;
        totalProductionTime += timePerUnit * cantidad;
      } else {
        // Si no hay tiempo configurado para esa talla, usar tiempos por defecto
        const timeData = getTimeData();
        const prodTime = timeData.production[prenda as keyof TimeCalculation['production']];
        if (prodTime) {
          const timePerUnit = prodTime.impresion + prodTime.cortado + prodTime.planchado + prodTime.control + prodTime.imprevisto;
          totalProductionTime += timePerUnit * cantidad;
        }
      }
    });

    const designTimeMinutes = designTime * 60;
    const totalTime = designTimeMinutes + totalProductionTime;

    return {
      designTime: designTimeMinutes,
      productionTime: totalProductionTime,
      totalTime
    };
  };

  const calculateOrderTime = (items: OrderItem[], designTime: number) => {
    // Calculate total production time in minutes
    let totalProductionTime = 0;
    const timeData = getTimeData();
    
    items.forEach(item => {
      const prodTime = timeData.production[item.prenda];
      const timePerUnit = prodTime.impresion + prodTime.cortado + prodTime.planchado + prodTime.control + prodTime.imprevisto;
      totalProductionTime += timePerUnit * item.cantidad;
    });

    // Convert design time from hours to minutes
    const designTimeMinutes = designTime * 60;
    
    const totalTime = designTimeMinutes + totalProductionTime;
    
    return {
      designTime: designTimeMinutes,
      productionTime: totalProductionTime,
      totalTime
    };
  };

  const calculateDeliveryTime = (totalMinutes: number, startDate?: Date) => {
    const workSchedule = getWorkSchedule();
    const start = startDate || new Date();
    // Reset seconds and milliseconds
    start.setSeconds(0, 0);
    const deliveryDate = new Date(start);
    
    let remainingMinutes = totalMinutes;
    let currentHour = start.getHours();
    let currentMinute = start.getMinutes();
    
    // Función para verificar si un día es laborable
    const isWorkDay = (date: Date) => {
      const dayOfWeek = date.getDay();
      return workSchedule.workDays.includes(dayOfWeek);
    };
    
    // Si no es día laborable, avanzar al siguiente día laborable
    while (!isWorkDay(deliveryDate)) {
      deliveryDate.setDate(deliveryDate.getDate() + 1);
      currentHour = workSchedule.startHour;
      currentMinute = 0;
    }
    
    // Adjust to work hours if starting outside
    if (currentHour < workSchedule.startHour) {
      currentHour = workSchedule.startHour;
      currentMinute = 0;
    } else if (currentHour >= workSchedule.endHour) {
      deliveryDate.setDate(deliveryDate.getDate() + 1);
      // Avanzar al siguiente día laborable
      while (!isWorkDay(deliveryDate)) {
        deliveryDate.setDate(deliveryDate.getDate() + 1);
      }
      currentHour = workSchedule.startHour;
      currentMinute = 0;
    }
    
    while (remainingMinutes > 0) {
      // Check if we're in lunch time
      if (currentHour === workSchedule.lunchStart && currentMinute === 0) {
        currentHour = workSchedule.lunchEnd;
        continue;
      }
      
      // Calculate remaining work minutes in current day
      let workMinutesLeft = (workSchedule.endHour - currentHour) * 60 - currentMinute;
      
      // Subtract lunch time if we haven't passed it yet
      if (currentHour < workSchedule.lunchStart) {
        workMinutesLeft -= 60; // lunch hour
      }
      
      if (remainingMinutes <= workMinutesLeft) {
        // Can finish today
        const hoursToAdd = Math.floor(remainingMinutes / 60);
        const minutesToAdd = remainingMinutes % 60;
        
        currentHour += hoursToAdd;
        currentMinute += minutesToAdd;
        
        if (currentMinute >= 60) {
          currentHour += Math.floor(currentMinute / 60);
          currentMinute = currentMinute % 60;
        }
        
        // Skip lunch time if we land on it
        if (currentHour === workSchedule.lunchStart && currentMinute > 0) {
          currentHour = workSchedule.lunchEnd;
        }
        
        deliveryDate.setHours(currentHour, currentMinute, 0, 0);
        remainingMinutes = 0;
      } else {
        // Move to next day
        remainingMinutes -= workMinutesLeft;
        deliveryDate.setDate(deliveryDate.getDate() + 1);
        // Avanzar al siguiente día laborable
        while (!isWorkDay(deliveryDate)) {
          deliveryDate.setDate(deliveryDate.getDate() + 1);
        }
        currentHour = workSchedule.startHour;
        currentMinute = 0;
      }
    }
    
    return deliveryDate;
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  return {
    calculateOrderTime,
    calculateOrderTimeFromExcel,
    calculateDeliveryTime,
    formatTime,
    workSchedule: getWorkSchedule()
  };
};