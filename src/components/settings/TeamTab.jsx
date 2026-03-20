import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { useMembership } from '@/lib/MembershipContext';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Users, UserPlus, MoreVertical, Shield, ShieldCheck, Eye, Mail, Trash2, Crown, AlertTriangle, ChevronDown, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Switch } from '@/components/ui/switch';

export default function TeamTab() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { companyId, activeMembership } = useMembership();

  // Permission modules grouped by category
  const PERMISSION_MODULES = [
    {
      key: 'dashboard',
      labelKey: 'settings.team.module.dashboard',
      permissions: [
        { id: 'dashboard_view', labelKey: 'settings.team.perm.dashboard_view' },
        { id: 'dashboard_export', labelKey: 'settings.team.perm.dashboard_export' },
      ]
    },
    {
      key: 'drivers',
      labelKey: 'settings.team.module.drivers',
      permissions: [
        { id: 'drivers_view', labelKey: 'settings.team.perm.drivers_view' },
        { id: 'driver_create', labelKey: 'settings.team.perm.driver_create' },
        { id: 'driver_edit', labelKey: 'settings.team.perm.driver_edit' },
        { id: 'driver_delete', labelKey: 'settings.team.perm.driver_delete' },
        { id: 'driver_status', labelKey: 'settings.team.perm.driver_status' },
        { id: 'driver_export', labelKey: 'settings.team.perm.driver_export' },
        { id: 'driver_tags', labelKey: 'settings.team.perm.driver_tags' },
      ]
    },
    {
      key: 'documents',
      labelKey: 'settings.team.module.documents',
      permissions: [
        { id: 'doc_view', labelKey: 'settings.team.perm.doc_view' },
        { id: 'doc_create', labelKey: 'settings.team.perm.doc_create' },
        { id: 'doc_edit', labelKey: 'settings.team.perm.doc_edit' },
        { id: 'doc_delete', labelKey: 'settings.team.perm.doc_delete' },
      ]
    },
    {
      key: 'comments',
      labelKey: 'settings.team.module.comments',
      permissions: [
        { id: 'comment_view', labelKey: 'settings.team.perm.comment_view' },
        { id: 'comment_create', labelKey: 'settings.team.perm.comment_create' },
        { id: 'comment_edit_own', labelKey: 'settings.team.perm.comment_edit_own' },
        { id: 'comment_delete_any', labelKey: 'settings.team.perm.comment_delete_any' },
      ]
    },
    {
      key: 'settings',
      labelKey: 'settings.team.module.settings',
      permissions: [
        { id: 'settings_profile', labelKey: 'settings.team.perm.settings_profile' },
        { id: 'settings_company', labelKey: 'settings.team.perm.settings_company' },
        { id: 'settings_team', labelKey: 'settings.team.perm.settings_team' },
        { id: 'settings_billing', labelKey: 'settings.team.perm.settings_billing' },
        { id: 'settings_notifications', labelKey: 'settings.team.perm.settings_notifications' },
      ]
    },
  ];

  // State
  const [members, setMembers] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [allRoles, setAllRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [changeRoleDialog, setChangeRoleDialog] = useState({ open: false, member: null });
  const [removeDialog, setRemoveDialog] = useState({ open: false, member: null });
  const [inviteDialog, setInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRoleId, setInviteRoleId] = useState('');
  const [saving, setSaving] = useState(false);
  const [transferOwnershipDialog, setTransferOwnershipDialog] = useState({ open: false, member: null });

  // Roles management
  const [expandedRoles, setExpandedRoles] = useState({});
  const [createRoleDialog, setCreateRoleDialog] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRolePermissions, setNewRolePermissions] = useState([]);
  const [editingRolePermissions, setEditingRolePermissions] = useState({});

  // Load all data on mount
  useEffect(() => {
    if (!companyId) return;
    loadTeamData();
  }, [companyId]);

  async function loadTeamData() {
    try {
      setLoading(true);

      // 1. Fetch all roles (templates + custom for this company)
      const templateRoles = await base44.entities.Role.filter({ is_template: true });
      const customRoles = await base44.entities.Role.filter({ company_id: companyId });
      const roles = [...templateRoles, ...customRoles.filter(cr => !templateRoles.find(tr => tr.id === cr.id))];
      setAllRoles(roles);

      // 2. Fetch memberships for this company
      const memberships = await base44.entities.Membership.filter({ company_id: companyId, status: 'active' });

      // 3. Enrich memberships with denormalized user fields (no User.get() needed)
      const enrichedMembers = memberships.map(membership => {
        const role = roles.find(r => r.id === membership.role_id);
        return {
          membership,
          user_full_name: membership.user_full_name,
          user_email: membership.user_email,
          role,
          isCurrentUser: membership.user_id === currentUser?.id,
        };
      });
      setMembers(enrichedMembers);

      // 4. Fetch pending invitations
      const invitations = await base44.entities.Invitation.filter({ company_id: companyId, status: 'pending' });
      setPendingInvitations(invitations);

    } catch (error) {
      console.error('TeamTab: Failed to load team data', error);
    } finally {
      setLoading(false);
    }
  }

  // Count admins (for guard: cannot remove/downgrade last admin)
  function getAdminCount() {
    const adminRole = allRoles.find(r => r.name === 'admin' && r.is_template);
    if (!adminRole) return 0;
    return members.filter(m => m.membership.role_id === adminRole.id).length;
  }

  // CHANGE ROLE handler
  async function handleChangeRole(newRoleId) {
    const member = changeRoleDialog.member;
    if (!member) return;

    // Guard: cannot change own role
    if (member.isCurrentUser) {
      toast.error(t('settings.team.cannotChangeOwnRole'));
      return;
    }

    // Guard: cannot change owner's role
    if (member.membership.is_owner) {
      toast.error(t('settings.team.cannotChangeOwnerRole'));
      return;
    }

    // Guard: cannot downgrade last admin
    const adminRole = allRoles.find(r => r.name === 'admin' && r.is_template);
    if (member.membership.role_id === adminRole?.id && newRoleId !== adminRole?.id) {
      if (getAdminCount() <= 1) {
        toast.error(t('settings.team.lastAdminWarning'));
        return;
      }
    }

    try {
      setSaving(true);
      await base44.entities.Membership.update(member.membership.id, { role_id: newRoleId });
      setChangeRoleDialog({ open: false, member: null });
      toast.success(t('settings.team.roleChanged'));
      await loadTeamData();
    } catch (err) {
      console.error('Failed to change role', err);
      toast.error(t('toasts.save_error'));
    } finally {
      setSaving(false);
    }
  }

  // REMOVE MEMBER handler
  async function handleRemoveMember() {
    const member = removeDialog.member;
    if (!member) return;

    // Guard: cannot remove owner
    if (member.membership.is_owner) {
      toast.error(t('settings.team.cannotRemoveOwner'));
      return;
    }

    // Guard: cannot remove last admin
    const adminRole = allRoles.find(r => r.name === 'admin' && r.is_template);
    if (member.membership.role_id === adminRole?.id && getAdminCount() <= 1) {
      toast.error(t('settings.team.lastAdminWarning'));
      return;
    }

    try {
      setSaving(true);
      await base44.entities.Membership.delete(member.membership.id);
      setRemoveDialog({ open: false, member: null });
      toast.success(t('settings.team.memberRemoved'));
      await loadTeamData();
    } catch (err) {
      console.error('Failed to remove member', err);
      toast.error(t('toasts.save_error'));
    } finally {
      setSaving(false);
    }
  }

  // INVITE handler
  async function handleInvite() {
    if (!inviteEmail || !inviteRoleId) return;

    // Guard: check if already a member
    const existingMember = members.find(m => m.user_email === inviteEmail);
    if (existingMember) {
      toast.error(t('settings.team.alreadyMember'));
      return;
    }

    // Guard: check if already invited
    const existingInvite = pendingInvitations.find(i => i.email === inviteEmail);
    if (existingInvite) {
      toast.error(t('settings.team.alreadyInvited'));
      return;
    }

    try {
      setSaving(true);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await base44.entities.Invitation.create({
        email: inviteEmail,
        company_id: companyId,
        role_id: inviteRoleId,
        invited_by: currentUser?.id,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
      });

      setInviteDialog(false);
      setInviteEmail('');
      setInviteRoleId('');
      toast.success(t('settings.team.inviteSent'));
      await loadTeamData();
    } catch (err) {
      console.error('Failed to send invite', err);
      toast.error(t('toasts.save_error'));
    } finally {
      setSaving(false);
    }
  }

  // TRANSFER OWNERSHIP handler
  async function handleTransferOwnership() {
    const member = transferOwnershipDialog.member;
    if (!member) return;
    try {
      setSaving(true);
      await base44.entities.Membership.update(activeMembership.id, { is_owner: false });
      await base44.entities.Membership.update(member.membership.id, { is_owner: true });
      setTransferOwnershipDialog({ open: false, member: null });
      toast.success(t('settings.team.transferSuccess'));
      await loadTeamData();
    } catch (err) {
      console.error('Failed to transfer ownership', err);
      toast.error(t('settings.team.transferError'));
      setTransferOwnershipDialog({ open: false, member: null });
    } finally {
      setSaving(false);
    }
  }

  // REVOKE INVITATION handler
  async function handleRevokeInvitation(invitationId) {
    try {
      await base44.entities.Invitation.delete(invitationId);
      toast.success(t('settings.team.inviteRevoked'));
      await loadTeamData();
    } catch (err) {
      console.error('Failed to revoke invitation', err);
      toast.error(t('toasts.save_error'));
    }
  }

  // Role badge color helper
  function getRoleBadgeVariant(roleName) {
    if (roleName === 'admin') return 'default';
    if (roleName === 'hr') return 'secondary';
    return 'outline';
  }

  // ROLES MANAGEMENT

  function toggleRoleExpanded(roleId) {
    setExpandedRoles(prev => ({ ...prev, [roleId]: !prev[roleId] }));
    const role = allRoles.find(r => r.id === roleId);
    if (role && !role.is_template && !editingRolePermissions[roleId]) {
      setEditingRolePermissions(prev => ({ ...prev, [roleId]: [...(role.permissions || [])] }));
    }
  }

  function togglePermission(roleId, permId) {
    setEditingRolePermissions(prev => {
      const current = prev[roleId] || [];
      if (current.includes(permId)) {
        return { ...prev, [roleId]: current.filter(p => p !== permId) };
      } else {
        return { ...prev, [roleId]: [...current, permId] };
      }
    });
  }

  function toggleNewRolePermission(permId) {
    setNewRolePermissions(prev => {
      if (prev.includes(permId)) return prev.filter(p => p !== permId);
      return [...prev, permId];
    });
  }

  async function handleSaveRolePermissions(roleId) {
    try {
      setSaving(true);
      const perms = editingRolePermissions[roleId] || [];
      await base44.entities.Role.update(roleId, { permissions: perms });
      toast.success(t('settings.team.roleSaved'));
      await loadTeamData();
    } catch (err) {
      console.error('Failed to save role', err);
      toast.error(t('toasts.save_error'));
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateRole() {
    if (!newRoleName.trim()) return;
    try {
      setSaving(true);
      await base44.entities.Role.create({
        name: newRoleName.trim().toLowerCase(),
        permissions: newRolePermissions,
        company_id: companyId,
        is_template: false,
      });
      setCreateRoleDialog(false);
      setNewRoleName('');
      setNewRolePermissions([]);
      toast.success(t('settings.team.roleCreated'));
      await loadTeamData();
    } catch (err) {
      console.error('Failed to create role', err);
      toast.error(t('toasts.save_error'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteRole(roleId) {
    const usedBy = members.filter(m => m.membership.role_id === roleId);
    if (usedBy.length > 0) {
      toast.error(t('settings.team.roleInUse'));
      return;
    }
    try {
      setSaving(true);
      await base44.entities.Role.delete(roleId);
      toast.success(t('settings.team.roleDeleted'));
      await loadTeamData();
    } catch (err) {
      console.error('Failed to delete role', err);
      toast.error(t('toasts.save_error'));
    } finally {
      setSaving(false);
    }
  }

  function PermissionGrid({ permissions: rolePerms, onToggle, readOnly }) {
    return (
      <div className="space-y-4 mt-3">
        {PERMISSION_MODULES.map(module => (
          <div key={module.key}>
            <div className="text-sm font-medium text-muted-foreground mb-2">{t(module.labelKey)}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {module.permissions.map(perm => (
                <div key={perm.id} className="flex items-center justify-between py-1 px-2 rounded hover:bg-muted/50">
                  <span className="text-sm">{t(perm.labelKey)}</span>
                  <Switch
                    checked={rolePerms.includes(perm.id)}
                    onCheckedChange={() => onToggle(perm.id)}
                    disabled={readOnly}
                    className="scale-90"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (loading) {
    return <div className="flex justify-center py-8"><div className="text-muted-foreground">{t('common.loading')}</div></div>;
  }

  return (
    <div className="space-y-6">

      {/* === SECTION 1: TEAM MEMBERS === */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('settings.team.membersTitle')}
            </CardTitle>
            <CardDescription>{t('settings.team.membersDesc', { count: members.length })}</CardDescription>
          </div>
          <Button onClick={() => setInviteDialog(true)} size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            {t('settings.team.inviteMember')}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members.map(({ membership, user_full_name, user_email, role, isCurrentUser }) => (
              <div key={membership.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  {/* Avatar (initials) */}
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                    {(user_full_name || user_email || '?').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {user_full_name || user_email}
                      {membership.is_owner && (
                        <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 gap-1">
                          <Crown className="h-3 w-3" />
                          {t('settings.team.owner')}
                        </Badge>
                      )}
                      {isCurrentUser && (
                        <Badge variant="outline" className="text-muted-foreground">{t('settings.team.you')}</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">{user_email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={getRoleBadgeVariant(role?.name)}>
                    {role?.name || 'unknown'}
                  </Badge>

                  {/* Actions dropdown — only visible to admins, not for self or owner */}
                  {!isCurrentUser && !membership.is_owner && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setChangeRoleDialog({ open: true, member: { membership, user_full_name, user_email, role, isCurrentUser } })}>
                          <Shield className="h-4 w-4 mr-2" />
                          {t('settings.team.changeRole')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setRemoveDialog({ open: true, member: { membership, user_full_name, user_email, role, isCurrentUser } })}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t('settings.team.removeMember')}
                        </DropdownMenuItem>
                        {activeMembership?.is_owner && role?.name?.toLowerCase() === 'admin' && !isCurrentUser && (
                          <DropdownMenuItem
                            className="text-amber-600"
                            onClick={() => setTransferOwnershipDialog({ open: true, member: { membership, user_full_name, user_email, role } })}
                          >
                            <Crown className="h-4 w-4 mr-2" />
                            {t('settings.team.transferOwnership')}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* === SECTION 2: PENDING INVITATIONS === */}
      {pendingInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              {t('settings.team.pendingTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingInvitations.map(invitation => {
                const role = allRoles.find(r => r.id === invitation.role_id);
                return (
                  <div key={invitation.id} className="flex items-center justify-between p-3 rounded-lg border border-dashed">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-medium">{invitation.email}</div>
                        <div className="text-sm text-muted-foreground">
                          {t('settings.team.expires')}: {new Date(invitation.expires_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{role?.name || '?'}</Badge>
                      <Button variant="ghost" size="sm" onClick={() => handleRevokeInvitation(invitation.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* === SECTION 3: ROLES OVERVIEW === */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t('settings.team.rolesTitle')}
            </CardTitle>
            <CardDescription>{t('settings.team.rolesDesc')}</CardDescription>
          </div>
          <Button onClick={() => setCreateRoleDialog(true)} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            {t('settings.team.createRole')}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {allRoles.map(role => {
              const isExpanded = expandedRoles[role.id];
              const isTemplate = role.is_template;
              const currentPerms = isTemplate ? (role.permissions || []) : (editingRolePermissions[role.id] || role.permissions || []);
              const hasChanges = !isTemplate && editingRolePermissions[role.id] && 
                JSON.stringify(editingRolePermissions[role.id].sort()) !== JSON.stringify((role.permissions || []).sort());

              return (
                <Collapsible key={role.id} open={isExpanded} onOpenChange={() => toggleRoleExpanded(role.id)}>
                  <div className="border rounded-lg">
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                          <span className="font-medium capitalize">{role.name}</span>
                          <Badge variant={isTemplate ? 'secondary' : 'outline'}>
                            {isTemplate ? t('settings.team.templateRole') : t('settings.team.customRole')}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {(role.permissions || []).length} {t('settings.team.permissionsCount')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {!isTemplate && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); handleDeleteRole(role.id); }}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                          <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-4 pb-4 border-t">
                        {isTemplate && (
                          <p className="text-xs text-muted-foreground mt-3 mb-1">{t('settings.team.templateReadOnly')}</p>
                        )}
                        <PermissionGrid
                          permissions={currentPerms}
                          onToggle={(permId) => togglePermission(role.id, permId)}
                          readOnly={isTemplate}
                        />
                        {!isTemplate && hasChanges && (
                          <div className="flex justify-end mt-4">
                            <Button size="sm" onClick={() => handleSaveRolePermissions(role.id)} disabled={saving}>
                              {t('settings.team.savePermissions')}
                            </Button>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* === DIALOGS === */}

      {/* Change Role Dialog */}
      <Dialog open={changeRoleDialog.open} onOpenChange={(open) => !open && setChangeRoleDialog({ open: false, member: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('settings.team.changeRoleTitle')}</DialogTitle>
            <DialogDescription>
              {t('settings.team.changeRoleDesc', { name: changeRoleDialog.member?.user_full_name || '' })}
            </DialogDescription>
          </DialogHeader>
          <Select onValueChange={handleChangeRole} disabled={saving}>
            <SelectTrigger>
              <SelectValue placeholder={t('settings.team.selectRole')} />
            </SelectTrigger>
            <SelectContent>
              {allRoles.map(role => (
                <SelectItem key={role.id} value={role.id}>
                  {role.name} ({(role.permissions || []).length} {t('settings.team.permissionsCount')})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </DialogContent>
      </Dialog>

      {/* Remove Member Dialog */}
      <Dialog open={removeDialog.open} onOpenChange={(open) => !open && setRemoveDialog({ open: false, member: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {t('settings.team.removeTitle')}
            </DialogTitle>
            <DialogDescription>
              {t('settings.team.removeDesc', { name: removeDialog.member?.user_full_name || '' })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveDialog({ open: false, member: null })}>{t('common.cancel')}</Button>
            <Button variant="destructive" onClick={handleRemoveMember} disabled={saving}>{t('settings.team.confirmRemove')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Dialog */}
      <Dialog open={inviteDialog} onOpenChange={setInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('settings.team.inviteTitle')}</DialogTitle>
            <DialogDescription>{t('settings.team.inviteDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('settings.team.inviteEmail')}</Label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </div>
            <div>
              <Label>{t('settings.team.inviteRole')}</Label>
              <Select value={inviteRoleId} onValueChange={setInviteRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('settings.team.selectRole')} />
                </SelectTrigger>
                <SelectContent>
                  {allRoles.map(role => (
                    <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialog(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleInvite} disabled={saving || !inviteEmail || !inviteRoleId}>
              <UserPlus className="h-4 w-4 mr-2" />
              {t('settings.team.sendInvite')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Ownership Dialog */}
      <Dialog open={transferOwnershipDialog.open} onOpenChange={(open) => !open && setTransferOwnershipDialog({ open: false, member: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              {t('settings.team.transferOwnership')}
            </DialogTitle>
            <DialogDescription>
              {t('settings.team.transferOwnershipDesc', { name: transferOwnershipDialog.member?.user_full_name || '' })}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
            {t('settings.team.transferOwnershipWarning')}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferOwnershipDialog({ open: false, member: null })}>{t('common.cancel')}</Button>
            <Button
              onClick={handleTransferOwnership}
              disabled={saving}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              <Crown className="h-4 w-4 mr-2" />
              {t('settings.team.confirmTransfer')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Role Dialog */}
      <Dialog open={createRoleDialog} onOpenChange={setCreateRoleDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('settings.team.createRoleTitle')}</DialogTitle>
            <DialogDescription>{t('settings.team.createRoleDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('settings.team.roleName')}</Label>
              <Input
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder={t('settings.team.roleNamePlaceholder')}
              />
            </div>
            <PermissionGrid
              permissions={newRolePermissions}
              onToggle={toggleNewRolePermission}
              readOnly={false}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateRoleDialog(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleCreateRole} disabled={saving || !newRoleName.trim()}>
              {t('settings.team.createRole')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}