'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Users, Plus, Shield, ShieldCheck, Wrench, Eye, Loader2, UserCog, Trash2, Power, PowerOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UsersPanelProps {
  onCreateUser: () => void;
}

const roleConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  admin: { label: 'Administrador', color: 'bg-red-100 text-red-700 border-red-200', icon: ShieldCheck },
  manager: { label: 'Jefe Mant.', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Shield },
  technician: { label: 'Técnico', color: 'bg-sky-100 text-sky-700 border-sky-200', icon: Wrench },
  viewer: { label: 'Observador', color: 'bg-zinc-100 text-zinc-600 border-zinc-200', icon: Eye },
};

export function UsersPanel({ onCreateUser }: UsersPanelProps) {
  const { data: session } = useSession();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState<UserData | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const userRole = (session?.user as any)?.role;
  const isAdmin = userRole === 'admin';

  const fetchUsers = useCallback(() => {
    fetch('/api/users')
      .then(r => {
        if (!r.ok) throw new Error('Error');
        return r.json();
      })
      .then(data => { setUsers(data); setLoading(false); })
      .catch(() => {
        setLoading(false);
        toast({ title: 'Error', description: 'No se pudieron cargar los usuarios', variant: 'destructive' });
      });
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleActive = async (user: UserData) => {
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !user.active }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error');
      }
      toast({
        title: user.active ? 'Usuario desactivado' : 'Usuario activado',
        description: `${user.name} ha sido ${user.active ? 'desactivado' : 'activado'}`,
      });
      fetchUsers();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (user: UserData) => {
    if (!confirm(`¿Desactivar al usuario ${user.name}?`)) return;
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error');
      }
      toast({ title: 'Usuario desactivado', description: `${user.name} ha sido desactivado` });
      fetchUsers();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleEditOpen = (user: UserData) => {
    setEditUser(user);
    setEditName(user.name);
    setEditRole(user.role);
    setEditPassword('');
    setEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      const body: Record<string, any> = { name: editName };
      if (isAdmin) body.role = editRole;
      if (editPassword) body.password = editPassword;

      const res = await fetch(`/api/users/${editUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error');
      }
      toast({ title: 'Usuario actualizado', description: `${editName} ha sido actualizado` });
      setEditDialogOpen(false);
      fetchUsers();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Usuarios</h1>
          <p className="text-sm text-zinc-500 mt-1">Gestión de usuarios del sistema</p>
        </div>
        {isAdmin && (
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={onCreateUser}>
            <Plus className="h-4 w-4 mr-1.5" />
            Nuevo Usuario
          </Button>
        )}
      </div>

      {users.length === 0 ? (
        <div className="text-center py-12 text-zinc-400">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No hay usuarios registrados</p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((user) => {
            const config = roleConfig[user.role] || roleConfig.viewer;
            const RoleIcon = config.icon;
            return (
              <Card key={user.id} className="border border-zinc-200 hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${user.active ? 'bg-zinc-100' : 'bg-zinc-50 opacity-60'}`}>
                        <RoleIcon className={`h-4 w-4 ${user.active ? 'text-zinc-600' : 'text-zinc-400'}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium truncate ${user.active ? 'text-zinc-900' : 'text-zinc-400'}`}>
                            {user.name}
                          </p>
                          {!user.active && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-zinc-300 text-zinc-400">
                              Inactivo
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className={`text-[11px] ${config.color}`}>
                        {config.label}
                      </Badge>
                      {isAdmin && (
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => handleEditOpen(user)}
                            title="Editar usuario"
                          >
                            <UserCog className="h-4 w-4 text-zinc-500" />
                          </Button>
                          {user.active ? (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => handleToggleActive(user)}
                              title="Desactivar usuario"
                            >
                              <PowerOff className="h-4 w-4 text-amber-500" />
                            </Button>
                          ) : (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => handleToggleActive(user)}
                              title="Activar usuario"
                            >
                              <Power className="h-4 w-4 text-emerald-500" />
                            </Button>
                          )}
                          {(session?.user as any)?.id !== user.id && user.active && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => handleDelete(user)}
                              title="Desactivar usuario"
                            >
                              <Trash2 className="h-4 w-4 text-red-400" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nombre</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            {isAdmin && (
              <div className="space-y-2">
                <Label htmlFor="edit-role">Rol</Label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger id="edit-role">
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="manager">Jefe de Mantenimiento</SelectItem>
                    <SelectItem value="technician">Técnico</SelectItem>
                    <SelectItem value="viewer">Observador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit-password">Nueva Contraseña (dejar vacío para no cambiar)</Label>
              <Input
                id="edit-password"
                type="password"
                placeholder="••••••••"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleEditSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
