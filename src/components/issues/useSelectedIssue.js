import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { issuesApi } from '../../lib/api';

/**
 * Jira keeps the open issue in the URL (?selectedIssue=KAN-12) so it can be
 * shared and survives reloads. Resolves the key to an id via the loaded list
 * first, then via the API.
 */
export function useSelectedIssue(issues) {
  const [params, setParams] = useSearchParams();
  const key = params.get('selectedIssue');
  const fromList = key ? issues?.find((i) => i.key === key) : null;

  const { data: resolved } = useQuery({
    queryKey: ['issue-key', key],
    queryFn: async () => (await issuesApi.getByKey(key)).data.data,
    enabled: !!key && !fromList && !!issues,
    staleTime: 60_000,
  });

  const open = useCallback(
    (issueOrKey) => {
      const k = typeof issueOrKey === 'string' ? issueOrKey : issueOrKey.key;
      setParams((p) => {
        const next = new URLSearchParams(p);
        next.set('selectedIssue', k);
        return next;
      });
    },
    [setParams]
  );
  const close = useCallback(() => {
    setParams((p) => {
      const next = new URLSearchParams(p);
      next.delete('selectedIssue');
      return next;
    });
  }, [setParams]);

  return { selectedId: fromList?.id || resolved?.id || null, open, close, isOpen: !!key };
}
