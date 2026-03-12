import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Loader2, MessageSquare, CheckCircle, Eye, Trash2 } from "lucide-react";
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

type DemoRequest = {
  id: string;
  full_name: string;
  company_name: string;
  email: string;
  phone: string | null;
  message: string | null;
  status: string;
  created_at: string;
};

const DemoRequestsManagement = () => {
  const [requests, setRequests] = useState<DemoRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Approve dialog
  const [approveRequest, setApproveRequest] = useState<DemoRequest | null>(null);
  const [approvePassword, setApprovePassword] = useState("");
  const [approveDays, setApproveDays] = useState("30");
  const [approving, setApproving] = useState(false);

  // Detail dialog
  const [detailRequest, setDetailRequest] = useState<DemoRequest | null>(null);

  // Delete confirm
  const [deleteRequest, setDeleteRequest] = useState<DemoRequest | null>(null);
  const [deletingDemo, setDeletingDemo] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("demo_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Error al cargar solicitudes", description: error.message, variant: "destructive" });
    } else {
      setRequests((data as DemoRequest[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const updateStatus = async (id: string, newStatus: string) => {
    if (newStatus === "approved") {
      const req = requests.find(r => r.id === id);
      if (req) {
        setApproveRequest(req);
        setApprovePassword("");
        setApproveDays("30");
        return;
      }
    }

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

  const handleApproveDemo = async () => {
    if (!approveRequest) return;
    if (!approvePassword || approvePassword.length < 6) {
      toast({ title: "La contraseña debe tener al menos 6 caracteres", variant: "destructive" });
      return;
    }

    setApproving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const res = await supabase.functions.invoke("manage-company-users", {
        body: {
          action: "create-demo-user",
          email: approveRequest.email,
          fullName: approveRequest.full_name,
          companyName: approveRequest.company_name,
          password: approvePassword,
          demoDays: parseInt(approveDays) || 30,
          demoRequestId: approveRequest.id,
        },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.error) {
        let msg = res.error.message;
        const ctx = (res.error as any)?.context;
        if (ctx instanceof Response) {
          try { const p = await ctx.clone().json(); if (p?.error) msg = String(p.error); } catch { /* noop */ }
        }
        throw new Error(msg);
      }
      if (res.data?.error) throw new Error(res.data.error);

      const expiresAt = res.data?.demo_expires_at
        ? format(new Date(res.data.demo_expires_at), "dd/MM/yyyy")
        : `${approveDays} días`;

      toast({
        title: "Demo aprobada",
        description: `Cuenta creada para ${approveRequest.email}. Acceso hasta ${expiresAt}.`,
      });

      setApproveRequest(null);
      setRequests(prev => prev.map(r => r.id === approveRequest.id ? { ...r, status: "approved" } : r));
    } catch (err: any) {
      toast({ title: "Error al aprobar demo", description: err.message, variant: "destructive" });
    } finally {
      setApproving(false);
    }
  };

  const handleDeleteDemo = async () => {
    if (!deleteRequest) return;
    setDeletingDemo(true);
    const { error } = await supabase.from("demo_requests").delete().eq("id", deleteRequest.id);
    setDeletingDemo(false);
    if (error) {
      toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
    } else {
      setRequests(prev => prev.filter(r => r.id !== deleteRequest.id));
      toast({ title: "Solicitud eliminada" });
      setDeleteRequest(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare size={20} /> Solicitudes de Demo
          </CardTitle>
          <CardDescription>Gestiona las solicitudes de demo. Al aprobar se crea la cuenta con acceso Professional por tiempo limitado.</CardDescription>
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
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
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
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setDetailRequest(r)} title="Ver detalle">
                            <Eye size={14} />
                          </Button>
                          {r.status !== "approved" && (
                            <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => {
                              setApproveRequest(r); setApprovePassword(""); setApproveDays("30");
                            }}>
                              <CheckCircle size={14} /> Aprobar
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteRequest(r)} title="Eliminar">
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approve Demo Dialog */}
      <Dialog open={!!approveRequest} onOpenChange={open => { if (!open) setApproveRequest(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Aprobar Demo</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Se creará una cuenta con plan <strong>Professional</strong> para <strong>{approveRequest?.email}</strong> en la empresa <strong>{approveRequest?.company_name}</strong>.
          </p>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Contraseña para la cuenta *</Label>
              <Input type="password" placeholder="Mínimo 6 caracteres" value={approvePassword} onChange={e => setApprovePassword(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Duración del acceso (días)</Label>
              <Select value={approveDays} onValueChange={setApproveDays}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 días</SelectItem>
                  <SelectItem value="14">14 días</SelectItem>
                  <SelectItem value="30">30 días</SelectItem>
                  <SelectItem value="60">60 días</SelectItem>
                  <SelectItem value="90">90 días</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleApproveDemo} disabled={approving}>
              {approving ? <Loader2 size={14} className="animate-spin mr-1" /> : <CheckCircle size={14} className="mr-1" />}
              Aprobar y crear cuenta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detailRequest} onOpenChange={open => { if (!open) setDetailRequest(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Detalle de Solicitud</DialogTitle></DialogHeader>
          {detailRequest && (
            <div className="space-y-3 text-sm">
              <div><span className="font-medium">Nombre:</span> {detailRequest.full_name}</div>
              <div><span className="font-medium">Empresa:</span> {detailRequest.company_name}</div>
              <div><span className="font-medium">Email:</span> {detailRequest.email}</div>
              <div><span className="font-medium">Teléfono:</span> {detailRequest.phone || "—"}</div>
              <div><span className="font-medium">Fecha:</span> {format(new Date(detailRequest.created_at), "dd/MM/yyyy HH:mm")}</div>
              <div><span className="font-medium">Estado:</span> {getStatusBadge(detailRequest.status)}</div>
              {detailRequest.message && (
                <div>
                  <span className="font-medium">Mensaje:</span>
                  <p className="mt-1 p-3 bg-muted rounded-md text-muted-foreground">{detailRequest.message}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cerrar</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Demo Confirm Dialog */}
      <Dialog open={!!deleteRequest} onOpenChange={open => { if (!open) setDeleteRequest(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Eliminar solicitud</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Estás seguro de que querés eliminar la solicitud de <strong>{deleteRequest?.full_name}</strong> ({deleteRequest?.email})? Esta acción no se puede deshacer.
          </p>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button variant="destructive" onClick={handleDeleteDemo} disabled={deletingDemo}>
              {deletingDemo ? <Loader2 size={14} className="animate-spin mr-1" /> : <Trash2 size={14} className="mr-1" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DemoRequestsManagement;
