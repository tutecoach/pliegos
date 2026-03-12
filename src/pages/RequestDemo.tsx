import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import Logo from "@/components/landing/Logo";
import { CheckCircle } from "lucide-react";

const RequestDemo = () => {
  const [companyName, setCompanyName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();
  const { language } = useLanguage();

  const copy = language === "en"
    ? {
        sideTitle: "Request a Demo",
        sideDesc: "Tell us about your company and we'll contact you to schedule a personalized demo of PliegoSmart.",
        title: "Request Demo",
        subtitle: "Fill out the form and our team will contact you shortly",
        company: "Company name",
        companyPh: "Your Company Ltd.",
        name: "Full name",
        namePh: "John Smith",
        email: "Corporate email",
        emailPh: "you@company.com",
        phone: "Phone (optional)",
        phonePh: "+1 555 123 4567",
        message: "Message (optional)",
        messagePh: "Tell us about your needs...",
        submit: "Send Request",
        sending: "Sending...",
        login: "Already have an account?",
        loginLink: "Log in",
        successTitle: "Request Sent!",
        successDesc: "Our team will contact you within 24-48 hours to schedule your demo.",
        backHome: "Back to home",
      }
    : {
        sideTitle: "Solicitar una Demo",
        sideDesc: "Cuéntanos sobre tu empresa y te contactaremos para agendar una demostración personalizada de PliegoSmart.",
        title: "Solicitar Demo",
        subtitle: "Completa el formulario y nuestro equipo te contactará a la brevedad",
        company: "Nombre de la empresa",
        companyPh: "Tu Empresa S.L.",
        name: "Nombre completo",
        namePh: "Juan García",
        email: "Email corporativo",
        emailPh: "tu@empresa.com",
        phone: "Teléfono (opcional)",
        phonePh: "+54 9 264 555 1234",
        message: "Mensaje (opcional)",
        messagePh: "Cuéntanos sobre tus necesidades...",
        submit: "Enviar Solicitud",
        sending: "Enviando...",
        login: "¿Ya tienes cuenta?",
        loginLink: "Iniciar sesión",
        successTitle: "¡Solicitud Enviada!",
        successDesc: "Nuestro equipo se pondrá en contacto contigo en las próximas 24-48 horas para agendar tu demo.",
        backHome: "Volver al inicio",
      };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !fullName.trim() || !email.trim()) {
      toast({ title: language === "en" ? "Complete all required fields" : "Completa todos los campos obligatorios", variant: "destructive" });
      return;
    }
    setLoading(true);

    const { error } = await supabase
      .from("demo_requests" as any)
      .insert([{ full_name: fullName, company_name: companyName, email, phone: phone || null, message: message || null }] as any);

    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-8">
        <div className="text-center max-w-md space-y-6">
          <CheckCircle size={64} className="mx-auto text-green-500" />
          <h1 className="text-2xl font-bold">{copy.successTitle}</h1>
          <p className="text-muted-foreground">{copy.successDesc}</p>
          <Button asChild>
            <Link to="/">{copy.backHome}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-primary items-center justify-center p-12">
        <div className="max-w-md text-primary-foreground">
          <h2 className="text-3xl font-bold mb-4">{copy.sideTitle}</h2>
          <p className="text-primary-foreground/70 text-lg leading-relaxed">{copy.sideDesc}</p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div>
            <Link to="/"><Logo size="md" /></Link>
            <h1 className="text-2xl font-bold mt-8 mb-2">{copy.title}</h1>
            <p className="text-muted-foreground">{copy.subtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company">{copy.company} *</Label>
              <Input id="company" placeholder={copy.companyPh} value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">{copy.name} *</Label>
              <Input id="name" placeholder={copy.namePh} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{copy.email} *</Label>
              <Input id="email" type="email" placeholder={copy.emailPh} value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{copy.phone}</Label>
              <Input id="phone" type="tel" placeholder={copy.phonePh} value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">{copy.message}</Label>
              <Textarea id="message" placeholder={copy.messagePh} value={message} onChange={(e) => setMessage(e.target.value)} rows={3} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? copy.sending : copy.submit}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {copy.login}{" "}
            <Link to="/login" className="text-accent font-medium hover:underline">{copy.loginLink}</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RequestDemo;
