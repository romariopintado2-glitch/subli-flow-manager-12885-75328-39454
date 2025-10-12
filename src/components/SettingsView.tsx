import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Settings as SettingsIcon, Plus, Trash2, Clock, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TimeCalculation } from '@/types/sublimation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SettingsData {
  timeData: TimeCalculation;
  diseñadores: string[];
  configMode: 'simple' | 'avanzada';
  advancedTimesBySize?: {
    [prenda: string]: {
      [talla: string]: {
        impresion: number;
        cortado: number;
        planchado: number;
        control: number;
        imprevisto: number;
      };
    };
  };
  advancedCostsBySize?: {
    [prenda: string]: {
      [talla: string]: {
        metrosXUnidad: number;
        precioTinta: number;
        precioPapel: number;
        costoTotal: number;
      };
    };
  };
}

export const SettingsView = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SettingsData>({
    timeData: {
      design: {
        polo: 6,
        poloMangaLarga: 0,
        short: 0,
        faldaShort: 0,
        pantaloneta: 0
      },
      production: {
        polo: { impresion: 9, cortado: 1, planchado: 3, control: 1, imprevisto: 1 },
        poloMangaLarga: { impresion: 10, cortado: 1, planchado: 3, control: 1, imprevisto: 2 },
        short: { impresion: 7, cortado: 1, planchado: 2, control: 1, imprevisto: 1 },
        faldaShort: { impresion: 7, cortado: 1, planchado: 2, control: 1, imprevisto: 1 },
        pantaloneta: { impresion: 7, cortado: 1, planchado: 2, control: 1, imprevisto: 1 }
      }
    },
    diseñadores: [],
    configMode: 'simple',
    advancedTimesBySize: {},
    advancedCostsBySize: {}
  });

  const [newDiseñador, setNewDiseñador] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('settings');
    if (stored) {
      try {
        setSettings(JSON.parse(stored));
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, []);

  const saveSettings = (data: SettingsData) => {
    setSettings(data);
    localStorage.setItem('settings', JSON.stringify(data));
    toast({
      title: 'Configuración guardada',
      description: 'Los cambios se han guardado correctamente'
    });
  };

  const updateProductionTime = (
    prenda: keyof TimeCalculation['production'],
    proceso: keyof TimeCalculation['production']['polo'],
    value: number
  ) => {
    const newSettings = {
      ...settings,
      timeData: {
        ...settings.timeData,
        production: {
          ...settings.timeData.production,
          [prenda]: {
            ...settings.timeData.production[prenda],
            [proceso]: Math.max(0, value)
          }
        }
      }
    };
    saveSettings(newSettings);
  };

  const addDiseñador = () => {
    if (newDiseñador.trim() && !settings.diseñadores.includes(newDiseñador.trim())) {
      saveSettings({
        ...settings,
        diseñadores: [...settings.diseñadores, newDiseñador.trim()]
      });
      setNewDiseñador('');
      setDialogOpen(false);
    }
  };

  const removeDiseñador = (nombre: string) => {
    saveSettings({
      ...settings,
      diseñadores: settings.diseñadores.filter(d => d !== nombre)
    });
  };

  const prendaLabels = {
    polo: 'Polo',
    poloMangaLarga: 'Polo Manga Larga',
    short: 'Short',
    faldaShort: 'Falda Short',
    pantaloneta: 'Pantaloneta'
  };

  const procesoLabels = {
    impresion: 'Impresión',
    cortado: 'Cortado',
    planchado: 'Planchado',
    control: 'Control',
    imprevisto: 'Imprevisto'
  };

  const tallas = ['4', '6', '8', '10', '12', '14', '16', 'S', 'M', 'L', 'XL', 'XXL'];

  const updateAdvancedTime = (prenda: string, talla: string, proceso: string, value: number) => {
    const newSettings = {
      ...settings,
      advancedTimesBySize: {
        ...settings.advancedTimesBySize,
        [prenda]: {
          ...(settings.advancedTimesBySize?.[prenda] || {}),
          [talla]: {
            ...(settings.advancedTimesBySize?.[prenda]?.[talla] || { impresion: 0, cortado: 0, planchado: 0, control: 0, imprevisto: 0 }),
            [proceso]: Math.max(0, value)
          }
        }
      }
    };
    saveSettings(newSettings);
  };

  const updateAdvancedCost = (prenda: string, talla: string, field: string, value: number) => {
    const newSettings = {
      ...settings,
      advancedCostsBySize: {
        ...settings.advancedCostsBySize,
        [prenda]: {
          ...(settings.advancedCostsBySize?.[prenda] || {}),
          [talla]: {
            ...(settings.advancedCostsBySize?.[prenda]?.[talla] || { metrosXUnidad: 0, precioTinta: 0, precioPapel: 0, costoTotal: 0 }),
            [field]: Math.max(0, value)
          }
        }
      }
    };
    saveSettings(newSettings);
  };

  const toggleConfigMode = (checked: boolean) => {
    saveSettings({
      ...settings,
      configMode: checked ? 'avanzada' : 'simple'
    });
  };

  return (
    <div className="space-y-6">
      {/* Selector de Modo de Configuración */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Modo de Configuración
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-medium ${settings.configMode === 'simple' ? 'text-primary' : 'text-muted-foreground'}`}>
                Simple
              </span>
              <Switch
                checked={settings.configMode === 'avanzada'}
                onCheckedChange={toggleConfigMode}
              />
              <span className={`text-sm font-medium ${settings.configMode === 'avanzada' ? 'text-primary' : 'text-muted-foreground'}`}>
                Avanzada
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {settings.configMode === 'simple' 
              ? '📊 Modo Simple: Usa tiempos y costos promedio por prenda.' 
              : '🎯 Modo Avanzado: Configura tiempos y costos específicos por cada talla.'}
          </p>
        </CardContent>
      </Card>

      {settings.configMode === 'simple' ? (
        /* CONFIGURACIÓN SIMPLE */
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Tiempos de Producción (minutos por unidad)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {(Object.keys(settings.timeData.production) as Array<keyof TimeCalculation['production']>).map(prenda => (
            <div key={prenda} className="space-y-3">
              <h3 className="font-semibold text-lg border-b pb-2">{prendaLabels[prenda]}</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {(Object.keys(settings.timeData.production[prenda]) as Array<keyof TimeCalculation['production']['polo']>).map(proceso => (
                  <div key={proceso}>
                    <Label htmlFor={`${prenda}-${proceso}`} className="text-xs">
                      {procesoLabels[proceso]}
                    </Label>
                    <Input
                      id={`${prenda}-${proceso}`}
                      type="number"
                      min="0"
                      step="0.1"
                      value={settings.timeData.production[prenda][proceso]}
                      onChange={(e) => updateProductionTime(prenda, proceso, parseFloat(e.target.value) || 0)}
                      className="mt-1"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Nota:</strong> Los tiempos de impresión son promedios considerando diferentes tallas. 
              Estos tiempos se utilizarán para calcular la fecha de entrega estimada de los pedidos.
            </p>
          </div>
        </CardContent>
      </Card>
      ) : (
        /* CONFIGURACIÓN AVANZADA */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Configuración Avanzada por Tallas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="tiempos" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="tiempos">Tiempos por Talla</TabsTrigger>
                <TabsTrigger value="costos">Costos por Talla</TabsTrigger>
              </TabsList>

              <TabsContent value="tiempos" className="space-y-6 mt-4">
                {(Object.keys(prendaLabels) as Array<keyof typeof prendaLabels>).map(prenda => (
                  <div key={prenda} className="space-y-3">
                    <h3 className="font-semibold text-lg border-b pb-2">{prendaLabels[prenda]}</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2 font-medium">Talla</th>
                            <th className="text-left p-2 font-medium">Impresión (min)</th>
                            <th className="text-left p-2 font-medium">Cortado (min)</th>
                            <th className="text-left p-2 font-medium">Planchado (min)</th>
                            <th className="text-left p-2 font-medium">Control (min)</th>
                            <th className="text-left p-2 font-medium">Imprevisto (min)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tallas.map(talla => {
                            const current = settings.advancedTimesBySize?.[prenda]?.[talla] || {
                              impresion: 0, cortado: 0, planchado: 0, control: 0, imprevisto: 0
                            };
                            return (
                              <tr key={talla} className="border-b">
                                <td className="p-2 font-medium">{talla}</td>
                                <td className="p-2">
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    value={current.impresion}
                                    onChange={(e) => updateAdvancedTime(prenda, talla, 'impresion', parseFloat(e.target.value) || 0)}
                                    className="w-20"
                                  />
                                </td>
                                <td className="p-2">
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    value={current.cortado}
                                    onChange={(e) => updateAdvancedTime(prenda, talla, 'cortado', parseFloat(e.target.value) || 0)}
                                    className="w-20"
                                  />
                                </td>
                                <td className="p-2">
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    value={current.planchado}
                                    onChange={(e) => updateAdvancedTime(prenda, talla, 'planchado', parseFloat(e.target.value) || 0)}
                                    className="w-20"
                                  />
                                </td>
                                <td className="p-2">
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    value={current.control}
                                    onChange={(e) => updateAdvancedTime(prenda, talla, 'control', parseFloat(e.target.value) || 0)}
                                    className="w-20"
                                  />
                                </td>
                                <td className="p-2">
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    value={current.imprevisto}
                                    onChange={(e) => updateAdvancedTime(prenda, talla, 'imprevisto', parseFloat(e.target.value) || 0)}
                                    className="w-20"
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Nota:</strong> Configura tiempos específicos por talla para mayor precisión en el cálculo de entregas.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="costos" className="space-y-6 mt-4">
                {(Object.keys(prendaLabels) as Array<keyof typeof prendaLabels>).map(prenda => (
                  <div key={prenda} className="space-y-3">
                    <h3 className="font-semibold text-lg border-b pb-2">{prendaLabels[prenda]}</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2 font-medium">Talla</th>
                            <th className="text-left p-2 font-medium">Metros/Unidad</th>
                            <th className="text-left p-2 font-medium">Precio Tinta (S/)</th>
                            <th className="text-left p-2 font-medium">Precio Papel (S/)</th>
                            <th className="text-left p-2 font-medium">Costo Total (S/)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tallas.map(talla => {
                            const current = settings.advancedCostsBySize?.[prenda]?.[talla] || {
                              metrosXUnidad: 0, precioTinta: 0, precioPapel: 0, costoTotal: 0
                            };
                            return (
                              <tr key={talla} className="border-b">
                                <td className="p-2 font-medium">{talla}</td>
                                <td className="p-2">
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    value={current.metrosXUnidad}
                                    onChange={(e) => updateAdvancedCost(prenda, talla, 'metrosXUnidad', parseFloat(e.target.value) || 0)}
                                    className="w-24"
                                  />
                                </td>
                                <td className="p-2">
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={current.precioTinta}
                                    onChange={(e) => updateAdvancedCost(prenda, talla, 'precioTinta', parseFloat(e.target.value) || 0)}
                                    className="w-24"
                                  />
                                </td>
                                <td className="p-2">
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={current.precioPapel}
                                    onChange={(e) => updateAdvancedCost(prenda, talla, 'precioPapel', parseFloat(e.target.value) || 0)}
                                    className="w-24"
                                  />
                                </td>
                                <td className="p-2">
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={current.costoTotal}
                                    onChange={(e) => updateAdvancedCost(prenda, talla, 'costoTotal', parseFloat(e.target.value) || 0)}
                                    className="w-24"
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Nota:</strong> Configura costos específicos por talla para cálculos más precisos.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Diseñadores */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="w-5 h-5" />
              Diseñadores
            </CardTitle>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Añadir Diseñador
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Añadir Diseñador</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nuevo-diseñador">Nombre del Diseñador</Label>
                    <Input
                      id="nuevo-diseñador"
                      value={newDiseñador}
                      onChange={(e) => setNewDiseñador(e.target.value)}
                      placeholder="Ej: Juan Pérez"
                      onKeyDown={(e) => e.key === 'Enter' && addDiseñador()}
                    />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={addDiseñador} disabled={!newDiseñador.trim()}>
                      Añadir
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {settings.diseñadores.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay diseñadores registrados. Añade uno usando el botón de arriba.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {settings.diseñadores.map(diseñador => (
                <Card key={diseñador}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <span className="font-medium">{diseñador}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeDiseñador(diseñador)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};