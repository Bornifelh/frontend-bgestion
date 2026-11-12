import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { issuesApi, issueSprintsApi } from '../../lib/api';
import { getSocket, joinBoard, leaveBoard } from '../../lib/socket';
import { apiError } from './issueMeta';

export const issueKeys = {
  list: (boardId, jql) => ['issues', boardId, 'list', jql || ''],
  lists: (boardId) => ['issues', boardId, 'list'],
  meta: (boardId) => ['issues', boardId, 'meta'],
  detail: (id) => ['issue', id],
  sprints: (boardId) => ['issues', boardId, 'sprints'],
};

export function useProjectMeta(boardId) {
  return useQuery({
    queryKey: issueKeys.meta(boardId),
    queryFn: async () => (await issuesApi.meta(boardId)).data.data,
    enabled: !!boardId,
    staleTime: 60_000,
  });
}

export function useProjectIssues(boardId, jql) {
  return useQuery({
    queryKey: issueKeys.list(boardId, jql),
    queryFn: async () => (await issuesApi.list(boardId, { jql: jql || undefined, limit: 500 })).data.data,
    enabled: !!boardId,
    placeholderData: keepPreviousData,
    retry: (count, err) => err?.response?.status !== 400 && count < 2,
  });
}

/** Keep every issue query of the board fresh when teammates change something. */
export function useIssueRealtime(boardId) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!boardId) return undefined;
    joinBoard(boardId);
    const socket = getSocket();
    const refresh = (payload) => {
      qc.invalidateQueries({ queryKey: ['issues', boardId] });
      const id = payload?.issue?.id || payload?.id;
      if (id) qc.invalidateQueries({ queryKey: issueKeys.detail(id) });
    };
    const events = ['issue:created', 'issue:updated', 'issue:deleted', 'issue:ranked', 'item:created', 'item:deleted', 'sprint:updated'];
    events.forEach((e) => socket?.on(e, refresh));
    return () => {
      events.forEach((e) => socket?.off(e, refresh));
      leaveBoard(boardId);
    };
  }, [boardId, qc]);
}

/** Optimistic PATCH: updates every cached list + detail, rolls back on error. */
export function useUpdateIssue(boardId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }) => (await issuesApi.update(id, patch)).data.data,
    onMutate: async ({ id, patch, optimistic }) => {
      await qc.cancelQueries({ queryKey: ['issues', boardId] });
      const snapshot = qc.getQueriesData({ queryKey: ['issues', boardId] });
      const detail = qc.getQueryData(issueKeys.detail(id));
      const apply = (i) => (i.id === id ? { ...i, ...(optimistic || patch) } : i);
      qc.setQueriesData({ queryKey: issueKeys.lists(boardId) }, (old) =>
        old?.issues ? { ...old, issues: old.issues.map(apply) } : old
      );
      if (detail) qc.setQueryData(issueKeys.detail(id), apply(detail));
      return { snapshot, detail };
    },
    onError: (err, { id }, ctx) => {
      ctx?.snapshot?.forEach(([key, data]) => qc.setQueryData(key, data));
      if (ctx?.detail) qc.setQueryData(issueKeys.detail(id), ctx.detail);
      toast.error(apiError(err, 'Mise à jour impossible'));
    },
    onSuccess: (issue) => {
      qc.setQueryData(issueKeys.detail(issue.id), (old) => (old ? { ...old, ...issue } : old));
    },
    onSettled: (_d, _e, { id }) => {
      qc.invalidateQueries({ queryKey: ['issues', boardId] });
      qc.invalidateQueries({ queryKey: issueKeys.detail(id) });
    },
  });
}

export function useCreateIssue(boardId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data) => (await issuesApi.create({ board_id: boardId, ...data })).data.data,
    onSuccess: (issue) => {
      qc.invalidateQueries({ queryKey: ['issues', boardId] });
      if (issue.parent) qc.invalidateQueries({ queryKey: issueKeys.detail(issue.parent.id) });
    },
    onError: (err) => toast.error(apiError(err, 'Création impossible')),
  });
}

export function useDeleteIssue(boardId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await issuesApi.delete(id)).data.data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['issues', boardId] });
      qc.invalidateQueries({ queryKey: ['issue'] });
    },
    onError: (err) => toast.error(apiError(err, 'Suppression impossible')),
  });
}

export function useRankIssue(boardId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, before_id, after_id }) => (await issuesApi.rank(id, { before_id, after_id })).data.data,
    onError: (err) => toast.error(apiError(err, 'Classement impossible')),
    onSettled: () => qc.invalidateQueries({ queryKey: ['issues', boardId] }),
  });
}

export function useSprints(boardId) {
  return useQuery({
    queryKey: issueKeys.sprints(boardId),
    queryFn: async () => (await issueSprintsApi.list(boardId)).data.data,
    enabled: !!boardId,
  });
}

/** Generic sprint mutation: refreshes sprints, issues and project meta. */
export function useSprintAction(boardId, fn, { success } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars) => (await fn(vars)).data.data,
    onSuccess: (data, vars) => {
      if (success) toast.success(typeof success === 'function' ? success(data, vars) : success);
    },
    onError: (err) => toast.error(apiError(err, 'Action impossible')),
    onSettled: () => qc.invalidateQueries({ queryKey: ['issues', boardId] }),
  });
}
