import { supabase } from '../lib/supabase.js';
import { formatDate } from '../lib/utils.js';

export async function renderDeviceTelemetry(params) {
  const deviceId = params.get('id');

  if (!deviceId) {
    window.router.navigate('/devices');
    return;
  }

  const app = document.getElementById('app');

  const { data: device, error: deviceError } = await supabase
    .from('devices')
    .select('*, projects (project_name, project_type)')
    .eq('device_id', deviceId)
    .maybeSingle();

  if (deviceError || !device) {
    app.innerHTML = `
      <div class="navbar">
        <div class="navbar-container">
          <a href="/" class="navbar-brand">IoT Dashboard</a>
          <ul class="navbar-nav">
            <li><a href="/" class="nav-link">Home</a></li>
            <li><a href="/firmware" class="nav-link">Firmware</a></li>
            <li><a href="/devices" class="nav-link active">Devices</a></li>
            <li><a href="/projects" class="nav-link">Projects</a></li>
          </ul>
        </div>
      </div>
      <div class="container">
        <div class="empty-state">Device not found</div>
      </div>
    `;
    return;
  }

  const projectType = device.projects?.project_type;

  if (projectType === 'water_pump') {
    await renderWaterPumpTelemetry(device);
  } else if (projectType === 'smart_light') {
    await renderSmartLightTelemetry(device);
  } else {
    app.innerHTML = `
      <div class="navbar">
        <div class="navbar-container">
          <a href="/" class="navbar-brand">IoT Dashboard</a>
          <ul class="navbar-nav">
            <li><a href="/" class="nav-link">Home</a></li>
            <li><a href="/firmware" class="nav-link">Firmware</a></li>
            <li><a href="/devices" class="nav-link active">Devices</a></li>
            <li><a href="/projects" class="nav-link">Projects</a></li>
          </ul>
        </div>
      </div>
      <div class="container">
        <div class="empty-state">Unknown project type</div>
      </div>
    `;
  }
}

async function renderWaterPumpTelemetry(device) {
  const app = document.getElementById('app');

  const { data: samples } = await supabase
    .from('wp_samples')
    .select('*')
    .eq('device_id', device.device_id)
    .order('ts_utc', { ascending: false })
    .limit(100);

  const latestSample = samples && samples.length > 0 ? samples[0] : null;

  app.innerHTML = `
    <div class="navbar">
      <div class="navbar-container">
        <a href="/" class="navbar-brand">IoT Dashboard</a>
        <ul class="navbar-nav">
          <li><a href="/" class="nav-link">Home</a></li>
          <li><a href="/firmware" class="nav-link">Firmware</a></li>
          <li><a href="/devices" class="nav-link active">Devices</a></li>
          <li><a href="/projects" class="nav-link">Projects</a></li>
        </ul>
      </div>
    </div>

    <div class="container">
      <div class="page-header">
        <h1 class="page-title">Device Telemetry</h1>
        <p class="page-description">
          <span class="badge badge-info">Water Pump</span>
          Device: ${device.device_id}
        </p>
      </div>

      ${latestSample ? `
        <div class="grid grid-3">
          <div class="stat-card">
            <div class="stat-value">${latestSample.level_pct?.toFixed(1) || 0}%</div>
            <div class="stat-label">Water Level</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${latestSample.pump_on ? 'ON' : 'OFF'}</div>
            <div class="stat-label">Pump Status</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${latestSample.net_flow_lpm?.toFixed(2) || 0}</div>
            <div class="stat-label">Net Flow (L/min)</div>
          </div>
        </div>
      ` : ''}

      <div class="card">
        <h2 class="card-title">Telemetry Data</h2>
        ${samples && samples.length > 0 ? `
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Level %</th>
                  <th>Pump</th>
                  <th>Flow Out (L/min)</th>
                  <th>Flow In (L/min)</th>
                  <th>Net Flow (L/min)</th>
                </tr>
              </thead>
              <tbody>
                ${samples.map(sample => `
                  <tr>
                    <td>${formatDate(sample.ts_utc)}</td>
                    <td>${sample.level_pct?.toFixed(1) || 0}%</td>
                    <td><span class="badge ${sample.pump_on ? 'badge-success' : 'badge-secondary'}">${sample.pump_on ? 'ON' : 'OFF'}</span></td>
                    <td>${sample.flow_out_lpm?.toFixed(2) || 0}</td>
                    <td>${sample.flow_in_lpm?.toFixed(2) || 0}</td>
                    <td>${sample.net_flow_lpm?.toFixed(2) || 0}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : `
          <div class="empty-state">
            <div class="empty-state-icon">📊</div>
            <p>No telemetry data available yet</p>
          </div>
        `}
      </div>

      <div class="actions">
        <button class="btn btn-secondary" onclick="window.router.navigate('/devices')">Back to Devices</button>
      </div>
    </div>
  `;

  window.updateActiveNav('devices');
}

async function renderSmartLightTelemetry(device) {
  const app = document.getElementById('app');

  const { data: samples } = await supabase
    .from('sl_samples')
    .select('*')
    .eq('device_id', device.device_id)
    .order('ts_utc', { ascending: false })
    .limit(100);

  const latestSample = samples && samples.length > 0 ? samples[0] : null;

  app.innerHTML = `
    <div class="navbar">
      <div class="navbar-container">
        <a href="/" class="navbar-brand">IoT Dashboard</a>
        <ul class="navbar-nav">
          <li><a href="/" class="nav-link">Home</a></li>
          <li><a href="/firmware" class="nav-link">Firmware</a></li>
          <li><a href="/devices" class="nav-link active">Devices</a></li>
          <li><a href="/projects" class="nav-link">Projects</a></li>
        </ul>
      </div>
    </div>

    <div class="container">
      <div class="page-header">
        <h1 class="page-title">Device Telemetry</h1>
        <p class="page-description">
          <span class="badge badge-info">Smart Light</span>
          Device: ${device.device_id}
        </p>
      </div>

      ${latestSample ? `
        <div class="grid grid-3">
          <div class="stat-card">
            <div class="stat-value">${latestSample.brightness || 0}%</div>
            <div class="stat-label">Brightness</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${latestSample.power_w?.toFixed(1) || 0}W</div>
            <div class="stat-label">Power Consumption</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${latestSample.color_temp || 0}K</div>
            <div class="stat-label">Color Temperature</div>
          </div>
        </div>
      ` : ''}

      <div class="card">
        <h2 class="card-title">Telemetry Data</h2>
        ${samples && samples.length > 0 ? `
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Brightness (%)</th>
                  <th>Power (W)</th>
                  <th>Color Temp (K)</th>
                </tr>
              </thead>
              <tbody>
                ${samples.map(sample => `
                  <tr>
                    <td>${formatDate(sample.ts_utc)}</td>
                    <td>${sample.brightness || 0}%</td>
                    <td>${sample.power_w?.toFixed(2) || 0}W</td>
                    <td>${sample.color_temp || 0}K</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : `
          <div class="empty-state">
            <div class="empty-state-icon">📊</div>
            <p>No telemetry data available yet</p>
          </div>
        `}
      </div>

      <div class="actions">
        <button class="btn btn-secondary" onclick="window.router.navigate('/devices')">Back to Devices</button>
      </div>
    </div>
  `;

  window.updateActiveNav('devices');
}
