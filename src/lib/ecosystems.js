import { MessageSquare, Newspaper, HelpCircle, BookOpen, Briefcase, Lightbulb, Megaphone, BarChart3, Cpu, Stethoscope, Building2, GraduationCap, Building, Home, Hotel, Trophy, Star, Gem } from 'lucide-react';

export const ECOSYSTEMS = [
  { id: 'technology', label: 'Technology', icon: Cpu, color: 'eco-technology' },
  { id: 'healthcare', label: 'Healthcare', icon: Stethoscope, color: 'eco-healthcare' },
  { id: 'corporate', label: 'Corporate', icon: Building2, color: 'eco-corporate' },
  { id: 'education', label: 'Education', icon: GraduationCap, color: 'eco-education' },
  { id: 'government', label: 'Government', icon: Building, color: 'eco-government' },
  { id: 'real_estate', label: 'Real Estate', icon: Home, color: 'eco-real-estate' },
  { id: 'hospitality', label: 'Hospitality', icon: Hotel, color: 'eco-hospitality' },
  { id: 'careers', label: 'Careers', icon: Briefcase, color: 'eco-careers' },
  { id: 'entertainment', label: 'Entertainment', icon: Star, color: 'eco-entertainment' },
];

export const FLAIRS = [
  { id: 'discussion', label: 'Discussion', icon: MessageSquare, color: 'bg-blue-500' },
  { id: 'news', label: 'News', icon: Newspaper, color: 'bg-amber-500' },
  { id: 'question', label: 'Question', icon: HelpCircle, color: 'bg-purple-500' },
  { id: 'resource', label: 'Resource', icon: BookOpen, color: 'bg-emerald-500' },
  { id: 'job', label: 'Job', icon: Briefcase, color: 'bg-cyan-500' },
  { id: 'insight', label: 'Insight', icon: Lightbulb, color: 'bg-yellow-500' },
  { id: 'announcement', label: 'Announcement', icon: Megaphone, color: 'bg-red-500' },
  { id: 'poll', label: 'Poll', icon: BarChart3, color: 'bg-indigo-500' },
];

export function getEcosystem(id) {
  return ECOSYSTEMS.find(e => e.id === id) || ECOSYSTEMS[0];
}

export function getFlair(id) {
  return FLAIRS.find(f => f.id === id) || FLAIRS[0];
}

export function getKarmaLevel(karma) {
  if (karma >= 5000) return { level: 'Legend', icon: Trophy, color: 'text-yellow-500' };
  if (karma >= 2000) return { level: 'Leader', icon: Star, color: 'text-purple-500' };
  if (karma >= 500) return { level: 'Expert', icon: Gem, color: 'text-blue-500' };
  return { level: 'Contributor', icon: Gem, color: 'text-muted-foreground' };
}