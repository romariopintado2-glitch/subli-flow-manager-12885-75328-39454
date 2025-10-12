import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Order } from '@/types/sublimation';
import { Cliente } from '@/types/cliente';
import { Calendar, Package, User } from 'lucide-react';
import { useTimeCalculator } from '@/hooks/useTimeCalculator';

export const HistorialPedidos = () => {
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const { formatTime } = useTimeCalculator();

  useEffect(() => {
    // Cargar pedidos
    const ordersStorage = localStorage.getItem('sublimation_orders');
    if (ordersStorage) {
      const allOrders = JSON.parse(ordersStorage).map((o: any) => ({
        ...o,
        fechaCreacion: new Date(o.fechaCreacion),
        fechaEntregaEstimada: new Date(o.fechaEntregaEstimada)
      }));

      // Filtrar pedidos completados de la última semana
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const filtered = allOrders.filter((order: Order) => 
        order.status === 'completed' && order.fechaCreacion >= oneWeekAgo
      );

      // Ordenar por fecha de creación (más reciente primero)
      filtered.sort((a: Order, b: Order) => b.fechaCreacion.getTime() - a.fechaCreacion.getTime());

      setCompletedOrders(filtered);
    }

    // Cargar clientes
    const clientesStorage = localStorage.getItem('clientes_database');
    if (clientesStorage) {
      setClientes(JSON.parse(clientesStorage));
    }
  }, []);

  const getClienteName = (clienteId?: string) => {
    if (!clienteId) return 'Sin cliente';
    const cliente = clientes.find(c => c.id === clienteId);
    return cliente ? cliente.nombre : 'Cliente no encontrado';
  };

  const formatItemsDisplay = (items: Order['items']) => {
    return items.map(item => {
      const prendaNames = {
        polo: 'Polo',
        poloMangaLarga: 'Polo Manga Larga',
        short: 'Short',
        faldaShort: 'Falda Short',
        pantaloneta: 'Pantaloneta'
      };
      return `${item.cantidad} ${prendaNames[item.prenda]}`;
    }).join(', ');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Historial de Pedidos Completados
        </h2>
        <p className="text-muted-foreground">Pedidos completados en los últimos 7 días</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Total de Pedidos Completados: {completedOrders.length}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {completedOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No hay pedidos completados en los últimos 7 días</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre del Pedido</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Prendas</TableHead>
                    <TableHead>Diseñador</TableHead>
                    <TableHead>Tiempo Total</TableHead>
                    <TableHead>Fecha Creación</TableHead>
                    <TableHead>Fecha Entrega</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.nombrePedido}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          {getClienteName(order.clienteId)}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm max-w-xs truncate">
                        {formatItemsDisplay(order.items)}
                      </TableCell>
                      <TableCell>{order.diseñador || '-'}</TableCell>
                      <TableCell className="font-mono">{formatTime(order.tiempoTotal)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {order.fechaCreacion.toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: '2-digit'
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {order.fechaEntregaEstimada.toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: '2-digit'
                          })}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
