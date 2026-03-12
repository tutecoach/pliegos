import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, signOut } = useAuth();
  const [demoExpired, setDemoExpired] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!user) {
      setChecking(false);
      return;
    }

    const checkExpiration = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("demo_expires_at")
        .eq("user_id", user.id)
        .single();

      if (data?.demo_expires_at) {
        const expires = new Date(data.demo_expires_at);
        if (expires < new Date()) {
          setDemoExpired(true);
        }
      }
      setChecking(false);
    };

    checkExpiration();
  }, [user]);

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (demoExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <AlertTriangle className="mx-auto text-amber-500 mb-2" size={48} />
            <CardTitle>Tu demo ha expirado</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Tu período de prueba ha finalizado. Contactanos para contratar un plan y seguir usando pliegoSmart.
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={signOut}>
                Cerrar sesión
              </Button>
              <Button onClick={() => window.location.href = "/"}>
                Ir al inicio
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
