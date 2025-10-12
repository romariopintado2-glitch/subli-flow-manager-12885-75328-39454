import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Order } from '@/types/sublimation';
import { useCostCalculator } from '@/hooks/useCostCalculator';
import { usePasswordProtection } from '@/hooks/usePasswordProtection';
import { PasswordProtect } from './PasswordProtect';
import { DollarSign, TrendingUp, Package } from 'lucide-react';

interface CostsViewProps {
  orders: Order[];
}

export const CostsView = ({ orders }: CostsViewProps) => {
  const { calculateOrderCost, formatCurrency } = useCostCalculator();
  const { isAuthenticated, isLoading, authenticate, logout } = usePasswordProtection();

  const prendaNames: Record<string, string> = {
    polo: 'Polo',
    poloMangaLarga: 'Polo Manga Larga',
    short: 'Short',
    faldaShort: 'Falda Short',
    pantaloneta: 'Pantaloneta'
  };

  const getStatusBadge = (status: Order['status']) => {
    const statusConfig = {
      pending: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      'in-design': { label: 'En Diseño', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      'in-production': { label: 'En Producción', className: 'bg-purple-100 text-purple-800 border-purple-200' },
      'in-planchado': { label: 'En Planchado', className: 'bg-orange-100 text-orange-800 border-orange-200' },
      completed: { label: 'Completado', className: 'bg-green-100 text-green-800 border-green-200' }
    };

    const config = statusConfig[status];
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  // Calcular costos totales
  const totalCostos = orders.reduce((sum, order) => {
    const { totalCost } = calculateOrderCost(order.items);
    return sum + totalCost;
  }, 0);

  const totalPrendas = orders.reduce((sum, order) => {
    return sum + order.items.reduce((itemSum, item) => itemSum + item.cantidad, 0);
  }, 0);

  return (
    <PasswordProtect
      isAuthenticated={isAuthenticated}
      isLoading={isLoading}
      onAuthenticate={authenticate}
      onLogout={logout}
    >
      <div className="space-y-6">
      {/* Resumen de Costos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-green-600 font-medium">Costo Total</p>
                <p className="text-2xl font-bold text-green-700">{formatCurrency(totalCostos)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Pedidos</p>
                <p className="text-2xl font-bold text-blue-700">{orders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-purple-600 font-medium">Prendas Totales</p>
                <p className="text-2xl font-bold text-purple-700">{totalPrendas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Costos por Pedido */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Costos por Pedido
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px]">Cliente</TableHead>
                  <TableHead className="min-w-[250px]">Detalle de Prendas</TableHead>
                  <TableHead className="min-w-[120px]">Estado</TableHead>
                  <TableHead className="min-w-[120px] text-right">Costo Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No hay pedidos registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => {
                    const { itemCosts, totalCost } = calculateOrderCost(order.items);
                    
                    return (
                      <TableRow key={order.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{order.cliente}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {itemCosts.map((item, idx) => (
                              <div key={idx} className="text-sm flex justify-between items-center gap-4">
                                <span className="text-muted-foreground">
                                  {item.cantidad} {prendaNames[item.prenda]}
                                </span>
                                <span className="font-mono">
                                  {formatCurrency(item.costoUnitario)} × {item.cantidad} = {formatCurrency(item.costoTotal)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell className="text-right">
                          <span className="font-mono font-bold text-lg text-green-700">
                            {formatCurrency(totalCost)}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Nota informativa */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <p className="text-sm text-blue-800">
            <strong>Nota:</strong> Los costos mostrados son promedios calculados basándose en diferentes tallas. 
            Los costos incluyen tinta sublimática y papel de transferencia según los datos de producción.
          </p>
        </CardContent>
      </Card>
      </div>
    </PasswordProtect>
  );
};
