import { supabase } from '../lib/supabase.js';
import { formatDate, showNotification } from '../lib/utils.js';

export async function renderWaterPumpDashboard(project) {
  const app = document.getElementById('app');

  const { data: devices } = await supabase
    .from('devices')
    .select('*')
    .eq('project_id', project.project_id);

  const { data: telemetryData, count: telemetryCount } = await supabase
    .from('wp_samples')
    .select('*', { count: 'exact' })
    .eq('project_id', project.project_id)
    .order('ts_utc', { ascending: false })
    .limit(20);

  const { data: mlModels } = await supabase
    .from('ml_models')
    .select('*')
    .eq('project_id', project.project_id)
    .order('created_at', { ascending: false });


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
        <h1 class="page-title">${project.project_name}</h1>
        <p class="page-description">
          <span class="badge badge-info">Water Pump</span>
          Project ID: ${project.project_id}
        </p>
      </div>

      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
          <div>
            <h2 class="card-title" style="margin: 0;">Telemetry Data</h2>
            <p style="margin: 0.5rem 0 0 0; color: var(--text-secondary); font-size: 0.875rem;">
              Total samples: ${telemetryCount || 0}
            </p>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn-danger" onclick="deleteAllTelemetry('${project.project_id}')" ${!telemetryCount ? 'disabled' : ''}>
              Clear All Data
            </button>
          </div>
        </div>
        ${telemetryData && telemetryData.length > 0 ? `
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Device</th>
                  <th>Level (%)</th>
                  <th>Pump</th>
                  <th>Flow Out (LPM)</th>
                  <th>Flow In (LPM)</th>
                  <th>Net Flow (LPM)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${telemetryData.map(sample => `
                  <tr>
                    <td>${formatDate(sample.ts_utc)}</td>
                    <td style="font-family: monospace; font-size: 0.875rem;">${sample.device_id}</td>
                    <td>${sample.level_pct !== null ? sample.level_pct + '%' : 'N/A'}</td>
                    <td>${sample.pump_on ? '<span class="badge badge-success">ON</span>' : '<span class="badge badge-secondary">OFF</span>'}</td>
                    <td>${sample.flow_out_lpm !== null ? sample.flow_out_lpm : 'N/A'}</td>
                    <td>${sample.flow_in_lpm !== null ? sample.flow_in_lpm : 'N/A'}</td>
                    <td style="color: ${sample.net_flow_lpm > 0 ? 'var(--success)' : sample.net_flow_lpm < 0 ? 'var(--danger)' : 'inherit'};">
                      ${sample.net_flow_lpm !== null ? sample.net_flow_lpm : 'N/A'}
                    </td>
                    <td>
                      <button class="btn btn-small btn-danger" onclick="deleteTelemetrySample(${sample.id})">Delete</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ${telemetryCount > 20 ? `<p style="margin-top: 1rem; color: var(--text-secondary); font-size: 0.875rem;">Showing 20 of ${telemetryCount} samples</p>` : ''}
        ` : `
          <div class="empty-state">
            <div class="empty-state-icon">📊</div>
            <p>No telemetry data available</p>
          </div>
        `}
      </div>

      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
          <h2 class="card-title" style="margin: 0;">ML Models</h2>
          <button class="btn btn-primary" onclick="trainModel('${project.project_id}')" ${!telemetryCount || telemetryCount < 10 ? 'disabled' : ''}>
            Train & Generate TFLite Model
          </button>
        </div>
        ${mlModels && mlModels.length > 0 ? `
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Created</th>
                  <th>Filename</th>
                  <th>Type</th>
                  <th>Training Samples</th>
                  <th>Size</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${mlModels.map(model => `
                  <tr>
                    <td>${formatDate(model.created_at)}</td>
                    <td style="font-family: monospace; font-size: 0.875rem;">${model.filename}</td>
                    <td><span class="badge badge-info">${model.model_type}</span></td>
                    <td>${model.training_samples}</td>
                    <td>${model.size_bytes ? (model.size_bytes / 1024).toFixed(2) + ' KB' : 'N/A'}</td>
                    <td>
                      <button class="btn btn-small btn-primary" onclick="downloadModel(${model.id}, '${model.filename}')">Download</button>
                      <button class="btn btn-small btn-danger" onclick="deleteModel(${model.id})">Delete</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : `
          <div class="empty-state">
            <div class="empty-state-icon">🤖</div>
            <p>No trained models available</p>
            <p style="margin-top: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">
              ${telemetryCount < 10 ? `Need at least 10 telemetry samples to train (currently ${telemetryCount || 0})` : 'Click "Train & Generate TFLite Model" to create your first model'}
            </p>
          </div>
        `}
      </div>

      <div class="card">
        <h2 class="card-title">Connected Devices</h2>
        ${devices && devices.length > 0 ? `
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Device ID</th>
                  <th>Role</th>
                  <th>Auto Update</th>
                  <th>Tank Shape</th>
                  <th>Dimensions</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${devices.map(device => `
                  <tr>
                    <td style="font-family: monospace;">${device.device_id}</td>
                    <td><span class="badge ${device.role === 'beta' ? 'badge-warning' : 'badge-secondary'}">${device.role}</span></td>
                    <td>${device.auto_update ? '✓' : '✗'}</td>
                    <td>${device.tank_shape || 'N/A'}</td>
                    <td>${device.height_cm ? `H: ${device.height_cm}cm` : ''} ${device.width_cm ? `W: ${device.width_cm}cm` : ''}</td>
                    <td>
                      <button class="btn btn-small btn-primary" onclick="window.router.navigate('/device/edit?id=${device.device_id}')">Edit</button>
                      <button class="btn btn-small btn-danger" onclick="deleteDevice('${device.device_id}')">Delete</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : `
          <div class="empty-state">
            <div class="empty-state-icon">📱</div>
            <p>No devices connected to this project</p>
          </div>
        `}
      </div>

      <div class="actions">
        <button class="btn btn-secondary" onclick="window.router.navigate('/projects')">Back to Projects</button>
      </div>
    </div>
  `;

  window.updateActiveNav('projects');
}

window.deleteTelemetrySample = async function(sampleId) {
  if (!confirm('Delete this telemetry sample?')) return;

  const { error } = await supabase
    .from('wp_samples')
    .delete()
    .eq('id', sampleId);

  if (error) {
    showNotification('Error deleting sample: ' + error.message, 'error');
    return;
  }

  showNotification('Sample deleted successfully', 'success');
  window.location.reload();
};

window.deleteAllTelemetry = async function(projectId) {
  if (!confirm('Delete ALL telemetry data for this project? This cannot be undone!')) return;

  const { error } = await supabase
    .from('wp_samples')
    .delete()
    .eq('project_id', projectId);

  if (error) {
    showNotification('Error deleting telemetry data: ' + error.message, 'error');
    return;
  }

  showNotification('All telemetry data deleted successfully', 'success');
  window.location.reload();
};

window.deleteDevice = async function(deviceId) {
  if (!confirm('Delete this device? This cannot be undone!')) return;

  const { error } = await supabase
    .from('devices')
    .delete()
    .eq('device_id', deviceId);

  if (error) {
    showNotification('Error deleting device: ' + error.message, 'error');
    return;
  }

  showNotification('Device deleted successfully', 'success');
  window.location.reload();
};

window.trainModel = async function(projectId) {
  showNotification('Training model... This may take a minute', 'info');

  try {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/train-model`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ project_id: projectId })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }

    const result = await response.json();
    showNotification('Model trained successfully! ' + result.training_samples + ' samples used', 'success');
    window.location.reload();
  } catch (error) {
    showNotification('Error training model: ' + error.message, 'error');
  }
};

window.downloadModel = async function(modelId, filename) {
  try {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/download-model?id=${modelId}`;
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      }
    });

    if (!response.ok) {
      throw new Error('Failed to download model');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    showNotification('Model downloaded successfully', 'success');
  } catch (error) {
    showNotification('Error downloading model: ' + error.message, 'error');
  }
};

window.deleteModel = async function(modelId) {
  if (!confirm('Delete this model? This cannot be undone!')) return;

  const { error } = await supabase
    .from('ml_models')
    .delete()
    .eq('id', modelId);

  if (error) {
    showNotification('Error deleting model: ' + error.message, 'error');
    return;
  }

  showNotification('Model deleted successfully', 'success');
  window.location.reload();
};
