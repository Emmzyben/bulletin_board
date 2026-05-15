import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { ECOSYSTEMS } from '@/lib/ecosystems';
import { Check, ArrowRight, Users, Plug, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const INTEGRATIONS = [
  'Google Drive', 'Asana', 'GitHub', 'Jira', 'Notion', 'Zoom', 'Salesforce', 'Figma', 'Stripe'
];

export default function Onboarding() {
  const { user, checkUserAuth } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedEco, setSelectedEco] = useState('');
  const [workspaceChoice, setWorkspaceChoice] = useState('create');
  const [wsName, setWsName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [teammates, setTeammates] = useState(['', '', '']);
  const [selectedIntegrations, setSelectedIntegrations] = useState([]);
  const navigate = useNavigate();

  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;

  const handleFinish = async () => {
    if (!user) return;
    
    try {
      // Update user metadata or profiles table
      const { error: profileError } = await supabase
        .from('users')
        .update({
          primary_ecosystem: selectedEco,
          onboarded: true,
        })
        .eq('email', user.email);

      if (profileError) throw profileError;

      if (workspaceChoice === 'create' && wsName) {
        // Create workspace
        const { data: ws, error: wsError } = await supabase
          .from('workspaces')
          .insert({
            name: wsName,
            ecosystem: selectedEco,
            owner_email: user.email,
            member_count: 1,
            plan: 'free',
            members: [{ email: user.email, role: 'owner', status: 'active' }],
          })
          .select()
          .single();

        if (wsError) throw wsError;

        // Create default channels
        const { error: channelError } = await supabase
          .from('channels')
          .insert([
            { name: 'announcements', workspace_id: ws.id, type: 'public' },
            { name: 'general', workspace_id: ws.id, type: 'public' },
            { name: 'random', workspace_id: ws.id, type: 'public' },
          ]);

        if (channelError) throw channelError;

        // Link user to workspace
        await supabase
          .from('users')
          .update({ workspace_id: ws.id })
          .eq('email', user.email);
      }

      await checkUserAuth(); // Refresh local user state
      navigate('/');
    } catch (error) {
      console.error('Onboarding failed:', error);
      toast.error('Onboarding failed. Please try again.');
    }
  };

  const toggleIntegration = (name) => {
    setSelectedIntegrations(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-bold text-lg">BB</span>
          </div>
          <h1 className="text-2xl font-bold">Welcome to Bulletin Board</h1>
          <p className="text-sm text-muted-foreground mt-1">Let's get you set up in 2 minutes</p>
        </div>

        <Progress value={progress} className="mb-6 h-1.5" />

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {step === 1 && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-1">Pick your ecosystem</h2>
                <p className="text-sm text-muted-foreground mb-4">Choose your primary industry</p>
                <div className="grid grid-cols-3 gap-2">
                  {ECOSYSTEMS.map(eco => (
                    <button
                      key={eco.id}
                      onClick={() => setSelectedEco(eco.id)}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        selectedEco === eco.id
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                          : 'hover:bg-secondary'
                      }`}
                    >
                      <span className="text-2xl block mb-1">{eco.icon}</span>
                      <span className="text-xs font-medium">{eco.label}</span>
                    </button>
                  ))}
                </div>
                <Button onClick={() => setStep(2)} disabled={!selectedEco} className="w-full mt-4">
                  Continue <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Card>
            )}

            {step === 2 && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-1">Set up your workspace</h2>
                <p className="text-sm text-muted-foreground mb-4">Create a new workspace or join one</p>
                <div className="flex gap-2 mb-4">
                  <Button
                    variant={workspaceChoice === 'create' ? 'default' : 'outline'}
                    onClick={() => setWorkspaceChoice('create')}
                    className="flex-1"
                  >
                    Create New
                  </Button>
                  <Button
                    variant={workspaceChoice === 'join' ? 'default' : 'outline'}
                    onClick={() => setWorkspaceChoice('join')}
                    className="flex-1"
                  >
                    Join Existing
                  </Button>
                </div>
                {workspaceChoice === 'create' ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1.5 block">Workspace Name</Label>
                      <Input value={wsName} onChange={e => setWsName(e.target.value)} placeholder="My Company" />
                    </div>
                  </div>
                ) : (
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Invite Code</Label>
                    <Input value={inviteCode} onChange={e => setInviteCode(e.target.value)} placeholder="Enter invite code" />
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
                  <Button onClick={() => setStep(3)} className="flex-1">
                    Continue <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </Card>
            )}

            {step === 3 && (
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">Invite your team</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4">Add teammates by email (optional)</p>
                <div className="space-y-2">
                  {teammates.map((email, i) => (
                    <Input
                      key={i}
                      value={email}
                      onChange={e => {
                        const n = [...teammates];
                        n[i] = e.target.value;
                        setTeammates(n);
                      }}
                      placeholder={`teammate${i + 1}@company.com`}
                      type="email"
                    />
                  ))}
                  <Button variant="outline" size="sm" onClick={() => setTeammates([...teammates, ''])}>
                    + Add Another
                  </Button>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Back</Button>
                  <Button onClick={() => setStep(4)} className="flex-1">
                    {teammates.some(e => e.trim()) ? 'Continue' : 'Skip'}
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </Card>
            )}

            {step === 4 && (
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-1">
                  <Plug className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">Connect your apps</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4">Select the tools your team uses</p>
                <div className="grid grid-cols-3 gap-2">
                  {INTEGRATIONS.map(name => (
                    <button
                      key={name}
                      onClick={() => toggleIntegration(name)}
                      className={`p-3 rounded-lg border text-center text-xs font-medium transition-all ${
                        selectedIntegrations.includes(name)
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-secondary'
                      }`}
                    >
                      {selectedIntegrations.includes(name) && <Check className="w-3 h-3 text-primary mx-auto mb-1" />}
                      {name}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" onClick={() => setStep(3)} className="flex-1">Back</Button>
                  <Button onClick={() => setStep(5)} className="flex-1">
                    Continue <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </Card>
            )}

            {step === 5 && (
              <Card className="p-8 text-center">
                <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">You're all set!</h2>
                <p className="text-sm text-muted-foreground mb-6">Your workspace is ready. Time to explore the GP Feed.</p>
                <Button onClick={handleFinish} className="w-full" size="lg">
                  Launch Bulletin Board <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>

        <p className="text-xs text-muted-foreground text-center mt-4">Step {step} of {totalSteps}</p>
      </div>
    </div>
  );
}