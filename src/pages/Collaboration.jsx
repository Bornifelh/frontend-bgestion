import { MessageSquare, MessagesSquare, FileText } from 'lucide-react';

export default function Collaboration() {
  const sections = [
    {
      id: 'messages',
      title: 'Messages recents',
      icon: MessageSquare,
    },
    {
      id: 'forums',
      title: 'Forums',
      icon: MessagesSquare,
    },
    {
      id: 'files',
      title: 'Fichiers partages',
      icon: FileText,
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Collaboration</h1>
        <p className="mt-1 text-sm text-gray-500">
          Communication et partage avec votre equipe
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {sections.map(({ id, title, icon: Icon }) => (
          <div
            key={id}
            className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col"
          >
            <div className="flex items-center gap-2 mb-4">
              <Icon className="w-5 h-5 text-blue-600" strokeWidth={1.75} />
              <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center py-10 text-center border border-dashed border-gray-200 rounded-md bg-gray-50/50">
              <p className="text-sm text-gray-500">Aucun element pour le moment</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
