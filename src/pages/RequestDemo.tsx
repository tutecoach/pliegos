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

          <div className="border-t border-border pt-6 space-y-2 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <a href="https://wa.me/5492645792222" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors inline-flex items-center gap-1">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-green-500"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                +54 9 264 579 2222
              </a>
            </p>
            <p>
              <a href="mailto:cuyotradingsas@gmail.com" className="hover:text-foreground transition-colors">✉️ cuyotradingsas@gmail.com</a>
            </p>
            <p className="text-xs text-muted-foreground/60">{language === "en" ? "Argentina · LATAM · European Union" : "Argentina · LATAM · Unión Europea"}</p>
          </div>

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
