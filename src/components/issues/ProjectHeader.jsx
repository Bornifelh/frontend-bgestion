import { NavLink, Link } from 'react-router-dom';
import { Globe, List, Columns3, Table2, ListTodo } from 'lucide-react';

const TABS = [
  { to: 'list', label: 'Liste', Icon: List },
  { to: 'backlog', label: 'Backlog', Icon: ListTodo },
  { to: 'board', label: 'Tableau', Icon: Columns3 },
];

/** Jira space header: breadcrumb, project avatar + name, view tabs. */
export default function ProjectHeader({ boardId, project, color, actions }) {
  return (
    <div className="border-b border-[#DFE1E6] bg-white px-6 pt-4">
      <nav className="text-sm text-[#626F86]">
        <span>Espaces</span>
        {project?.key && (
          <>
            <span className="mx-1.5">/</span>
            <span>{project.key}</span>
          </>
        )}
      </nav>
      <div className="mt-1 flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-xs font-bold text-white"
            style={{ backgroundColor: color || '#0C66E4' }}
          >
            {(project?.key || '?').slice(0, 2)}
          </span>
          <h1 className="truncate text-2xl font-semibold text-[#172B4D]">{project?.name || '…'}</h1>
        </div>
        <div className="flex items-center gap-2">{actions}</div>
      </div>
      <div className="mt-3 flex items-center gap-1 overflow-x-auto">
        {TABS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={`/project/${boardId}/${to}`}
            className={({ isActive }) =>
              `flex items-center gap-1.5 whitespace-nowrap border-b-2 px-2 pb-2 pt-1 text-sm font-medium transition-colors ${
                isActive ? 'border-[#0C66E4] text-[#0C66E4]' : 'border-transparent text-[#44546F] hover:text-[#172B4D]'
              }`
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
        <Link
          to={`/board/${boardId}`}
          className="flex items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent px-2 pb-2 pt-1 text-sm font-medium text-[#44546F] hover:text-[#172B4D]"
          title="Ancienne vue tableau (colonnes personnalisées, calendrier, chronologie…)"
        >
          <Table2 className="h-4 w-4" />
          Vue avancée
        </Link>
        <span className="ml-auto hidden items-center gap-1 pb-2 text-xs text-[#626F86] md:flex">
          <Globe className="h-3.5 w-3.5" /> Projet géré par l'équipe
        </span>
      </div>
    </div>
  );
}
