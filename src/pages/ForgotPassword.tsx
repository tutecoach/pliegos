import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Logo from "@/components/landing/Logo";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <div className="w-full max-w-md space-y-8">
        <div>
          <Link to="/">
            <Logo size="md" />
          </Link>
          <h1 className="text-2xl font-bold mt-8 mb-2">Recuperar Contraseña</h1>
          <p className="text-muted-foreground">
            Te enviaremos un enlace para restablecer tu contraseña.
          </p>
        </div>

        {sent ? (
          <div className="bg-accent/10 border border-accent/20 rounded-lg p-6 text-center">
            <p className="font-medium mb-2">Email enviado</p>
            <p className="text-sm text-muted-foreground">
              Revisa tu bandeja de entrada y sigue las instrucciones.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Enviando..." : "Enviar enlace"}
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground">
          <Link to="/login" className="text-accent font-medium hover:underline">
            Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
