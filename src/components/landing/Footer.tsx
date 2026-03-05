import Logo from "./Logo";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <Logo size="sm" className="[&_span]:text-background [&_.text-accent]:text-accent mb-4" />
            <p className="text-sm text-background/60">
              Motor estratégico de análisis de licitaciones con IA sectorial. 
              Simulación, scoring y generación de memoria técnica.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm">Plataforma</h4>
            <ul className="space-y-2 text-sm text-background/60">
              <li><a href="#features" className="hover:text-background transition-colors">Funcionalidades</a></li>
              <li><a href="#sectors" className="hover:text-background transition-colors">Sectores</a></li>
              <li><a href="#pricing" className="hover:text-background transition-colors">Planes</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Documentación</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm">Empresa</h4>
            <ul className="space-y-2 text-sm text-background/60">
              <li><a href="#" className="hover:text-background transition-colors">Sobre nosotros</a></li>
              <li><a href="#contact" className="hover:text-background transition-colors">Contacto</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Blog</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm">Legal</h4>
            <ul className="space-y-2 text-sm text-background/60">
              <li><a href="#" className="hover:text-background transition-colors">Privacidad</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Términos</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Cookies</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-background/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-background/40">
          <span>© {new Date().getFullYear()} PLIEGO SMART. Todos los derechos reservados.</span>
          <span>Argentina · España · LATAM · UE</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
