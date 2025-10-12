import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AddOrderDialog } from '@/components/AddOrderDialog';
import { OrdersTable } from '@/components/OrdersTable';
import { ScheduleView } from '@/components/ScheduleView';
import { CostsView } from '@/components/CostsView';
import { ClientsDatabase } from '@/components/ClientsDatabase';
import { InventoryView } from '@/components/InventoryView';
import { SettingsView } from '@/components/SettingsView';
import { HistorialPedidos } from '@/components/HistorialPedidos';
import { Order, OrderItem } from '@/types/sublimation';
import { useTimeCalculator } from '@/hooks/useTimeCalculator';
import { usePasswordProtection } from '@/hooks/usePasswordProtection';
import { PasswordProtect } from '@/components/PasswordProtect';
import { BarChart3, Clock, DollarSign, Users, Package, Settings, History } from 'lucide-react';

const Index = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState('orders');
  const { calculateOrderTime, calculateDeliveryTime } = useTimeCalculator();
  const { isAuthenticated, isLoading, authenticate, logout } = usePasswordProtection();

  const handleAddOrder = (nombrePedido: string, clienteId: string | undefined, items: OrderItem[], designTime: number, diseñador?: string) => {
    const timeCalc = calculateOrderTime(items, designTime);
    const deliveryDate = calculateDeliveryTime(timeCalc.totalTime);
    
    // Get client name if clienteId is provided
    let clienteNombre = 'Sin asignar';
    if (clienteId) {
      const clientesStorage = localStorage.getItem('clientes_database');
      if (clientesStorage) {
        const clientes = JSON.parse(clientesStorage);
        const cliente = clientes.find((c: any) => c.id === clienteId);
        if (cliente) clienteNombre = cliente.nombre;
      }
    }
    
    const newOrder: Order = {
      id: crypto.randomUUID(),
      nombrePedido,
      clienteId,
      cliente: clienteNombre,
      items,
      tiempoDiseno: designTime,
      tiempoTotal: timeCalc.totalTime,
      fechaCreacion: new Date(),
      fechaEntregaEstimada: deliveryDate,
      status: 'pending',
      diseñador,
      procesos: {
        diseno: { completado: false },
        impresion: { completado: false },
        cortado: { completado: false },
        planchado: { completado: false },
        control: { completado: false }
      }
    };

    setOrders(prev => [...prev, newOrder]);
  };

  const handleUpdateOrder = (orderId: string, updates: Partial<Order>) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, ...updates } : order
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent mb-2">
              Sistema de Gestión de Sublimación
            </h1>
            <p className="text-muted-foreground text-lg">
              Control completo de diseño, impresión, cortado y planchado
            </p>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-10 w-10">
                <Settings className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setActiveTab('costs')}>
                <DollarSign className="mr-2 h-4 w-4" />
                Costos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab('settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Configuración
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab('historial')}>
                <History className="mr-2 h-4 w-4" />
                Historial
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mb-6">
          <AddOrderDialog onAddOrder={handleAddOrder} />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Pedidos
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Programación
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Inventario
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Clientes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-6">
            <OrdersTable orders={orders} onUpdateOrder={handleUpdateOrder} />
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            <ScheduleView orders={orders} />
          </TabsContent>

          <TabsContent value="costs" className="space-y-6">
            <CostsView orders={orders} />
          </TabsContent>

          <TabsContent value="inventory" className="space-y-6">
            <InventoryView />
          </TabsContent>

          <TabsContent value="clients" className="space-y-6">
            <PasswordProtect
              isAuthenticated={isAuthenticated}
              isLoading={isLoading}
              onAuthenticate={authenticate}
              onLogout={logout}
            >
              <ClientsDatabase />
            </PasswordProtect>
          </TabsContent>

          <TabsContent value="historial" className="space-y-6">
            <HistorialPedidos />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <SettingsView />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
