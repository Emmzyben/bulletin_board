import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useQueryClient } from '@tanstack/react-query';
import { ECOSYSTEMS, FLAIRS } from '@/lib/ecosystems';
import { ImagePlus, Loader2, AlertCircle } from 'lucide-react';
import RichTextEditor from './RichTextEditor';
import { api } from '@/api';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';
import { pinata } from '@/lib/pinata';
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export default function CreatePostModal({ open, onClose }) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [flair, setFlair] = useState('');
  const joinedCommunities = user?.joined_communities || [];
  const availableEcosystems = joinedCommunities.length > 0
    ? ECOSYSTEMS.filter(e => joinedCommunities.includes(e.id))
    : ECOSYSTEMS;
  const [ecosystem, setEcosystem] = useState(
    () => {
      const primary = user?.primary_ecosystem;
      if (primary && (joinedCommunities.length === 0 || joinedCommunities.includes(primary))) return primary;
      return joinedCommunities[0] || '';
    }
  );
  const [imageFile, setImageFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [errors, setErrors] = useState({});
  const queryClient = useQueryClient();

  const validateImage = (file) => {
    if (!file) return null;

    if (file.size > MAX_IMAGE_SIZE) {
      return 'Image must be smaller than 5MB';
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return 'Only JPEG, PNG, GIF, and WebP images are allowed';
    }

    return null;
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const error = validateImage(file);
      if (error) {
        toast.error(error);
        e.target.value = '';
        setImageFile(null);
      } else {
        setImageFile(file);
        setErrors(prev => ({ ...prev, image: null }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.length > 500) {
      newErrors.title = 'Title must be 500 characters or less';
    }

    if (!flair) {
      newErrors.flair = 'Please select a flair';
    }

    if (!ecosystem) {
      newErrors.ecosystem = 'Please select an ecosystem';
    }

    if (flair === 'poll') {
      const validOptions = pollOptions.filter(o => o.trim());
      if (validOptions.length < 2) {
        newErrors.poll = 'Poll must have at least 2 options';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      let image_url = '';
      if (imageFile) {
        setIsUploadingImage(true);
        try {
          const { url } = await api.get('/upload/presigned_url');
          const upload = await pinata.upload.public.file(imageFile).url(url);
          if (upload.cid) {
            image_url = await pinata.gateways.public.convert(upload.cid);
          }
        } finally {
          setIsUploadingImage(false);
        }
      }

      const postData = {
        title: title.trim(),
        body: body.trim(),
        flair,
        ecosystem,
        image_url,
        author_name: user?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Anonymous',
        author_email: user?.email || '',
        vote_score: 0,
        upvotes: 0,
        downvotes: 0,
        comment_count: 0,
        saves_count: 0,
      };

      if (flair === 'poll') {
        postData.poll_options = pollOptions
          .filter(o => o.trim())
          .map(text => ({ text: text.trim(), votes: 0 }));
      }

      await api.post('/posts', postData);

      await queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Post created successfully!');

      // Reset form
      setTitle('');
      setBody('');
      setFlair('');
      setEcosystem(user?.primary_ecosystem || '');
      setImageFile(null);
      setPollOptions(['', '']);
      setErrors({});

      onClose();
    } catch (error) {
      console.error('Error creating post:', error);

      let errorMessage = 'Failed to create post';
      if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
      setErrors(prev => ({ ...prev, submit: errorMessage }));
    } finally {
      setIsSubmitting(false);
      setIsUploadingImage(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-lg"
        style={{
          top: 'calc(56px + 5vh)',
          transform: 'translateX(-50%)',
          marginTop: 0,
          maxHeight: 'calc(100vh - 56px - 5vh - 16px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-xl">Create Post</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2 min-h-0 overflow-y-auto pr-1">
          {errors.submit && (
            <div className="flex gap-2 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md text-sm text-red-700 dark:text-red-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errors.submit}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">
                Flair {errors.flair && <span className="text-red-500">*</span>}
              </Label>
              <Select value={flair} onValueChange={setFlair}>
                <SelectTrigger className={errors.flair ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Choose flair" />
                </SelectTrigger>
                <SelectContent>
                  {FLAIRS.map(f => {
                    const FlairIcon = f.icon;
                    return (
                      <SelectItem key={f.id} value={f.id}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <FlairIcon size={14} />
                          {f.label}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {errors.flair && <p className="text-xs text-red-500 mt-1">{errors.flair}</p>}
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">
                Ecosystem {errors.ecosystem && <span className="text-red-500">*</span>}
              </Label>
              {joinedCommunities.length === 0 ? (
                <div className="flex items-start gap-3 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10">
                  <div>
                    <p className="text-sm font-semibold text-amber-400">You haven't joined any communities yet.</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Join a community to start posting.{' '}
                      <Link to="/communities" onClick={onClose} className="text-primary underline font-medium hover:text-primary/80 transition-colors">
                        Browse Communities →
                      </Link>
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <Select value={ecosystem} onValueChange={setEcosystem}>
                    <SelectTrigger className={errors.ecosystem ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Choose ecosystem" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableEcosystems.map(e => {
                        const EcoIcon = e.icon;
                        return (
                          <SelectItem key={e.id} value={e.id}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <EcoIcon size={14} />
                              {e.label}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">Showing only your joined communities</p>
                </>
              )}
              {errors.ecosystem && <p className="text-xs text-red-500 mt-1">{errors.ecosystem}</p>}
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">
              Title <span className="text-red-500">*</span>
              <span className="text-xs text-muted-foreground ml-2">
                {title.length}/500
              </span>
            </Label>
            <Input
              value={title}
              onChange={e => {
                setTitle(e.target.value);
                if (errors.title) setErrors(prev => ({ ...prev, title: null }));
              }}
              placeholder="What's happening in your industry today?"
              className={`text-base ${errors.title ? 'border-red-500' : ''}`}
              maxLength="500"
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Body (optional)</Label>
            <RichTextEditor
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Add more detail..."
            />
          </div>

          {flair === 'poll' && (
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">
                Poll Options {errors.poll && <span className="text-red-500">*</span>}
              </Label>
              <div className="space-y-2">
                {pollOptions.map((opt, i) => (
                  <Input
                    key={i}
                    value={opt}
                    onChange={e => {
                      const n = [...pollOptions];
                      n[i] = e.target.value;
                      setPollOptions(n);
                      if (errors.poll) setErrors(prev => ({ ...prev, poll: null }));
                    }}
                    placeholder={`Option ${i + 1}`}
                  />
                ))}
                {errors.poll && <p className="text-xs text-red-500">{errors.poll}</p>}
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
              <span>{imageFile ? imageFile.name : 'Choose File'}</span>
              {isUploadingImage && <Loader2 className="w-4 h-4 animate-spin" />}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
                disabled={isSubmitting}
              />
            </label>
            {imageFile && !isUploadingImage && (
              <p className="text-xs text-muted-foreground mt-1">
                {(imageFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            )}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || !flair || !ecosystem || isSubmitting || isUploadingImage || joinedCommunities.length === 0}
            className="w-full"
          >
            {isSubmitting || isUploadingImage ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isUploadingImage ? 'Uploading image...' : 'Creating post...'}
              </>
            ) : (
              'Publish post →'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}