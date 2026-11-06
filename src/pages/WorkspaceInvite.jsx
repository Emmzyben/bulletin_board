import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, CheckCircle2, Loader2, LogIn, Mail, UserPlus } from 'lucide-react';
import { api } from '@/api';
import { useAuth } from '@/lib/AuthContext';
import { ECOSYSTEMS } from '@/lib/ecosystems';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function WorkspaceInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();
  const token = searchParams.get('token');
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const { data: invitation, isLoading, isError } = useQuery({
    queryKey: ['workspaceInvitation', token],
    queryFn: () => api.get(`/workspaces/invites/${encodeURIComponent(token)}`),
    enabled: !!token,
    retry: false,
  });

  const isInvitee = user?.email?.toLowerCase() === invitation?.email?.toLowerCase();
  const ecosystem = ECOSYSTEMS.find(item => item.id === invitation?.workspace?.ecosystem);
  const redirectToInvite = `/invite?token=${encodeURIComponent(token || '')}`;
  const authParams = `redirect=${encodeURIComponent(redirectToInvite)}&email=${encodeURIComponent(invitation?.email || '')}`;

  const handleAccept = async () => {
    setAccepting(true);
    try {
      await api.put(`/workspaces/invites/${encodeURIComponent(token)}/accept`, {});
      setAccepted(true);
      await queryClient.invalidateQueries({ queryKey: ['workspaces', user?.email] });
      toast.success(`You joined ${invitation.workspace.name}`);
      navigate('/workspace');
    } catch (error) {
      toast.error(error.message || 'Failed to accept workspace invitation');
      setAccepting(false);
    }
  };

  const continueWithInvitee = () => {
    logout();
    navigate(`/login?${authParams}`);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!token || isError || !invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invitation unavailable</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">This invitation is invalid or has expired. Ask the workspace owner to send a new one.</p>
            <Button className="w-full" onClick={() => navigate('/')}>Go to Bulletin Board</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Building2 className="mx-auto mb-2 h-10 w-10 text-primary" />
            <CardTitle>Workspace invitation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-3 rounded-md border p-4">
              <div>
                <p className="text-lg font-semibold">{invitation.workspace.name}</p>
                <p className="text-sm text-muted-foreground">{ecosystem?.label || invitation.workspace.ecosystem} workspace</p>
              </div>
              <p className="text-sm text-muted-foreground">Invited by {invitation.inviter_name} to join as a member.</p>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{invitation.email}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {invitation.account_exists
                ? 'Sign in to the account this invitation was sent to, then review and accept the request.'
                : 'Create an account with this email address, then review and accept the request.'}
            </p>
            <Button className="w-full gap-2" onClick={() => navigate(`/${invitation.account_exists ? 'login' : 'signup'}?${authParams}`)}>
              {invitation.account_exists ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
              {invitation.account_exists ? 'Sign in to accept' : 'Create account to accept'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isInvitee) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>This invitation is for another account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">The invitation was sent to {invitation.email}. You are signed in as {user.email}.</p>
            <Button className="w-full" onClick={continueWithInvitee}>Sign in as {invitation.email}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="text-center text-sm text-muted-foreground">
        <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-primary" />
        Review your workspace invitation.
      </div>
      <Dialog open={!accepted} onOpenChange={open => { if (!open) navigate('/'); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join {invitation.workspace.name}?</DialogTitle>
            <DialogDescription>
              You have been invited to join this workspace. Review the details before accepting.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 rounded-md border p-4">
            <div className="flex items-start gap-3">
              <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="font-semibold">{invitation.workspace.name}</p>
                <p className="text-sm text-muted-foreground">{ecosystem?.label || invitation.workspace.ecosystem} workspace</p>
              </div>
            </div>
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <p><span className="text-muted-foreground">Owner:</span> {invitation.workspace.owner_name}</p>
              <p><span className="text-muted-foreground">Invited by:</span> {invitation.inviter_name}</p>
              <p className="sm:col-span-2"><span className="text-muted-foreground">Invited email:</span> {invitation.email}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => navigate('/')} disabled={accepting}>Not now</Button>
            <Button onClick={handleAccept} disabled={accepting}>
              {accepting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Accept invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}