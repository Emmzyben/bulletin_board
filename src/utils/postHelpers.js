/**
 * Validates a post object against schema requirements
 * @param {Object} post - Post data to validate
 * @returns {Object} - Object with isValid boolean and errors array
 */
export const validatePost = (post) => {
  const errors = [];

  if (!post.title || !post.title.trim()) {
    errors.push('Title is required');
  } else if (post.title.length > 500) {
    errors.push('Title must be 500 characters or less');
  }

  if (!post.flair) {
    errors.push('Flair is required');
  } else if (!['discussion', 'news', 'question', 'resource', 'job', 'insight', 'announcement', 'poll'].includes(post.flair)) {
    errors.push('Invalid flair type');
  }

  if (!post.ecosystem) {
    errors.push('Ecosystem is required');
  } else if (!['technology', 'healthcare', 'corporate', 'education', 'government', 'real_estate', 'hospitality', 'careers', 'entertainment'].includes(post.ecosystem)) {
    errors.push('Invalid ecosystem type');
  }

  if (post.body && post.body.length > 10000) {
    errors.push('Body must be 10000 characters or less');
  }

  if (post.flair === 'poll' && post.poll_options) {
    if (!Array.isArray(post.poll_options) || post.poll_options.length < 2) {
      errors.push('Poll must have at least 2 options');
    }
    post.poll_options.forEach((option, index) => {
      if (!option.text || !option.text.trim()) {
        errors.push(`Poll option ${index + 1} cannot be empty`);
      }
    });
  }

  if (!post.author_email) {
    errors.push('Author email is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Formats post data for database insertion
 * @param {Object} formData - Raw form data
 * @param {Object} user - Current user object
 * @returns {Object} - Formatted post data
 */
export const formatPostData = (formData, user) => {
  const postData = {
    title: formData.title.trim(),
    body: (formData.body || '').trim(),
    flair: formData.flair,
    ecosystem: formData.ecosystem,
    image_url: formData.image_url || '',
    author_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Anonymous',
    author_email: user?.email || '',
    vote_score: 0,
    upvotes: 0,
    downvotes: 0,
    comment_count: 0,
    saves_count: 0,
  };

  if (formData.flair === 'poll' && Array.isArray(formData.poll_options)) {
    postData.poll_options = formData.poll_options
      .filter(o => o.trim())
      .map(text => ({ text: text.trim(), votes: 0 }));
  }

  return postData;
};

/**
 * Gets the display name for the current user
 * @param {Object} user - User object from Supabase auth
 * @returns {string} - User's display name
 */
export const getUserDisplayName = (user) => {
  if (!user) return 'Anonymous';
  return user?.user_metadata?.full_name || 
         user?.full_name || 
         user?.email?.split('@')[0] || 
         'Anonymous';
};

/**
 * Checks if an error is a network error
 * @param {Error} error - Error object
 * @returns {boolean} - True if network error
 */
export const isNetworkError = (error) => {
  return error?.message?.toLowerCase().includes('network') ||
         error?.message?.toLowerCase().includes('connection') ||
         error?.message?.toLowerCase().includes('fetch');
};

/**
 * Filters posts by ecosystem
 * @param {Array} posts - Array of posts
 * @param {string} ecosystem - Ecosystem to filter by
 * @returns {Array} - Filtered posts
 */
export const filterPostsByEcosystem = (posts, ecosystem) => {
  if (!ecosystem) return posts;
  return posts.filter(post => post.ecosystem === ecosystem);
};

/**
 * Filters posts by flair
 * @param {Array} posts - Array of posts
 * @param {string} flair - Flair to filter by
 * @returns {Array} - Filtered posts
 */
export const filterPostsByFlair = (posts, flair) => {
  if (!flair) return posts;
  return posts.filter(post => post.flair === flair);
};

/**
 * Sorts posts by various criteria
 * @param {Array} posts - Array of posts
 * @param {string} sortBy - Sort criterion ('recent', 'trending', 'top')
 * @returns {Array} - Sorted posts
 */
export const sortPosts = (posts, sortBy = 'recent') => {
  const sorted = [...posts];
  
  switch (sortBy) {
    case 'trending':
      return sorted.sort((a, b) => (b.vote_score || 0) - (a.vote_score || 0));
    case 'top':
      return sorted.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
    case 'recent':
    default:
      return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
};
