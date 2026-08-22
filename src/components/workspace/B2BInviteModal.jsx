import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from '@/api';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { sendB2BInviteEmail } from '@/hooks/email';

const RELATIONSHIP_TYPES = [
  { id: 'client', label: 'Client', icon: '🔵', desc: 'You deliver work to them' },
  { id: 'partner', label: 'Partner', icon: '🟡', desc: 'Collaborating as equals' },
  { id: 'investor', label: 'Investor', icon: '🟣', desc: 'Financial stake' },
  { id: 'vendor', label: 'Vendor', icon: '⚫', desc: 'Supplying to you' },
];

export default function B2BInviteModal({ open, onClose, workspaceId, workspaceName, inviterName }) {
  const [companyName, setCompanyName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [relationship, setRelationship] = useState('');
  const [channelName, setChannelName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    if (!companyName || !adminEmail || !relationship) return;
    setIsSubmitting(true);

    try {
      // 1. Create the B2B Space record
      await api.post('/b2b', {
        company_name: companyName,
        admin_email: adminEmail,
        relationship_type: relationship,
        workspace_id: workspaceId,
        status: 'pending',
        shared_channels: channelName ? [channelName] : [],
      });

      // 2. If a shared channel is specified, create it in the channels table
      if (channelName) {
        await api.post('/channels', {
          name: channelName,
          workspace_id: workspaceId,
          type: 'b2b',
        });
      }

      queryClient.invalidateQueries({ queryKey: ['b2bSpaces'] });
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      
      // 3. Send the invite email
      await sendB2BInviteEmail(adminEmail, inviterName, workspaceName);

      toast.success(`Invite sent to ${companyName}`);

      setCompanyName('');
      setAdminEmail('');
      setRelationship('');
      setChannelName('');
      onClose();
    } catch (error) {
      console.error('Error creating B2B space:', error);
      toast.error(error.message || 'Failed to send invite');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Company (B2B)</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Company Name</Label>
            <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. TechNova Solutions" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Admin Email</Label>
            <Input value={adminEmail} onChange={e => setAdminEmail(e.target.value)} placeholder="admin@company.com" type="email" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Relationship</Label>
            <Select value={relationship} onValueChange={setRelationship}>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                {RELATIONSHIP_TYPES.map(r => (
                  <SelectItem key={r.id} value={r.id}>{r.icon} {r.label} — {r.desc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Shared Channel Name</Label>
            <Input
              value={channelName}
              onChange={e => setChannelName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
              placeholder="e.g. technova-project"
            />
          </div>
          <Button onClick={handleSubmit} disabled={!companyName || !adminEmail || !relationship || isSubmitting} className="w-full">
            {isSubmitting ? 'Sending...' : 'Send Invite'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}