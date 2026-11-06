import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { api } from '@/api';
import { toast } from 'sonner';

export default function PollCard({ post, userEmail, isGuest, myVote, onRequireLogin }) {
  const [submitting, setSubmitting] = useState(false);
  const [showVoters, setShowVoters] = useState(false);
  const queryClient = useQueryClient();
  let pollOptions = post.poll_options;
  if (typeof pollOptions === 'string') {
    try {
      pollOptions = JSON.parse(pollOptions);
    } catch {
      pollOptions = [];
    }
  }
  const options = Array.isArray(pollOptions) ? pollOptions : [];
  const endTime = post.poll_ends_at ? new Date(post.poll_ends_at).getTime() : null;
  const isClosed = endTime !== null && endTime <= Date.now();
  const isCreator = !!userEmail && userEmail === post.author_email;
  const hasVoted = Number.isInteger(myVote);
  const showResults = isCreator || hasVoted || isClosed;
  const canVote = !isGuest && !isClosed;
  const {
    data: pollResults,
    isLoading: resultsLoading,
    isError: resultsError,
    error: resultsErrorDetails,
    refetch: refetchResults,
  } = useQuery({
    queryKey: ['pollResults', post.id],
    queryFn: async () => {
      const data = await api.get(`/posts/${encodeURIComponent(post.id)}/poll-results`);
      if (!Array.isArray(data.options)) throw new Error('The poll results response was invalid.');
      return data;
    },
    enabled: showResults,
  });
  const resultsAvailable = showResults && !!pollResults;
  const resultOptions = resultsAvailable
    ? pollResults.options
    : options.map(option => ({ ...option, votes: 0 }));
  const totalVotes = pollResults?.total_votes ?? 0;

  const {
    data: voters = [],
    isLoading: votersLoading,
    isError: votersError,
    error: votersErrorDetails,
    refetch: refetchVoters,
  } = useQuery({
    queryKey: ['pollVoters', post.id],
    queryFn: async () => {
      const data = await api.get(`/posts/${encodeURIComponent(post.id)}/poll-voters`);
      if (!Array.isArray(data)) throw new Error('The voter list response was invalid.');
      return data;
    },
    enabled: showVoters && isCreator,
  });

  const handleVote = async optionIndex => {
    if (isGuest) {
      onRequireLogin();
      return;
    }
    if (isClosed || submitting || myVote === optionIndex) return;

    setSubmitting(true);
    try {
      await api.post(`/posts/${encodeURIComponent(post.id)}/poll-vote`, { option_index: optionIndex });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['posts'] }),
        queryClient.invalidateQueries({ queryKey: ['pollVotes', userEmail] }),
        queryClient.invalidateQueries({ queryKey: ['pollResults', post.id] }),
        queryClient.invalidateQueries({ queryKey: ['pollVoters', post.id] }),
      ]);
      toast.success(hasVoted ? 'Your vote has been updated' : 'Your vote has been recorded');
    } catch (error) {
      toast.error(error.message || 'Failed to record your vote');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-3 rounded-lg border border-slate-700 bg-slate-900/40 p-3" aria-label="Poll">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{isClosed ? 'Poll closed' : endTime ? `Closes ${formatDistanceToNow(endTime, { addSuffix: true })}` : 'Poll'}</span>
        {showResults && <span>{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}</span>}
      </div>

      {showResults && resultsLoading && (
        <p className="mb-2 text-xs text-muted-foreground">Loading poll results…</p>
      )}
      {showResults && resultsError && (
        <div className="mb-2 text-xs text-destructive" role="alert">
          <span>{resultsErrorDetails?.message || 'Could not load poll results.'} </span>
          <button type="button" onClick={() => refetchResults()} className="underline">Retry</button>
        </div>
      )}

      <div className="space-y-2">
        {resultOptions.map((option, index) => {
          const count = Number(option.votes) || 0;
          const percentage = totalVotes ? Math.round((count / totalVotes) * 100) : 0;
          const selected = myVote === index;

          if (!resultsAvailable) {
            return (
              canVote ? (
                <button
                  key={`${index}-${option.text}`}
                  type="button"
                  disabled={submitting}
                  onClick={() => handleVote(index)}
                  className="w-full rounded-md border border-slate-700 px-3 py-2 text-left text-sm text-foreground transition-colors hover:border-primary hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {option.text}
                </button>
              ) : (
                <div key={`${index}-${option.text}`} className="rounded-md border border-slate-700 px-3 py-2 text-sm text-foreground">
                  {option.text}
                </div>
              )
            );
          }

          const resultContent = (
            <>
              <div className="absolute inset-y-0 left-0 bg-primary/15" style={{ width: `${percentage}%` }} />
              <div className="relative flex items-center justify-between gap-3 text-sm">
                <span>{option.text}{selected ? ' · Your vote' : ''}</span>
                <span className="font-medium tabular-nums">{percentage}% <span className="text-muted-foreground">({count})</span></span>
              </div>
            </>
          );
          const resultClass = `relative w-full overflow-hidden rounded-md border px-3 py-2 text-left ${selected ? 'border-primary' : 'border-slate-700'} ${canVote ? 'hover:border-primary hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60' : ''}`;

          return canVote ? (
            <button
              key={`${index}-${option.text}`}
              type="button"
              disabled={submitting || resultsLoading || resultsError}
              onClick={() => handleVote(index)}
              className={resultClass}
              aria-label={`${selected ? 'Your selected option' : 'Change vote to'} ${option.text}`}
            >
              {resultContent}
            </button>
          ) : (
            <div
              key={`${index}-${option.text}`}
              className={resultClass}
              aria-label={`${option.text}: ${percentage} percent, ${count} votes${selected ? ', your vote' : ''}`}
            >
              {resultContent}
            </div>
          );
        })}
      </div>

      {!hasVoted && !isClosed && (
        <p className="mt-2 text-xs text-muted-foreground">
          {isGuest ? 'Sign in to vote and see results.' : 'Choose an option. You can change your vote until the poll closes.'}
        </p>
      )}

      {isCreator && (
        <div className="mt-3 border-t border-slate-700 pt-2">
          <button
            type="button"
            onClick={() => setShowVoters(value => !value)}
            className="text-xs text-primary hover:underline"
          >
            {showVoters ? 'Hide voter details' : `View voter details (${totalVotes})`}
          </button>
          {showVoters && (
            <div className="mt-2 space-y-2">
              {votersLoading ? (
                <p className="text-xs text-muted-foreground">Loading voter details…</p>
              ) : votersError ? (
                <div role="alert" className="text-xs text-destructive">
                  <span>{votersErrorDetails?.message || 'Could not load voter details.'} </span>
                  <button type="button" onClick={() => refetchVoters()} className="underline">Retry</button>
                </div>
              ) : voters.length === 0 ? (
                <p className="text-xs text-muted-foreground">No votes yet.</p>
              ) : voters.map((voter, index) => (
                <div key={`${voter.email}-${index}`} className="flex justify-between gap-3 text-xs">
                  <span className="truncate">{voter.full_name || voter.email}</span>
                  <span className="shrink-0 text-muted-foreground">{options[voter.option_index]?.text || 'Option'} · {new Date(voter.voted_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
