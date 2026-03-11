import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Logo from "@/components/landing/Logo";

const Register = () => {
  const [companyName, setCompanyName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !fullName.trim()) {
      toast({ title: "Completa todos los campos", variant: "destructive" });
      return;
    }
    setLoading(true);

    // 1. Sign up user first (trigger creates profile automatically)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName, company_name: companyName },
      },
    });

    if (authError) {
      toast({ title: "Error al registrar", description: authError.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    if (authData.user) {
      if (!authData.session) {
        toast({
          title: "Revisa tu correo",
          description: "Confirma tu email para activar la cuenta y luego inicia sesión.",
        });
        navigate("/login");
        setLoading(false);
        return;
      }

      const newCompanyId = crypto.randomUUID();
      const { error: companyError } = await supabase
        .from("companies")
        .insert({ id: newCompanyId, name: companyName });

      if (companyError) {
        console.error("Company creation error:", companyError);
        toast({ title: "Cuenta creada", description: "Configura tu empresa desde el perfil." });
      } else {
        const { data: updatedProfile, error: profileUpdateError } = await supabase
          .from("profiles")
          .update({ company_id: newCompanyId, full_name: fullName })
          .eq("user_id", authData.user.id)
          .select("id")
          .maybeSingle();

        if (profileUpdateError) {
          console.error("Profile update error:", profileUpdateError);
        } else if (!updatedProfile) {
          await supabase.from("profiles").insert({
            user_id: authData.user.id,
            full_name: fullName,
            company_id: newCompanyId,
          });
        }
      }

      toast({ title: "¡Registro exitoso!", description: "Ya puedes acceder a tu cuenta." });
      navigate("/dashboard");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-primary items-center justify-center p-12">
        <div className="max-w-md text-primary-foreground">
          <h2 className="text-3xl font-bold mb-4">Registra tu empresa</h2>
          <p className="text-primary-foreground/70 text-lg leading-relaxed">
            Crea tu cuenta corporativa y empieza a analizar pliegos de licitaciones
            con inteligencia artificial en minutos.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div>
            <Link to="/"><Logo size="md" /></Link>
            <h1 className="text-2xl font-bold mt-8 mb-2">Crear Cuenta</h1>
            <p className="text-muted-foreground">Registra tu empresa para comenzar</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company">Nombre de la empresa</Label>
              <Input id="company" placeholder="Tu Empresa S.L." value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <Input id="name" placeholder="Juan García" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email corporativo</Label>
              <Input id="email" type="email" placeholder="tu@empresa.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creando cuenta..." : "Registrar Empresa"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className="text-accent font-medium hover:underline">Iniciar sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
