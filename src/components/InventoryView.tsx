import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Package, Settings, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TintaStock {
  color: 'cyan' | 'magenta' | 'yellow' | 'black';
  cantidad: number;
  minimo: number;
}

interface PapelStock {
  id: string;
  tamaño: string;
  cantidad: number;
  minimo: number;
}

interface TelaStock {
  id: string;
  tipo: string;
  cantidad: number;
  minimo: number;
}

interface InventoryData {
  tintas: TintaStock[];
  papeles: PapelStock[];
  telas: TelaStock[];
}

export const InventoryView = () => {
  const { toast } = useToast();
  const [inventory, setInventory] = useState<InventoryData>({
    tintas: [
      { color: 'cyan', cantidad: 0, minimo: 1 },
      { color: 'magenta', cantidad: 0, minimo: 1 },
      { color: 'yellow', cantidad: 0, minimo: 1 },
      { color: 'black', cantidad: 0, minimo: 1 }
    ],
    papeles: [],
    telas: []
  });

  const [settingsOpen, setSettingsOpen] = useState<{ type: 'tinta' | 'papel' | 'tela', id: string } | null>(null);
  const [tempMinimo, setTempMinimo] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem('inventario');
    if (stored) {
      try {
        setInventory(JSON.parse(stored));
      } catch (error) {
        console.error('Error loading inventory:', error);
      }
    }
  }, []);

  const saveInventory = (data: InventoryData) => {
    setInventory(data);
    localStorage.setItem('inventario', JSON.stringify(data));
  };

  const updateTintaCantidad = (color: TintaStock['color'], cantidad: number) => {
    const newInventory = {
      ...inventory,
      tintas: inventory.tintas.map(t => 
        t.color === color ? { ...t, cantidad: Math.max(0, cantidad) } : t
      )
    };
    saveInventory(newInventory);
  };

  const updateTintaMinimo = (color: TintaStock['color'], minimo: number) => {
    const newInventory = {
      ...inventory,
      tintas: inventory.tintas.map(t => 
        t.color === color ? { ...t, minimo: Math.max(0, minimo) } : t
      )
    };
    saveInventory(newInventory);
    toast({
      title: 'Stock mínimo actualizado',
      description: `Stock mínimo para ${color} actualizado correctamente`
    });
  };

  const addPapel = (tamaño: string) => {
    const newPapel: PapelStock = {
      id: crypto.randomUUID(),
      tamaño,
      cantidad: 0,
      minimo: 1
    };
    saveInventory({
      ...inventory,
      papeles: [...inventory.papeles, newPapel]
    });
    toast({
      title: 'Papel añadido',
      description: `Papel ${tamaño} añadido al inventario`
    });
  };

  const removePapel = (id: string) => {
    saveInventory({
      ...inventory,
      papeles: inventory.papeles.filter(p => p.id !== id)
    });
    toast({
      title: 'Papel eliminado',
      description: 'Papel eliminado del inventario'
    });
  };

  const updatePapelCantidad = (id: string, cantidad: number) => {
    saveInventory({
      ...inventory,
      papeles: inventory.papeles.map(p => 
        p.id === id ? { ...p, cantidad: Math.max(0, cantidad) } : p
      )
    });
  };

  const updatePapelMinimo = (id: string, minimo: number) => {
    saveInventory({
      ...inventory,
      papeles: inventory.papeles.map(p => 
        p.id === id ? { ...p, minimo: Math.max(0, minimo) } : p
      )
    });
    toast({
      title: 'Stock mínimo actualizado',
      description: 'Stock mínimo actualizado correctamente'
    });
  };

  const addTela = (tipo: string) => {
    const newTela: TelaStock = {
      id: crypto.randomUUID(),
      tipo,
      cantidad: 0,
      minimo: 1
    };
    saveInventory({
      ...inventory,
      telas: [...inventory.telas, newTela]
    });
    toast({
      title: 'Tela añadida',
      description: `Tela ${tipo} añadida al inventario`
    });
  };

  const removeTela = (id: string) => {
    saveInventory({
      ...inventory,
      telas: inventory.telas.filter(t => t.id !== id)
    });
    toast({
      title: 'Tela eliminada',
      description: 'Tela eliminada del inventario'
    });
  };

  const updateTelaCantidad = (id: string, cantidad: number) => {
    saveInventory({
      ...inventory,
      telas: inventory.telas.map(t => 
        t.id === id ? { ...t, cantidad: Math.max(0, cantidad) } : t
      )
    });
  };

  const updateTelaMinimo = (id: string, minimo: number) => {
    saveInventory({
      ...inventory,
      telas: inventory.telas.map(t => 
        t.id === id ? { ...t, minimo: Math.max(0, minimo) } : t
      )
    });
    toast({
      title: 'Stock mínimo actualizado',
      description: 'Stock mínimo actualizado correctamente'
    });
  };

  const openSettings = (type: 'tinta' | 'papel' | 'tela', id: string) => {
    let currentMinimo = 0;
    if (type === 'tinta') {
      const tinta = inventory.tintas.find(t => t.color === id);
      currentMinimo = tinta?.minimo || 0;
    } else if (type === 'papel') {
      const papel = inventory.papeles.find(p => p.id === id);
      currentMinimo = papel?.minimo || 0;
    } else {
      const tela = inventory.telas.find(t => t.id === id);
      currentMinimo = tela?.minimo || 0;
    }
    setTempMinimo(currentMinimo);
    setSettingsOpen({ type, id });
  };

  const saveSettings = () => {
    if (!settingsOpen) return;
    
    const { type, id } = settingsOpen;
    if (type === 'tinta') {
      updateTintaMinimo(id as TintaStock['color'], tempMinimo);
    } else if (type === 'papel') {
      updatePapelMinimo(id, tempMinimo);
    } else {
      updateTelaMinimo(id, tempMinimo);
    }
    setSettingsOpen(null);
  };

  const getTintaLabel = (color: TintaStock['color']) => {
    const labels = {
      cyan: 'Cyan',
      magenta: 'Magenta',
      yellow: 'Amarillo',
      black: 'Negro'
    };
    return labels[color];
  };

  const isLowStock = (cantidad: number, minimo: number) => cantidad <= minimo;

  return (
    <div className="space-y-6">
      {/* Tintas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Tintas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {inventory.tintas.map(tinta => (
              <Card 
                key={tinta.color} 
                className={`${isLowStock(tinta.cantidad, tinta.minimo) ? 'border-destructive border-2' : ''}`}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{getTintaLabel(tinta.color)}</h3>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openSettings('tinta', tinta.color)}
                      className="h-8 w-8"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                  {isLowStock(tinta.cantidad, tinta.minimo) && (
                    <div className="flex items-center gap-2 text-destructive text-sm">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Stock bajo</span>
                    </div>
                  )}
                  <div>
                    <Label htmlFor={`tinta-${tinta.color}`}>Cantidad (litros)</Label>
                    <Input
                      id={`tinta-${tinta.color}`}
                      type="number"
                      min="0"
                      step="1"
                      value={tinta.cantidad}
                      onChange={(e) => updateTintaCantidad(tinta.color, parseInt(e.target.value) || 0)}
                      className="mt-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Mínimo: {tinta.minimo} litros
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Papeles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Papel de Sublimación
            </CardTitle>
            <AddPapelDialog onAdd={addPapel} />
          </div>
        </CardHeader>
        <CardContent>
          {inventory.papeles.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay papeles registrados. Añade uno usando el botón de arriba.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inventory.papeles.map(papel => (
                <Card 
                  key={papel.id}
                  className={`${isLowStock(papel.cantidad, papel.minimo) ? 'border-destructive border-2' : ''}`}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{papel.tamaño}</h3>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openSettings('papel', papel.id)}
                          className="h-8 w-8"
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removePapel(papel.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {isLowStock(papel.cantidad, papel.minimo) && (
                      <div className="flex items-center gap-2 text-destructive text-sm">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Stock bajo</span>
                      </div>
                    )}
                    <div>
                      <Label htmlFor={`papel-${papel.id}`}>Cantidad (rollos)</Label>
                      <Input
                        id={`papel-${papel.id}`}
                        type="number"
                        min="0"
                        value={papel.cantidad}
                        onChange={(e) => updatePapelCantidad(papel.id, parseInt(e.target.value) || 0)}
                        className="mt-1"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Mínimo: {papel.minimo} rollos
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Telas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Telas
            </CardTitle>
            <AddTelaDialog onAdd={addTela} />
          </div>
        </CardHeader>
        <CardContent>
          {inventory.telas.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay telas registradas. Añade una usando el botón de arriba.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inventory.telas.map(tela => (
                <Card 
                  key={tela.id}
                  className={`${isLowStock(tela.cantidad, tela.minimo) ? 'border-destructive border-2' : ''}`}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{tela.tipo}</h3>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openSettings('tela', tela.id)}
                          className="h-8 w-8"
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeTela(tela.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {isLowStock(tela.cantidad, tela.minimo) && (
                      <div className="flex items-center gap-2 text-destructive text-sm">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Stock bajo</span>
                      </div>
                    )}
                    <div>
                      <Label htmlFor={`tela-${tela.id}`}>Cantidad (metros)</Label>
                      <Input
                        id={`tela-${tela.id}`}
                        type="number"
                        min="0"
                        value={tela.cantidad}
                        onChange={(e) => updateTelaCantidad(tela.id, parseInt(e.target.value) || 0)}
                        className="mt-1"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Mínimo: {tela.minimo} metros
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings Dialog */}
      <Dialog open={!!settingsOpen} onOpenChange={() => setSettingsOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurar Stock Mínimo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="minimo">Stock Mínimo</Label>
              <Input
                id="minimo"
                type="number"
                min="0"
                value={tempMinimo}
                onChange={(e) => setTempMinimo(parseInt(e.target.value) || 0)}
                className="mt-1"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Se mostrará una alerta cuando el stock llegue a este nivel o por debajo.
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setSettingsOpen(null)}>
                Cancelar
              </Button>
              <Button onClick={saveSettings}>
                Guardar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const AddPapelDialog = ({ onAdd }: { onAdd: (tamaño: string) => void }) => {
  const [open, setOpen] = useState(false);
  const [tamaño, setTamaño] = useState('90cm');
  const [customTamaño, setCustomTamaño] = useState('');

  const handleAdd = () => {
    const finalTamaño = tamaño === 'custom' ? customTamaño : tamaño;
    if (finalTamaño.trim()) {
      onAdd(finalTamaño);
      setTamaño('90cm');
      setCustomTamaño('');
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Añadir Papel
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Añadir Papel</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="tamaño">Tamaño del Papel</Label>
            <Select value={tamaño} onValueChange={setTamaño}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="90cm">90cm</SelectItem>
                <SelectItem value="110cm">110cm</SelectItem>
                <SelectItem value="160cm">160cm</SelectItem>
                <SelectItem value="180cm">180cm</SelectItem>
                <SelectItem value="custom">Otro tamaño</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {tamaño === 'custom' && (
            <div>
              <Label htmlFor="custom">Especificar Tamaño</Label>
              <Input
                id="custom"
                value={customTamaño}
                onChange={(e) => setCustomTamaño(e.target.value)}
                placeholder="Ej: 120cm"
                className="mt-1"
              />
            </div>
          )}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAdd}>
              Añadir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const AddTelaDialog = ({ onAdd }: { onAdd: (tipo: string) => void }) => {
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState('Dry Fit');
  const [customTipo, setCustomTipo] = useState('');

  const handleAdd = () => {
    const finalTipo = tipo === 'custom' ? customTipo : tipo;
    if (finalTipo.trim()) {
      onAdd(finalTipo);
      setTipo('Dry Fit');
      setCustomTipo('');
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Añadir Tela
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Añadir Tela</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="tipo">Tipo de Tela</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Dry Fit">Dry Fit</SelectItem>
                <SelectItem value="Win Freshy">Win Freshy</SelectItem>
                <SelectItem value="custom">Otro tipo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {tipo === 'custom' && (
            <div>
              <Label htmlFor="custom-tipo">Especificar Tipo</Label>
              <Input
                id="custom-tipo"
                value={customTipo}
                onChange={(e) => setCustomTipo(e.target.value)}
                placeholder="Ej: Poliéster Premium"
                className="mt-1"
              />
            </div>
          )}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAdd}>
              Añadir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};