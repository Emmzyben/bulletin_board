export const ECOSYSTEMS = [
  { id: 'technology', label: 'Technology', icon: '💻', color: 'eco-technology' },
  { id: 'healthcare', label: 'Healthcare', icon: '🏥', color: 'eco-healthcare' },
  { id: 'corporate', label: 'Corporate', icon: '🏢', color: 'eco-corporate' },
  { id: 'education', label: 'Education', icon: '🎓', color: 'eco-education' },
  { id: 'government', label: 'Government', icon: '🏛️', color: 'eco-government' },
  { id: 'real_estate', label: 'Real Estate', icon: '🏠', color: 'eco-real-estate' },
  { id: 'hospitality', label: 'Hospitality', icon: '🏨', color: 'eco-hospitality' },
  { id: 'careers', label: 'Careers', icon: '💼', color: 'eco-careers' },
  { id: 'entertainment', label: 'Entertainment', icon: '🎬', color: 'eco-entertainment' },
];

export const FLAIRS = [
  { id: 'discussion', label: 'Discussion', icon: '💬', color: 'bg-blue-500' },
  { id: 'news', label: 'News', icon: '📰', color: 'bg-amber-500' },
  { id: 'question', label: 'Question', icon: '❓', color: 'bg-purple-500' },
  { id: 'resource', label: 'Resource', icon: '📚', color: 'bg-emerald-500' },
  { id: 'job', label: 'Job', icon: '💼', color: 'bg-cyan-500' },
  { id: 'insight', label: 'Insight', icon: '💡', color: 'bg-yellow-500' },
  { id: 'announcement', label: 'Announcement', icon: '📢', color: 'bg-red-500' },
  { id: 'poll', label: 'Poll', icon: '📊', color: 'bg-indigo-500' },
];

export function getEcosystem(id) {
  return ECOSYSTEMS.find(e => e.id === id) || ECOSYSTEMS[0];
}

export function getFlair(id) {
  return FLAIRS.find(f => f.id === id) || FLAIRS[0];
}

export function getKarmaLevel(karma) {
  if (karma >= 5000) return { level: 'Legend', badge: '🏆', color: 'text-yellow-500' };
  if (karma >= 2000) return { level: 'Leader', badge: '⭐', color: 'text-purple-500' };
  if (karma >= 500) return { level: 'Expert', badge: '🔷', color: 'text-blue-500' };
  return { level: 'Contributor', badge: '🔹', color: 'text-muted-foreground' };
}