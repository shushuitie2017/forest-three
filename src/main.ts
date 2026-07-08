import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const canvas = document.querySelector<HTMLCanvasElement>('#scene');

if (!canvas) {
  throw new Error('Canvas element was not found.');
}

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  canvas,
  powerPreference: 'high-performance',
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.35;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearColor(0x081831, 1);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0b2138, 0.026);

const camera = new THREE.OrthographicCamera(-12, 12, 8, -8, 0.1, 100);
camera.position.set(12, 10.5, 12);
camera.lookAt(0, 0, 0);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minZoom = 0.75;
controls.maxZoom = 1.55;
controls.target.set(0, 0.6, 0);

const textureLoader = new THREE.TextureLoader();
const publicAssetUrl = (path: string): string => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
const atlasUrl = publicAssetUrl('textures/mystic-forest-atlas.png');
const crystalAtlasUrl = publicAssetUrl('textures/crystal-emissive-atlas.png');
const mushroomCapUrl = publicAssetUrl('textures/mushroom-cap-pink-v2.png');

function atlasTile(column: number, row: number): THREE.Texture {
  const texture = textureLoader.load(atlasUrl);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestMipmapNearestFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(1 / 3, 1 / 3);
  texture.offset.set(column / 3, (2 - row) / 3);
  return texture;
}

function crystalTile(column: 0 | 1): THREE.Texture {
  const texture = textureLoader.load(crystalAtlasUrl);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
  texture.repeat.set(1 / 2, 1);
  texture.offset.set(column / 2, 0);
  return texture;
}

function materialTexture(url: string): THREE.Texture {
  const texture = textureLoader.load(url);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
  return texture;
}

const textures = {
  grass: atlasTile(0, 0),
  dirt: atlasTile(1, 0),
  rock: atlasTile(2, 0),
  bark: atlasTile(0, 1),
  pine: atlasTile(1, 1),
  cyanCrystal: crystalTile(0),
  purpleCrystal: crystalTile(1),
  water: atlasTile(1, 2),
  stone: atlasTile(2, 2),
  mushroomCap: materialTexture(mushroomCapUrl),
};

type PlayerDirection = 'down' | 'down-left' | 'left' | 'up-left' | 'up' | 'up-right' | 'right' | 'down-right';
const playerWalkColumns = 2;
const playerWalkRows = 2;
const playerWalkFrameCount = playerWalkColumns * playerWalkRows;
const playerWalkFramesPerSecond = 8;
type CompanionRole = 'thief' | 'swordsman' | 'wizard';
type CompanionRenderVariant = {
  row: number;
  flipX: 1 | -1;
};
const companionWalkColumns = 4;
const companionWalkRows = 4;
const companionWalkFrameCount = companionWalkColumns;
const companionSpriteWidth = 0.78;
const companionSpriteHeight = 1.16;
const companionFramePixelHeight = 96;
const companionFrameBottomPaddingPixels = 6;
const companionFootPaddingWorld = (companionFrameBottomPaddingPixels / companionFramePixelHeight) * companionSpriteHeight;
const companionWalkFramesPerSecond = 8;
const companionIdleFrame = 1;

function playerWalkTexture(direction: PlayerDirection): THREE.Texture {
  const texture = textureLoader.load(publicAssetUrl(`sprites/player-walk-${direction}/sheet-transparent.png`));
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(1 / playerWalkColumns, 1 / playerWalkRows);
  return texture;
}

function companionWalkTexture(role: CompanionRole): THREE.Texture {
  const texture = textureLoader.load(publicAssetUrl(`sprites/companions/${role}/sheet-transparent.png`));
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestMipmapNearestFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(1 / companionWalkColumns, 1 / companionWalkRows);
  return texture;
}

const playerWalkTextures: Record<PlayerDirection, THREE.Texture> = {
  down: playerWalkTexture('down'),
  'down-left': playerWalkTexture('down-left'),
  left: playerWalkTexture('left'),
  'up-left': playerWalkTexture('up-left'),
  up: playerWalkTexture('up'),
  'up-right': playerWalkTexture('up-right'),
  right: playerWalkTexture('right'),
  'down-right': playerWalkTexture('down-right'),
};

const companionWalkTextures: Record<CompanionRole, THREE.Texture> = {
  thief: companionWalkTexture('thief'),
  swordsman: companionWalkTexture('swordsman'),
  wizard: companionWalkTexture('wizard'),
};

const materials = {
  grass: new THREE.MeshStandardMaterial({
    color: 0x8bc46a,
    map: textures.grass,
    roughness: 0.88,
  }),
  dirt: new THREE.MeshStandardMaterial({
    color: 0xb28d67,
    map: textures.dirt,
    roughness: 0.92,
  }),
  rock: new THREE.MeshStandardMaterial({
    color: 0x5d7382,
    map: textures.rock,
    roughness: 0.94,
  }),
  bark: new THREE.MeshStandardMaterial({
    color: 0x684032,
    map: textures.bark,
    roughness: 0.9,
  }),
  pine: new THREE.MeshStandardMaterial({
    color: 0x2d8a62,
    map: textures.pine,
    roughness: 0.86,
  }),
  water: new THREE.MeshStandardMaterial({
    color: 0x32b8d8,
    map: textures.water,
    transparent: true,
    opacity: 0.76,
    emissive: 0x0e6f8f,
    emissiveIntensity: 0.42,
    roughness: 0.36,
    metalness: 0.04,
  }),
  stone: new THREE.MeshStandardMaterial({
    color: 0x9ba9a6,
    map: textures.stone,
    roughness: 0.88,
  }),
  cyanCrystal: new THREE.MeshStandardMaterial({
    color: 0x5feaff,
    map: textures.cyanCrystal,
    emissiveMap: textures.cyanCrystal,
    emissive: 0x0fbfe8,
    emissiveIntensity: 1.35,
    roughness: 0.22,
    metalness: 0.08,
  }),
  purpleCrystal: new THREE.MeshStandardMaterial({
    color: 0xc35cff,
    map: textures.purpleCrystal,
    emissiveMap: textures.purpleCrystal,
    emissive: 0x8e32ff,
    emissiveIntensity: 1.55,
    roughness: 0.22,
    metalness: 0.08,
  }),
  flower: new THREE.MeshStandardMaterial({
    color: 0xff8ec2,
    map: textures.mushroomCap,
    emissiveMap: textures.mushroomCap,
    emissive: 0x7a1f4b,
    emissiveIntensity: 0.22,
    roughness: 0.68,
  }),
  shadow: new THREE.MeshBasicMaterial({
    color: 0x06101c,
    transparent: true,
    opacity: 0.24,
    depthWrite: false,
  }),
};

const terrainGroup = new THREE.Group();
const propGroup = new THREE.Group();
const glowGroup = new THREE.Group();
const companionGroup = new THREE.Group();
const playerGroup = new THREE.Group();
scene.add(terrainGroup, propGroup, glowGroup, companionGroup, playerGroup);

const hemiLight = new THREE.HemisphereLight(0xb7f5ff, 0x213412, 3.2);
scene.add(hemiLight);

const moon = new THREE.DirectionalLight(0xd5ecff, 5.2);
moon.position.set(-8, 14, 8);
moon.castShadow = true;
moon.shadow.mapSize.set(2048, 2048);
moon.shadow.camera.left = -15;
moon.shadow.camera.right = 15;
moon.shadow.camera.top = 15;
moon.shadow.camera.bottom = -15;
scene.add(moon);

const fill = new THREE.DirectionalLight(0x9e7cff, 1.25);
fill.position.set(8, 8, -6);
scene.add(fill);

function addPointLight(color: THREE.ColorRepresentation, position: THREE.Vector3Tuple, intensity = 2.2, distance = 8): void {
  const light = new THREE.PointLight(color, intensity, distance, 2.2);
  light.position.set(...position);
  scene.add(light);
}

addPointLight(0x8f4dff, [0, 2.6, 0], 3.6, 10);
addPointLight(0x20dfff, [-5.5, 1.4, -2.8], 2.1, 8);
addPointLight(0x25e8ff, [5.6, 2.2, -4.2], 2.6, 8);
addPointLight(0xb246ff, [6.8, 2.2, 3.2], 2.2, 8);

const topGrass = [materials.rock, materials.rock, materials.grass, materials.rock, materials.rock, materials.rock];
const topDirt = [materials.rock, materials.rock, materials.dirt, materials.rock, materials.rock, materials.rock];
const topStone = [materials.rock, materials.rock, materials.stone, materials.rock, materials.rock, materials.rock];
const blockGeometry = new THREE.BoxGeometry(1, 1, 1);

function terrainHeight(x: number, z: number): number {
  const edge = Math.max(Math.abs(x) - 5.5, Math.abs(z) - 4.7, 0);
  const ridge =
    0.35 * Math.sin(x * 0.8) +
    0.25 * Math.cos(z * 0.9) +
    0.45 * Math.sin((x + z) * 0.42);
  const plateau = x > 4 && z < -1 ? 0.9 : 0;
  return THREE.MathUtils.clamp(0.65 + edge * 0.45 + ridge + plateau, 0.45, 2.8);
}

function isPath(x: number, z: number): boolean {
  const winding = Math.abs(z - Math.sin(x * 0.7) * 1.15 - x * -0.18) < 0.78;
  const eastPath = Math.abs(x - 5.2) < 0.7 && z > -5.2 && z < 2.5;
  const center = Math.hypot(x, z) < 2.4;
  return winding || eastPath || center;
}

function isWater(x: number, z: number): boolean {
  const stream = Math.abs(x + 4.2 + Math.sin(z * 1.1) * 0.62) < 0.86 && z > -6.3 && z < 5.4;
  const pond = Math.hypot(x + 5.1, z + 0.6) < 1.6;
  return stream || pond;
}

function surfaceHeightAt(x: number, z: number): number {
  const tileX = Math.round(x);
  const tileZ = Math.round(z);
  return isWater(tileX, tileZ) ? 0.22 : terrainHeight(tileX, tileZ) - 0.5;
}

for (let x = -8; x <= 8; x += 1) {
  for (let z = -6; z <= 6; z += 1) {
    const water = isWater(x, z);
    const path = isPath(x, z);
    const height = water ? 0.35 : terrainHeight(x, z);
    const material = water ? topStone : path ? topDirt : Math.hypot(x, z) < 2.7 ? topStone : topGrass;
    const block = new THREE.Mesh(blockGeometry, material);
    block.position.set(x, height / 2 - 0.5, z);
    block.scale.set(1, height, 1);
    block.castShadow = true;
    block.receiveShadow = true;
    terrainGroup.add(block);

    if (water) {
      const waterMesh = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.08, 0.94), materials.water);
      waterMesh.position.set(x, 0.15, z);
      waterMesh.receiveShadow = true;
      terrainGroup.add(waterMesh);
    }
  }
}

function addShadowDisc(x: number, z: number, radius: number): void {
  const disc = new THREE.Mesh(new THREE.CircleGeometry(radius, 18), materials.shadow);
  disc.rotation.x = -Math.PI / 2;
  disc.position.set(x, 0.03, z);
  propGroup.add(disc);
}

function addCrystal(x: number, z: number, color: 'cyan' | 'purple', scale = 1): void {
  const mat = color === 'cyan' ? materials.cyanCrystal : materials.purpleCrystal;
  const main = new THREE.Mesh(new THREE.OctahedronGeometry(0.42 * scale, 0), mat);
  main.scale.set(0.7, 1.75, 0.7);
  main.position.set(x, 0.9 * scale, z);
  main.castShadow = true;
  main.receiveShadow = true;
  propGroup.add(main);

  for (let i = 0; i < 4; i += 1) {
    const angle = (i / 4) * Math.PI * 2 + 0.3;
    const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.22 * scale, 0), mat);
    shard.scale.set(0.55, 1.15, 0.55);
    shard.position.set(x + Math.cos(angle) * 0.62 * scale, 0.34 * scale, z + Math.sin(angle) * 0.62 * scale);
    shard.rotation.y = angle;
    shard.castShadow = true;
    propGroup.add(shard);
  }

  addShadowDisc(x, z, 0.95 * scale);
}

function addPine(x: number, z: number, height = 1.8): void {
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.22, height * 0.75, 5), materials.bark);
  trunk.position.set(x, height * 0.38, z);
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  propGroup.add(trunk);

  for (let i = 0; i < 3; i += 1) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.85 - i * 0.15, 1.05, 5), materials.pine);
    cone.position.set(x, height * 0.75 + i * 0.48, z);
    cone.rotation.y = i * 0.62;
    cone.castShadow = true;
    cone.receiveShadow = true;
    propGroup.add(cone);
  }

  addShadowDisc(x, z, 0.85);
}

function addAncientTree(x: number, z: number, canopyColor = 0x347c4c): void {
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.72, 2.1, 6), materials.bark);
  trunk.position.set(x, 1.0, z);
  trunk.rotation.z = -0.12;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  propGroup.add(trunk);

  const canopyMat = materials.pine.clone();
  canopyMat.color = new THREE.Color(canopyColor);
  const lumps: Array<[number, number, number, number]> = [
    [0, 2.35, 0, 1.18],
    [-0.75, 2.05, 0.1, 0.88],
    [0.68, 2.1, -0.18, 0.82],
    [0.1, 2.75, 0.08, 0.76],
  ];
  for (const [ox, oy, oz, s] of lumps) {
    const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), canopyMat);
    crown.position.set(x + ox, oy, z + oz);
    crown.rotation.set(0.2 + ox, 0.45 + oz, 0.1);
    crown.castShadow = true;
    crown.receiveShadow = true;
    propGroup.add(crown);
  }

  addShadowDisc(x, z, 1.45);
}

function addMushrooms(x: number, z: number): void {
  for (let i = 0; i < 5; i += 1) {
    const angle = i * 1.37;
    const radius = 0.22 + (i % 3) * 0.12;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.22, 5), materials.stone);
    stem.position.set(x + Math.cos(angle) * radius, 0.17, z + Math.sin(angle) * radius);
    propGroup.add(stem);

    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.12, 6), materials.flower);
    cap.position.set(stem.position.x, 0.34, stem.position.z);
    cap.castShadow = true;
    propGroup.add(cap);
  }
}

function addLantern(x: number, z: number, color: THREE.ColorRepresentation): void {
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.18, 0.4, 6), materials.stone);
  base.position.set(x, 0.2, z);
  base.castShadow = true;
  propGroup.add(base);

  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.82, 6), materials.stone);
  post.position.set(x, 0.8, z);
  post.castShadow = true;
  propGroup.add(post);

  const flameMat = color === 0x34f7ff ? materials.cyanCrystal : materials.purpleCrystal;
  const flame = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), flameMat);
  flame.scale.y = 1.35;
  flame.position.set(x, 1.34, z);
  propGroup.add(flame);
  addPointLight(color, [x, 1.35, z], 1.6, 5);
}

function addBridge(): void {
  const plankMat = materials.bark;
  for (let i = 0; i < 5; i += 1) {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 1.6), plankMat);
    plank.position.set(-4.2 + i * 0.34, 0.55, 4.0);
    plank.rotation.y = 0.07;
    plank.castShadow = true;
    plank.receiveShadow = true;
    propGroup.add(plank);
  }

  for (const side of [-0.92, 0.92]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.12, 0.12), plankMat);
    rail.position.set(-3.55, 0.92, 4.0 + side);
    rail.rotation.y = 0.07;
    rail.castShadow = true;
    propGroup.add(rail);
  }
}

function addStoneCircle(): void {
  for (let i = 0; i < 24; i += 1) {
    const radius = i % 2 === 0 ? 1.65 : 2.12;
    const angle = (i / 24) * Math.PI * 2;
    const tile = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.13, 0.3), materials.stone);
    tile.position.set(Math.cos(angle) * radius, 0.18, Math.sin(angle) * radius);
    tile.rotation.y = -angle;
    tile.castShadow = true;
    tile.receiveShadow = true;
    propGroup.add(tile);
  }

  const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.08, 18), materials.stone);
  disc.position.set(0, 0.14, 0);
  disc.receiveShadow = true;
  propGroup.add(disc);
}

addStoneCircle();
addCrystal(0, 0, 'purple', 1.35);
addBridge();

const pines: Array<[number, number, number]> = [
  [-7.2, -5.0, 2.3],
  [-6.5, -2.4, 1.9],
  [-7.6, 1.1, 2.2],
  [-6.2, 4.5, 2.4],
  [-3.3, -5.4, 1.8],
  [2.2, -5.5, 1.85],
  [6.6, -5.2, 2.4],
  [7.3, -2.3, 1.95],
  [7.0, 1.3, 2.15],
  [6.4, 5.0, 2.35],
  [2.8, 5.3, 1.9],
  [-1.8, 5.1, 1.75],
];
pines.forEach(([x, z, h]) => addPine(x, z, h));

addAncientTree(-5.7, -0.9, 0x2f7342);
addAncientTree(3.6, -2.7, 0x2e895f);
addAncientTree(6.3, 2.5, 0x7133a5);

const crystals: Array<[number, number, 'cyan' | 'purple', number]> = [
  [-6.7, 3.0, 'purple', 0.8],
  [-5.0, -3.2, 'cyan', 0.72],
  [-2.2, -2.2, 'cyan', 0.62],
  [3.2, -4.7, 'cyan', 0.66],
  [5.7, -3.1, 'cyan', 0.98],
  [6.8, 2.8, 'purple', 0.85],
  [-1.4, 4.2, 'purple', 0.7],
  [4.4, 1.4, 'cyan', 0.58],
];
crystals.forEach(([x, z, color, scale]) => addCrystal(x, z, color, scale));

const mushroomPatches: Array<[number, number]> = [
  [-2.8, 1.6],
  [2.7, 1.2],
  [4.9, -0.6],
  [-6.1, 1.9],
  [5.3, 4.2],
  [-0.9, -4.6],
];
mushroomPatches.forEach(([x, z]) => addMushrooms(x, z));

addLantern(-1.8, 1.4, 0x34f7ff);
addLantern(2.0, -1.5, 0x34f7ff);
addLantern(4.4, -0.1, 0x9b50ff);
addLantern(-3.9, -2.3, 0x34f7ff);

for (let i = 0; i < 56; i += 1) {
  const x = THREE.MathUtils.seededRandom(i * 13.1) * 15.8 - 7.9;
  const z = THREE.MathUtils.seededRandom(i * 29.7) * 11.4 - 5.7;
  if (isWater(Math.round(x), Math.round(z)) || Math.hypot(x, z) < 2.2) continue;
  const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12 + THREE.MathUtils.seededRandom(i) * 0.16, 0), materials.rock);
  stone.position.set(x, 0.28, z);
  stone.rotation.set(i * 0.2, i * 0.37, i * 0.13);
  stone.castShadow = true;
  stone.receiveShadow = true;
  propGroup.add(stone);
}

const starGeometry = new THREE.BufferGeometry();
const starCount = 180;
const positions = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i += 1) {
  positions[i * 3] = THREE.MathUtils.seededRandom(i * 8.9) * 42 - 21;
  positions[i * 3 + 1] = THREE.MathUtils.seededRandom(i * 14.1) * 8 + 7;
  positions[i * 3 + 2] = THREE.MathUtils.seededRandom(i * 22.5) * 42 - 21;
}
starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const starMaterial = new THREE.PointsMaterial({
  color: 0x8defff,
  size: 0.035,
  transparent: true,
  opacity: 0.72,
  depthWrite: false,
});
glowGroup.add(new THREE.Points(starGeometry, starMaterial));

const playerPosition = new THREE.Vector3(0.65, 0, 1.1);
const playerSpriteWidth = 0.86;
const playerSpriteHeight = 1.32;
const playerFramePixelHeight = 128;
const playerFrameBottomPaddingPixels = 13.5;
const playerFootPaddingWorld = (playerFrameBottomPaddingPixels / playerFramePixelHeight) * playerSpriteHeight;
const playerMaterial = new THREE.MeshBasicMaterial({
  map: playerWalkTextures.down,
  transparent: true,
  depthWrite: false,
  side: THREE.DoubleSide,
});
const playerSprite = new THREE.Mesh(new THREE.PlaneGeometry(playerSpriteWidth, playerSpriteHeight), playerMaterial);
playerSprite.position.y = playerSpriteHeight / 2 - playerFootPaddingWorld;
playerSprite.renderOrder = 10;
playerGroup.add(playerSprite);

const playerShadow = new THREE.Mesh(new THREE.CircleGeometry(0.34, 18), materials.shadow.clone());
playerShadow.rotation.x = -Math.PI / 2;
playerGroup.add(playerShadow);

type Companion = {
  role: CompanionRole;
  position: THREE.Vector3;
  facingWorld: THREE.Vector3;
  material: THREE.MeshBasicMaterial;
  sprite: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  shadow: THREE.Mesh<THREE.CircleGeometry, THREE.Material>;
  texture: THREE.Texture;
  currentFrame: number;
  currentRow: number;
  currentFlipX: 1 | -1;
};

type TrailPoint = {
  position: THREE.Vector3;
  direction: PlayerDirection;
  distance: number;
};

const playerFacingWorld = new THREE.Vector3(0, 0, 1);
const companionSpecs: Array<{ role: CompanionRole; spacing: number }> = [
  { role: 'thief', spacing: 0.78 },
  { role: 'swordsman', spacing: 1.56 },
  { role: 'wizard', spacing: 2.34 },
];
const companionTrail: TrailPoint[] = [];
let companionTrailDistance = 0;

function createCompanion(role: CompanionRole): Companion {
  const texture = companionWalkTextures[role];
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const sprite = new THREE.Mesh(new THREE.PlaneGeometry(companionSpriteWidth, companionSpriteHeight), material);
  sprite.renderOrder = 9;
  companionGroup.add(sprite);

  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.29, 18), materials.shadow.clone());
  shadow.rotation.x = -Math.PI / 2;
  companionGroup.add(shadow);

  return {
    role,
    position: playerPosition.clone(),
    facingWorld: playerFacingWorld.clone(),
    material,
    sprite,
    shadow,
    texture,
    currentFrame: -1,
    currentRow: -1,
    currentFlipX: 1,
  };
}

const companions = companionSpecs.map((spec) => createCompanion(spec.role));

const pressedKeys = new Set<string>();
let currentPlayerDirection: PlayerDirection = 'down';
let currentPlayerTextureDirection: PlayerDirection = 'down';
let currentPlayerFlipX = 1;
let currentPlayerFrame = -1;

function playerRenderVariant(direction: PlayerDirection): { textureDirection: PlayerDirection; flipX: 1 | -1 } {
  switch (direction) {
    case 'right':
      return { textureDirection: 'left', flipX: -1 };
    case 'up-right':
      return { textureDirection: 'up-left', flipX: -1 };
    case 'down-right':
      return { textureDirection: 'down-left', flipX: -1 };
    default:
      return { textureDirection: direction, flipX: 1 };
  }
}

function setPlayerFrame(direction: PlayerDirection, frame: number): void {
  const { textureDirection, flipX } = playerRenderVariant(direction);

  if (direction !== currentPlayerDirection) {
    currentPlayerDirection = direction;
    currentPlayerFrame = -1;
  }

  if (textureDirection !== currentPlayerTextureDirection) {
    currentPlayerTextureDirection = textureDirection;
    playerMaterial.map = playerWalkTextures[textureDirection];
    playerMaterial.needsUpdate = true;
  }

  if (flipX !== currentPlayerFlipX) {
    currentPlayerFlipX = flipX;
    playerSprite.scale.x = flipX;
  }

  if (frame === currentPlayerFrame) return;
  currentPlayerFrame = frame;
  const col = frame % playerWalkColumns;
  const row = Math.floor(frame / playerWalkColumns);
  playerWalkTextures[textureDirection].offset.set(col / playerWalkColumns, (playerWalkRows - 1 - row) / playerWalkRows);
}

function companionRenderVariant(direction: PlayerDirection): CompanionRenderVariant {
  switch (direction) {
    case 'up':
      return { row: 3, flipX: 1 };
    case 'up-left':
      return { row: 2, flipX: 1 };
    case 'up-right':
      return { row: 2, flipX: -1 };
    case 'left':
    case 'down-left':
      return { row: 1, flipX: 1 };
    case 'right':
    case 'down-right':
      return { row: 1, flipX: -1 };
    case 'down':
    default:
      return { row: 0, flipX: 1 };
  }
}

function setCompanionFrame(companion: Companion, direction: PlayerDirection, frame: number): void {
  const { row, flipX } = companionRenderVariant(direction);

  if (flipX !== companion.currentFlipX) {
    companion.currentFlipX = flipX;
    companion.sprite.scale.x = flipX;
  }

  if (frame === companion.currentFrame && row === companion.currentRow) return;
  companion.currentFrame = frame;
  companion.currentRow = row;
  companion.texture.offset.set(frame / companionWalkColumns, (companionWalkRows - 1 - row) / companionWalkRows);
}

function companionFrameForMotion(isWalking: boolean, elapsed: number, index: number): number {
  if (!isWalking) return companionIdleFrame;
  return Math.floor((elapsed + index * 0.11) * companionWalkFramesPerSecond) % companionWalkFrameCount;
}

function initializeCompanionTrail(): void {
  const maxSpacing = companionSpecs[companionSpecs.length - 1].spacing + 0.9;
  companionTrail.length = 0;
  companionTrailDistance = maxSpacing;

  for (let i = 0; i <= 8; i += 1) {
    const distance = (maxSpacing / 8) * i;
    const position = playerPosition.clone().addScaledVector(playerFacingWorld, distance - maxSpacing);
    companionTrail.push({
      position,
      direction: 'down',
      distance,
    });
  }

  companions.forEach((companion, index) => {
    companion.position.copy(playerPosition).addScaledVector(playerFacingWorld, -companionSpecs[index].spacing);
  });
}

function recordCompanionTrail(direction: PlayerDirection): void {
  const lastPoint = companionTrail[companionTrail.length - 1];
  if (!lastPoint) {
    companionTrail.push({
      position: playerPosition.clone(),
      direction,
      distance: companionTrailDistance,
    });
    return;
  }

  const stepDistance = lastPoint.position.distanceTo(playerPosition);
  if (stepDistance < 0.015) {
    lastPoint.direction = direction;
    return;
  }

  companionTrailDistance += stepDistance;
  companionTrail.push({
    position: playerPosition.clone(),
    direction,
    distance: companionTrailDistance,
  });

  const maxTrailLength = companionSpecs[companionSpecs.length - 1].spacing + 1.2;
  while (companionTrail.length > 2 && companionTrailDistance - companionTrail[0].distance > maxTrailLength) {
    companionTrail.shift();
  }
}

function sampleCompanionTrail(spacing: number): { position: THREE.Vector3; direction: PlayerDirection } {
  const firstPoint = companionTrail[0];
  const lastPoint = companionTrail[companionTrail.length - 1];
  if (!firstPoint || !lastPoint) {
    return { position: playerPosition.clone(), direction: currentPlayerDirection };
  }

  const targetDistance = Math.max(lastPoint.distance - spacing, firstPoint.distance);
  for (let i = 1; i < companionTrail.length; i += 1) {
    const previous = companionTrail[i - 1];
    const next = companionTrail[i];
    if (next.distance < targetDistance) continue;
    const segmentLength = Math.max(next.distance - previous.distance, 0.0001);
    const t = THREE.MathUtils.clamp((targetDistance - previous.distance) / segmentLength, 0, 1);
    return {
      position: new THREE.Vector3().lerpVectors(previous.position, next.position, t),
      direction: next.direction,
    };
  }

  return { position: lastPoint.position.clone(), direction: lastPoint.direction };
}

function updatePlayerPlacement(): void {
  const groundY = surfaceHeightAt(playerPosition.x, playerPosition.z);
  playerPosition.y = groundY;
  playerSprite.position.set(playerPosition.x, groundY + playerSpriteHeight / 2 - playerFootPaddingWorld, playerPosition.z);
  playerShadow.position.set(playerPosition.x, groundY + 0.025, playerPosition.z);
}

function updateCompanionPlacement(companion: Companion): void {
  const groundY = surfaceHeightAt(companion.position.x, companion.position.z);
  companion.position.y = groundY;
  companion.sprite.position.set(
    companion.position.x,
    groundY + companionSpriteHeight / 2 - companionFootPaddingWorld,
    companion.position.z,
  );
  companion.shadow.position.set(companion.position.x, groundY + 0.025, companion.position.z);
}

function updateCompanions(delta: number, elapsed: number, leaderMoving: boolean): void {
  const followAlpha = 1 - Math.exp(-delta * 14);

  companions.forEach((companion, index) => {
    const sample = sampleCompanionTrail(companionSpecs[index].spacing);
    const previousPosition = companion.position.clone();
    companion.position.lerp(sample.position, followAlpha);

    const moved = previousPosition.distanceTo(companion.position) > 0.006;
    if (moved) {
      companion.facingWorld.copy(companion.position).sub(previousPosition).normalize();
    }

    const walking = leaderMoving && moved;
    const direction = walking ? directionFromWorldFacing(companion.facingWorld) : sample.direction;
    const frame = companionFrameForMotion(walking, elapsed, index);
    setCompanionFrame(companion, direction, frame);
    updateCompanionPlacement(companion);
  });
}

window.addEventListener('keydown', (event) => {
  pressedKeys.add(event.key.toLowerCase());
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(event.key.toLowerCase())) {
    event.preventDefault();
  }
});

window.addEventListener('keyup', (event) => {
  pressedKeys.delete(event.key.toLowerCase());
});

function cameraGroundBasis(): { right: THREE.Vector3; up: THREE.Vector3 } {
  const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
  const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
  right.y = 0;
  up.y = 0;
  right.normalize();
  up.normalize();
  return { right, up };
}

function directionFromWorldFacing(facing: THREE.Vector3): PlayerDirection {
  const { right, up } = cameraGroundBasis();
  const screenX = facing.dot(right);
  const screenY = facing.dot(up);
  const angle = Math.atan2(screenY, screenX);
  const octant = (Math.round(angle / (Math.PI / 4)) + 8) % 8;
  const directions: PlayerDirection[] = ['right', 'up-right', 'up', 'up-left', 'left', 'down-left', 'down', 'down-right'];
  return directions[octant];
}

function facePlaneToCamera(sprite: THREE.Object3D): void {
  const toCamera = camera.position.clone().sub(sprite.position);
  toCamera.y = 0;
  if (toCamera.lengthSq() > 0.0001) {
    sprite.rotation.y = Math.atan2(toCamera.x, toCamera.z);
  }
}

function updatePlayer(delta: number, elapsed: number): void {
  const inputX = Number(pressedKeys.has('d') || pressedKeys.has('arrowright')) - Number(pressedKeys.has('a') || pressedKeys.has('arrowleft'));
  const inputY = Number(pressedKeys.has('w') || pressedKeys.has('arrowup')) - Number(pressedKeys.has('s') || pressedKeys.has('arrowdown'));
  const { right, up } = cameraGroundBasis();
  const movement = right.multiplyScalar(inputX).add(up.multiplyScalar(inputY));
  let leaderMoving = false;

  if (movement.lengthSq() > 0) {
    leaderMoving = true;
    movement.normalize();
    playerFacingWorld.copy(movement);
    const step = movement.multiplyScalar(delta * 2.5);
    playerPosition.x = THREE.MathUtils.clamp(playerPosition.x + step.x, -7.6, 7.6);
    playerPosition.z = THREE.MathUtils.clamp(playerPosition.z + step.z, -5.6, 5.6);
    const direction = directionFromWorldFacing(playerFacingWorld);
    setPlayerFrame(direction, Math.floor(elapsed * playerWalkFramesPerSecond) % playerWalkFrameCount);
    recordCompanionTrail(direction);

    const follow = new THREE.Vector3(playerPosition.x, 0.6, playerPosition.z);
    const targetDelta = follow.sub(controls.target).multiplyScalar(0.06);
    controls.target.add(targetDelta);
    camera.position.add(targetDelta);
  } else {
    const direction = directionFromWorldFacing(playerFacingWorld);
    setPlayerFrame(direction, 0);
    recordCompanionTrail(direction);
  }

  updatePlayerPlacement();
  updateCompanions(delta, elapsed, leaderMoving);
  facePlaneToCamera(playerSprite);
  companions.forEach((companion) => facePlaneToCamera(companion.sprite));
}

setPlayerFrame('down', 0);
initializeCompanionTrail();
updatePlayerPlacement();
companions.forEach((companion) => {
  setCompanionFrame(companion, 'down', companionIdleFrame);
  updateCompanionPlacement(companion);
});

function resize(): void {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height);
  const aspect = width / height;
  const viewSize = width < 700 ? 9.4 : 7.9;
  camera.left = -viewSize * aspect;
  camera.right = viewSize * aspect;
  camera.top = viewSize;
  camera.bottom = -viewSize;
  camera.updateProjectionMatrix();
}

window.addEventListener('resize', resize);
resize();

const clock = new THREE.Clock();

function animate(): void {
  const delta = clock.getDelta();
  const elapsed = clock.elapsedTime;

  propGroup.children.forEach((child, index) => {
    if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
      if (child.material.emissiveIntensity > 0.9) {
        child.position.y += Math.sin(elapsed * 1.8 + index) * 0.0009;
      }
    }
  });

  glowGroup.rotation.y = elapsed * 0.015;
  updatePlayer(delta, elapsed);
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
