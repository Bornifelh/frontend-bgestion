import { Type, Hash, Calendar, User, CheckCircle, Flag, BarChart3, FileText } from 'lucide-react';

export const PALETTE_COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#06b6d4',
  '#3b82f6',
];

export const columnIcons = {
  text: Type,
  number: Hash,
  date: Calendar,
  person: User,
  status: CheckCircle,
  priority: Flag,
  progress: BarChart3,
  checkbox: CheckCircle,
  files: FileText,
  file: FileText,
};

const AVATAR_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e'
];

export const getAvatarColor = (user) => {
  const index = (user?.id || user?.email || '').toString().charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
};

export const getInitials = (user) => {
  if (user?.firstName && user?.lastName) {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  }
  return user?.email?.[0]?.toUpperCase() || '?';
};
