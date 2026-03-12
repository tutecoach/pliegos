import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Loader2, MessageSquare } from "lucide-react";
import { format } from "date-fns";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pendiente", variant: "secondary" as const },
  { value: "contacted", label: "Contactado", variant: "default" as const },
  { value: "approved", label: "Aprobado", variant: "default" as const },
  { value: "rejected", label: "Rechazado", variant: "destructive" as const },
];

const getStatusBadge = (status: string) => {
  const opt = STATUS_OPTIONS.find(o => o.value === status);
  if (!opt) return <Badge variant="secondary">{status}</Badge>;
  return <Badge variant={opt.variant}>{opt.label}</Badge>;
};

const DemoRequestsManagement = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("demo_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Error al cargar solicitudes", description: error.message, variant: "destructive" });
    } else {
      setRequests(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    const { error } = await supabase.from("demo_requests").update({ status: newStatus }).eq("id", id);
    setUpdatingId(null);
    if (error) {
      toast({ title: "Error al actualizar", description: error.message, variant: "destructive" });
    } else {
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
      toast({ title: "Estado actualizado" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare size={20} /> Solicitudes de Demo
        </CardTitle>
        <CardDescription>Gestiona las solicitudes de demo recibidas</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
        ) : requests.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No hay solicitudes de demo</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {format(new Date(r.created_at), "dd/MM/yyyy HH:mm")}
                    </TableCell>
                    <TableCell className="font-medium">{r.full_name}</TableCell>
                    <TableCell>{r.company_name}</TableCell>
                    <TableCell className="text-xs">{r.email}</TableCell>
                    <TableCell className="text-xs">{r.phone || "—"}</TableCell>
                    <TableCell>
                      {updatingId === r.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Select value={r.status} onValueChange={v => updateStatus(r.id, v)}>
                          <SelectTrigger className="w-[140px] h-8 text-xs">
                            <SelectValue>{getStatusBadge(r.status)}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map(o => (
                              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DemoRequestsManagement;
