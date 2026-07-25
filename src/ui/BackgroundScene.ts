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

export class BackgroundScene {
  private readonly scene: Scene;
  private readonly camera: PerspectiveCamera;
  private readonly renderer: WebGLRenderer;
  private readonly points: Points;
  private frameId: number;

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

    this.points = this.createPointField();
    this.scene.add(this.points);

    this.frameId = 0;

    window.addEventListener("resize", this.handleResize);
  }

  private createPointField(): Points {
    const count = 400;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));

    const material = new PointsMaterial({
      color: 0x18181b,
      size: 0.035,
      transparent: true,
      opacity: 0.35
    });

    return new Points(geometry, material);
  }

  private readonly handleResize = (): void => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  public start(): void {
    const animate = (): void => {
      this.points.rotation.y += 0.0006;
      this.points.rotation.x += 0.0002;
      this.renderer.render(this.scene, this.camera);
      this.frameId = requestAnimationFrame(animate);
    };
    animate();
  }

  public dispose(): void {
    cancelAnimationFrame(this.frameId);
    window.removeEventListener("resize", this.handleResize);
    this.renderer.dispose();
  }
}
