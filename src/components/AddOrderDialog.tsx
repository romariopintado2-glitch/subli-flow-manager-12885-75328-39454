import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Trash2, Check, ChevronsUpDown, UserPlus, Upload, X } from 'lucide-react';
import { OrderItem } from '@/types/sublimation';
import { Cliente } from '@/types/cliente';
import { useTimeCalculator } from '@/hooks/useTimeCalculator';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

interface AddOrderDialogProps {
  onAddOrder: (nombrePedido: string, clienteId: string | undefined, items: OrderItem[], designTime: number, diseñador?: string) => void;
}

export const AddOrderDialog = ({ onAddOrder }: AddOrderDialogProps) => {
  const [open, setOpen] = useState(false);
  const [nombrePedido, setNombrePedido] = useState('');
  const [clienteId, setClienteId] = useState<string>('');
  const [diseñador, setDiseñador] = useState('');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [tiempoDiseno, setTiempoDiseno] = useState(0); // in minutes
  const [tiempoLista, setTiempoLista] = useState(15); // in minutes
  const [items, setItems] = useState<OrderItem[]>([
    { prenda: 'polo', cantidad: 1 }
  ]);
  const [clienteSearchOpen, setClienteSearchOpen] = useState(false);
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [newClientData, setNewClientData] = useState({
    nombre: '',
    celular: '',
    distrito: '',
    descripcion: ''
  });
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelData, setExcelData] = useState<{
    polo?: { [talla: string]: number };
    poloMangaLarga?: { [talla: string]: number };
    short?: { [talla: string]: number };
    faldaShort?: { [talla: string]: number };
    pantaloneta?: { [talla: string]: number };
  } | null>(null);
  
  const { calculateOrderTime, calculateOrderTimeFromExcel, formatTime } = useTimeCalculator();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      const clientesStorage = localStorage.getItem('clientes_database');
      if (clientesStorage) {
        try {
          const parsedClientes = JSON.parse(clientesStorage);
          setClientes(parsedClientes);
        } catch (error) {
          console.error('Error loading clients:', error);
          setClientes([]);
        }
      }
    }
  }, [open]);

  const addItem = () => {
    setItems([...items, { prenda: 'polo', cantidad: 1 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelFile(file);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      // Buscar las columnas de prendas (empezar desde fila 1, índice 0)
      const headers = jsonData[0] as string[];
      
      // Mapeo de columnas a buscar
      const columnMap = {
        polo: ['POLO'],
        poloMangaLarga: ['POLO MANGA LARGA', 'POLO ML'],
        short: ['SHORT'],
        faldaShort: ['FALDASHORT', 'FALDA SHORT'],
        pantaloneta: ['PANTALONETA']
      };

      const resultado: {
        polo?: { [talla: string]: number };
        poloMangaLarga?: { [talla: string]: number };
        short?: { [talla: string]: number };
        faldaShort?: { [talla: string]: number };
        pantaloneta?: { [talla: string]: number };
      } = {};

      let columnsFound = 0;

      // Buscar cada tipo de prenda
      for (const [key, possibleNames] of Object.entries(columnMap)) {
        const columnIndex = headers.findIndex(h => {
          if (!h) return false;
          const headerUpper = h.toString().toUpperCase().trim();
          return possibleNames.some(name => headerUpper === name);
        });

        if (columnIndex !== -1) {
          // Contar las tallas en esta columna (empezar desde fila 2, índice 1)
          const tallasCount: { [talla: string]: number } = {};
          for (let i = 1; i < jsonData.length; i++) {
            const talla = jsonData[i][columnIndex];
            if (talla) {
              const tallaStr = talla.toString().toUpperCase().trim();
              tallasCount[tallaStr] = (tallasCount[tallaStr] || 0) + 1;
            }
          }

          if (Object.keys(tallasCount).length > 0) {
            resultado[key as keyof typeof resultado] = tallasCount;
            columnsFound++;
          }
        }
      }

      if (columnsFound === 0) {
        toast({
          title: 'Error',
          description: 'No se encontraron columnas de prendas (POLO, POLO MANGA LARGA, SHORT, FALDASHORT, PANTALONETA)',
          variant: 'destructive'
        });
        setExcelFile(null);
        return;
      }

      setExcelData(resultado);
      
      toast({
        title: 'Excel cargado',
        description: `Se encontraron ${columnsFound} tipo(s) de prenda(s)`
      });
    } catch (error) {
      console.error('Error reading Excel:', error);
      toast({
        title: 'Error',
        description: 'No se pudo leer el archivo Excel',
        variant: 'destructive'
      });
      setExcelFile(null);
    }
  };

  const clearExcelData = () => {
    setExcelFile(null);
    setExcelData(null);
  };

  const handleCreateClient = () => {
    if (!newClientData.nombre || !newClientData.celular || !newClientData.distrito) {
      toast({
        title: 'Error',
        description: 'Por favor completa todos los campos requeridos',
        variant: 'destructive'
      });
      return;
    }

    const newCliente: Cliente = {
      id: crypto.randomUUID(),
      ...newClientData,
      fechaCreacion: new Date()
    };

    const clientesStorage = localStorage.getItem('clientes_database');
    const existingClientes = clientesStorage ? JSON.parse(clientesStorage) : [];
    const updatedClientes = [...existingClientes, newCliente];
    localStorage.setItem('clientes_database', JSON.stringify(updatedClientes));

    setClientes(updatedClientes);
    setClienteId(newCliente.id);
    setShowCreateClient(false);
    setNewClientData({ nombre: '', celular: '', distrito: '', descripcion: '' });
    setClienteSearchOpen(false);

    toast({
      title: 'Cliente creado',
      description: 'El cliente se ha agregado correctamente'
    });
  };

  const handleSubmit = () => {
    if (nombrePedido.trim()) {
      // Determinar los items finales
      let finalItems: OrderItem[];
      
      if (excelData) {
        // Si hay datos de Excel, crear items para cada tipo de prenda
        finalItems = [];
        
        if (excelData.polo) {
          const totalCantidad = Object.values(excelData.polo).reduce((sum, count) => sum + count, 0);
          finalItems.push({ prenda: 'polo', cantidad: totalCantidad });
        }
        if (excelData.poloMangaLarga) {
          const totalCantidad = Object.values(excelData.poloMangaLarga).reduce((sum, count) => sum + count, 0);
          finalItems.push({ prenda: 'poloMangaLarga', cantidad: totalCantidad });
        }
        if (excelData.short) {
          const totalCantidad = Object.values(excelData.short).reduce((sum, count) => sum + count, 0);
          finalItems.push({ prenda: 'short', cantidad: totalCantidad });
        }
        if (excelData.faldaShort) {
          const totalCantidad = Object.values(excelData.faldaShort).reduce((sum, count) => sum + count, 0);
          finalItems.push({ prenda: 'faldaShort', cantidad: totalCantidad });
        }
        if (excelData.pantaloneta) {
          const totalCantidad = Object.values(excelData.pantaloneta).reduce((sum, count) => sum + count, 0);
          finalItems.push({ prenda: 'pantaloneta', cantidad: totalCantidad });
        }
      } else {
        // Si no hay Excel, usar los items manuales
        finalItems = items;
      }

      if (finalItems.length > 0) {
        const totalDesignTimeHours = (tiempoDiseno + tiempoLista) / 60;
        const finalDiseñador = diseñador && diseñador !== 'none' ? diseñador : undefined;
        onAddOrder(nombrePedido, clienteId || undefined, finalItems, totalDesignTimeHours, finalDiseñador);
        setNombrePedido('');
        setClienteId('');
        setDiseñador('');
        setTiempoDiseno(0);
        setTiempoLista(15);
        setItems([{ prenda: 'polo', cantidad: 1 }]);
        clearExcelData();
        setOpen(false);
      }
    }
  };

  const totalDesignTimeHours = (tiempoDiseno + tiempoLista) / 60;
  
  // Calcular el tiempo basándose en si hay datos de Excel o items manuales
  let timeCalculation;
  if (excelData) {
    // Sumar tiempos de todas las prendas del Excel
    let totalTime = 0;
    let totalDesignTime = 0;
    
    if (excelData.polo) {
      const calc = calculateOrderTimeFromExcel('polo', excelData.polo, totalDesignTimeHours);
      totalTime += calc.totalTime;
      totalDesignTime += calc.designTime;
    }
    if (excelData.poloMangaLarga) {
      const calc = calculateOrderTimeFromExcel('poloMangaLarga', excelData.poloMangaLarga, totalDesignTimeHours);
      totalTime += calc.totalTime;
      totalDesignTime += calc.designTime;
    }
    if (excelData.short) {
      const calc = calculateOrderTimeFromExcel('short', excelData.short, totalDesignTimeHours);
      totalTime += calc.totalTime;
      totalDesignTime += calc.designTime;
    }
    if (excelData.faldaShort) {
      const calc = calculateOrderTimeFromExcel('faldaShort', excelData.faldaShort, totalDesignTimeHours);
      totalTime += calc.totalTime;
      totalDesignTime += calc.designTime;
    }
    if (excelData.pantaloneta) {
      const calc = calculateOrderTimeFromExcel('pantaloneta', excelData.pantaloneta, totalDesignTimeHours);
      totalTime += calc.totalTime;
      totalDesignTime += calc.designTime;
    }
    
    timeCalculation = {
      designTime: totalDesignTime,
      productionTime: totalTime - totalDesignTime,
      totalTime: totalTime
    };
  } else {
    timeCalculation = calculateOrderTime(items, totalDesignTimeHours);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Pedido
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Agregar Nuevo Pedido
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <Label htmlFor="nombrePedido">Nombre del Pedido</Label>
            <Input
              id="nombrePedido"
              value={nombrePedido}
              onChange={(e) => setNombrePedido(e.target.value)}
              placeholder="Ej: Uniformes Colegio San Juan"
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Asignar Cliente</Label>
              <Popover open={clienteSearchOpen} onOpenChange={setClienteSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={clienteSearchOpen}
                    className="w-full justify-between mt-1"
                  >
                    {clienteId && clienteId !== 'none'
                      ? clientes.find((c) => c.id === clienteId)?.nombre
                      : "Seleccionar cliente..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Buscar cliente..." />
                    <CommandEmpty>
                      <div className="p-4 text-center">
                        <p className="text-sm text-muted-foreground mb-3">No se encontró el cliente</p>
                        <Button
                          size="sm"
                          onClick={() => {
                            setShowCreateClient(true);
                            setClienteSearchOpen(false);
                          }}
                          className="gap-2"
                        >
                          <UserPlus className="w-4 h-4" />
                          Crear Nuevo Cliente
                        </Button>
                      </div>
                    </CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="none"
                        onSelect={() => {
                          setClienteId('none');
                          setClienteSearchOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            clienteId === 'none' ? "opacity-100" : "opacity-0"
                          )}
                        />
                        Sin asignar
                      </CommandItem>
                      {clientes.map((cliente) => (
                        <CommandItem
                          key={cliente.id}
                          value={cliente.nombre.toLowerCase()}
                          onSelect={() => {
                            setClienteId(cliente.id);
                            setClienteSearchOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              clienteId === cliente.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {cliente.nombre} - {cliente.distrito}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="diseñador">Diseñador</Label>
              <Select
                value={diseñador}
                onValueChange={setDiseñador}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Seleccionar diseñador (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asignar</SelectItem>
                  {(() => {
                    const settingsStorage = localStorage.getItem('settings');
                    if (settingsStorage) {
                      try {
                        const settings = JSON.parse(settingsStorage);
                        return settings.diseñadores?.map((d: string) => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ));
                      } catch (error) {
                        return null;
                      }
                    }
                    return null;
                  })()}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tiempoDiseno">Tiempo de Diseño</Label>
              <Select
                value={tiempoDiseno.toString()}
                onValueChange={(value) => setTiempoDiseno(parseInt(value))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0 min (ninguno)</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="60">1 hora</SelectItem>
                  <SelectItem value="90">1 hora 30 min</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="tiempoLista">Tiempo de Lista</Label>
              <Select
                value={tiempoLista.toString()}
                onValueChange={(value) => setTiempoLista(parseInt(value))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="45">45 min</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-sm font-medium">
              Tiempo Total de Diseño: <span className="font-mono text-primary">{formatTime(tiempoDiseno + tiempoLista)}</span>
            </p>
          </div>

          {/* Sección de carga de Excel */}
          <div className="border-2 border-dashed rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Importar desde Excel (Opcional)</Label>
              {excelFile && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearExcelData}
                  className="h-8 text-destructive hover:text-destructive"
                >
                  <X className="w-4 h-4 mr-1" />
                  Limpiar
                </Button>
              )}
            </div>
            
            {!excelFile ? (
              <div className="space-y-2">
                <Input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleExcelUpload}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground">
                  Sube un archivo Excel con columnas: POLO, POLO MANGA LARGA, SHORT, FALDASHORT, PANTALONETA. 
                  Se contarán automáticamente las tallas de cada columna desde la segunda fila.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Upload className="w-4 h-4 text-primary" />
                  <span className="font-medium">{excelFile.name}</span>
                </div>
                
                {excelData && (
                  <div className="bg-muted/50 rounded-md p-3 space-y-3">
                    {excelData.polo && (
                      <div>
                        <p className="text-sm font-semibold mb-2 text-primary">Polo:</p>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          {Object.entries(excelData.polo).map(([talla, cantidad]) => (
                            <div key={talla} className="bg-background rounded px-2 py-1 flex justify-between">
                              <span className="font-medium">{talla}:</span>
                              <span className="text-muted-foreground">{cantidad} unid.</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {excelData.poloMangaLarga && (
                      <div>
                        <p className="text-sm font-semibold mb-2 text-primary">Polo Manga Larga:</p>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          {Object.entries(excelData.poloMangaLarga).map(([talla, cantidad]) => (
                            <div key={talla} className="bg-background rounded px-2 py-1 flex justify-between">
                              <span className="font-medium">{talla}:</span>
                              <span className="text-muted-foreground">{cantidad} unid.</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {excelData.short && (
                      <div>
                        <p className="text-sm font-semibold mb-2 text-primary">Short:</p>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          {Object.entries(excelData.short).map(([talla, cantidad]) => (
                            <div key={talla} className="bg-background rounded px-2 py-1 flex justify-between">
                              <span className="font-medium">{talla}:</span>
                              <span className="text-muted-foreground">{cantidad} unid.</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {excelData.faldaShort && (
                      <div>
                        <p className="text-sm font-semibold mb-2 text-primary">Falda Short:</p>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          {Object.entries(excelData.faldaShort).map(([talla, cantidad]) => (
                            <div key={talla} className="bg-background rounded px-2 py-1 flex justify-between">
                              <span className="font-medium">{talla}:</span>
                              <span className="text-muted-foreground">{cantidad} unid.</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {excelData.pantaloneta && (
                      <div>
                        <p className="text-sm font-semibold mb-2 text-primary">Pantaloneta:</p>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          {Object.entries(excelData.pantaloneta).map(([talla, cantidad]) => (
                            <div key={talla} className="bg-background rounded px-2 py-1 flex justify-between">
                              <span className="font-medium">{talla}:</span>
                              <span className="text-muted-foreground">{cantidad} unid.</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      ℹ️ Se usarán los tiempos de la configuración avanzada para cada talla
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>Prendas del Pedido {excelData && <span className="text-xs text-muted-foreground">(manual)</span>}</Label>
              <Button onClick={addItem} size="sm" variant="outline" disabled={!!excelData}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex gap-3 items-end p-3 border rounded-lg bg-card">
                  <div className="flex-1">
                    <Label className="text-sm">Tipo de Prenda</Label>
                    <Select
                      value={item.prenda}
                      onValueChange={(value: any) => updateItem(index, 'prenda', value)}
                      disabled={!!excelData}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="polo">Polo</SelectItem>
                        <SelectItem value="poloMangaLarga">Polo Manga Larga</SelectItem>
                        <SelectItem value="short">Short</SelectItem>
                        <SelectItem value="faldaShort">Falda Short</SelectItem>
                        <SelectItem value="pantaloneta">Pantaloneta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="w-24">
                    <Label className="text-sm">Cantidad</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.cantidad}
                      onChange={(e) => updateItem(index, 'cantidad', parseInt(e.target.value) || 1)}
                      className="mt-1"
                      disabled={!!excelData}
                    />
                  </div>
                  
                  {items.length > 1 && !excelData && (
                    <Button
                      onClick={() => removeItem(index)}
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <h4 className="font-medium">Estimación de Tiempo</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Diseño:</span>
                <span className="ml-2 font-mono">{formatTime(timeCalculation.designTime)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Producción:</span>
                <span className="ml-2 font-mono">{formatTime(timeCalculation.productionTime)}</span>
              </div>
              <div className="col-span-2 pt-2 border-t border-border">
                <span className="text-muted-foreground">Total:</span>
                <span className="ml-2 font-mono font-bold">{formatTime(timeCalculation.totalTime)}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={!nombrePedido.trim()}>
              Crear Pedido
            </Button>
          </div>
        </div>

        {/* Dialog para crear nuevo cliente */}
        <Dialog open={showCreateClient} onOpenChange={setShowCreateClient}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Cliente</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="new-nombre">Nombre *</Label>
                <Input
                  id="new-nombre"
                  value={newClientData.nombre}
                  onChange={(e) => setNewClientData(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Nombre completo del cliente"
                />
              </div>
              <div>
                <Label htmlFor="new-celular">Celular *</Label>
                <Input
                  id="new-celular"
                  value={newClientData.celular}
                  onChange={(e) => setNewClientData(prev => ({ ...prev, celular: e.target.value }))}
                  placeholder="Ej: +51 999 999 999"
                />
              </div>
              <div>
                <Label htmlFor="new-distrito">Distrito *</Label>
                <Input
                  id="new-distrito"
                  value={newClientData.distrito}
                  onChange={(e) => setNewClientData(prev => ({ ...prev, distrito: e.target.value }))}
                  placeholder="Ej: San Isidro"
                />
              </div>
              <div>
                <Label htmlFor="new-descripcion">Descripción</Label>
                <Textarea
                  id="new-descripcion"
                  value={newClientData.descripcion}
                  onChange={(e) => setNewClientData(prev => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Información adicional del cliente"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setShowCreateClient(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateClient}>
                  Crear y Asignar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};