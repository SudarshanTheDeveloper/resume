import * as THREE from '../assets/vendor/three.module.min.js';

export function createRenderLab({ paused = false, onStatus }) {
  const canvas = document.querySelector('#scene-canvas');
  const viewport = document.querySelector('#scene-viewport');
  const lab = document.querySelector('#render-lab');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  } catch { return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 600 ? 1.25 : 1.6));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.setClearColor(0x0b1010, 0);

  const world = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 60);
  camera.position.set(5.4, 4, 7.3);
  camera.lookAt(0, -0.15, 0);

  // A small procedural studio provides local reflections with no external textures.
  const studio = new THREE.Scene();
  studio.background = new THREE.Color(0x111b15);
  const lightPanel = (color, intensity, position, scale) => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(...scale), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }));
    mesh.position.set(...position); mesh.lookAt(0, 0, 0); studio.add(mesh);
  };
  lightPanel(0xd8ffdc, 4, [-4, 4, 2], [3, 6]);
  lightPanel(0xffffff, 3.5, [3, 4, 0], [2, 5]);
  lightPanel(0x8abd9e, 2, [0, 0, -4], [4, 2]);
  const environment = new THREE.PMREMGenerator(renderer);
  const environmentTarget = environment.fromScene(studio, .05);
  world.environment = environmentTarget.texture;
  environment.dispose();
  studio.traverse(object => { if (object.isMesh) { object.geometry.dispose(); object.material.dispose(); } });
  world.add(new THREE.HemisphereLight(0xe6ffe9, 0x16261c, 2.7));
  const key = new THREE.DirectionalLight(0xe3ffdb, 4.8); key.position.set(-4, 7, 5); world.add(key);
  const rim = new THREE.DirectionalLight(0x8ac4a3, 3.4); rim.position.set(4, 2, -4); world.add(rim);
  const front = new THREE.PointLight(0xe5f8ea, 15, 15); front.position.set(2, 3, 5); world.add(front);

  const sculpture = new THREE.Group();
  sculpture.position.y = .3; world.add(sculpture);
  const materials = [];
  const ringShape = new THREE.Shape();
  const outer = 1.25, inner = .86, corner = .13;
  function roundedSquare(path, half, radius, clockwise) {
    if (!clockwise) {
      path.moveTo(-half + radius, -half); path.lineTo(half - radius, -half);
      path.quadraticCurveTo(half, -half, half, -half + radius); path.lineTo(half, half - radius);
      path.quadraticCurveTo(half, half, half - radius, half); path.lineTo(-half + radius, half);
      path.quadraticCurveTo(-half, half, -half, half - radius); path.lineTo(-half, -half + radius);
      path.quadraticCurveTo(-half, -half, -half + radius, -half);
    } else {
      path.moveTo(-half + radius, -half); path.quadraticCurveTo(-half, -half, -half, -half + radius);
      path.lineTo(-half, half - radius); path.quadraticCurveTo(-half, half, -half + radius, half);
      path.lineTo(half - radius, half); path.quadraticCurveTo(half, half, half, half - radius);
      path.lineTo(half, -half + radius); path.quadraticCurveTo(half, -half, half - radius, -half);
      path.lineTo(-half + radius, -half);
    }
  }
  roundedSquare(ringShape, outer, corner, false);
  const hole = new THREE.Path(); roundedSquare(hole, inner, .07, true); ringShape.holes.push(hole);
  const frameGeometry = new THREE.ExtrudeGeometry(ringShape, { depth: .24, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: .045, bevelThickness: .045, curveSegments: 5 });
  frameGeometry.center();
  const frameColors = [0xc4e6c7, 0x719b7c, 0x303e33];
  const frameRotations = [[0, 0, 0], [Math.PI / 2, 0, 0], [0, Math.PI / 2, 0]];
  for (let i = 0; i < 3; i++) {
    const material = new THREE.MeshStandardMaterial({ color: frameColors[i], metalness: .77, roughness: .25, envMapIntensity: 1.2 });
    materials.push(material);
    const frame = new THREE.Mesh(frameGeometry, material);
    frame.rotation.set(...frameRotations[i]);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(frameGeometry, 40), new THREE.LineBasicMaterial({ color: i === 0 ? 0xe1ffda : 0x97c49b, transparent: true, opacity: .36 }));
    frame.add(edges); sculpture.add(frame);
  }
  const coreMaterial = new THREE.MeshStandardMaterial({ color: 0x547b5a, metalness: .85, roughness: .15, envMapIntensity: 1.8, flatShading: true });
  materials.push(coreMaterial);
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(.68, 0), coreMaterial);
  core.add(new THREE.LineSegments(new THREE.EdgesGeometry(core.geometry), new THREE.LineBasicMaterial({ color: 0xccffd0, transparent: true, opacity: .6 })));
  sculpture.add(core);
  sculpture.rotation.set(.28, -.35, -.18);

  // Fine ticks, an orbital halo, and a contact shadow make the object feel spatial.
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.95, 2.02, .08, 96), new THREE.MeshStandardMaterial({ color: 0x16251c, metalness: .75, roughness: .42 }));
  pedestal.position.y = -1.72; world.add(pedestal);
  const orbital = new THREE.Group(); orbital.position.y = -1.66; world.add(orbital);
  [1.96, 2.17, 2.4].forEach((radius, i) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, i === 0 ? .009 : .003, 4, 128), new THREE.MeshBasicMaterial({ color: i === 0 ? 0x9bd8a5 : 0x49674e, transparent: true, opacity: i === 0 ? .8 : .55 }));
    ring.rotation.x = Math.PI / 2; orbital.add(ring);
  });
  const tickPoints = [];
  for (let i = 0; i < 80; i++) {
    const angle = i / 80 * Math.PI * 2;
    const length = i % 10 === 0 ? .13 : .045;
    tickPoints.push(new THREE.Vector3(Math.cos(angle) * 2.27, .001, Math.sin(angle) * 2.27), new THREE.Vector3(Math.cos(angle) * (2.27 + length), .001, Math.sin(angle) * (2.27 + length)));
  }
  orbital.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(tickPoints), new THREE.LineBasicMaterial({ color: 0x90b796, transparent: true, opacity: .55 })));
  const shadowCanvas = document.createElement('canvas'); shadowCanvas.width = shadowCanvas.height = 128;
  const shadowContext = shadowCanvas.getContext('2d');
  const gradient = shadowContext.createRadialGradient(64, 64, 3, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(0,0,0,.85)'); gradient.addColorStop(.5, 'rgba(0,0,0,.5)'); gradient.addColorStop(1, 'rgba(0,0,0,0)');
  shadowContext.fillStyle = gradient; shadowContext.fillRect(0, 0, 128, 128);
  const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.6), new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -1.665; world.add(shadow);
  const grid = new THREE.GridHelper(12, 32, 0x324b38, 0x233629);
  grid.position.y = -1.8; grid.material.transparent = true; grid.material.opacity = .17; world.add(grid);

  let visible = true, overlayOpen = false, contextLost = false, dragging = false;
  let targetRotation = -.35, targetTilt = .28, pointerX = 0, elapsed = 0;
  let frameHandle = 0, previousTime = 0, disposed = false;
  let interactionNeeded = true;
  function draw() {
    if (disposed || contextLost) return;
    sculpture.rotation.y = targetRotation;
    sculpture.rotation.x = targetTilt;
    renderer.render(world, camera);
  }
  function resize() {
    const { width, height } = viewport.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false); camera.aspect = width / height;
    // Maintain the entire sculpture and platform in narrow layouts.
    camera.fov = width / height < .8 ? 42 : 35;
    camera.updateProjectionMatrix(); draw();
  }
  function schedule() {
    if (!frameHandle && visible && !document.hidden && !overlayOpen && !contextLost && !disposed && (!paused || interactionNeeded)) frameHandle = requestAnimationFrame(animate);
  }
  function animate(time) {
    frameHandle = 0;
    const delta = previousTime ? Math.min((time - previousTime) / 1000, .05) : 0;
    previousTime = time;
    if (!paused && !dragging) { targetRotation += delta * .13; elapsed += delta; }
    sculpture.position.y = .3 + (paused ? 0 : Math.sin(elapsed * .65) * .08);
    draw(); interactionNeeded = false; schedule();
  }
  function refresh() { interactionNeeded = true; schedule(); }
  function stop() { cancelAnimationFrame(frameHandle); frameHandle = 0; previousTime = 0; }
  const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(viewport);
  const visibilityObserver = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible) refresh(); else stop();
  }, { rootMargin: '80px' }); visibilityObserver.observe(viewport);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else refresh(); });
  viewport.addEventListener('pointerdown', event => {
    if (!event.isPrimary) return;
    dragging = true; pointerX = event.clientX; viewport.setPointerCapture(event.pointerId);
  });
  viewport.addEventListener('pointermove', event => {
    if (!dragging) return;
    targetRotation += (event.clientX - pointerX) * .009; pointerX = event.clientX; refresh();
  });
  function release() { dragging = false; }
  viewport.addEventListener('pointerup', release); viewport.addEventListener('pointercancel', release); viewport.addEventListener('lostpointercapture', release);
  viewport.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home') { targetRotation = -.35; targetTilt = .28; }
    else targetRotation += event.key === 'ArrowLeft' ? -.2 : .2;
    refresh();
  });
  document.querySelectorAll('[data-scene-mode]').forEach(button => button.addEventListener('click', () => {
    const wireframe = button.dataset.sceneMode === 'wireframe';
    materials.forEach(material => { material.wireframe = wireframe; });
    document.querySelectorAll('[data-scene-mode]').forEach(mode => mode.setAttribute('aria-pressed', String(mode === button)));
    onStatus(wireframe ? 'Wireframe rendering enabled.' : 'Shaded rendering enabled.'); refresh();
  }));
  document.querySelector('#scene-reset').addEventListener('click', () => {
    targetRotation = -.35; targetTilt = .28; elapsed = 0;
    onStatus('3D view reset.'); refresh();
  });
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault(); contextLost = true; stop(); lab.classList.remove('scene-ready');
    document.querySelector('#scene-hint').textContent = 'Static preview';
    onStatus('Interactive rendering paused by the browser. Showing a static preview.');
  });
  canvas.addEventListener('webglcontextrestored', () => {
    contextLost = false; lab.classList.add('scene-ready');
    document.querySelector('#scene-hint').textContent = 'Drag to orbit ↔'; refresh();
  });
  resize(); lab.classList.add('scene-ready'); schedule();
  // Useful diagnostics, based on the actual scene rather than decorative counters.
  viewport.dataset.renderer = 'webgl';
  return {
    setPaused(value) { paused = value; stop(); refresh(); },
    setOverlayOpen(value) { overlayOpen = value; if (value) stop(); else refresh(); },
    dispose() {
      disposed = true; stop(); resizeObserver.disconnect(); visibilityObserver.disconnect();
      const geometries = new Set(), allMaterials = new Set();
      world.traverse(object => {
        if (object.geometry) geometries.add(object.geometry);
        if (object.material) (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => allMaterials.add(material));
      });
      geometries.forEach(geometry => geometry.dispose()); allMaterials.forEach(material => material.dispose());
      shadowTexture.dispose(); environmentTarget.dispose(); renderer.dispose();
    }
  };
}
