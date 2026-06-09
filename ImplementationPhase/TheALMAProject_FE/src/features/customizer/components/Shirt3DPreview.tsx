import { Environment, OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import {
	Box3,
	BufferGeometry,
	CanvasTexture,
	Color,
	DoubleSide,
	Float32BufferAttribute,
	LinearFilter,
	LinearMipmapLinearFilter,
	type Material,
	Mesh,
	MeshBasicMaterial,
	Object3D,
	Raycaster,
	SRGBColorSpace,
	type Texture,
	type Object3D as ThreeObject3D,
	Vector3,
} from "three";

type PrintRenderMode = "plane" | "sampledDepth";

type PrintPlaneConfig = {
	position: [number, number, number];
	rotation: [number, number, number];
	size: [number, number];
	renderMode?: PrintRenderMode;
	segments?: [number, number];
	projectionDirection?: [number, number, number];
	maxProjectionDistance?: number;
	surfaceOffset?: number;
	projectionStrength?: number;
	fallbackBend?: number;
	smoothIterations?: number;
	authoredTextureOffset?: [number, number];
	authoredTextureRepeat?: [number, number];
};

type Shirt3DPreviewProps = {
	modelUrl: string;
	shirtColorHex: string;
	canCalibrate?: boolean;
	centerOffset?: [number, number, number] | null;
	frontPrintPlane?: PrintPlaneConfig | null;
	backPrintPlane?: PrintPlaneConfig | null;
	frontDesignTextureUrl?: string | null;
	backDesignTextureUrl?: string | null;
};

type ShirtSceneProps = Pick<
	Shirt3DPreviewProps,
	| "modelUrl"
	| "shirtColorHex"
	| "frontDesignTextureUrl"
	| "backDesignTextureUrl"
> & {
	frontPrintPlane: PrintPlaneConfig;
	backPrintPlane: PrintPlaneConfig;
};

type PrintSide = "front" | "back";

type ProjectionStats = Record<PrintSide, number | null>;

type TextureImageSource = {
	width?: number;
	height?: number;
	naturalWidth?: number;
	naturalHeight?: number;
};

const AUTHORED_PRINT_MESH_NAMES: Record<PrintSide, string[]> = {
	front: ["print_front", "printf_front", "printfront"],
	back: ["print_back", "printback"],
};

const MODEL_CENTER_OFFSET: [number, number, number] = [
	-9.443575220313505, 620.7378559796042, 30.46297532832287,
];

const MODEL_TARGET_CENTER = new Vector3(
	-MODEL_CENTER_OFFSET[0],
	-MODEL_CENTER_OFFSET[1],
	-MODEL_CENTER_OFFSET[2],
);
const MODEL_TARGET_HEIGHT = 1318.6491215978187;

const DEFAULT_SEGMENTS: [number, number] = [24, 32];

const DEFAULT_SURFACE_SETTINGS = {
	renderMode: "sampledDepth" as const,
	maxProjectionDistance: 320,
	surfaceOffset: 0.45,
	projectionStrength: 1,
	fallbackBend: 0.08,
	smoothIterations: 1,
};

const DEFAULT_AUTHORED_FRONT_TEXTURE_OFFSET: [number, number] = [0.23, 0.03];
const DEFAULT_AUTHORED_BACK_TEXTURE_OFFSET: [number, number] = [-0.25, 0.03];
const DEFAULT_AUTHORED_TEXTURE_OFFSET: [number, number] = [0, 0.03];
const DEFAULT_AUTHORED_TEXTURE_REPEAT: [number, number] = [1.03, 0.6];
const AUTHORED_TEXTURE_MIN_SIZE = 2048;
const AUTHORED_TEXTURE_MAX_SIZE = 4096;

const sampledSurfaceGeometryCache = new Map<string, BufferGeometry>();

const SHIRT_NAME_HINTS = [
	"shirt",
	"tshirt",
	"t-shirt",
	"tee",
	"body",
	"fabric",
	"cloth",
	"ao",
	"áo",
];
const NON_SHIRT_NAME_HINTS = [
	"hanger",
	"hook",
	"metal",
	"wood",
	"print",
	"logo",
	"label",
	"tag",
];
const FRONT_PRINT_PLANE: PrintPlaneConfig = {
	position: [0, -620, 119],
	rotation: [0, 0, 0],
	size: [1150, 1438],
	renderMode: "sampledDepth",
	segments: DEFAULT_SEGMENTS,
	projectionDirection: [0, 0, -1],
	maxProjectionDistance: DEFAULT_SURFACE_SETTINGS.maxProjectionDistance,
	surfaceOffset: DEFAULT_SURFACE_SETTINGS.surfaceOffset,
	projectionStrength: DEFAULT_SURFACE_SETTINGS.projectionStrength,
	fallbackBend: DEFAULT_SURFACE_SETTINGS.fallbackBend,
	smoothIterations: DEFAULT_SURFACE_SETTINGS.smoothIterations,
	authoredTextureOffset: DEFAULT_AUTHORED_FRONT_TEXTURE_OFFSET,
	authoredTextureRepeat: DEFAULT_AUTHORED_TEXTURE_REPEAT,
};
const BACK_PRINT_PLANE: PrintPlaneConfig = {
	position: [0, -620, -179],
	rotation: [0, Math.PI, 0],
	size: [1150, 1438],
	renderMode: "sampledDepth",
	segments: DEFAULT_SEGMENTS,
	projectionDirection: [0, 0, 1],
	maxProjectionDistance: DEFAULT_SURFACE_SETTINGS.maxProjectionDistance,
	surfaceOffset: 0.45,
	projectionStrength: DEFAULT_SURFACE_SETTINGS.projectionStrength,
	fallbackBend: DEFAULT_SURFACE_SETTINGS.fallbackBend,
	smoothIterations: DEFAULT_SURFACE_SETTINGS.smoothIterations,
	authoredTextureOffset: DEFAULT_AUTHORED_BACK_TEXTURE_OFFSET,
	authoredTextureRepeat: DEFAULT_AUTHORED_TEXTURE_REPEAT,
};

const getNumberOrDefault = (value: number | undefined, fallback: number) =>
	Number.isFinite(value) ? value : fallback;

const getTupleOrDefault = <
	T extends [number, number] | [number, number, number],
>(
	value: T | undefined,
	fallback: T,
) => (value ? ([...value] as T) : ([...fallback] as T));

const normalizePrintPlaneConfig = (
	config: PrintPlaneConfig,
	fallback: PrintPlaneConfig,
): PrintPlaneConfig => ({
	position: getTupleOrDefault(config.position, fallback.position),
	rotation: getTupleOrDefault(config.rotation, fallback.rotation),
	size: getTupleOrDefault(config.size, fallback.size),
	renderMode:
		config.renderMode ??
		fallback.renderMode ??
		DEFAULT_SURFACE_SETTINGS.renderMode,
	segments: getTupleOrDefault(
		config.segments,
		fallback.segments ?? DEFAULT_SEGMENTS,
	),
	projectionDirection: getTupleOrDefault(
		config.projectionDirection,
		fallback.projectionDirection ?? [0, 0, -1],
	),
	maxProjectionDistance: getNumberOrDefault(
		config.maxProjectionDistance,
		fallback.maxProjectionDistance ??
			DEFAULT_SURFACE_SETTINGS.maxProjectionDistance,
	),
	surfaceOffset: getNumberOrDefault(
		config.surfaceOffset,
		fallback.surfaceOffset ?? DEFAULT_SURFACE_SETTINGS.surfaceOffset,
	),
	projectionStrength: getNumberOrDefault(
		config.projectionStrength,
		fallback.projectionStrength ?? DEFAULT_SURFACE_SETTINGS.projectionStrength,
	),
	fallbackBend: getNumberOrDefault(
		config.fallbackBend,
		fallback.fallbackBend ?? DEFAULT_SURFACE_SETTINGS.fallbackBend,
	),
	smoothIterations: getNumberOrDefault(
		config.smoothIterations,
		fallback.smoothIterations ?? DEFAULT_SURFACE_SETTINGS.smoothIterations,
	),
	authoredTextureOffset: getTupleOrDefault(
		config.authoredTextureOffset,
		fallback.authoredTextureOffset ?? DEFAULT_AUTHORED_TEXTURE_OFFSET,
	),
	authoredTextureRepeat: getTupleOrDefault(
		config.authoredTextureRepeat,
		fallback.authoredTextureRepeat ?? DEFAULT_AUTHORED_TEXTURE_REPEAT,
	),
});

const clonePrintPlaneConfig = (
	config: PrintPlaneConfig,
	fallback = config,
): PrintPlaneConfig => normalizePrintPlaneConfig(config, fallback);

const createDefaultPrintPlaneConfigs = () => ({
	front: clonePrintPlaneConfig(FRONT_PRINT_PLANE),
	back: clonePrintPlaneConfig(BACK_PRINT_PLANE),
});

const createPrintPlaneConfigs = (
	frontPrintPlane?: PrintPlaneConfig | null,
	backPrintPlane?: PrintPlaneConfig | null,
) => ({
	front: clonePrintPlaneConfig(
		frontPrintPlane ?? FRONT_PRINT_PLANE,
		FRONT_PRINT_PLANE,
	),
	back: clonePrintPlaneConfig(
		backPrintPlane ?? BACK_PRINT_PLANE,
		BACK_PRINT_PLANE,
	),
});

const hasColor = (
	material: Material,
): material is Material & { color: Color } => {
	const candidate = material as Material & { color?: unknown };
	return candidate.color instanceof Color;
};

const getMaterials = (material: Material | Material[]) =>
	Array.isArray(material) ? material : [material];

const includesHint = (value: string, hints: string[]) => {
	const normalized = value.toLowerCase();
	return hints.some((hint) => normalized.includes(hint));
};

const normalizeObjectName = (value: string) =>
	value.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_");

const isAuthoredPrintMeshName = (name: string, side?: PrintSide) => {
	const normalizedName = normalizeObjectName(name);
	const names = side
		? AUTHORED_PRINT_MESH_NAMES[side]
		: Object.values(AUTHORED_PRINT_MESH_NAMES).flat();
	return names.some((printName) => normalizedName.includes(printName));
};

const shouldTintMesh = (mesh: Mesh, material: Material) => {
	if (isAuthoredPrintMeshName(mesh.name)) return false;
	const searchableName = `${mesh.name} ${material.name}`;
	if (includesHint(searchableName, NON_SHIRT_NAME_HINTS)) return false;
	if (includesHint(searchableName, SHIRT_NAME_HINTS)) return true;
	return true;
};

const shouldUseMeshForProjection = (mesh: Mesh) =>
	getMaterials(mesh.material).some((material) =>
		shouldTintMesh(mesh, material),
	);

const collectProjectionMeshes = (scene: ThreeObject3D) => {
	const meshes: Mesh[] = [];
	scene.traverse((child) => {
		if (!(child instanceof Mesh)) return;
		if (isAuthoredPrintMeshName(child.name)) return;
		if (shouldUseMeshForProjection(child)) meshes.push(child);
	});
	return meshes;
};

const findAuthoredPrintMesh = (scene: ThreeObject3D, side: PrintSide) => {
	let printMesh: Mesh | null = null;
	scene.traverse((child) => {
		if (printMesh || !(child instanceof Mesh)) return;
		if (isAuthoredPrintMeshName(child.name, side)) printMesh = child;
	});
	return printMesh;
};

const cloneModelScene = (sourceScene: ThreeObject3D) => {
	const clonedScene = sourceScene.clone(true);
	clonedScene.traverse((child) => {
		if (!(child instanceof Mesh)) return;
		if (Array.isArray(child.material)) {
			child.material = child.material.map((material) => material.clone());
			return;
		}
		child.material = child.material.clone();
	});
	return clonedScene;
};

const normalizeModelScene = (scene: ThreeObject3D) => {
	const box = new Box3().setFromObject(scene);
	const size = new Vector3();
	const center = new Vector3();
	box.getSize(size);
	box.getCenter(center);

	if (!Number.isFinite(size.y) || size.y <= 0) return scene;

	const scale = MODEL_TARGET_HEIGHT / size.y;
	scene.scale.setScalar(scale);
	scene.position.copy(MODEL_TARGET_CENTER).sub(center.multiplyScalar(scale));
	scene.updateMatrixWorld(true);
	return scene;
};

const useTintedClonedScene = (modelUrl: string, shirtColorHex: string) => {
	const { scene } = useGLTF(modelUrl);
	const clonedScene = useMemo(
		() => normalizeModelScene(cloneModelScene(scene)),
		[scene],
	);

	useEffect(() => {
		clonedScene.traverse((child) => {
			if (!(child instanceof Mesh)) return;
			getMaterials(child.material).forEach((material) => {
				if (!hasColor(material) || !shouldTintMesh(child, material)) return;
				material.color.set(shirtColorHex);
				material.needsUpdate = true;
			});
		});
	}, [clonedScene, shirtColorHex]);

	return clonedScene;
};

const createTextureFromImage = async (imageUrl: string) => {
	const image = new Image();
	image.crossOrigin = "anonymous";
	image.src = imageUrl;
	await image.decode();

	const texture = new CanvasTexture(image);
	texture.colorSpace = SRGBColorSpace;
	texture.minFilter = LinearFilter;
	texture.magFilter = LinearFilter;
	texture.needsUpdate = true;
	return texture;
};

const usePreviewTexture = (imageUrl?: string | null) => {
	const [texture, setTexture] = useState<Texture | null>(null);

	useEffect(() => {
		let cancelled = false;
		setTexture(null);
		if (!imageUrl) return undefined;

		createTextureFromImage(imageUrl)
			.then((nextTexture) => {
				if (cancelled) {
					nextTexture.dispose();
					return;
				}
				setTexture(nextTexture);
			})
			.catch(() => setTexture(null));

		return () => {
			cancelled = true;
		};
	}, [imageUrl]);

	useEffect(() => () => texture?.dispose(), [texture]);

	return texture;
};

const getTextureImageSize = (texture: Texture) => {
	const image = texture.image as TextureImageSource | undefined;
	const width = image?.naturalWidth ?? image?.width ?? 0;
	const height = image?.naturalHeight ?? image?.height ?? 0;
	return { width, height };
};

const getAuthoredMeshAspect = (mesh: Mesh) => {
	mesh.updateWorldMatrix(true, false);
	const bounds = new Box3().setFromObject(mesh);
	const size = new Vector3();
	bounds.getSize(size);
	const width = Math.max(size.x, size.z, 1);
	return width / Math.max(size.y, 1);
};

const fitTextureSize = (height: number, aspect: number) => {
	let fittedHeight = Math.min(
		Math.max(Math.round(height), AUTHORED_TEXTURE_MIN_SIZE),
		AUTHORED_TEXTURE_MAX_SIZE,
	);
	let fittedWidth = Math.max(Math.round(fittedHeight * aspect), 1);

	if (fittedWidth > AUTHORED_TEXTURE_MAX_SIZE) {
		const ratio = AUTHORED_TEXTURE_MAX_SIZE / fittedWidth;
		fittedWidth = AUTHORED_TEXTURE_MAX_SIZE;
		fittedHeight = Math.max(Math.round(fittedHeight * ratio), 1);
	}

	return { width: fittedWidth, height: fittedHeight };
};

const createAspectFittedAuthoredTexture = (sourceTexture: Texture, mesh: Mesh) => {
	const sourceImage = sourceTexture.image as CanvasImageSource | undefined;
	const { width: sourceWidth, height: sourceHeight } =
		getTextureImageSize(sourceTexture);
	if (!sourceImage || sourceWidth <= 0 || sourceHeight <= 0) return null;

	const targetAspect = getAuthoredMeshAspect(mesh);
	const canvas = document.createElement("canvas");
	const fittedSize = fitTextureSize(sourceHeight, targetAspect);
	canvas.width = fittedSize.width;
	canvas.height = fittedSize.height;

	const context = canvas.getContext("2d");
	if (!context) return null;

	const sourceAspect = sourceWidth / sourceHeight;
	let drawWidth = canvas.width;
	let drawHeight = drawWidth / sourceAspect;
	if (drawHeight > canvas.height) {
		drawHeight = canvas.height;
		drawWidth = drawHeight * sourceAspect;
	}

	context.clearRect(0, 0, canvas.width, canvas.height);
	context.imageSmoothingEnabled = true;
	context.imageSmoothingQuality = "high";
	context.drawImage(
		sourceImage,
		(canvas.width - drawWidth) / 2,
		(canvas.height - drawHeight) / 2,
		drawWidth,
		drawHeight,
	);

	const fittedTexture = new CanvasTexture(canvas);
	fittedTexture.colorSpace = SRGBColorSpace;
	fittedTexture.minFilter = LinearMipmapLinearFilter;
	fittedTexture.magFilter = LinearFilter;
	fittedTexture.generateMipmaps = true;
	fittedTexture.anisotropy = 8;
	fittedTexture.flipY = false;
	fittedTexture.needsUpdate = true;
	return fittedTexture;
};

const buildPanelTransform = (config: PrintPlaneConfig) => {
	const transform = new Object3D();
	transform.position.set(...config.position);
	transform.rotation.set(...config.rotation);
	transform.updateMatrixWorld(true);
	return transform;
};

const createWarpedPanelGeometry = (config: PrintPlaneConfig) => {
	const [width, height] = config.size;
	const [xSegments, ySegments] = config.segments ?? DEFAULT_SEGMENTS;
	const fallbackBend =
		config.fallbackBend ?? DEFAULT_SURFACE_SETTINGS.fallbackBend;
	const positions: number[] = [];
	const uvs: number[] = [];
	const indices: number[] = [];

	for (let y = 0; y <= ySegments; y += 1) {
		const v = y / ySegments;
		const normalizedY = 1 - v;
		for (let x = 0; x <= xSegments; x += 1) {
			const u = x / xSegments;
			const localX = (u - 0.5) * width;
			const localY = (0.5 - v) * height;
			const centeredX = localX / (width / 2);
			const centeredY = localY / (height / 2);
			const bodyBend = -(centeredX * centeredX) * width * fallbackBend;
			const softBulge =
				(1 - centeredY * centeredY) * width * fallbackBend * 0.12;
			positions.push(localX, localY, bodyBend + softBulge);
			uvs.push(u, normalizedY);
		}
	}

	for (let y = 0; y < ySegments; y += 1) {
		for (let x = 0; x < xSegments; x += 1) {
			const topLeft = y * (xSegments + 1) + x;
			const topRight = topLeft + 1;
			const bottomLeft = topLeft + xSegments + 1;
			const bottomRight = bottomLeft + 1;
			indices.push(
				topLeft,
				bottomLeft,
				topRight,
				topRight,
				bottomLeft,
				bottomRight,
			);
		}
	}

	const geometry = new BufferGeometry();
	geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
	geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
	geometry.setIndex(indices);
	geometry.computeVertexNormals();
	return geometry;
};

const smoothDepthValues = (
	zValues: number[],
	validMask: boolean[],
	xSegments: number,
	ySegments: number,
	iterations: number,
) => {
	let current = zValues;
	for (let iteration = 0; iteration < iterations; iteration += 1) {
		const next = [...current];
		for (let y = 1; y < ySegments; y += 1) {
			for (let x = 1; x < xSegments; x += 1) {
				const index = y * (xSegments + 1) + x;
				if (!validMask[index]) continue;
				const neighborAverage =
					[
						index - 1,
						index + 1,
						index - (xSegments + 1),
						index + xSegments + 1,
					].reduce(
						(total, neighborIndex) =>
							validMask[neighborIndex] ? total + current[neighborIndex] : total,
						0,
					) /
					[
						index - 1,
						index + 1,
						index - (xSegments + 1),
						index + xSegments + 1,
					].filter((neighborIndex) => validMask[neighborIndex]).length;
				if (!Number.isFinite(neighborAverage)) continue;
				next[index] = current[index] * 0.6 + neighborAverage * 0.4;
			}
		}
		current = next;
	}
	return current;
};

const buildClippedPanelIndices = (
	validMask: boolean[],
	xSegments: number,
	ySegments: number,
) => {
	const indices: number[] = [];
	const width = xSegments + 1;

	for (let y = 0; y < ySegments; y += 1) {
		for (let x = 0; x < xSegments; x += 1) {
			const topLeft = y * width + x;
			const topRight = topLeft + 1;
			const bottomLeft = topLeft + width;
			const bottomRight = bottomLeft + 1;

			if (
				validMask[topLeft] &&
				validMask[bottomLeft] &&
				validMask[topRight]
			) {
				indices.push(topLeft, bottomLeft, topRight);
			}

			if (
				validMask[topRight] &&
				validMask[bottomLeft] &&
				validMask[bottomRight]
			) {
				indices.push(topRight, bottomLeft, bottomRight);
			}
		}
	}

	return indices;
};

const createSampledDepthGeometry = (
	config: PrintPlaneConfig,
	targetMeshes: Mesh[],
	cacheKey?: string,
) => {
	if (cacheKey) {
		const cachedGeometry = sampledSurfaceGeometryCache.get(cacheKey);
		if (cachedGeometry) return cachedGeometry.clone();
	}

	if (targetMeshes.length === 0) return createWarpedPanelGeometry(config);

	const [xSegments, ySegments] = config.segments ?? DEFAULT_SEGMENTS;
	const maxProjectionDistance =
		config.maxProjectionDistance ??
		DEFAULT_SURFACE_SETTINGS.maxProjectionDistance;
	const surfaceOffset =
		config.surfaceOffset ?? DEFAULT_SURFACE_SETTINGS.surfaceOffset;
	const projectionStrength =
		config.projectionStrength ?? DEFAULT_SURFACE_SETTINGS.projectionStrength;
	const smoothIterations = Math.max(
		0,
		Math.floor(config.smoothIterations ?? 0),
	);
	const panelTransform = buildPanelTransform(config);
	const projectionDirection = new Vector3(
		...(config.projectionDirection ?? [0, 0, -1]),
	).normalize();
	if (projectionDirection.lengthSq() === 0) {
		projectionDirection.set(0, 0, -1);
	}
	const targetBounds = new Box3();
	targetMeshes.forEach((mesh) => {
		targetBounds.expandByObject(mesh);
	});
	const targetSize = new Vector3();
	targetBounds.getSize(targetSize);
	const projectionDistance = Math.max(
		maxProjectionDistance,
		Math.max(targetSize.x, targetSize.z) * 1.25,
	);
	const raycaster = new Raycaster();
	raycaster.far = projectionDistance * 2;
	const baseGeometry = createWarpedPanelGeometry(config);
	const basePositions = baseGeometry.getAttribute("position");
	const baseUvs = baseGeometry.getAttribute("uv");
	const positions: number[] = [];
	const zValues: number[] = [];
	const validMask: boolean[] = [];
	let hitCount = 0;

	const originalMaterialSides = targetMeshes.flatMap((mesh) =>
		getMaterials(mesh.material).map((material) => ({
			material,
			side: material.side,
		})),
	);

	originalMaterialSides.forEach(({ material }) => {
		material.side = DoubleSide;
	});

	targetMeshes.forEach((mesh) => {
		mesh.updateMatrixWorld(true);
	});

	for (let index = 0; index < basePositions.count; index += 1) {
		const localPoint = new Vector3(
			basePositions.getX(index),
			basePositions.getY(index),
			basePositions.getZ(index),
		);
		const worldPoint = panelTransform.localToWorld(localPoint.clone());
		const rayOrigin = worldPoint
			.clone()
			.addScaledVector(projectionDirection, -projectionDistance);
		raycaster.set(rayOrigin, projectionDirection);

		const sampledHit = raycaster
			.intersectObjects(targetMeshes, false)
			.map((hit) => {
				const localSurface = panelTransform.worldToLocal(hit.point.clone());
				const outsidePoint = hit.point
					.clone()
					.addScaledVector(projectionDirection, -surfaceOffset);
				const localHit = panelTransform.worldToLocal(outsidePoint);
				const outsideDirection = Math.sign(localHit.z - localSurface.z);
				return {
					localZ: localHit.z,
					outsideDirection,
					score:
						Math.abs(localHit.x - localPoint.x) * 2 +
						Math.abs(localHit.y - localPoint.y) * 2 +
						Math.abs(localHit.z - localPoint.z),
				};
			})
			.sort((left, right) => left.score - right.score)[0];

		if (sampledHit) {
			localPoint.z += (sampledHit.localZ - localPoint.z) * projectionStrength;
			if (sampledHit.outsideDirection >= 0) {
				localPoint.z = Math.max(localPoint.z, sampledHit.localZ);
			} else {
				localPoint.z = Math.min(localPoint.z, sampledHit.localZ);
			}
			hitCount += 1;
			validMask.push(true);
		} else {
			validMask.push(false);
		}

		positions.push(localPoint.x, localPoint.y, localPoint.z);
		zValues.push(localPoint.z);
	}

	originalMaterialSides.forEach(({ material, side }) => {
		material.side = side;
	});

	const hitRatio = hitCount / basePositions.count;

	if (hitRatio === 0) {
		baseGeometry.userData.hitRatio = hitRatio;
		return baseGeometry;
	}

	const smoothedZ = smoothDepthValues(
		zValues,
		validMask,
		xSegments,
		ySegments,
		smoothIterations,
	);
	for (let index = 0; index < smoothedZ.length; index += 1) {
		positions[index * 3 + 2] = smoothedZ[index];
	}

	const geometry = new BufferGeometry();
	geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
	geometry.setAttribute("uv", baseUvs.clone());
	geometry.setIndex(buildClippedPanelIndices(validMask, xSegments, ySegments));
	geometry.computeVertexNormals();
	geometry.userData.hitRatio = hitRatio;
	baseGeometry.dispose();

	if (cacheKey) {
		sampledSurfaceGeometryCache.set(cacheKey, geometry.clone());
	}

	return geometry;
};

function PrintSurface({
	texture,
	config,
	targetMeshes,
	cacheKey,
	side,
	showWireframe,
	onStats,
}: {
	texture: Texture | null;
	config: PrintPlaneConfig;
	targetMeshes: Mesh[];
	cacheKey: string;
	side: PrintSide;
	showWireframe: boolean;
	onStats: (side: PrintSide, hitRatio: number | null) => void;
}) {
	const geometry = useMemo(() => {
		if (!texture) return null;
		if (config.renderMode === "sampledDepth") {
			return createSampledDepthGeometry(config, targetMeshes, cacheKey);
		}
		return createWarpedPanelGeometry({ ...config, fallbackBend: 0 });
	}, [cacheKey, config, targetMeshes, texture]);

	useEffect(() => () => geometry?.dispose(), [geometry]);

	useEffect(() => {
		const hitRatio = geometry?.userData.hitRatio;
		onStats(side, typeof hitRatio === "number" ? hitRatio : null);
	}, [geometry, onStats, side]);

	if (!texture || !geometry) return null;

	return (
		<>
			<mesh
				geometry={geometry}
				position={config.position}
				rotation={config.rotation}
				renderOrder={2}
			>
				<meshBasicMaterial
					map={texture}
					transparent
					depthWrite={false}
					side={DoubleSide}
					polygonOffset
					polygonOffsetFactor={-1}
					toneMapped={false}
				/>
			</mesh>
			{showWireframe && (
				<mesh
					geometry={geometry}
					position={config.position}
					rotation={config.rotation}
					renderOrder={3}
				>
					<meshBasicMaterial
						color="#c084fc"
						transparent
						opacity={0.55}
						wireframe
						depthWrite={false}
						toneMapped={false}
					/>
				</mesh>
			)}
		</>
	);
}

function AuthoredPrintSurface({
	mesh,
	texture,
	config,
	side,
	onStats,
}: {
	mesh: Mesh | null;
	texture: Texture | null;
	config: PrintPlaneConfig;
	side: PrintSide;
	onStats: (side: PrintSide, hitRatio: number | null) => void;
}) {
	useEffect(() => {
		if (!mesh) {
			onStats(side, null);
			return undefined;
		}

		const originalMaterial = mesh.material;
		const originalVisible = mesh.visible;
		const originalRenderOrder = mesh.renderOrder;

		if (!texture) {
			mesh.visible = false;
			onStats(side, 1);
			return () => {
				mesh.material = originalMaterial;
				mesh.visible = originalVisible;
				mesh.renderOrder = originalRenderOrder;
			};
		}

		texture.flipY = false;
		const fittedTexture = createAspectFittedAuthoredTexture(texture, mesh);
		const materialTexture = fittedTexture ?? texture;
		const [offsetX, offsetY] = config.authoredTextureOffset ?? [0, 0];
		const [repeatX, repeatY] = config.authoredTextureRepeat ?? [1, 1];
		materialTexture.offset.set(
			0.5 - repeatX / 2 + offsetX,
			0.5 - repeatY / 2 + offsetY,
		);
		materialTexture.repeat.set(repeatX, repeatY);
		materialTexture.needsUpdate = true;

		const printMaterial = new MeshBasicMaterial({
			map: materialTexture,
			transparent: true,
			depthWrite: false,
			side: DoubleSide,
			polygonOffset: true,
			polygonOffsetFactor: -1,
			toneMapped: false,
		});

		mesh.material = printMaterial;
		mesh.visible = true;
		mesh.renderOrder = 2;
		onStats(side, 1);

		return () => {
			mesh.material = originalMaterial;
			mesh.visible = originalVisible;
			mesh.renderOrder = originalRenderOrder;
			printMaterial.dispose();
			fittedTexture?.dispose();
		};
	}, [config, mesh, onStats, side, texture]);

	return null;
}

function AuthoredPrintSurfaces({
	frontMesh,
	backMesh,
	frontDesignTextureUrl,
	backDesignTextureUrl,
	frontPrintPlane,
	backPrintPlane,
	onStats,
}: Pick<
	Shirt3DPreviewProps,
	"frontDesignTextureUrl" | "backDesignTextureUrl"
> & {
	frontMesh: Mesh | null;
	backMesh: Mesh | null;
	frontPrintPlane: PrintPlaneConfig;
	backPrintPlane: PrintPlaneConfig;
	onStats: (side: PrintSide, hitRatio: number | null) => void;
}) {
	const frontTexture = usePreviewTexture(frontDesignTextureUrl);
	const backTexture = usePreviewTexture(backDesignTextureUrl);

	return (
		<>
			<AuthoredPrintSurface
				mesh={frontMesh}
				texture={frontTexture}
				config={frontPrintPlane}
				side="front"
				onStats={onStats}
			/>
			<AuthoredPrintSurface
				mesh={backMesh}
				texture={backTexture}
				config={backPrintPlane}
				side="back"
				onStats={onStats}
			/>
		</>
	);
}

function ShirtPrintSurfaces({
	modelUrl,
	targetMeshes,
	frontDesignTextureUrl,
	backDesignTextureUrl,
	frontPrintPlane,
	backPrintPlane,
	authoredPrintMeshes,
	showWireframe,
	onStats,
}: Pick<
	Shirt3DPreviewProps,
	"modelUrl" | "frontDesignTextureUrl" | "backDesignTextureUrl"
> & {
	targetMeshes: Mesh[];
	frontPrintPlane: PrintPlaneConfig;
	backPrintPlane: PrintPlaneConfig;
	authoredPrintMeshes: Record<PrintSide, Mesh | null>;
	showWireframe: boolean;
	onStats: (side: PrintSide, hitRatio: number | null) => void;
}) {
	const frontTexture = usePreviewTexture(frontDesignTextureUrl);
	const backTexture = usePreviewTexture(backDesignTextureUrl);
	const frontCacheKey = useMemo(
		() => `${modelUrl}:front:${JSON.stringify(frontPrintPlane)}`,
		[frontPrintPlane, modelUrl],
	);
	const backCacheKey = useMemo(
		() => `${modelUrl}:back:${JSON.stringify(backPrintPlane)}`,
		[backPrintPlane, modelUrl],
	);

	return (
		<>
			{!authoredPrintMeshes.front && (
				<PrintSurface
					texture={frontTexture}
					config={frontPrintPlane}
					targetMeshes={targetMeshes}
					cacheKey={frontCacheKey}
					side="front"
					showWireframe={showWireframe}
					onStats={onStats}
				/>
			)}
			{!authoredPrintMeshes.back && (
				<PrintSurface
					texture={backTexture}
					config={backPrintPlane}
					targetMeshes={targetMeshes}
					cacheKey={backCacheKey}
					side="back"
					showWireframe={showWireframe}
					onStats={onStats}
				/>
			)}
		</>
	);
}

function ShirtScene({
	modelUrl,
	shirtColorHex,
	frontDesignTextureUrl,
	backDesignTextureUrl,
	frontPrintPlane,
	backPrintPlane,
	showPrintGrid,
	onProjectionStats,
	onAuthoredPrintMeshesChange,
}: ShirtSceneProps & {
	showPrintGrid: boolean;
	onProjectionStats: (side: PrintSide, hitRatio: number | null) => void;
	onAuthoredPrintMeshesChange: (usesAuthoredPrintMeshes: boolean) => void;
}) {
	const clonedScene = useTintedClonedScene(modelUrl, shirtColorHex);
	const targetMeshes = useMemo(
		() => collectProjectionMeshes(clonedScene),
		[clonedScene],
	);
	const authoredPrintMeshes = useMemo(
		() => ({
			front: findAuthoredPrintMesh(clonedScene, "front"),
			back: findAuthoredPrintMesh(clonedScene, "back"),
		}),
		[clonedScene],
	);

	useEffect(() => {
		onAuthoredPrintMeshesChange(
			Boolean(authoredPrintMeshes.front || authoredPrintMeshes.back),
		);
	}, [authoredPrintMeshes, onAuthoredPrintMeshesChange]);

	return (
		<>
			<primitive object={clonedScene} />
			<AuthoredPrintSurfaces
				frontMesh={authoredPrintMeshes.front}
				backMesh={authoredPrintMeshes.back}
				frontDesignTextureUrl={frontDesignTextureUrl}
				backDesignTextureUrl={backDesignTextureUrl}
				frontPrintPlane={frontPrintPlane}
				backPrintPlane={backPrintPlane}
				onStats={onProjectionStats}
			/>
			<ShirtPrintSurfaces
				modelUrl={modelUrl}
				targetMeshes={targetMeshes}
				frontDesignTextureUrl={frontDesignTextureUrl}
				backDesignTextureUrl={backDesignTextureUrl}
				frontPrintPlane={frontPrintPlane}
				backPrintPlane={backPrintPlane}
				authoredPrintMeshes={authoredPrintMeshes}
				showWireframe={showPrintGrid}
				onStats={onProjectionStats}
			/>
		</>
	);
}
function CalibrationNumberInput({
	label,
	value,
	onChange,
	step = 1,
}: {
	label: string;
	value: number;
	onChange: (value: number) => void;
	step?: number;
}) {
	return (
		<label className="flex items-center justify-between gap-2 text-[11px] text-white/70">
			<span>{label}</span>
			<input
				type="number"
				step={step}
				value={value}
				onChange={(event) => onChange(Number(event.target.value))}
				className="h-7 w-20 rounded border border-white/10 bg-slate-950/80 px-2 text-right text-xs text-white outline-none focus:border-purple-400"
			/>
		</label>
	);
}

function PrintPlaneCalibrationControls({
	modelUrl,
	frontPrintPlane,
	backPrintPlane,
	showPrintGrid,
	usesAuthoredPrintMeshes,
	projectionStats,
	onChange,
	onReset,
	onShowPrintGridChange,
}: {
	modelUrl: string;
	frontPrintPlane: PrintPlaneConfig;
	backPrintPlane: PrintPlaneConfig;
	showPrintGrid: boolean;
	usesAuthoredPrintMeshes: boolean;
	projectionStats: ProjectionStats;
	onChange: (side: PrintSide, nextConfig: PrintPlaneConfig) => void;
	onReset: () => void;
	onShowPrintGridChange: (show: boolean) => void;
}) {
	const [copied, setCopied] = useState(false);
	const [dirty, setDirty] = useState(false);
	const [draftConfigs, setDraftConfigs] = useState(() => ({
		front: clonePrintPlaneConfig(frontPrintPlane),
		back: clonePrintPlaneConfig(backPrintPlane),
	}));
	const configJson = useMemo(
		() =>
			JSON.stringify(
				{
					modelUrl,
					centerOffset: MODEL_CENTER_OFFSET,
					frontPrintPlane: draftConfigs.front,
					backPrintPlane: draftConfigs.back,
				},
				null,
				2,
			),
		[modelUrl, draftConfigs],
	);

	useEffect(() => {
		setDraftConfigs({
			front: clonePrintPlaneConfig(frontPrintPlane),
			back: clonePrintPlaneConfig(backPrintPlane),
		});
		setDirty(false);
	}, [frontPrintPlane, backPrintPlane]);

	const updateDraft = (side: PrintSide, updater: (config: PrintPlaneConfig) => void) => {
		setDraftConfigs((current) => {
			const nextConfig = clonePrintPlaneConfig(current[side]);
			updater(nextConfig);
			return {
				...current,
				[side]: nextConfig,
			};
		});
		setDirty(true);
	};

	const updatePosition = (
		side: PrintSide,
		axisIndex: 0 | 1 | 2,
		value: number,
	) => {
		updateDraft(side, (config) => {
			config.position[axisIndex] = value;
		});
	};

	const updateSize = (side: PrintSide, axisIndex: 0 | 1, value: number) => {
		updateDraft(side, (config) => {
			config.size[axisIndex] = value;
		});
	};

	const updateMode = (side: PrintSide, value: PrintRenderMode) => {
		updateDraft(side, (config) => {
			config.renderMode = value;
		});
	};

	const updateSurfaceValue = (
		side: PrintSide,
		key:
			| "projectionStrength"
			| "surfaceOffset"
			| "maxProjectionDistance"
			| "fallbackBend",
		value: number,
	) => {
		updateDraft(side, (config) => {
			config[key] = value;
		});
	};

	const updateTextureTuple = (
		side: PrintSide,
		key: "authoredTextureOffset" | "authoredTextureRepeat",
		axisIndex: 0 | 1,
		value: number,
	) => {
		updateDraft(side, (config) => {
			const fallback: [number, number] =
				key === "authoredTextureOffset"
					? DEFAULT_AUTHORED_TEXTURE_OFFSET
					: DEFAULT_AUTHORED_TEXTURE_REPEAT;
			const tuple = [...(config[key] ?? fallback)] as [number, number];
			tuple[axisIndex] = value;
			config[key] = tuple;
		});
	};

	const updateTextureScale = (side: PrintSide, value: number) => {
		updateDraft(side, (config) => {
			const currentRepeat =
				config.authoredTextureRepeat ?? DEFAULT_AUTHORED_TEXTURE_REPEAT;
			config.authoredTextureRepeat = [value, currentRepeat[1]];
		});
	};

	const updateTextureHeight = (side: PrintSide, value: number) => {
		updateDraft(side, (config) => {
			const currentRepeat =
				config.authoredTextureRepeat ?? DEFAULT_AUTHORED_TEXTURE_REPEAT;
			config.authoredTextureRepeat = [currentRepeat[0], value];
		});
	};

	const applyDraft = () => {
		onChange("front", draftConfigs.front);
		onChange("back", draftConfigs.back);
		setDirty(false);
	};

	const handleReset = () => {
		onReset();
		setDirty(false);
	};

	const copyJson = async () => {
		await navigator.clipboard.writeText(configJson);
		setCopied(true);
		window.setTimeout(() => setCopied(false), 1200);
	};

	const formatHitRatio = (side: PrintSide) => {
		const hitRatio = projectionStats[side];
		return typeof hitRatio === "number" ? `${Math.round(hitRatio * 100)}%` : "--";
	};

	const renderSideControls = (side: PrintSide, config: PrintPlaneConfig) => (
		<div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
			<div className="flex items-center justify-between gap-2 text-xs font-bold uppercase tracking-wide text-purple-200">
				<span>{side}</span>
				<span className="rounded-full bg-black/25 px-2 py-0.5 text-[10px] normal-case tracking-normal text-white/60">
					Hit {formatHitRatio(side)}
				</span>
				{!usesAuthoredPrintMeshes && (
					<button
						type="button"
						onClick={() =>
							updateMode(
								side,
								config.renderMode === "sampledDepth" ? "plane" : "sampledDepth",
							)
						}
						className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] normal-case tracking-normal text-white/70 hover:bg-white/10"
					>
						{config.renderMode === "sampledDepth" ? "Sampled" : "Plane"}
					</button>
				)}
			</div>
			{usesAuthoredPrintMeshes ? (
				<>
					<CalibrationNumberInput
						label="X"
						value={config.authoredTextureOffset?.[0] ?? 0}
						step={0.01}
						onChange={(value) =>
							updateTextureTuple(side, "authoredTextureOffset", 0, value)
						}
					/>
					<CalibrationNumberInput
						label="Y"
						value={config.authoredTextureOffset?.[1] ?? 0}
						step={0.01}
						onChange={(value) =>
							updateTextureTuple(side, "authoredTextureOffset", 1, value)
						}
					/>
					<CalibrationNumberInput
						label="Scale"
						value={
							config.authoredTextureRepeat?.[0] ??
							DEFAULT_AUTHORED_TEXTURE_REPEAT[0]
						}
						step={0.05}
						onChange={(value) => updateTextureScale(side, value)}
					/>
					<CalibrationNumberInput
						label="Height"
						value={
							config.authoredTextureRepeat?.[1] ??
							DEFAULT_AUTHORED_TEXTURE_REPEAT[1]
						}
						step={0.05}
						onChange={(value) => updateTextureHeight(side, value)}
					/>
				</>
			) : (
				<>
			<CalibrationNumberInput
				label="X"
				value={config.position[0]}
				onChange={(value) => updatePosition(side, 0, value)}
			/>
			<CalibrationNumberInput
				label="Y"
				value={config.position[1]}
				onChange={(value) => updatePosition(side, 1, value)}
			/>
			<CalibrationNumberInput
				label="Z"
				value={config.position[2]}
				onChange={(value) => updatePosition(side, 2, value)}
			/>
			<CalibrationNumberInput
				label="Width"
				value={config.size[0]}
				onChange={(value) => updateSize(side, 0, value)}
			/>
			<CalibrationNumberInput
				label="Height"
				value={config.size[1]}
				onChange={(value) => updateSize(side, 1, value)}
			/>
			<CalibrationNumberInput
				label="Strength"
				value={
					config.projectionStrength ??
					DEFAULT_SURFACE_SETTINGS.projectionStrength
				}
				step={0.05}
				onChange={(value) =>
					updateSurfaceValue(side, "projectionStrength", value)
				}
			/>
			<CalibrationNumberInput
				label="Offset"
				value={config.surfaceOffset ?? DEFAULT_SURFACE_SETTINGS.surfaceOffset}
				step={0.1}
				onChange={(value) => updateSurfaceValue(side, "surfaceOffset", value)}
			/>
			<CalibrationNumberInput
				label="Distance"
				value={
					config.maxProjectionDistance ??
					DEFAULT_SURFACE_SETTINGS.maxProjectionDistance
				}
				onChange={(value) =>
					updateSurfaceValue(side, "maxProjectionDistance", value)
				}
			/>
			<CalibrationNumberInput
				label="Bend"
				value={config.fallbackBend ?? DEFAULT_SURFACE_SETTINGS.fallbackBend}
				step={0.01}
				onChange={(value) => updateSurfaceValue(side, "fallbackBend", value)}
			/>
				</>
			)}
		</div>
	);

	return (
		<div className="absolute bottom-4 right-4 top-4 z-10 flex w-80 flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950/90 p-4 text-white shadow-2xl backdrop-blur">
			<div className="mb-3 flex items-center justify-between gap-3">
				<div>
					<div className="text-sm font-bold">3D Calibration</div>
					<div className="text-[11px] text-white/45">
						Edit draft values, then Apply to resample.
					</div>
				</div>
				<button
					type="button"
					onClick={handleReset}
					className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-white/70 hover:bg-white/10"
				>
					Reset
				</button>
			</div>

			<div className="mb-3 space-y-2 rounded-xl border border-white/10 bg-black/20 p-3 text-[11px] text-white/65">
				<div className="truncate font-mono text-white/45">{modelUrl}</div>
				{!usesAuthoredPrintMeshes && (
					<label className="flex items-center justify-between gap-3">
						<span>Show print grid</span>
						<input
							type="checkbox"
							checked={showPrintGrid}
							onChange={(event) => onShowPrintGridChange(event.target.checked)}
						/>
					</label>
				)}
				<div>
					{usesAuthoredPrintMeshes
						? "Authored GLB print mesh: X/Y moves the artwork, Scale > 1 makes it smaller."
						: "Tip: Z moves the print plane, Offset controls the surface gap, Strength controls sampled depth."}
				</div>
			</div>

			<div className="min-h-0 flex-1 overflow-y-auto pr-1">
			<div className="grid grid-cols-2 gap-3">
				{renderSideControls("front", draftConfigs.front)}
				{renderSideControls("back", draftConfigs.back)}
			</div>
			</div>

			<div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/10 pt-3">
				<button
					type="button"
					onClick={applyDraft}
					className="rounded-xl bg-purple-500 px-3 py-2 text-xs font-bold text-white hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-45"
					disabled={!dirty}
				>
					{dirty ? "Apply tuning" : "Applied"}
				</button>
				<button
					type="button"
					onClick={copyJson}
					className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-white hover:bg-white/10"
				>
					{copied ? "Copied" : "Copy JSON"}
				</button>
			</div>
		</div>
	);
}
export function Shirt3DPreview({
	modelUrl,
	shirtColorHex,
	canCalibrate = false,
	centerOffset,
	frontPrintPlane,
	backPrintPlane,
	frontDesignTextureUrl,
	backDesignTextureUrl,
}: Shirt3DPreviewProps) {
	const [calibrationOpen, setCalibrationOpen] = useState(false);
	const [showPrintGrid, setShowPrintGrid] = useState(false);
	const [usesAuthoredPrintMeshes, setUsesAuthoredPrintMeshes] = useState(false);
	const [projectionStats, setProjectionStats] = useState<ProjectionStats>({
		front: null,
		back: null,
	});
	const [printPlaneConfigs, setPrintPlaneConfigs] = useState(() =>
		createPrintPlaneConfigs(frontPrintPlane, backPrintPlane),
	);
	const activeCenterOffset = centerOffset ?? MODEL_CENTER_OFFSET;

	useEffect(() => {
		setPrintPlaneConfigs(
			createPrintPlaneConfigs(frontPrintPlane, backPrintPlane),
		);
	}, [frontPrintPlane, backPrintPlane]);

	const handlePrintPlaneChange = (
		side: PrintSide,
		nextConfig: PrintPlaneConfig,
	) => {
		setPrintPlaneConfigs((current) => ({
			...current,
			[side]: nextConfig,
		}));
	};

	const handleProjectionStats = useCallback(
		(side: PrintSide, hitRatio: number | null) => {
			setProjectionStats((current) => {
				if (current[side] === hitRatio) return current;
				return {
					...current,
					[side]: hitRatio,
				};
			});
		},
		[],
	);
	const handleAuthoredPrintMeshesChange = useCallback((nextValue: boolean) => {
		setUsesAuthoredPrintMeshes((current) =>
			current === nextValue ? current : nextValue,
		);
	}, []);

	return (
		<div className="relative h-[min(78vh,820px)] min-h-[560px] w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl">
			<Canvas
				camera={{ position: [0, 120, 2200], fov: 38, near: 1, far: 5000 }}
				shadows
				dpr={[1, 2]}
			>
				<color attach="background" args={[new Color("#0f172a")]} />
				<ambientLight intensity={0.7} />
				<directionalLight position={[3, 4, 5]} intensity={1.8} />
				<Suspense fallback={null}>
					<group position={activeCenterOffset}>
						<ShirtScene
							modelUrl={modelUrl}
							shirtColorHex={shirtColorHex}
							frontDesignTextureUrl={frontDesignTextureUrl}
							backDesignTextureUrl={backDesignTextureUrl}
							frontPrintPlane={printPlaneConfigs.front}
							backPrintPlane={printPlaneConfigs.back}
							showPrintGrid={showPrintGrid}
							onProjectionStats={handleProjectionStats}
							onAuthoredPrintMeshesChange={handleAuthoredPrintMeshesChange}
						/>
					</group>
					<Environment preset="studio" />
				</Suspense>
				<OrbitControls
					makeDefault
					enablePan={false}
					target={[0, 0, 0]}
					minDistance={900}
					maxDistance={3600}
				/>
			</Canvas>
			<span className="sr-only">3D preview canvas</span>
			<div className="pointer-events-none absolute left-4 top-4 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs font-semibold text-white/80 backdrop-blur">
				Kéo để xoay, cuộn để phóng to
			</div>
			{canCalibrate && (
				<button
					type="button"
					onClick={() => setCalibrationOpen((open) => !open)}
					className="absolute right-4 top-4 z-10 rounded-full border border-purple-300/30 bg-purple-500/20 px-3 py-1.5 text-xs font-bold text-purple-100 backdrop-blur hover:bg-purple-500/35"
				>
					{calibrationOpen ? "Hide 3D tuning" : "Tune 3D"}
				</button>
			)}
			{canCalibrate && calibrationOpen && (
				<PrintPlaneCalibrationControls
					modelUrl={modelUrl}
					frontPrintPlane={printPlaneConfigs.front}
					backPrintPlane={printPlaneConfigs.back}
					showPrintGrid={showPrintGrid}
					usesAuthoredPrintMeshes={usesAuthoredPrintMeshes}
					projectionStats={projectionStats}
					onChange={handlePrintPlaneChange}
					onReset={() => setPrintPlaneConfigs(createDefaultPrintPlaneConfigs())}
					onShowPrintGridChange={setShowPrintGrid}
				/>
			)}
		</div>
	);
}

useGLTF.preload("/models/base-products/tshirt_operational.glb");
useGLTF.preload("/models/base-products/polo_operation_v1.1.glb");
useGLTF.preload("/models/base-products/hoodie_operational.glb");
