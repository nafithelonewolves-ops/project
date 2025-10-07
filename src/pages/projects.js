import { supabase } from '../lib/supabase.js';
import { formatDate, showNotification } from '../lib/utils.js';

export async function renderProjectList() {
  const app = document.getElementById('app');

  app.innerHTML = `
    <div class="navbar">
      <div class="navbar-container">
        <a href="/" class="navbar-brand">IoT Dashboard</a>
        <ul class="navbar-nav">
          <li><a href="/" class="nav-link">Home</a></li>
          <li><a href="/firmware" class="nav-link">Firmware</a></li>
          <li><a href="/devices" class="nav-link">Devices</a></li>
          <li><a href="/projects" class="nav-link active">Projects</a></li>
        </ul>
      </div>
    </div>

    <div class="container">
      <div class="page-header">
        <h1 class="page-title">Projects</h1>
        <p class="page-description">Manage your IoT projects</p>
      </div>

      <div class="card">
        <h2 class="card-title">All Projects</h2>
        <div id="project-list">
          <div class="loading">Loading projects...</div>
        </div>
      </div>
    </div>
  `;

  loadProjectList();

  window.updateActiveNav('projects');
}

async function loadProjectList() {
  const listContainer = document.getElementById('project-list');

  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    listContainer.innerHTML = `<div class="empty-state">Error loading projects: ${error.message}</div>`;
    return;
  }

  if (!projects || projects.length === 0) {
    listContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📊</div>
        <p>No projects created yet</p>
      </div>
    `;
    return;
  }

  const projectsWithDevices = await Promise.all(
    projects.map(async (project) => {
      const { count } = await supabase
        .from('devices')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', project.project_id);

      return { ...project, deviceCount: count || 0 };
    })
  );

  listContainer.innerHTML = `
    <div class="grid grid-2">
      ${projectsWithDevices.map(project => `
        <div class="project-card" onclick="window.router.navigate('/project?id=${project.project_id}')">
          <div class="project-type">
            <span class="badge badge-info">${project.project_type.replace('_', ' ')}</span>
          </div>
          <div class="project-name">${project.project_name}</div>
          <div class="project-id">${project.project_id}</div>
          <div style="margin-top: 0.75rem; font-size: 0.875rem; color: var(--text-secondary);">
            ${project.deviceCount} device${project.deviceCount !== 1 ? 's' : ''}
          </div>
          <div style="margin-top: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">
            Created ${formatDate(project.created_at)}
          </div>
          <div style="margin-top: 0.75rem;">
            <button
              class="btn btn-small btn-danger"
              onclick="event.stopPropagation(); deleteProject('${project.project_id}')"
            >
              Delete
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

window.deleteProject = async function(projectId) {
  const apiKey = prompt('Enter API key to delete project:');

  if (!apiKey) {
    return;
  }

  if (apiKey !== 'demo-api-key-12345') {
    showNotification('Invalid API key', 'error');
    return;
  }

  if (!confirm('Are you sure you want to delete this project? This will also delete all associated devices.')) {
    return;
  }

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('project_id', projectId);

  if (error) {
    showNotification('Error deleting project: ' + error.message, 'error');
    return;
  }

  showNotification('Project deleted successfully', 'success');
  loadProjectList();
};
