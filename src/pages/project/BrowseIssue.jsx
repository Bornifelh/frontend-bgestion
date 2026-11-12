import { Navigate, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { issuesApi } from '../../lib/api';
import { apiError } from '../../components/issues/issueMeta';

/** Permalink /browse/KAN-12 → opens the issue in its project list. */
export default function BrowseIssue() {
  const { issueKey } = useParams();
  const { data, error } = useQuery({
    queryKey: ['issue-key', issueKey],
    queryFn: async () => (await issuesApi.getByKey(issueKey)).data.data,
    retry: false,
  });
  if (data) return <Navigate replace to={`/project/${data.board_id}/list?selectedIssue=${encodeURIComponent(data.key)}`} />;
  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-10 text-center">
        <p className="text-lg font-semibold text-[#172B4D]">{issueKey}</p>
        <p className="text-sm text-[#626F86]">{apiError(error, 'Ticket introuvable')}</p>
        <Link to="/" className="text-sm text-[#0C66E4] hover:underline">Retour à l'accueil</Link>
      </div>
    );
  }
  return <div className="p-10 text-center text-sm text-[#626F86]">Ouverture de {issueKey}…</div>;
}
