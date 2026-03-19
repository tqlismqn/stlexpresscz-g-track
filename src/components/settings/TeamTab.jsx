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
import { Users, UserPlus, MoreVertical, Shield, ShieldCheck, Eye, Mail, Trash2, Crown, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function TeamTab() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { companyId, activeMembership } = useMembership();

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

      // 3. For each membership, fetch User and resolve Role name (sequential, NOT Promise.all)
      const enrichedMembers = [];
      for (const membership of memberships) {
        try {
          const user = await base44.entities.User.get(membership.user_id);
          const role = roles.find(r => r.id === membership.role_id);
          enrichedMembers.push({
            membership,
            user,
            role,
            isCurrentUser: membership.user_id === currentUser?.id,
          });
        } catch (err) {
          console.error('Failed to fetch user for membership', membership.id, err);
        }
      }
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
    const existingMember = members.find(m => m.user?.email === inviteEmail);
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
            {members.map(({ membership, user, role, isCurrentUser }) => (
              <div key={membership.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  {/* Avatar (initials) */}
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                    {(user?.display_name || user?.full_name || user?.email || '?').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {user?.display_name || user?.full_name || user?.email}
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
                    <div className="text-sm text-muted-foreground">{user?.email}</div>
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
                        <DropdownMenuItem onClick={() => setChangeRoleDialog({ open: true, member: { membership, user, role, isCurrentUser } })}>
                          <Shield className="h-4 w-4 mr-2" />
                          {t('settings.team.changeRole')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setRemoveDialog({ open: true, member: { membership, user, role, isCurrentUser } })}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t('settings.team.removeMember')}
                        </DropdownMenuItem>
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t('settings.team.rolesTitle')}
          </CardTitle>
          <CardDescription>{t('settings.team.rolesDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {allRoles.map(role => (
              <div key={role.id} className="p-4 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium capitalize">{role.name}</span>
                  <Badge variant={role.is_template ? 'secondary' : 'outline'}>
                    {role.is_template ? t('settings.team.templateRole') : t('settings.team.customRole')}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {(role.permissions || []).length} {t('settings.team.permissionsCount')}
                </div>
              </div>
            ))}
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
              {t('settings.team.changeRoleDesc', { name: changeRoleDialog.member?.user?.display_name || '' })}
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
              {t('settings.team.removeDesc', { name: removeDialog.member?.user?.display_name || '' })}
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

    </div>
  );
}