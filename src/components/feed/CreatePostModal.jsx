import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useQueryClient } from '@tanstack/react-query';
import { ECOSYSTEMS, FLAIRS } from '@/lib/ecosystems';
import { ImagePlus, Loader2 } from 'lucide-react';
import RichTextEditor from './RichTextEditor';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';

export default function CreatePostModal({ open, onClose }) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [flair, setFlair] = useState('');
  const [ecosystem, setEcosystem] = useState(user?.primary_ecosystem || '');
  const [imageFile, setImageFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pollOptions, setPollOptions] = useState(['', '']);
  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    if (!title || !flair || !ecosystem) return;
    setIsSubmitting(true);

    try {
      let image_url = '';
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `posts/${fileName}`;

        const { data, error: uploadError } = await supabase.storage
          .from('assets')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('assets')
          .getPublicUrl(filePath);
        
        image_url = publicUrl;
      }

      const postData = {
        title,
        body,
        flair,
        ecosystem,
        image_url,
        author_name: user?.full_name || 'Anonymous',
        author_email: user?.email || '',
        vote_score: 0,
        upvotes: 0,
        downvotes: 0,
        comment_count: 0,
        saves_count: 0,
      };

      if (flair === 'poll') {
        postData.poll_options = pollOptions.filter(o => o.trim()).map(text => ({ text, votes: 0 }));
      }

      const { error: postError } = await supabase
        .from('posts')
        .insert(postData);

      if (postError) throw postError;

      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Post created successfully!');

      setTitle('');
      setBody('');
      setFlair('');
      setImageFile(null);
      setPollOptions(['', '']);
      onClose();
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg" style={{ top: 'calc(56px + 5vh)', transform: 'translateX(-50%)', marginTop: 0 }}>
        <DialogHeader>
          <DialogTitle className="text-xl">Create Post</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Flair</Label>
              <Select value={flair} onValueChange={setFlair}>
                <SelectTrigger><SelectValue placeholder="Choose flair" /></SelectTrigger>
                <SelectContent>
                  {FLAIRS.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.icon} {f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Ecosystem</Label>
              <Select value={ecosystem} onValueChange={setEcosystem}>
                <SelectTrigger><SelectValue placeholder="Choose ecosystem" /></SelectTrigger>
                <SelectContent>
                  {ECOSYSTEMS.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.icon} {e.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Title</Label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What's happening in your industry today?"
              className="text-base"
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Body (optional)</Label>
            <RichTextEditor value={body} onChange={e => setBody(e.target.value)} placeholder="Add more detail..." />
          </div>

          {flair === 'poll' && (
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Poll Options</Label>
              <div className="space-y-2">
                {pollOptions.map((opt, i) => (
                  <Input
                    key={i}
                    value={opt}
                    onChange={e => {
                      const n = [...pollOptions];
                      n[i] = e.target.value;
                      setPollOptions(n);
                    }}
                    placeholder={`Option ${i + 1}`}
                  />
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPollOptions([...pollOptions, ''])}
                >
                  + Add Option
                </Button>
              </div>
            </div>
          )}

          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Attach Image (optional)</Label>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ImagePlus className="w-5 h-5" />
              {imageFile ? imageFile.name : 'Choose File'}
              <input type="file" accept="image/*" className="hidden" onChange={e => setImageFile(e.target.files[0])} />
            </label>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!title || !flair || !ecosystem || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Publish post →
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}