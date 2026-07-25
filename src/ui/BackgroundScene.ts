import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Points,
  BufferGeometry,
  Float32BufferAttribute,
  PointsMaterial,
  Color
} from "three";

const baseRotationSpeedY = 0.0006;
const baseRotationSpeedX = 0.0002;
const basePointSize = 0.035;
const baseOpacity = 0.35;
const pulseDecayPerFrame = 0.05;

export class BackgroundScene {
  private readonly scene: Scene;
  private readonly camera: PerspectiveCamera;
  private readonly renderer: WebGLRenderer;
  private readonly points: Points;
  private readonly material: PointsMaterial;
  private readonly prefersReducedMotion: boolean;
  private frameId: number;
  private pulseEnergy: number;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new Scene();
    this.scene.background = new Color(0xffffff);

    this.camera = new PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.camera.position.z = 8;

    this.renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.material = this.createPointMaterial();
    this.points = this.createPointField(this.material);
    this.scene.add(this.points);

    this.prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.frameId = 0;
    this.pulseEnergy = 0;

    window.addEventListener("resize", this.handleResize);
  }

  private createPointMaterial(): PointsMaterial {
    return new PointsMaterial({
      color: 0x18181b,
      size: basePointSize,
      transparent: true,
      opacity: baseOpacity
    });
  }

  private createPointField(material: PointsMaterial): Points {
    const count = 400;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));

    return new Points(geometry, material);
  }

  private readonly handleResize = (): void => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  public start(): void {
    const animate = (): void => {
      const speedFactor = this.prefersReducedMotion ? 0 : 1 + this.pulseEnergy * 3;

      this.points.rotation.y += baseRotationSpeedY * speedFactor;
      this.points.rotation.x += baseRotationSpeedX * speedFactor;

      if (this.pulseEnergy > 0) {
        this.material.size = basePointSize + this.pulseEnergy * 0.05;
        this.material.opacity = Math.min(1, baseOpacity + this.pulseEnergy * 0.4);
        this.pulseEnergy = Math.max(0, this.pulseEnergy - pulseDecayPerFrame);
      } else if (this.material.size !== basePointSize || this.material.opacity !== baseOpacity) {
        this.material.size = basePointSize;
        this.material.opacity = baseOpacity;
      }

      this.renderer.render(this.scene, this.camera);
      this.frameId = requestAnimationFrame(animate);
    };
    animate();
  }

  public pulse(): void {
    if (this.prefersReducedMotion) {
      return;
    }

    this.pulseEnergy = 1;
  }

  public dispose(): void {
    cancelAnimationFrame(this.frameId);
    window.removeEventListener("resize", this.handleResize);
    this.renderer.dispose();
  }
}
