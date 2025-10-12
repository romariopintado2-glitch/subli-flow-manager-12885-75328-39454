import { OrderItem } from '@/types/sublimation';
import { getAverageCost } from '@/data/costData';

export const useCostCalculator = () => {
  const calculateOrderCost = (items: OrderItem[]) => {
    let totalCost = 0;
    const itemCosts: { prenda: string; cantidad: number; costoUnitario: number; costoTotal: number }[] = [];

    items.forEach(item => {
      const avgCost = getAverageCost(item.prenda);
      const itemTotal = avgCost * item.cantidad;
      totalCost += itemTotal;

      itemCosts.push({
        prenda: item.prenda,
        cantidad: item.cantidad,
        costoUnitario: avgCost,
        costoTotal: itemTotal
      });
    });

    return {
      itemCosts,
      totalCost
    };
  };

  const formatCurrency = (amount: number): string => {
    return `S/ ${amount.toFixed(2)}`;
  };

  return {
    calculateOrderCost,
    formatCurrency
  };
};
