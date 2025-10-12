import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, AlertCircle } from 'lucide-react';
import { Order } from '@/types/sublimation';
import { useTimeCalculator } from '@/hooks/useTimeCalculator';

interface ScheduleViewProps {
  orders: Order[];
}

export const ScheduleView = ({ orders }: ScheduleViewProps) => {
  const { formatTime } = useTimeCalculator();

  const activeOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'pending');
  const todayOrders = orders.filter(o => {
    const today = new Date();
    const deliveryDate = o.fechaEntregaEstimada;
    return deliveryDate.toDateString() === today.toDateString();
  });

  const getProcessInfo = (order: Order) => {
    const processes = Object.entries(order.procesos);
    const currentProcess = processes.find(([_, proc]) => proc.inicio && !proc.completado);
    
    if (currentProcess) {
      const [processName, proc] = currentProcess;
      const startTime = proc.inicio!;
      const now = new Date();
      const elapsedMinutes = Math.floor((now.getTime() - startTime.getTime()) / 1000 / 60);
      
      return {
        name: processName,
        elapsed: elapsedMinutes,
        startTime
      };
    }
    
    return null;
  };

  const processNames = {
    diseno: 'Diseño',
    impresion: 'Impresión', 
    cortado: 'Cortado',
    planchado: 'Planchado',
    control: 'Control de Calidad'
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-blue-600 font-medium">Pedidos Activos</p>
                <p className="text-2xl font-bold text-blue-700">{activeOrders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-orange-600 font-medium">Entregas Hoy</p>
                <p className="text-2xl font-bold text-orange-700">{todayOrders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-green-600 font-medium">Completados</p>
                <p className="text-2xl font-bold text-green-700">
                  {orders.filter(o => o.status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Programación en Tiempo Real
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeOrders.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No hay pedidos activos en este momento
              </p>
            ) : (
              activeOrders.map(order => {
                const processInfo = getProcessInfo(order);
                return (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-card to-muted/30">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{order.nombrePedido}</h4>
                      <p className="text-xs text-muted-foreground">Cliente: {order.cliente}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {order.items.map(item => `${item.cantidad} ${item.prenda}`).join(', ')}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {processInfo ? (
                        <div className="text-right">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 mb-1">
                            {processNames[processInfo.name as keyof typeof processNames]}
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            Iniciado: {processInfo.startTime.toLocaleTimeString('es-ES', { 
                              hour: '2-digit', 
                              minute: '2-digit',
                              hour12: false
                            })}
                          </p>
                          <p className="text-xs font-medium">
                            Tiempo transcurrido: {formatTime(processInfo.elapsed)}
                          </p>
                        </div>
                      ) : (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                          En espera
                        </Badge>
                      )}
                      
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Entrega estimada</p>
                        <p className="text-sm font-medium">
                          {order.fechaEntregaEstimada.toLocaleString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {todayOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <Calendar className="w-5 h-5" />
              Entregas de Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayOrders.map(order => (
                <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg bg-orange-50 border-orange-200">
                  <div>
                    <h4 className="font-semibold text-orange-900">{order.nombrePedido}</h4>
                    <p className="text-xs text-orange-700">Cliente: {order.cliente}</p>
                    <p className="text-sm text-orange-700 mt-1">
                      {order.items.map(item => `${item.cantidad} ${item.prenda}`).join(', ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-orange-900">
                      {order.fechaEntregaEstimada.toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      })}
                    </p>
                    <Badge 
                      variant="outline" 
                      className={
                        order.status === 'completed' 
                          ? 'bg-green-100 text-green-800 border-green-200'
                          : 'bg-orange-100 text-orange-800 border-orange-200'
                      }
                    >
                      {order.status === 'completed' ? 'Completado' : 'Pendiente'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};