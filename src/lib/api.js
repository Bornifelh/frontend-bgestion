import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

// Use environment variable in production, fallback to /api for dev (with Vite proxy)
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't retry for logout or if already retrying
    const isLogout = originalRequest.url?.includes('/auth/logout');
    const isRefresh = originalRequest.url?.includes('/auth/refresh');
    
    if (error.response?.status === 401 && !originalRequest._retry && !isLogout && !isRefresh) {
      originalRequest._retry = true;

      try {
        const { refreshToken } = useAuthStore.getState();
        if (!refreshToken) {
          // No refresh token, just clear auth state
          useAuthStore.getState().clearAuth();
          return Promise.reject(error);
        }
        
        const newAccessToken = await useAuthStore.getState().refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().clearAuth();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// API functions
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  me: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/password', data),
  changeTempPassword: (data) => api.post('/auth/change-temp-password', data),
};

export const workspaceApi = {
  getAll: () => api.get('/workspaces'),
  getOne: (id) => api.get(`/workspaces/${id}`),
  create: (data) => api.post('/workspaces', data),
  update: (id, data) => api.put(`/workspaces/${id}`, data),
  delete: (id) => api.delete(`/workspaces/${id}`),
  getMembers: (id) => api.get(`/workspaces/${id}/members`),
  addMember: (id, data) => api.post(`/workspaces/${id}/members`, data),
  updateMember: (id, memberId, data) => api.put(`/workspaces/${id}/members/${memberId}`, data),
  removeMember: (id, memberId) => api.delete(`/workspaces/${id}/members/${memberId}`),
  getStats: (id) => api.get(`/workspaces/${id}/stats`),
};

export const boardApi = {
  getByWorkspace: (workspaceId) => api.get(`/boards/workspace/${workspaceId}`),
  getOne: (id) => api.get(`/boards/${id}`),
  create: (data) => api.post('/boards', data),
  update: (id, data) => api.put(`/boards/${id}`, data),
  delete: (id) => api.delete(`/boards/${id}`),
  duplicate: (id, data) => api.post(`/boards/${id}/duplicate`, data),
};

export const groupApi = {
  getByBoard: (boardId) => api.get(`/boards/${boardId}/groups`),
  create: (data) => api.post(`/boards/${data.boardId}/groups`, data),
  update: (id, data) => api.put(`/boards/groups/${id}`, data),
  delete: (id) => api.delete(`/boards/groups/${id}`),
};

export const itemApi = {
  create: (data) => api.post('/items', data),
  update: (id, data) => api.put(`/items/${id}`, data),
  updateValue: (itemId, columnId, value) => 
    api.put(`/items/${itemId}/values/${columnId}`, { value }),
  delete: (id) => api.delete(`/items/${id}`),
  batchDelete: (itemIds) => api.delete('/items/batch', { data: { itemIds } }),
  batchReorder: (items) => api.put('/items/batch/reorder', { items }),
  duplicate: (id) => api.post(`/items/${id}/duplicate`),
};

export const columnApi = {
  getTypes: () => api.get('/columns/types'),
  create: (data) => api.post('/columns', data),
  update: (id, data) => api.put(`/columns/${id}`, data),
  delete: (id) => api.delete(`/columns/${id}`),
  reorder: (boardId, columns) => api.put('/columns/reorder', { boardId, columns }),
  addLabel: (columnId, data) => api.post(`/columns/${columnId}/labels`, data),
  updateLabel: (columnId, labelId, data) => api.put(`/columns/${columnId}/labels/${labelId}`, data),
  deleteLabel: (columnId, labelId) => api.delete(`/columns/${columnId}/labels/${labelId}`),
};

export const userApi = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  search: (params) => api.get('/users/search', { params }),
};

export const notificationApi = {
  getAll: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
};

// Budget API
export const budgetApi = {
  getByWorkspace: (workspaceId) => api.get(`/budgets/workspace/${workspaceId}`),
  getOne: (id) => api.get(`/budgets/${id}`),
  create: (data) => api.post('/budgets', data),
  update: (id, data) => api.put(`/budgets/${id}`, data),
  delete: (id) => api.delete(`/budgets/${id}`),
  getAnalytics: (id) => api.get(`/budgets/${id}/analytics`),
  // Categories
  addCategory: (budgetId, data) => api.post(`/budgets/${budgetId}/categories`, data),
  // Expenses
  addExpense: (budgetId, data) => api.post(`/budgets/${budgetId}/expenses`, data),
  updateExpense: (budgetId, expenseId, data) => api.put(`/budgets/${budgetId}/expenses/${expenseId}`, data),
  deleteExpense: (budgetId, expenseId) => api.delete(`/budgets/${budgetId}/expenses/${expenseId}`),
};

// Member API
export const memberApi = {
  getByWorkspace: (workspaceId) => api.get(`/members/workspace/${workspaceId}`),
  getInvitations: (workspaceId) => api.get(`/members/workspace/${workspaceId}/invitations`),
  invite: (workspaceId, data) => api.post(`/members/workspace/${workspaceId}/invite`, data),
  resendInvitation: (invitationId) => api.post(`/members/invitations/${invitationId}/resend`),
  cancelInvitation: (invitationId) => api.delete(`/members/invitations/${invitationId}`),
  acceptInvitation: (token) => api.post(`/members/invitations/accept/${token}`),
  updateRole: (workspaceId, memberId, data) => api.put(`/members/workspace/${workspaceId}/members/${memberId}/role`, data),
  remove: (workspaceId, memberId) => api.delete(`/members/workspace/${workspaceId}/members/${memberId}`),
  transferOwnership: (workspaceId, data) => api.post(`/members/workspace/${workspaceId}/transfer-ownership`, data),
  // Team evaluation
  getEvaluation: (workspaceId) => api.get(`/members/workspace/${workspaceId}/evaluation`),
};

// SDSI (Schéma Directeur des Systèmes d'Information) API
export const sdsiApi = {
  // Dashboard & Analytics
  getDashboard: (workspaceId) => api.get(`/sdsi/dashboard/workspace/${workspaceId}`),
  getRoadmap: (workspaceId, year) => api.get(`/sdsi/roadmap/workspace/${workspaceId}`, { params: { year } }),
  getAlerts: (workspaceId) => api.get(`/sdsi/alerts/workspace/${workspaceId}`),

  // Strategic Axes
  getAxes: (workspaceId) => api.get(`/sdsi/axes/workspace/${workspaceId}`),
  createAxis: (data) => api.post('/sdsi/axes', data),
  updateAxis: (axisId, data) => api.put(`/sdsi/axes/${axisId}`, data),
  deleteAxis: (axisId) => api.delete(`/sdsi/axes/${axisId}`),

  // Projects
  getProjects: (workspaceId, params) => api.get(`/sdsi/projects/workspace/${workspaceId}`, { params }),
  getProject: (projectId) => api.get(`/sdsi/projects/${projectId}`),
  createProject: (data) => api.post('/sdsi/projects', data),
  updateProject: (projectId, data) => api.put(`/sdsi/projects/${projectId}`, data),
  deleteProject: (projectId) => api.delete(`/sdsi/projects/${projectId}`),

  // Automatic Progress Tracking
  syncProgress: (projectId) => api.post(`/sdsi/projects/${projectId}/sync-progress`),
  checkCompletion: (projectId) => api.post(`/sdsi/projects/${projectId}/check-completion`),

  // Project Phases
  getPhases: (workspaceId, params) => api.get(`/sdsi/phases/workspace/${workspaceId}`, { params }),
  createPhase: (projectId, data) => api.post(`/sdsi/projects/${projectId}/phases`, data),
  updatePhase: (phaseId, data) => api.put(`/sdsi/phases/${phaseId}`, data),
  deletePhase: (phaseId) => api.delete(`/sdsi/phases/${phaseId}`),

  // Milestones
  getMilestones: (workspaceId, params) => api.get(`/sdsi/milestones/workspace/${workspaceId}`, { params }),
  createMilestone: (projectId, data) => api.post(`/sdsi/projects/${projectId}/milestones`, data),
  updateMilestone: (milestoneId, data) => api.put(`/sdsi/milestones/${milestoneId}`, data),
  deleteMilestone: (milestoneId) => api.delete(`/sdsi/milestones/${milestoneId}`),

  // Applications
  getApplications: (workspaceId) => api.get(`/sdsi/applications/workspace/${workspaceId}`),
  createApplication: (data) => api.post('/sdsi/applications', data),
  updateApplication: (appId, data) => api.put(`/sdsi/applications/${appId}`, data),
  deleteApplication: (appId) => api.delete(`/sdsi/applications/${appId}`),

  // KPIs
  getKPIs: (workspaceId) => api.get(`/sdsi/kpis/workspace/${workspaceId}`),
  createKPI: (data) => api.post('/sdsi/kpis', data),
  updateKPI: (kpiId, data) => api.put(`/sdsi/kpis/${kpiId}`, data),
  deleteKPI: (kpiId) => api.delete(`/sdsi/kpis/${kpiId}`),
  addKPIValue: (kpiId, data) => api.post(`/sdsi/kpis/${kpiId}/values`, data),
  getKPIHistory: (kpiId) => api.get(`/sdsi/kpis/${kpiId}/history`),
  
  // KPI Automation
  syncKPI: (kpiId) => api.post(`/sdsi/kpis/${kpiId}/sync`),
  syncProjectKPIs: (projectId) => api.post(`/sdsi/projects/${projectId}/sync-kpis`),
  syncAllKPIs: (workspaceId) => api.post(`/sdsi/kpis/workspace/${workspaceId}/sync-all`),
  getCalculationMethods: () => api.get('/sdsi/kpis/calculation-methods'),

  // Resources
  getResources: (workspaceId) => api.get(`/sdsi/resources/workspace/${workspaceId}`),
  createResource: (data) => api.post('/sdsi/resources', data),
  updateResource: (resourceId, data) => api.put(`/sdsi/resources/${resourceId}`, data),
  deleteResource: (resourceId) => api.delete(`/sdsi/resources/${resourceId}`),
  getResourceAllocations: (resourceId) => api.get(`/sdsi/resources/${resourceId}/allocations`),
  createAllocation: (resourceId, data) => api.post(`/sdsi/resources/${resourceId}/allocations`, data),
  updateAllocation: (allocationId, data) => api.put(`/sdsi/allocations/${allocationId}`, data),
  deleteAllocation: (allocationId) => api.delete(`/sdsi/allocations/${allocationId}`),

  // Risks
  getRisks: (workspaceId, params) => api.get(`/sdsi/risks/workspace/${workspaceId}`, { params }),
  createRisk: (projectId, data) => api.post(`/sdsi/projects/${projectId}/risks`, data),
  updateRisk: (riskId, data) => api.put(`/sdsi/risks/${riskId}`, data),
  deleteRisk: (riskId) => api.delete(`/sdsi/risks/${riskId}`),

  // Project Expenses (Dépenses)
  getExpenses: (projectId) => api.get(`/sdsi/projects/${projectId}/expenses`),
  addExpense: (projectId, data) => api.post(`/sdsi/projects/${projectId}/expenses`, data),
  updateExpense: (expenseId, data) => api.put(`/sdsi/expenses/${expenseId}`, data),
  deleteExpense: (expenseId) => api.delete(`/sdsi/expenses/${expenseId}`),
  getExpenseCategories: () => api.get('/sdsi/expense-categories'),
};

// Comments API
export const commentApi = {
  getByItem: (itemId) => api.get(`/comments/item/${itemId}`),
  create: (data) => api.post('/comments', data),
  update: (commentId, data) => api.put(`/comments/${commentId}`, data),
  delete: (commentId) => api.delete(`/comments/${commentId}`),
};

// Subtasks API
export const subtaskApi = {
  getByItem: (itemId) => api.get(`/subtasks/item/${itemId}`),
  getProgress: (itemId) => api.get(`/subtasks/item/${itemId}/progress`),
  create: (data) => api.post('/subtasks', data),
  update: (subtaskId, data) => api.put(`/subtasks/${subtaskId}`, data),
  toggle: (subtaskId) => api.put(`/subtasks/${subtaskId}/toggle`),
  delete: (subtaskId) => api.delete(`/subtasks/${subtaskId}`),
  reorder: (itemId, subtasks) => api.put(`/subtasks/item/${itemId}/reorder`, { subtasks }),
};

// Activity API
export const activityApi = {
  getByWorkspace: (workspaceId, params) => api.get(`/activity/workspace/${workspaceId}`, { params }),
  getByBoard: (boardId, params) => api.get(`/activity/board/${boardId}`, { params }),
  getByItem: (itemId) => api.get(`/activity/item/${itemId}`),
  getMy: (params) => api.get('/activity/me', { params }),
};

// Search API
export const searchApi = {
  global: (params) => api.get('/search', { params }),
  quick: (params) => api.get('/search/quick', { params }),
};

// Export API
export const exportApi = {
  board: (boardId, format) => api.get(`/export/board/${boardId}`, { 
    params: { format },
    ...(format === 'csv' ? { responseType: 'blob' } : {})
  }),
  workspace: (workspaceId) => api.get(`/export/workspace/${workspaceId}`),
};

// Automations API
export const automationApi = {
  getTemplates: () => api.get('/automations/templates'),
  getByBoard: (boardId) => api.get(`/automations/board/${boardId}`),
  create: (data) => api.post('/automations', data),
  update: (automationId, data) => api.put(`/automations/${automationId}`, data),
  toggle: (automationId) => api.post(`/automations/${automationId}/toggle`),
  delete: (automationId) => api.delete(`/automations/${automationId}`),
  trigger: (data) => api.post('/automations/trigger', data),
  getLogs: (automationId) => api.get(`/automations/${automationId}/logs`),
};

// Permissions API
export const permissionApi = {
  // Permissions list
  getPermissions: () => api.get('/permissions/list'),
  
  // Roles
  getRoles: (workspaceId) => api.get(`/permissions/roles/workspace/${workspaceId}`),
  createRole: (data) => api.post('/permissions/roles', data),
  updateRole: (roleId, data) => api.put(`/permissions/roles/${roleId}`, data),
  deleteRole: (roleId) => api.delete(`/permissions/roles/${roleId}`),
  
  // User roles
  getUserPermissions: (userId, workspaceId) => api.get(`/permissions/users/${userId}/workspace/${workspaceId}`),
  assignRole: (userId, data) => api.post(`/permissions/users/${userId}/roles`, data),
  removeRole: (userId, roleId, workspaceId) => api.delete(`/permissions/users/${userId}/roles/${roleId}`, { params: { workspaceId } }),
  
  // Board permissions
  getBoardPermissions: (boardId) => api.get(`/permissions/boards/${boardId}`),
  setBoardPermission: (boardId, userId, data) => api.post(`/permissions/boards/${boardId}/users/${userId}`, data),
  removeBoardPermission: (boardId, userId) => api.delete(`/permissions/boards/${boardId}/users/${userId}`),
  
  // Project permissions
  getProjectPermissions: (projectId) => api.get(`/permissions/projects/${projectId}`),
  setProjectPermission: (projectId, userId, data) => api.post(`/permissions/projects/${projectId}/users/${userId}`, data),
  removeProjectPermission: (projectId, userId) => api.delete(`/permissions/projects/${projectId}/users/${userId}`),
  
  // User groups
  getGroups: (workspaceId) => api.get(`/permissions/groups/workspace/${workspaceId}`),
  createGroup: (data) => api.post('/permissions/groups', data),
  updateGroup: (groupId, data) => api.put(`/permissions/groups/${groupId}`, data),
  deleteGroup: (groupId) => api.delete(`/permissions/groups/${groupId}`),
  addGroupMember: (groupId, userId) => api.post(`/permissions/groups/${groupId}/members/${userId}`),
  removeGroupMember: (groupId, userId) => api.delete(`/permissions/groups/${groupId}/members/${userId}`),
  
  // Audit
  getAuditLogs: (workspaceId, params) => api.get(`/permissions/audit/workspace/${workspaceId}`, { params }),
};

// Files API
export const fileApi = {
  upload: async (file, itemId, columnId) => {
    const formData = new FormData();
    formData.append('file', file);
    if (itemId) formData.append('itemId', itemId);
    if (columnId) formData.append('columnId', columnId);
    
    return api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  uploadMultiple: async (files, itemId, columnId) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    if (itemId) formData.append('itemId', itemId);
    if (columnId) formData.append('columnId', columnId);
    
    return api.post('/files/upload-multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  delete: (filename) => api.delete(`/files/${filename}`),
};

// Tickets API (Intervention tickets)
export const ticketApi = {
  // Categories
  getCategories: () => api.get('/tickets/categories'),

  // User routes
  getMyTickets: (params) => api.get('/tickets/my', { params }),
  create: (data) => api.post('/tickets', data),
  get: (ticketId) => api.get(`/tickets/${ticketId}`),
  update: (ticketId, data) => api.put(`/tickets/${ticketId}`, data),
  cancel: (ticketId) => api.delete(`/tickets/${ticketId}`),

  // Admin routes
  getByWorkspace: (workspaceId, params) => api.get(`/tickets/workspace/${workspaceId}`, { params }),
  getStats: (workspaceId) => api.get(`/tickets/workspace/${workspaceId}/stats`),
  assign: (ticketId, data) => api.put(`/tickets/${ticketId}/assign`, data),
  updateStatus: (ticketId, data) => api.put(`/tickets/${ticketId}/status`, data),
};
