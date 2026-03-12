import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Loader2, UserPlus, Pencil, Users, Trash2, KeyRound } from "lucide-react";

type CompanyUser = {
  user_id: string;
  full_name: string;
  email: string;
  plan_tier: string;
  role: string;
  created_at: string;
  demo_expires_at: string | null;
};

const PLAN_OPTIONS = [
  { value: "starter", label: "Starter" },
  { value: "professional", label: "Professional" },
  { value: "enterprise", label: "Enterprise" },
];

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "user", label: "Usuario Técnico" },
];

const UserManagement = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editUser, setEditUser] = useState<CompanyUser | null>(null);
  const [saving, setSaving] = useState(false);

  // Invite form
  const [invEmail, setInvEmail] = useState("");
  const [invName, setInvName] = useState("");
  const [invPlan, setInvPlan] = useState("starter");
  const [invRole, setInvRole] = useState("user");
  const [invPassword, setInvPassword] = useState("");

  // Edit form
  const [editName, setEditName] = useState("");
  const [editPlan, setEditPlan] = useState("");
  const [editRole, setEditRole] = useState("");

  // Password change
  const [passwordUser, setPasswordUser] = useState<CompanyUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Delete confirm
  const [deleteUser, setDeleteUser] = useState<CompanyUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  const callManage = useCallback(async (body: Record<string, unknown>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("No session");

    const res = await supabase.functions.invoke("manage-company-users", {
      body,
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (res.error) {
      let parsedMessage = res.error.message;
      const ctx = (res.error as any)?.context;
      if (ctx instanceof Response) {
        try { const p = await ctx.clone().json(); if (p?.error) parsedMessage = String(p.error); } catch { /* noop */ }
      } else if (typeof ctx === "string") {
        try { const p = JSON.parse(ctx); if (p?.error) parsedMessage = String(p.error); } catch { /* noop */ }
      } else if (ctx && typeof ctx === "object" && "error" in ctx) {
        parsedMessage = String((ctx as { error: unknown }).error);
      }
      throw new Error(parsedMessage);
    }

    if (res.data?.error) throw new Error(res.data.error);
    return res.data;
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await callManage({ action: "list" });
      setUsers(data.users ?? []);
    } catch (err: any) {
      toast({ title: "Error al cargar usuarios", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [callManage]);

  useEffect(() => {
    if (user) loadUsers();
  }, [user, loadUsers]);

  const handleInvite = async () => {
    if (!invEmail.trim() || !invPassword.trim()) {
      toast({ title: "Email y contraseña son obligatorios", variant: "destructive" });
      return;
    }
    if (invPassword.length < 6) {
      toast({ title: "La contraseña debe tener al menos 6 caracteres", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await callManage({
        action: "invite",
        email: invEmail,
        fullName: invName,
        password: invPassword,
        planTier: invPlan,
        role: invRole,
      });
      toast({ title: "Usuario creado exitosamente", description: `Se creó la cuenta para ${invEmail}` });
      setInviteOpen(false);
      setInvEmail(""); setInvName(""); setInvPassword(""); setInvPlan("starter"); setInvRole("user");
      loadUsers();
    } catch (err: any) {
      const message = String(err?.message || "Error desconocido");
      const friendlyMessage =
        message.includes("ya pertenece a otra empresa")
          ? "Ese email ya está asociado a otra empresa."
          : message.includes("already been registered") || message.includes("email_exists")
            ? "Ese email ya existe. Podés editar el usuario existente."
            : message;
      toast({ title: "Error al crear usuario", description: friendlyMessage, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (u: CompanyUser) => {
    setEditUser(u);
    setEditName(u.full_name || "");
    setEditPlan(u.plan_tier);
    setEditRole(u.role);
  };

  const handleUpdate = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      await callManage({
        action: "update",
        userId: editUser.user_id,
        fullName: editName,
        planTier: editPlan,
        role: editRole,
      });
      toast({ title: "Usuario actualizado" });
      setEditUser(null);
      loadUsers();
    } catch (err: any) {
      toast({ title: "Error al actualizar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordUser) return;
    if (!newPassword || newPassword.length < 6) {
      toast({ title: "La contraseña debe tener al menos 6 caracteres", variant: "destructive" });
      return;
    }
    setChangingPassword(true);
    try {
      await callManage({ action: "update-password", userId: passwordUser.user_id, newPassword });
      toast({ title: "Contraseña actualizada", description: `Se cambió la contraseña de ${passwordUser.email}` });
      setPasswordUser(null);
      setNewPassword("");
    } catch (err: any) {
      toast({ title: "Error al cambiar contraseña", description: err.message, variant: "destructive" });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUser) return;
    setDeleting(true);
    try {
      await callManage({ action: "delete-user", userId: deleteUser.user_id });
      toast({ title: "Usuario eliminado", description: `Se eliminó a ${deleteUser.email}` });
      setDeleteUser(null);
      loadUsers();
    } catch (err: any) {
      toast({ title: "Error al eliminar", description: err.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const planBadgeVariant = (tier: string) => {
    switch (tier) {
      case "enterprise": return "default";
      case "professional": return "secondary";
      default: return "outline";
    }
  };

  const isSelf = (u: CompanyUser) => u.user_id === user?.id;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users size={20} /> Gestión de Usuarios
              </CardTitle>
              <CardDescription>Crea usuarios para tu empresa y gestiona sus roles, planes y contraseñas</CardDescription>
            </div>
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1"><UserPlus size={14} /> Crear usuario</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Crear nuevo usuario</DialogTitle></DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-1">
                    <Label>Email (será el usuario) *</Label>
                    <Input placeholder="usuario@empresa.com" value={invEmail} onChange={e => setInvEmail(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Contraseña *</Label>
                    <Input type="password" placeholder="Mínimo 6 caracteres" value={invPassword} onChange={e => setInvPassword(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Nombre completo</Label>
                    <Input placeholder="Juan García" value={invName} onChange={e => setInvName(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Plan</Label>
                    <Select value={invPlan} onValueChange={setInvPlan}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{PLAN_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Rol</Label>
                    <Select value={invRole} onValueChange={setInvRole}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{ROLE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                  <Button onClick={handleInvite} disabled={saving}>
                    {saving ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
                    Crear usuario
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No hay usuarios registrados.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Demo</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(u => (
                    <TableRow key={u.user_id}>
                      <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                      <TableCell className="text-xs">{u.email}</TableCell>
                      <TableCell>
                        <Badge variant={u.role === "admin" ? "default" : "outline"} className="text-xs">
                          {u.role === "admin" ? "Admin" : "Técnico"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={planBadgeVariant(u.plan_tier) as any} className="text-xs capitalize">{u.plan_tier}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {u.demo_expires_at
                          ? new Date(u.demo_expires_at) < new Date()
                            ? <Badge variant="destructive" className="text-xs">Expirada</Badge>
                            : `Hasta ${new Date(u.demo_expires_at).toLocaleDateString()}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(u)} title="Editar">
                            <Pencil size={14} />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => { setPasswordUser(u); setNewPassword(""); }} title="Cambiar contraseña">
                            <KeyRound size={14} />
                          </Button>
                          {!isSelf(u) && (
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteUser(u)} title="Eliminar">
                              <Trash2 size={14} />
                            </Button>
                          )}
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

      {/* Edit Dialog */}
      <Dialog open={!!editUser} onOpenChange={open => { if (!open) setEditUser(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar usuario</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Email</Label>
              <Input value={editUser?.email || ""} disabled className="bg-muted" />
            </div>
            <div className="space-y-1">
              <Label>Nombre completo</Label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Plan</Label>
              <Select value={editPlan} onValueChange={setEditPlan}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PLAN_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Rol</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ROLE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleUpdate} disabled={saving}>
              {saving ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={!!passwordUser} onOpenChange={open => { if (!open) setPasswordUser(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cambiar contraseña</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Cambiar la contraseña de <strong>{passwordUser?.email}</strong>
          </p>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Nueva contraseña *</Label>
              <Input type="password" placeholder="Mínimo 6 caracteres" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleChangePassword} disabled={changingPassword}>
              {changingPassword ? <Loader2 size={14} className="animate-spin mr-1" /> : <KeyRound size={14} className="mr-1" />}
              Cambiar contraseña
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteUser} onOpenChange={open => { if (!open) setDeleteUser(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Eliminar usuario</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Estás seguro de que querés eliminar a <strong>{deleteUser?.email}</strong>? Esta acción no se puede deshacer.
          </p>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={deleting}>
              {deleting ? <Loader2 size={14} className="animate-spin mr-1" /> : <Trash2 size={14} className="mr-1" />}
              Eliminar usuario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserManagement;
