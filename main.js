import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const rendererContainer = document.getElementById('renderer-container');
const latitudeInput = document.getElementById('latitude');
const timezoneInput = document.getElementById('timezone');
const orientationInput = document.getElementById('orientation');
const daySlider = document.getElementById('day-of-year');
const timeSlider = document.getElementById('time-of-day');
const dateDisplay = document.getElementById('date-display');
const timeDisplay = document.getElementById('time-display');
const altitudeDisplay = document.getElementById('altitude-display');
const azimuthDisplay = document.getElementById('azimuth-display');
const shadowLengthDisplay = document.getElementById('shadow-length-display');
const animateDayButton = document.getElementById('animate-day');
const animateYearButton = document.getElementById('animate-year');
const resetViewButton = document.getElementById('reset-view');

const structuresContainer = document.getElementById('structures-container');
const addStructureButton = document.getElementById('add-structure');
const structureTemplate = document.getElementById('structure-template');

const solarChartCanvas = document.getElementById('solar-chart');
const solarChartCtx = solarChartCanvas.getContext('2d');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050914);

const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 500);
camera.position.set(12, 10, 12);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setPixelRatio(window.devicePixelRatio);
rendererContainer.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, 2.5, 0);

const ambientLight = new THREE.AmbientLight(0x8899aa, 0.45);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xfff4cc, 1.2);
sunLight.castShadow = true;
sunLight.shadow.bias = -0.0002;
sunLight.shadow.mapSize.set(2048, 2048);
const camSize = 30;
sunLight.shadow.camera.near = 1;
sunLight.shadow.camera.far = 120;
sunLight.shadow.camera.left = -camSize;
sunLight.shadow.camera.right = camSize;
sunLight.shadow.camera.top = camSize;
sunLight.shadow.camera.bottom = -camSize;
scene.add(sunLight);
scene.add(sunLight.target);

const groundGeometry = new THREE.PlaneGeometry(80, 80);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.9, metalness: 0.05 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const grid = new THREE.GridHelper(60, 30, 0x3b82f6, 0x1e293b);
grid.position.y = 0.01;
scene.add(grid);

const structureGroup = new THREE.Group();
scene.add(structureGroup);

const canopyMaterial = new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.35, metalness: 0.2 });
const columnMaterial = new THREE.MeshStandardMaterial({ color: 0x22d3ee, roughness: 0.4, metalness: 0.25 });

const axisHelper = new THREE.AxesHelper(3);
axisHelper.position.set(0, 0.02, 0);
scene.add(axisHelper);

const compassGroup = new THREE.Group();
compassGroup.position.set(-12, 0.02, -12);
scene.add(compassGroup);

const compassRadius = 3.2;
const compassBase = new THREE.CircleGeometry(compassRadius, 64);
const compassBaseMaterial = new THREE.MeshBasicMaterial({ color: 0x111827, transparent: true, opacity: 0.7, side: THREE.DoubleSide });
const compassBaseMesh = new THREE.Mesh(compassBase, compassBaseMaterial);
compassBaseMesh.rotation.x = -Math.PI / 2;
compassGroup.add(compassBaseMesh);

const compassRingGeometry = new THREE.RingGeometry(compassRadius - 0.08, compassRadius, 64);
const compassRingMaterial = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.6, side: THREE.DoubleSide });
const compassRing = new THREE.Mesh(compassRingGeometry, compassRingMaterial);
compassRing.rotation.x = -Math.PI / 2;
compassGroup.add(compassRing);

const cardinalMaterial = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.55 });
const northSouthGeometry = new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(0, 0.01, -compassRadius),
  new THREE.Vector3(0, 0.01, compassRadius),
]);
compassGroup.add(new THREE.Line(northSouthGeometry, cardinalMaterial));

const eastWestGeometry = new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(-compassRadius, 0.01, 0),
  new THREE.Vector3(compassRadius, 0.01, 0),
]);
compassGroup.add(new THREE.Line(eastWestGeometry, cardinalMaterial));

const northArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0.05, 0), compassRadius - 0.6, 0xfacc15, 0.6, 0.3);
compassGroup.add(northArrow);

function createLabelSprite(text, color = '#bae6fd') {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.font = 'bold 180px "Inter", "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(text, size / 2, size / 2 + 12);
  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 8;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(1.4, 1.4, 1.4);
  return sprite;
}

const labelN = createLabelSprite('N');
labelN.position.set(0, 0.02, compassRadius + 0.6);
compassGroup.add(labelN);

const labelS = createLabelSprite('S');
labelS.position.set(0, 0.02, -compassRadius - 0.6);
compassGroup.add(labelS);

const labelE = createLabelSprite('L');
labelE.position.set(compassRadius + 0.6, 0.02, 0);
compassGroup.add(labelE);

const labelW = createLabelSprite('O');
labelW.position.set(-compassRadius - 0.6, 0.02, 0);
compassGroup.add(labelW);

const structures = new Map();
let structureCounter = 0;

const referenceYear = new Date().getUTCFullYear();
let animationMode = null;
let animationStart = 0;
const animationDurations = {
  day: 20000,
  year: 25000,
};

let annualSunPaths = [];
let dailySunPath = [];
let currentSunInfo = null;
let chartPixelRatio = window.devicePixelRatio || 1;

const monthLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function mergeStructureData(initial = {}) {
  return {
    label: initial.label ?? '',
    enabled: initial.enabled !== undefined ? initial.enabled : true,
    type: initial.type || 'horizontal',
    horizontal: {
      length: initial.horizontal?.length ?? 4,
      width: initial.horizontal?.width ?? 3,
      thickness: initial.horizontal?.thickness ?? 0.25,
      height: initial.horizontal?.height ?? 3,
      offsetX: initial.horizontal?.offsetX ?? 0,
      offsetZ: initial.horizontal?.offsetZ ?? 0,
    },
    vertical: {
      profile: initial.vertical?.profile || 'circular',
      radius: initial.vertical?.radius ?? 0.3,
      width: initial.vertical?.width ?? 0.4,
      depth: initial.vertical?.depth ?? 0.4,
      height: initial.vertical?.height ?? 3,
      offsetX: initial.vertical?.offsetX ?? 0,
      offsetZ: initial.vertical?.offsetZ ?? 0,
    },
  };
}

function sanitizeNumber(value, fallback, min) {
  const parsed = parseFloat(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  if (typeof min === 'number') {
    return Math.max(parsed, min);
  }
  return parsed;
}

function updateStructureVisibility(structure) {
  const type = structure.ui.type ? structure.ui.type.value : structure.data.type;
  const isHorizontal = type === 'horizontal';
  if (structure.ui.sections.horizontal) {
    structure.ui.sections.horizontal.classList.toggle('hidden', !isHorizontal);
  }
  if (structure.ui.sections.vertical) {
    structure.ui.sections.vertical.classList.toggle('hidden', isHorizontal);
  }
}

function updateProfileVisibility(structure) {
  const profile = structure.ui.profileSelect ? structure.ui.profileSelect.value : structure.data.vertical.profile;
  if (structure.ui.profileGroups.circular) {
    structure.ui.profileGroups.circular.classList.toggle('hidden', profile !== 'circular');
  }
  if (structure.ui.profileGroups.rectangular) {
    structure.ui.profileGroups.rectangular.classList.toggle('hidden', profile !== 'rectangular');
  }
}

function updateStructurePlaceholder(structure) {
  if (!structure.ui.label) {
    return;
  }
  const type = structure.ui.type ? structure.ui.type.value : structure.data.type;
  const placeholder = type === 'horizontal' ? 'Marquise' : 'Coluna';
  structure.ui.label.placeholder = placeholder;
}

function parseStructureInputs(structure) {
  const data = structure.data;
  if (structure.ui.enabled) {
    data.enabled = structure.ui.enabled.checked;
  }
  if (structure.ui.label) {
    data.label = structure.ui.label.value.trim();
  }
  if (structure.ui.type) {
    data.type = structure.ui.type.value;
  }

  const hInputs = structure.ui.horizontalInputs;
  const h = data.horizontal;
  if (hInputs.length) {
    h.length = sanitizeNumber(hInputs.length.value, h.length, 0.1);
  }
  if (hInputs.width) {
    h.width = sanitizeNumber(hInputs.width.value, h.width, 0.1);
  }
  if (hInputs.thickness) {
    h.thickness = sanitizeNumber(hInputs.thickness.value, h.thickness, 0.05);
  }
  if (hInputs.height) {
    h.height = sanitizeNumber(hInputs.height.value, h.height, 0);
  }
  if (hInputs.offsetX) {
    h.offsetX = sanitizeNumber(hInputs.offsetX.value, h.offsetX ?? 0);
  }
  if (hInputs.offsetZ) {
    h.offsetZ = sanitizeNumber(hInputs.offsetZ.value, h.offsetZ ?? 0);
  }

  const vInputs = structure.ui.verticalInputs;
  const v = data.vertical;
  if (structure.ui.profileSelect) {
    v.profile = structure.ui.profileSelect.value;
  }
  if (vInputs.radius) {
    v.radius = sanitizeNumber(vInputs.radius.value, v.radius, 0.05);
  }
  if (vInputs.width) {
    v.width = sanitizeNumber(vInputs.width.value, v.width, 0.05);
  }
  if (vInputs.depth) {
    v.depth = sanitizeNumber(vInputs.depth.value, v.depth, 0.05);
  }
  if (vInputs.height) {
    v.height = sanitizeNumber(vInputs.height.value, v.height, 0.1);
  }
  if (vInputs.offsetX) {
    v.offsetX = sanitizeNumber(vInputs.offsetX.value, v.offsetX ?? 0);
  }
  if (vInputs.offsetZ) {
    v.offsetZ = sanitizeNumber(vInputs.offsetZ.value, v.offsetZ ?? 0);
  }

  return data;
}

function getStructureDisplayName(structure) {
  if (structure.data.label) {
    return structure.data.label;
  }
  return structure.data.type === 'horizontal' ? 'Marquise' : 'Coluna';
}

function refreshStructureTitles() {
  const fieldsets = Array.from(structuresContainer.querySelectorAll('[data-structure]'));
  fieldsets.forEach((fieldset, index) => {
    const structure = structures.get(fieldset.dataset.structureId);
    if (!structure) {
      return;
    }
    structure.ui.title.textContent = `Elemento ${index + 1}: ${getStructureDisplayName(structure)}`;
  });
}

function disposeMesh(mesh) {
  if (!mesh) {
    return;
  }
  if (mesh.geometry) {
    mesh.geometry.dispose();
  }
}

function rebuildStructure(structure) {
  if (structure.mesh) {
    structureGroup.remove(structure.mesh);
    disposeMesh(structure.mesh);
    structure.mesh = null;
  }

  if (!structure.data.enabled) {
    return;
  }

  let mesh;
  if (structure.data.type === 'horizontal') {
    const { length, width, thickness, height, offsetX, offsetZ } = structure.data.horizontal;
    const geometry = new THREE.BoxGeometry(Math.max(length, 0.1), Math.max(thickness, 0.05), Math.max(width, 0.1));
    mesh = new THREE.Mesh(geometry, canopyMaterial);
    mesh.position.set(offsetX, height + Math.max(thickness, 0.05) / 2, offsetZ);
  } else {
    const { profile, radius, width, depth, height, offsetX, offsetZ } = structure.data.vertical;
    let geometry;
    if (profile === 'rectangular') {
      geometry = new THREE.BoxGeometry(Math.max(width, 0.05), Math.max(height, 0.1), Math.max(depth, 0.05));
    } else {
      const finalRadius = Math.max(radius, 0.05);
      geometry = new THREE.CylinderGeometry(finalRadius, finalRadius, Math.max(height, 0.1), 48);
    }
    mesh = new THREE.Mesh(geometry, columnMaterial);
    mesh.position.set(offsetX, Math.max(height, 0.1) / 2, offsetZ);
  }

  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.structureId = structure.id;

  structure.mesh = mesh;
  structureGroup.add(mesh);
}

function rebuildAllStructures() {
  structures.forEach((structure) => rebuildStructure(structure));
}

function handleStructureInput(structure) {
  stopAnimation();
  parseStructureInputs(structure);
  rebuildStructure(structure);
  updateScene();
}

function removeStructure(structureId) {
  const structure = structures.get(structureId);
  if (!structure) {
    return;
  }
  stopAnimation();
  if (structure.mesh) {
    structureGroup.remove(structure.mesh);
    disposeMesh(structure.mesh);
  }
  if (structure.fieldset.parentElement) {
    structure.fieldset.parentElement.removeChild(structure.fieldset);
  }
  structures.delete(structureId);
  refreshStructureTitles();
  updateScene();
}

function createStructure(dataInput = {}) {
  const data = mergeStructureData(dataInput);
  const fragment = structureTemplate.content.cloneNode(true);
  const fieldset = fragment.querySelector('[data-structure]');
  if (!fieldset) {
    console.error('Template de estrutura ausente: não foi possível criar o elemento.');
    return null;
  }
  const id = `structure-${++structureCounter}`;
  fieldset.dataset.structureId = id;

  const titleEl = fieldset.querySelector('.structure-title');
  const removeButton = fieldset.querySelector('.remove-structure');
  const enabledInput = fieldset.querySelector('[data-field="enabled"]');
  const labelInput = fieldset.querySelector('[data-field="label"]');
  const typeSelect = fieldset.querySelector('[data-field="type"]');

  const horizontalSection = fieldset.querySelector('.horizontal-config');
  const verticalSection = fieldset.querySelector('.vertical-config');
  const profileSelect = verticalSection.querySelector('[data-param="profile"]');
  const circularGroup = verticalSection.querySelector('[data-profile="circular"]');
  const rectangularGroup = verticalSection.querySelector('[data-profile="rectangular"]');

  const criticalElements = [
    ['title', titleEl],
    ['removeButton', removeButton],
    ['enabled', enabledInput],
    ['label', labelInput],
    ['type', typeSelect],
    ['horizontalSection', horizontalSection],
    ['verticalSection', verticalSection],
    ['profileSelect', profileSelect],
  ];

  const missingCritical = criticalElements.filter(([, element]) => !element);
  if (missingCritical.length) {
    console.error(
      `Template incompleto para o elemento ${id}: faltam ${missingCritical.map(([name]) => name).join(', ')}`,
    );
    return null;
  }

  const horizontalInputs = {
    length: horizontalSection.querySelector('[data-param="length"]'),
    width: horizontalSection.querySelector('[data-param="width"]'),
    thickness: horizontalSection.querySelector('[data-param="thickness"]'),
    height: horizontalSection.querySelector('[data-param="height"]'),
    offsetX: horizontalSection.querySelector('[data-param="offsetX"]'),
    offsetZ: horizontalSection.querySelector('[data-param="offsetZ"]'),
  };

  const verticalInputs = {
    profile: profileSelect,
    radius: verticalSection.querySelector('[data-param="radius"]'),
    width: verticalSection.querySelector('[data-param="width"]'),
    depth: verticalSection.querySelector('[data-param="depth"]'),
    height: verticalSection.querySelector('[data-param="height"]'),
    offsetX: verticalSection.querySelector('[data-param="offsetX"]'),
    offsetZ: verticalSection.querySelector('[data-param="offsetZ"]'),
  };

  enabledInput.checked = data.enabled;
  labelInput.value = data.label;
  typeSelect.value = data.type;

  const h = data.horizontal;
  Object.entries(horizontalInputs).forEach(([key, input]) => {
    if (!input) {
      return;
    }
    const value = h[key];
    input.value = value ?? '';
  });

  const v = data.vertical;
  profileSelect.value = v.profile;
  Object.entries(verticalInputs).forEach(([key, input]) => {
    if (!input || key === 'profile') {
      return;
    }
    const value = v[key];
    input.value = value ?? '';
  });

  structuresContainer.appendChild(fieldset);

  const structure = {
    id,
    fieldset,
    data,
    mesh: null,
    ui: {
      title: titleEl,
      removeButton,
      enabled: enabledInput,
      label: labelInput,
      type: typeSelect,
      sections: {
        horizontal: horizontalSection,
        vertical: verticalSection,
      },
      profileSelect,
      profileGroups: {
        circular: circularGroup,
        rectangular: rectangularGroup,
      },
      horizontalInputs,
      verticalInputs,
    },
  };

  structures.set(id, structure);

  updateStructureVisibility(structure);
  updateProfileVisibility(structure);
  updateStructurePlaceholder(structure);
  parseStructureInputs(structure);
  rebuildStructure(structure);
  refreshStructureTitles();

  removeButton.addEventListener('click', () => removeStructure(structure.id));

  enabledInput.addEventListener('change', () => {
    structure.data.enabled = enabledInput.checked;
    handleStructureInput(structure);
  });

  labelInput.addEventListener('input', () => {
    structure.data.label = labelInput.value.trim();
    refreshStructureTitles();
  });

  typeSelect.addEventListener('change', () => {
    structure.data.type = typeSelect.value;
    updateStructureVisibility(structure);
    updateStructurePlaceholder(structure);
    handleStructureInput(structure);
    refreshStructureTitles();
  });

  profileSelect.addEventListener('change', () => {
    structure.data.vertical.profile = profileSelect.value;
    updateProfileVisibility(structure);
    handleStructureInput(structure);
  });

  const numericInputs = [
    horizontalInputs.length,
    horizontalInputs.width,
    horizontalInputs.thickness,
    horizontalInputs.height,
    horizontalInputs.offsetX,
    horizontalInputs.offsetZ,
    verticalInputs.radius,
    verticalInputs.width,
    verticalInputs.depth,
    verticalInputs.height,
    verticalInputs.offsetX,
    verticalInputs.offsetZ,
  ];

  numericInputs
    .filter((input) => input && typeof input.addEventListener === 'function')
    .forEach((input) => {
      input.addEventListener('input', () => handleStructureInput(structure));
    });

  return structure;
}

function computeAnnualSunPaths(latitude, timezone) {
  const year = referenceYear;
  const result = [];
  for (let month = 0; month < 12; month += 1) {
    const sampleDay = 15;
    const points = [];
    for (let hour = 0; hour < 24; hour += 1) {
      const dateUTC = new Date(Date.UTC(year, month, sampleDay, hour - timezone));
      const { altitude, azimuth } = getSunPosition(dateUTC, latitude, timezone);
      points.push({ altitude, azimuth });
    }
    result.push({ month, points });
  }
  return result;
}

function computeDailySunPath(dayOfYear, latitude, timezone) {
  const year = referenceYear;
  const points = [];
  for (let hour = 0; hour < 24; hour += 0.5) {
    const hours = Math.floor(hour);
    const minutes = Math.round((hour - hours) * 60);
    const dateUTC = new Date(Date.UTC(year, 0, dayOfYear, hours - timezone, minutes));
    const { altitude, azimuth } = getSunPosition(dateUTC, latitude, timezone);
    points.push({ altitude, azimuth });
  }
  return points;
}

function resizeRenderer() {
  const { clientWidth, clientHeight } = rendererContainer;
  const width = clientWidth || rendererContainer.parentElement.clientWidth;
  const height = clientHeight || rendererContainer.parentElement.clientHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function resizeSolarChartCanvas() {
  const rect = solarChartCanvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  chartPixelRatio = dpr;
  solarChartCanvas.width = Math.max(rect.width * dpr, 1);
  solarChartCanvas.height = Math.max(rect.height * dpr, 1);
}

function getDateFromDay(dayOfYear, year) {
  return new Date(Date.UTC(year, 0, dayOfYear));
}

function getFormattedDate(dayOfYear, year) {
  const date = getDateFromDay(dayOfYear, year);
  const formatter = new Intl.DateTimeFormat('pt-BR', { month: 'long', day: 'numeric' });
  return formatter.format(date);
}

function updateDateDisplay() {
  dateDisplay.textContent = getFormattedDate(Number(daySlider.value), referenceYear);
}

function updateTimeDisplay() {
  const timeValue = parseFloat(timeSlider.value);
  const hours = Math.floor(timeValue);
  const minutes = Math.round((timeValue - hours) * 60);
  timeDisplay.textContent = `${String(hours).padStart(2, '0')}h${String(minutes).padStart(2, '0')}`;
}

function updateStructureOrientation() {
  const orientationDegrees = parseFloat(orientationInput.value) || 0;
  structureGroup.rotation.y = THREE.MathUtils.degToRad(orientationDegrees);
}

function getSunPosition(dateUTC, latitude, timezoneOffset) {
  const latRad = THREE.MathUtils.degToRad(latitude);
  const timezoneHours = timezoneOffset;
  const localDate = new Date(dateUTC.getTime() + timezoneHours * 3600 * 1000);
  const startOfYear = Date.UTC(localDate.getUTCFullYear(), 0, 0);
  const dayOfYear = Math.floor((localDate.getTime() - startOfYear) / 86400000);

  const localMinutes = localDate.getUTCHours() * 60 + localDate.getUTCMinutes() + localDate.getUTCSeconds() / 60;
  const gamma = (2 * Math.PI / 365) * (dayOfYear - 1 + localMinutes / 1440);

  const equationOfTime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));

  const declination =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);

  let trueSolarTime = localMinutes + equationOfTime;
  trueSolarTime = ((trueSolarTime % 1440) + 1440) % 1440;

  const hourAngleDeg = trueSolarTime / 4 - 180;
  const hourAngle = THREE.MathUtils.degToRad(hourAngleDeg);

  const cosineZenith =
    Math.sin(latRad) * Math.sin(declination) +
    Math.cos(latRad) * Math.cos(declination) * Math.cos(hourAngle);

  const zenith = Math.acos(Math.min(Math.max(cosineZenith, -1), 1));
  const altitude = Math.PI / 2 - zenith;

  let azimuth = Math.atan2(
    Math.sin(hourAngle),
    Math.cos(hourAngle) * Math.sin(latRad) - Math.tan(declination) * Math.cos(latRad)
  );
  azimuth = (azimuth + Math.PI * 2) % (Math.PI * 2);

  return { altitude, azimuth, hourAngleDeg };
}

function updateSunLight() {
  const latitude = parseFloat(latitudeInput.value);
  const timezoneOffset = parseFloat(timezoneInput.value);
  const dayOfYear = Number(daySlider.value);
  const timeValue = parseFloat(timeSlider.value);
  const hours = Math.floor(timeValue);
  const minutes = Math.round((timeValue - hours) * 60);
  const dateUTC = new Date(Date.UTC(referenceYear, 0, dayOfYear, hours - timezoneOffset, minutes));

  const { altitude, azimuth } = getSunPosition(dateUTC, latitude, timezoneOffset);

  const altitudeDeg = THREE.MathUtils.radToDeg(altitude);
  const azimuthDeg = THREE.MathUtils.radToDeg(azimuth);
  altitudeDisplay.textContent = `${altitudeDeg.toFixed(1)}°`;
  azimuthDisplay.textContent = `${azimuthDeg.toFixed(1)}°`;

  let shadowLength = null;

  if (altitude > 0) {
    sunLight.intensity = 1.25;
    const distance = 60;
    const x = distance * Math.sin(azimuth) * Math.cos(altitude);
    const y = distance * Math.sin(altitude);
    const z = distance * Math.cos(azimuth) * Math.cos(altitude);
    sunLight.position.set(x, y, z);
    sunLight.target.position.set(0, 0, 0);
    sunLight.target.updateMatrixWorld();

    const tangent = Math.tan(altitude);
    shadowLength = Math.abs(tangent) > 1e-4 ? Math.abs(1 / tangent) : 999;
  } else {
    sunLight.intensity = 0;
  }

  return { altitude, azimuth, altitudeDeg, azimuthDeg, shadowLength };
}

function updateShadowDisplay(sunInfo) {
  if (!sunInfo || sunInfo.altitude <= 0 || !Number.isFinite(sunInfo.shadowLength)) {
    shadowLengthDisplay.textContent = '—';
    return;
  }
  if (sunInfo.shadowLength >= 999) {
    shadowLengthDisplay.textContent = '> 100 m';
    return;
  }
  shadowLengthDisplay.textContent = `${sunInfo.shadowLength.toFixed(2)} m`;
}

function getChartPoint(altitude, azimuth, radius, centerX, centerY) {
  const altDeg = THREE.MathUtils.radToDeg(altitude);
  if (altDeg <= 0) {
    return null;
  }
  const r = (1 - altDeg / 90) * radius;
  const x = centerX + r * Math.sin(azimuth);
  const y = centerY - r * Math.cos(azimuth);
  return { x, y, altDeg };
}

function drawSolarChart(sunInfo) {
  if (!solarChartCtx) {
    return;
  }
  const width = solarChartCanvas.width / chartPixelRatio;
  const height = solarChartCanvas.height / chartPixelRatio;
  if (!width || !height) {
    return;
  }

  if (solarChartCtx.resetTransform) {
    solarChartCtx.resetTransform();
  } else {
    solarChartCtx.setTransform(1, 0, 0, 1, 0, 0);
  }
  solarChartCtx.setTransform(chartPixelRatio, 0, 0, chartPixelRatio, 0, 0);

  solarChartCtx.clearRect(0, 0, width, height);

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 18;

  solarChartCtx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  solarChartCtx.fillRect(0, 0, width, height);

  solarChartCtx.beginPath();
  solarChartCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  solarChartCtx.strokeStyle = 'rgba(59, 130, 246, 0.35)';
  solarChartCtx.lineWidth = 1.5;
  solarChartCtx.stroke();

  const altitudeSteps = [15, 30, 45, 60];
  altitudeSteps.forEach((alt) => {
    const r = (1 - alt / 90) * radius;
    solarChartCtx.beginPath();
    solarChartCtx.arc(centerX, centerY, r, 0, Math.PI * 2);
    solarChartCtx.strokeStyle = 'rgba(148, 163, 184, 0.18)';
    solarChartCtx.lineWidth = 1;
    solarChartCtx.stroke();

    solarChartCtx.fillStyle = 'rgba(148, 163, 184, 0.6)';
    solarChartCtx.font = '11px "Inter", "Segoe UI", sans-serif';
    solarChartCtx.textAlign = 'left';
    solarChartCtx.textBaseline = 'middle';
    solarChartCtx.fillText(`${alt}°`, centerX + r + 6, centerY);
  });

  solarChartCtx.fillStyle = 'rgba(226, 232, 240, 0.8)';
  solarChartCtx.font = '13px "Inter", "Segoe UI", sans-serif';
  const cardinals = [
    { label: 'N', angle: 0 },
    { label: 'L', angle: Math.PI / 2 },
    { label: 'S', angle: Math.PI },
    { label: 'O', angle: (3 * Math.PI) / 2 },
  ];
  cardinals.forEach(({ label, angle }) => {
    solarChartCtx.beginPath();
    solarChartCtx.moveTo(centerX, centerY);
    solarChartCtx.lineTo(centerX + radius * Math.sin(angle), centerY - radius * Math.cos(angle));
    solarChartCtx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
    solarChartCtx.lineWidth = 1;
    solarChartCtx.stroke();

    const x = centerX + (radius + 12) * Math.sin(angle);
    const y = centerY - (radius + 12) * Math.cos(angle);
    solarChartCtx.textAlign = 'center';
    solarChartCtx.textBaseline = 'middle';
    solarChartCtx.fillText(label, x, y);
  });

  solarChartCtx.beginPath();
  solarChartCtx.arc(centerX, centerY, 3, 0, Math.PI * 2);
  solarChartCtx.fillStyle = 'rgba(148, 163, 184, 0.8)';
  solarChartCtx.fill();

  annualSunPaths.forEach((path, index) => {
    solarChartCtx.beginPath();
    let started = false;
    path.points.forEach((point) => {
      const coords = getChartPoint(point.altitude, point.azimuth, radius, centerX, centerY);
      if (!coords) {
        started = false;
        return;
      }
      if (!started) {
        solarChartCtx.moveTo(coords.x, coords.y);
        started = true;
      } else {
        solarChartCtx.lineTo(coords.x, coords.y);
      }
    });
    solarChartCtx.strokeStyle = `hsla(${200 + index * 3}, 75%, 60%, 0.35)`;
    solarChartCtx.lineWidth = 1.2;
    solarChartCtx.stroke();

    const middayPoint = path.points[12];
    const middayCoords = middayPoint ? getChartPoint(middayPoint.altitude, middayPoint.azimuth, radius, centerX, centerY) : null;
    if (middayCoords) {
      solarChartCtx.fillStyle = 'rgba(94, 234, 212, 0.6)';
      solarChartCtx.font = '11px "Inter", "Segoe UI", sans-serif';
      solarChartCtx.textAlign = 'center';
      solarChartCtx.textBaseline = 'bottom';
      solarChartCtx.fillText(monthLabels[path.month], middayCoords.x, middayCoords.y - 4);
    }
  });

  if (dailySunPath.length) {
    solarChartCtx.beginPath();
    let started = false;
    dailySunPath.forEach((point) => {
      const coords = getChartPoint(point.altitude, point.azimuth, radius, centerX, centerY);
      if (!coords) {
        started = false;
        return;
      }
      if (!started) {
        solarChartCtx.moveTo(coords.x, coords.y);
        started = true;
      } else {
        solarChartCtx.lineTo(coords.x, coords.y);
      }
    });
    solarChartCtx.strokeStyle = 'rgba(34, 211, 238, 0.9)';
    solarChartCtx.lineWidth = 2.2;
    solarChartCtx.stroke();
  }

  if (sunInfo && sunInfo.altitude > 0) {
    const sunCoords = getChartPoint(sunInfo.altitude, sunInfo.azimuth, radius, centerX, centerY);
    if (sunCoords) {
      solarChartCtx.beginPath();
      solarChartCtx.arc(sunCoords.x, sunCoords.y, 5, 0, Math.PI * 2);
      solarChartCtx.fillStyle = '#facc15';
      solarChartCtx.fill();
      solarChartCtx.strokeStyle = 'rgba(250, 204, 21, 0.35)';
      solarChartCtx.lineWidth = 2;
      solarChartCtx.stroke();
    }

    if (sunInfo.shadowLength !== null) {
      const maxShadow = 12;
      const clamped = Math.min(sunInfo.shadowLength, maxShadow);
      const normalized = clamped / maxShadow;
      const shadowRadius = normalized * radius;
      const shadowAngle = (sunInfo.azimuth + Math.PI) % (Math.PI * 2);
      const xShadow = centerX + shadowRadius * Math.sin(shadowAngle);
      const yShadow = centerY - shadowRadius * Math.cos(shadowAngle);

      solarChartCtx.beginPath();
      solarChartCtx.moveTo(centerX, centerY);
      solarChartCtx.lineTo(xShadow, yShadow);
      solarChartCtx.strokeStyle = 'rgba(248, 113, 113, 0.85)';
      solarChartCtx.lineWidth = 2.2;
      solarChartCtx.stroke();

      solarChartCtx.beginPath();
      solarChartCtx.arc(xShadow, yShadow, 3.2, 0, Math.PI * 2);
      solarChartCtx.fillStyle = 'rgba(248, 113, 113, 0.9)';
      solarChartCtx.fill();
    }
  }
}

function updateScene() {
  updateDateDisplay();
  updateTimeDisplay();
  updateStructureOrientation();
  const sunInfo = updateSunLight();
  updateShadowDisplay(sunInfo);
  currentSunInfo = sunInfo;
  drawSolarChart(sunInfo);
}

function refreshDailySunPath() {
  const latitude = parseFloat(latitudeInput.value);
  const timezoneOffset = parseFloat(timezoneInput.value);
  const day = Number(daySlider.value);
  dailySunPath = computeDailySunPath(day, latitude, timezoneOffset);
}

function refreshSunPathData() {
  const latitude = parseFloat(latitudeInput.value);
  const timezoneOffset = parseFloat(timezoneInput.value);
  annualSunPaths = computeAnnualSunPaths(latitude, timezoneOffset);
  refreshDailySunPath();
}

function animate(timestamp) {
  requestAnimationFrame(animate);
  if (animationMode) {
    const duration = animationDurations[animationMode];
    const elapsed = (timestamp - animationStart) % duration;
    const progress = elapsed / duration;

    if (animationMode === 'day') {
      timeSlider.value = (progress * 24).toFixed(2);
    } else if (animationMode === 'year') {
      const newDay = Math.floor(progress * 365) + 1;
      if (Number(daySlider.value) !== newDay) {
        daySlider.value = newDay;
        refreshDailySunPath();
      }
    }
    updateScene();
  }

  controls.update();
  renderer.render(scene, camera);
}

function stopAnimation() {
  animationMode = null;
}

animateDayButton.addEventListener('click', () => {
  if (animationMode === 'day') {
    stopAnimation();
  } else {
    animationMode = 'day';
    animationStart = performance.now();
  }
});

animateYearButton.addEventListener('click', () => {
  if (animationMode === 'year') {
    stopAnimation();
  } else {
    animationMode = 'year';
    animationStart = performance.now();
  }
});

resetViewButton.addEventListener('click', () => {
  stopAnimation();
  controls.reset();
  camera.position.set(12, 10, 12);
  controls.target.set(0, 2.5, 0);
});

latitudeInput.addEventListener('input', () => {
  stopAnimation();
  refreshSunPathData();
  updateScene();
});

timezoneInput.addEventListener('input', () => {
  stopAnimation();
  refreshSunPathData();
  updateScene();
});

orientationInput.addEventListener('input', () => {
  stopAnimation();
  updateScene();
});

daySlider.addEventListener('input', () => {
  stopAnimation();
  refreshDailySunPath();
  updateScene();
});

timeSlider.addEventListener('input', () => {
  stopAnimation();
  updateScene();
});

addStructureButton.addEventListener('click', () => {
  const newStructure = createStructure({
    label: `Estrutura ${structures.size + 1}`,
    type: 'horizontal',
    enabled: true,
  });
  if (!newStructure) {
    return;
  }
  newStructure.fieldset.scrollIntoView({ behavior: 'smooth', block: 'center' });
  updateScene();
});

const initialStructures = [
  {
    label: 'Marquise',
    type: 'horizontal',
    enabled: true,
    horizontal: { length: 6, width: 3.5, thickness: 0.3, height: 3.2, offsetX: 0, offsetZ: 0 },
  },
  {
    label: 'Coluna',
    type: 'vertical',
    enabled: true,
    vertical: { profile: 'circular', radius: 0.4, width: 0.5, depth: 0.5, height: 3.2, offsetX: -2.5, offsetZ: 1.2 },
  },
];

initialStructures.forEach((config) => {
  const structure = createStructure(config);
  if (!structure) {
    console.warn('Não foi possível inicializar um elemento de exemplo.', config);
  }
});

refreshStructureTitles();
rebuildAllStructures();
resizeRenderer();
resizeSolarChartCanvas();
refreshSunPathData();
updateScene();
requestAnimationFrame(animate);

window.addEventListener('resize', () => {
  resizeRenderer();
  resizeSolarChartCanvas();
  drawSolarChart(currentSunInfo);
});

