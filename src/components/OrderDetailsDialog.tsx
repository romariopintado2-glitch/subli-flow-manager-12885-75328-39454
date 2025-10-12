import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Order } from '@/types/sublimation';
import { Cliente } from '@/types/cliente';
import { Badge } from '@/components/ui/badge';
import { useTimeCalculator } from '@/hooks/useTimeCalculator';
import { Calendar, User, MapPin, Phone, FileText, Pencil, Upload, X, Image as ImageIcon, Eye, MessageCircle, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OrderDetailsDialogProps {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateOrder: (orderId: string, updates: Partial<Order>) => void;
}

export const OrderDetailsDialog = ({ order, open, onOpenChange, onUpdateOrder }: OrderDetailsDialogProps) => {
  const { formatTime } = useTimeCalculator();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [descripcion, setDescripcion] = useState(order.descripcionPedido || '');
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [imageViewOpen, setImageViewOpen] = useState(false);
  const [linkImpresion, setLinkImpresion] = useState('');
  const [descripcionLink, setDescripcionLink] = useState('');

  useEffect(() => {
    if (order.clienteId) {
      const clientesStorage = localStorage.getItem('clientes_database');
      if (clientesStorage) {
        const clientes = JSON.parse(clientesStorage);
        const foundCliente = clientes.find((c: Cliente) => c.id === order.clienteId);
        setCliente(foundCliente || null);
      }
    }
  }, [order.clienteId]);

  const handleSaveDescripcion = () => {
    onUpdateOrder(order.id, { descripcionPedido: descripcion });
    setIsEditing(false);
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;

    const currentPhotos = order.fotosLista || [];
    if (currentPhotos.length + files.length > 4) {
      toast({
        title: 'Error',
        description: 'Solo puedes subir hasta 4 fotos en total',
        variant: 'destructive'
      });
      return;
    }

    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Error',
          description: 'Por favor selecciona solo imágenes válidas',
          variant: 'destructive'
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const updatedPhotos = [...(order.fotosLista || []), reader.result as string];
        onUpdateOrder(order.id, { fotosLista: updatedPhotos });
        toast({
          title: 'Foto cargada',
          description: 'La foto de lista se ha guardado correctamente'
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddLinkImpresion = () => {
    if (!linkImpresion.trim()) return;
    
    const newLink = {
      url: linkImpresion,
      descripcion: descripcionLink || 'Sin descripción'
    };
    
    const currentLinks = order.archivosImpresion || [];
    onUpdateOrder(order.id, { 
      archivosImpresion: [...currentLinks, JSON.stringify(newLink)] 
    });
    
    setLinkImpresion('');
    setDescripcionLink('');
    toast({
      title: 'Link añadido',
      description: 'El link de impresión se ha guardado correctamente'
    });
  };

  const removeFile = (type: 'fotoLista' | 'archivoImpresion', index?: number) => {
    if (type === 'fotoLista' && index !== undefined) {
      const currentPhotos = order.fotosLista || [];
      onUpdateOrder(order.id, { fotosLista: currentPhotos.filter((_, i) => i !== index) });
    } else if (type === 'archivoImpresion' && index !== undefined) {
      const currentFiles = order.archivosImpresion || [];
      onUpdateOrder(order.id, { archivosImpresion: currentFiles.filter((_, i) => i !== index) });
    }
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Detalles del Pedido
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del Pedido */}
          <div className="p-4 bg-muted/30 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{order.nombrePedido}</h3>
              {getStatusBadge(order.status)}
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Fecha de Creación</p>
                  <p className="font-medium">
                    {order.fechaCreacion.toLocaleString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Entrega Estimada</p>
                  <p className="font-medium">
                    {order.fechaEntregaEstimada.toLocaleString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-border">
              <p className="text-muted-foreground text-sm">Tiempo Total</p>
              <p className="text-xl font-bold font-mono">{formatTime(order.tiempoTotal)}</p>
            </div>
          </div>

          {/* Información del Cliente */}
          {cliente && (
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Información del Cliente
                </h3>
                <Button
                  size="sm"
                  variant="default"
                  className="gap-2"
                  onClick={() => window.open(`https://wa.me/${cliente.celular.replace(/\D/g, '')}`, '_blank')}
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Nombre</p>
                  <p className="font-medium">{cliente.nombre}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Teléfono</p>
                    <p className="font-medium">{cliente.celular}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Distrito</p>
                    <p className="font-medium">{cliente.distrito}</p>
                  </div>
                </div>
                
                {cliente.descripcion && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Descripción del Cliente</p>
                    <p className="font-medium">{cliente.descripcion}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Prendas del Pedido */}
          <div className="p-4 bg-muted/30 rounded-lg space-y-2">
            <h3 className="font-semibold">Prendas del Pedido</h3>
            <p className="text-sm">{formatItemsDisplay(order.items)}</p>
          </div>

          {/* Diseñador */}
          {order.diseñador && (
            <div className="p-4 bg-muted/30 rounded-lg space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <User className="w-4 h-4" />
                Diseñador Asignado
              </h3>
              <p className="font-medium">{order.diseñador}</p>
            </div>
          )}

          {/* Descripción del Pedido */}
          <div className="p-4 bg-muted/30 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Descripción del Pedido
              </h3>
              {!isEditing && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="w-3 h-3 mr-1" />
                  Editar
                </Button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-3">
                <Textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Añade detalles sobre el pedido..."
                  rows={4}
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setDescripcion(order.descripcionPedido || '');
                      setIsEditing(false);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={handleSaveDescripcion}>
                    Guardar
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {order.descripcionPedido || 'Sin descripción'}
              </p>
            )}
          </div>

          {/* Archivos */}
          <div className="p-4 bg-muted/30 rounded-lg space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Archivos
            </h3>

            {/* Fotos de Lista */}
            <div className="space-y-2">
              <Label>Fotos de Lista del Pedido (hasta 4 fotos)</Label>
              {order.fotosLista && order.fotosLista.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {order.fotosLista.map((foto, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={foto} 
                        alt={`Lista del pedido ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border cursor-pointer"
                        onClick={() => setSelectedImageIndex(index)}
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                        <Button
                          size="icon"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedImageIndex(index);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile('fotoLista', index);
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {(!order.fotosLista || order.fotosLista.length < 4) && (
                <>
                  <Label htmlFor="foto-lista" className="cursor-pointer">
                    <div className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg hover:bg-muted/50 transition-colors">
                      <Upload className="w-4 h-4" />
                      <span className="text-sm">
                        Subir fotos ({order.fotosLista?.length || 0}/4)
                      </span>
                    </div>
                  </Label>
                  <Input
                    id="foto-lista"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      handleFileUpload(e.target.files);
                      e.target.value = '';
                    }}
                  />
                </>
              )}
            </div>

            {/* Archivos de Impresión - Links */}
            <div className="space-y-3">
              <Label>Archivos para Impresión</Label>
              
              {order.archivosImpresion && order.archivosImpresion.length > 0 && (
                <div className="space-y-2 mb-3">
                  {order.archivosImpresion.map((archivoStr, index) => {
                    try {
                      const archivo = JSON.parse(archivoStr);
                      return (
                        <div key={index} className="flex items-center gap-2 p-3 border rounded-lg bg-card">
                          <div className="flex-1">
                            <a 
                              href={archivo.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:underline font-medium text-sm break-all"
                            >
                              {archivo.url}
                            </a>
                            <p className="text-xs text-muted-foreground mt-1">{archivo.descripcion}</p>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeFile('archivoImpresion', index)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    } catch (error) {
                      return null;
                    }
                  })}
                </div>
              )}

              <div className="space-y-3 p-4 border-2 border-dashed rounded-lg">
                <div>
                  <Label htmlFor="link-impresion">Link del Archivo</Label>
                  <Input
                    id="link-impresion"
                    value={linkImpresion}
                    onChange={(e) => setLinkImpresion(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="descripcion-link">Descripción</Label>
                  <Input
                    id="descripcion-link"
                    value={descripcionLink}
                    onChange={(e) => setDescripcionLink(e.target.value)}
                    placeholder="Ej: Diseño frontal, Logo grande, etc."
                    className="mt-1"
                  />
                </div>
                <Button 
                  onClick={handleAddLinkImpresion} 
                  disabled={!linkImpresion.trim()}
                  className="w-full"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Añadir Link
                </Button>
              </div>
            </div>
          </div>

          {/* Image View Dialog */}
          <Dialog open={imageViewOpen} onOpenChange={setImageViewOpen}>
            <DialogContent className="max-w-6xl">
              <DialogHeader>
                <DialogTitle>Fotos de Lista del Pedido</DialogTitle>
              </DialogHeader>
              {order.fotosLista && order.fotosLista.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  {order.fotosLista.map((foto, index) => (
                    <img 
                      key={index}
                      src={foto} 
                      alt={`Lista del pedido ${index + 1}`}
                      className="w-full h-auto max-h-[70vh] object-contain rounded-lg border"
                    />
                  ))}
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Estado de Procesos */}
          <div className="p-4 bg-muted/30 rounded-lg space-y-3">
            <h3 className="font-semibold">Estado de Procesos</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {Object.entries(order.procesos).map(([key, proc]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${proc.completado ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="capitalize">{key}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};