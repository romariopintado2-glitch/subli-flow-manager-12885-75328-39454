import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PasswordProtectProps {
  isAuthenticated: boolean;
  isLoading: boolean;
  onAuthenticate: (password: string) => boolean;
  onLogout: () => void;
  children: React.ReactNode;
}

export const PasswordProtect = ({ 
  isAuthenticated, 
  isLoading, 
  onAuthenticate, 
  onLogout,
  children 
}: PasswordProtectProps) => {
  const [password, setPassword] = useState('');
  const { toast } = useToast();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const success = onAuthenticate(password);
      if (success) {
        toast({
          title: "Acceso concedido",
          description: "Has ingresado correctamente"
        });
        setPassword('');
      } else {
        toast({
          title: "Contraseña incorrecta",
          description: "Por favor, intenta de nuevo",
          variant: "destructive"
        });
        setPassword('');
      }
    };

    return (
      <div className="flex items-center justify-center py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Lock className="w-12 h-12 text-primary" />
            </div>
            <CardTitle>Acceso Protegido</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  type="password"
                  placeholder="Ingresa la contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-center"
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full">
                Ingresar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onLogout}
          className="flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Cerrar Sesión
        </Button>
      </div>
      {children}
    </div>
  );
};
