import { router } from './lib/router.js';
import { renderHome } from './pages/home.js';
import { renderFirmware } from './pages/firmware.js';
import { renderDeviceList, renderDeviceEdit } from './pages/devices.js';
import { renderProjectList } from './pages/projects.js';
import { renderProjectDetail } from './pages/project-detail.js';
import { renderDeviceTelemetry } from './pages/device-telemetry.js';

window.router = router;

router.register('/', renderHome);
router.register('/firmware', renderFirmware);
router.register('/devices', renderDeviceList);
router.register('/device/edit', renderDeviceEdit);
router.register('/device/telemetry', renderDeviceTelemetry);
router.register('/projects', renderProjectList);
router.register('/project', renderProjectDetail);

router.init();
