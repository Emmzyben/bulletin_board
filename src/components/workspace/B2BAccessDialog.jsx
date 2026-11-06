import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function B2BAccessDialog({ space, mode = 'manage', onClose }) {
  const queryClient = useQueryClient();
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [saving, setSaving] = useState(false);
  const { data, isLoading, isError } = useQuery({
    queryKey: ['b2bAccess', space?.id],
    queryFn: () => api.get(`/b2b/${space.id}/access`),
    enabled: !!space?.id,
  });

  useEffect(() => {
    if (!data || !space) return;
    setSelectedEmails([...new Set([space.admin_email, ...(data.selected_emails || [])])]);
  }, [data, space?.admin_email]);

  if (!space) return null;

  const toggleMember = (email, checked) => {
    setSelectedEmails(current => checked
      ? [...new Set([...current, email])]
      : current.filter(selectedEmail => selectedEmail !== email));
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      if (mode === 'accept') {
        await api.put(`/b2b/${space.id}/status`, {
          status: 'active',
          member_emails: selectedEmails,
        });
        toast.success(`B2B invitation from ${space.company_name} accepted`);
      } else {
        await api.put(`/b2b/${space.id}/access`, { member_emails: selectedEmails });
        toast.success('Shared workspace access updated');
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['incomingB2BRequests'] }),
        queryClient.invalidateQueries({ queryKey: ['b2bSpaces'] }),
        queryClient.invalidateQueries({ queryKey: ['channels'] }),
      ]);
      onClose();
    } catch (error) {
      let message = error.message || 'Failed to update shared workspace access';
      try { message = JSON.parse(message).error || message; } catch {}
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const ownerEmail = data?.members?.find(member => member.role === 'owner')?.email || space.admin_email;
  const isAcceptMode = mode === 'accept';

  return (
    <Dialog open={!!space} onOpenChange={open => { if (!open && !saving) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isAcceptMode ? `Accept ${space.company_name}'s invitation` : `Shared members for ${space.company_name}`}</DialogTitle>
          <DialogDescription>
            Choose which people from your workspace can use the B2B shared channels. They will not be added to the other workspace.
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : isError ? (
          <p className="py-4 text-sm text-destructive">Could not load your workspace members. Please close this dialog and try again.</p>
        ) : (
          <div className="max-h-72 space-y-2 overflow-y-auto py-1">
            {data.members.map(member => {
              const isOwner = member.email.toLowerCase() === ownerEmail.toLowerCase();
              const checked = isOwner || selectedEmails.includes(member.email);
              return (
                <label key={member.email} className="flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 hover:bg-muted/50">
                  <Checkbox
                    checked={checked}
                    disabled={isOwner || saving}
                    onCheckedChange={value => toggleMember(member.email, value === true)}
                    aria-label={`Allow ${member.email} to access shared channels`}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm">{member.email}</span>
                  <span className="text-xs text-muted-foreground">{isOwner ? 'Admin · always included' : member.role === 'subadmin' ? 'Sub-admin' : 'Member'}</span>
                </label>
              );
            })}
            {data.shared_channels.length > 0 && (
              <p className="pt-2 text-xs text-muted-foreground">Shared channels: {data.shared_channels.join(', ')}</p>
            )}
            {data.shared_channels.length === 0 && (
              <p className="pt-2 text-xs text-muted-foreground">This partnership has no shared channels configured yet.</p>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isLoading || isError || saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isAcceptMode ? 'Accept and share' : 'Save access'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
