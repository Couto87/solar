import * as THREE from 'https://cdn.skypack.dev/three@0.155.0';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.155.0/examples/jsm/controls/OrbitControls.js';

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
const animateDayButton = document.getElementById('animate-day');
const animateYearButton = document.getElementById('animate-year');
const resetViewButton = document.getElementById('reset-view');

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

const canopyGeometry = new THREE.BoxGeometry(6, 0.3, 3.5);
const canopyMaterial = new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.35, metalness: 0.2 });
const canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
canopy.position.set(0, 3.2, 0);
canopy.castShadow = true;
canopy.receiveShadow = true;
structureGroup.add(canopy);

const columnGeometry = new THREE.CylinderGeometry(0.35, 0.4, 3.2, 32);
const columnMaterial = new THREE.MeshStandardMaterial({ color: 0x22d3ee, roughness: 0.4, metalness: 0.25 });
const column = new THREE.Mesh(columnGeometry, columnMaterial);
column.position.set(-2.5, 1.6, 1.2);
column.castShadow = true;
column.receiveShadow = true;
structureGroup.add(column);

const supportGeometry = new THREE.CylinderGeometry(0.35, 0.35, 3.2, 16);
const support = new THREE.Mesh(supportGeometry, columnMaterial);
support.position.set(2.5, 1.6, -1.2);
support.castShadow = true;
support.receiveShadow = true;
structureGroup.add(support);

const axisHelper = new THREE.AxesHelper(3);
axisHelper.position.set(0, 0.02, 0);
scene.add(axisHelper);

const referenceYear = new Date().getUTCFullYear();
let animationMode = null;
let animationStart = 0;
const animationDurations = {
  day: 20000,
  year: 25000,
};

function resizeRenderer() {
  const { clientWidth, clientHeight } = rendererContainer;
  const width = clientWidth || rendererContainer.parentElement.clientWidth;
  const height = clientHeight || rendererContainer.parentElement.clientHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
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

  if (altitude <= 0) {
    sunLight.intensity = 0;
    return;
  }

  sunLight.intensity = 1.25;
  const distance = 60;
  const x = distance * Math.sin(azimuth) * Math.cos(altitude);
  const y = distance * Math.sin(altitude);
  const z = distance * Math.cos(azimuth) * Math.cos(altitude);
  sunLight.position.set(x, y, z);
  sunLight.target.position.set(0, 0, 0);
  sunLight.target.updateMatrixWorld();
}

function updateScene() {
  updateDateDisplay();
  updateTimeDisplay();
  updateStructureOrientation();
  updateSunLight();
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
      daySlider.value = Math.floor(progress * 365) + 1;
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
  controls.reset();
  camera.position.set(12, 10, 12);
  controls.target.set(0, 2.5, 0);
  stopAnimation();
});

[latitudeInput, timezoneInput, orientationInput, daySlider, timeSlider].forEach((input) => {
  input.addEventListener('input', () => {
    stopAnimation();
    updateScene();
  });
});

window.addEventListener('resize', resizeRenderer);
resizeRenderer();
updateScene();
requestAnimationFrame(animate);
