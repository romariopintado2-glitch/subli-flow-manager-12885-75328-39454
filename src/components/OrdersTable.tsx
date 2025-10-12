import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, Clock, Play, Eye, Archive, LayoutGrid, List, Upload, Image as ImageIcon, X } from 'lucide-react';
import { Order } from '@/types/sublimation';
import { useTimeCalculator } from '@/hooks/useTimeCalculator';
import { OrderDetailsDialog } from './OrderDetailsDialog';
import { getWeekNumber } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface OrdersTableProps {
  orders: Order[];
  onUpdateOrder: (orderId: string, updates: Partial<Order>) => void;
}

export const OrdersTable = ({ orders, onUpdateOrder }: OrdersTableProps) => {
  const { formatTime } = useTimeCalculator();
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const activeOrders = orders.filter(o => o.status !== 'archived');
  const archivedOrders = orders.filter(o => o.status === 'archived');

  const getStatusBadge = (status: Order['status']) => {
    const statusConfig = {
      pending: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      'in-design': { label: 'En Diseño', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      'in-production': { label: 'En Producción', className: 'bg-purple-100 text-purple-800 border-purple-200' },
      'in-planchado': { label: 'En Planchado', className: 'bg-orange-100 text-orange-800 border-orange-200' },
      completed: { label: 'Completado', className: 'bg-green-100 text-green-800 border-green-200' },
      archived: { label: 'Archivado', className: 'bg-gray-100 text-gray-800 border-gray-200' }
    };

    const config = statusConfig[status];
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const handleArchiveOrder = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const weekNumber = getWeekNumber(new Date());
    onUpdateOrder(orderId, {
      status: 'archived',
      semanaArchivo: weekNumber
    });
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  const startProcess = (orderId: string, process: keyof Order['procesos']) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const now = new Date();
    const updatedProcesos = {
      ...order.procesos,
      [process]: {
        ...order.procesos[process],
        inicio: now,
        completado: false
      }
    };

    // Update status based on process
    let newStatus = order.status;
    if (process === 'diseno') newStatus = 'in-design';
    else if (process === 'impresion' || process === 'cortado') newStatus = 'in-production';
    else if (process === 'planchado') newStatus = 'in-planchado';

    onUpdateOrder(orderId, {
      procesos: updatedProcesos,
      status: newStatus
    });
  };

  const completeProcess = (orderId: string, process: keyof Order['procesos']) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const now = new Date();
    const updatedProcesos = {
      ...order.procesos,
      [process]: {
        ...order.procesos[process],
        fin: now,
        completado: true
      }
    };

    // Recalculate delivery time based on remaining processes
    const { calculateOrderTime, calculateDeliveryTime } = useTimeCalculator();
    
    // Calculate remaining time from uncompleted processes
    let remainingTime = 0;
    const processOrder = ['diseno', 'impresion', 'cortado', 'planchado', 'control'] as const;
    
    for (const proc of processOrder) {
      if (!updatedProcesos[proc].completado) {
        // Add time for this process based on order items
        if (proc === 'diseno') {
          remainingTime += order.tiempoDiseno * 60;
        } else {
          // Calculate production time for remaining processes
          const timeCalc = calculateOrderTime(order.items, 0);
          remainingTime += timeCalc.productionTime / 4; // Approximate division
        }
      }
    }

    const newDeliveryDate = remainingTime > 0 
      ? calculateDeliveryTime(remainingTime)
      : order.fechaEntregaEstimada;

    // Check if all processes are completed
    const allCompleted = Object.entries(updatedProcesos).every(([_, proc]) => proc.completado);
    
    onUpdateOrder(orderId, {
      procesos: updatedProcesos,
      status: allCompleted ? 'completed' : order.status,
      fechaEntregaEstimada: newDeliveryDate
    });
  };

  const getProcessButton = (order: Order, process: keyof Order['procesos'], label: string) => {
    const proc = order.procesos[process];
    
    if (proc.completado) {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Completado
        </Badge>
      );
    }

    if (proc.inicio && !proc.fin) {
      return (
        <div className="flex gap-1">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Clock className="w-3 h-3 mr-1" />
            En proceso
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={() => completeProcess(order.id, process)}
            className="h-6 px-2 text-xs"
          >
            Finalizar
          </Button>
        </div>
      );
    }

    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() => startProcess(order.id, process)}
        className="h-6 px-2 text-xs"
      >
        <Play className="w-3 h-3 mr-1" />
        Iniciar
      </Button>
    );
  };

  const formatItemsDisplay = (items: Order['items']) => {
    return items.map(item => {
      const prendaNames = {
        polo: 'Polo',
        poloMangaLarga: 'Polo M.L.',
        short: 'Short',
        faldaShort: 'Falda Short',
        pantaloneta: 'Pantaloneta'
      };
      return `${item.cantidad} ${prendaNames[item.prenda]}`;
    }).join(', ');
  };

  const handleImageUpload = (orderId: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Por favor selecciona un archivo de imagen',
        variant: 'destructive'
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      onUpdateOrder(orderId, { imagenDiseño: reader.result as string });
      toast({
        title: 'Imagen cargada',
        description: 'La imagen del diseño se ha guardado correctamente'
      });
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (orderId: string) => {
    onUpdateOrder(orderId, { imagenDiseño: undefined });
    toast({
      title: 'Imagen eliminada',
      description: 'La imagen del diseño se ha eliminado'
    });
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Gestión de Pedidos
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <List className="w-4 h-4 mr-2" />
                Lista
              </Button>
              <Button
                variant={viewMode === 'cards' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('cards')}
              >
                <LayoutGrid className="w-4 h-4 mr-2" />
                Tarjetas
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[50px]">Ver</TableHead>
                  <TableHead className="min-w-[150px]">Pedido</TableHead>
                  <TableHead className="min-w-[200px]">Prendas</TableHead>
                  <TableHead className="min-w-[80px]">Tiempo</TableHead>
                  <TableHead className="min-w-[120px]">Entrega Est.</TableHead>
                  <TableHead className="min-w-[100px]">Estado</TableHead>
                  <TableHead className="min-w-[120px]">Diseño</TableHead>
                  <TableHead className="min-w-[120px]">Impresión</TableHead>
                  <TableHead className="min-w-[120px]">Cortado</TableHead>
                  <TableHead className="min-w-[120px]">Planchado</TableHead>
                  <TableHead className="min-w-[120px]">Control</TableHead>
                  <TableHead className="min-w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center text-muted-foreground py-8">
                      No hay pedidos activos
                    </TableCell>
                  </TableRow>
                ) : (
                  activeOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-muted/50">
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewDetails(order)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">{order.nombrePedido}</TableCell>
                      <TableCell className="text-sm">{formatItemsDisplay(order.items)}</TableCell>
                      <TableCell className="font-mono text-sm">{formatTime(order.tiempoTotal)}</TableCell>
                      <TableCell className="text-sm">
                        {order.fechaEntregaEstimada.toLocaleString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false
                        })}
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>{getProcessButton(order, 'diseno', 'Diseño')}</TableCell>
                      <TableCell>{getProcessButton(order, 'impresion', 'Impresión')}</TableCell>
                      <TableCell>{getProcessButton(order, 'cortado', 'Cortado')}</TableCell>
                      <TableCell>{getProcessButton(order, 'planchado', 'Planchado')}</TableCell>
                      <TableCell>{getProcessButton(order, 'control', 'Control')}</TableCell>
                      <TableCell>
                        {order.status === 'completed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleArchiveOrder(order.id)}
                            className="h-8 px-2 text-xs"
                          >
                            <Archive className="w-3 h-3 mr-1" />
                            Archivar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {activeOrders.length === 0 ? (
                <p className="col-span-full text-center text-muted-foreground py-8">
                  No hay pedidos activos
                </p>
              ) : (
                activeOrders.map(order => (
                  <Card key={order.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardContent className="p-4 space-y-3">
                      {/* Image Area */}
                      <div className="aspect-square bg-muted rounded-lg overflow-hidden relative group">
                        {order.imagenDiseño ? (
                          <>
                            <img 
                              src={order.imagenDiseño} 
                              alt={`Diseño ${order.nombrePedido}`}
                              className="w-full h-full object-cover"
                            />
                            <Button
                              size="icon"
                              variant="destructive"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeImage(order.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                            <ImageIcon className="w-12 h-12 mb-2" />
                            <p className="text-sm">Sin imagen</p>
                          </div>
                        )}
                      </div>

                      {/* Upload Button */}
                      <div>
                        <Label htmlFor={`upload-card-${order.id}`} className="cursor-pointer">
                          <div className="flex items-center justify-center gap-2 p-2 border-2 border-dashed rounded-lg hover:bg-muted/50 transition-colors">
                            <Upload className="w-4 h-4" />
                            <span className="text-sm">
                              {order.imagenDiseño ? 'Cambiar imagen' : 'Subir imagen'}
                            </span>
                          </div>
                        </Label>
                        <Input
                          id={`upload-card-${order.id}`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(order.id, file);
                          }}
                        />
                      </div>

                      {/* Order Info */}
                      <div className="space-y-1">
                        <h3 className="font-bold text-lg">{order.nombrePedido}</h3>
                        <p className="text-sm text-muted-foreground">{order.cliente}</p>
                        {order.diseñador && (
                          <p className="text-xs text-muted-foreground">
                            Diseñador: {order.diseñador}
                          </p>
                        )}
                      </div>

                      {/* Status Badge */}
                      <div className="flex items-center justify-between">
                        {getStatusBadge(order.status)}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewDetails(order)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {archivedOrders.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Pedidos Archivados</h3>
              <div className="space-y-2">
                {Object.entries(
                  archivedOrders.reduce((acc, order) => {
                    const week = order.semanaArchivo || 'Sin semana';
                    if (!acc[week]) acc[week] = [];
                    acc[week].push(order);
                    return acc;
                  }, {} as Record<string, Order[]>)
                ).map(([week, weekOrders]) => (
                  <div key={week} className="p-4 bg-muted/30 rounded-lg">
                    <h4 className="font-medium mb-2">{week}</h4>
                    <div className="space-y-1 text-sm">
                      {weekOrders.map(order => (
                        <div key={order.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded">
                          <span>{order.nombrePedido}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewDetails(order)}
                            className="h-6 px-2"
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedOrder && (
        <OrderDetailsDialog
          order={selectedOrder}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          onUpdateOrder={onUpdateOrder}
        />
      )}
    </>
  );
};