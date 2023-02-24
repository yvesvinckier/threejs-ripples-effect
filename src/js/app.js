import * as THREE from "three";
import fragment from "./shader/fragment.glsl";
import vertex from "./shader/vertex.glsl";

// Images
import brush from "../img/brush.png";
import ocean from "../img/jeremy-bishop-7KLUhedmR2c-unsplash.jpg";

export default class Sketch {
  constructor(options) {
    // Scenes
    this.scene = new THREE.Scene();
    this.scene1 = new THREE.Scene();

    // Container
    this.container = options.dom;

    // Sizes
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);

    this.baseTexture = new THREE.WebGLRenderTarget(this.width, this.height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
    });

    var frustumSize = this.height;
    var aspect = this.width / this.height;

    // Camera
    this.camera = new THREE.OrthographicCamera(
      (frustumSize * aspect) / -2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      frustumSize / -2,
      -1000,
      1000
    );

    this.camera.position.set(0, 0, 2);

    this.time = 0;
    this.mouse = new THREE.Vector2(0, 0);
    this.prevMouse = new THREE.Vector2(0, 0);
    this.currentWave = 0;

    this.addObjects();
    this.mouseEvents();
    this.resize();
    this.render();
    this.setupResize();
  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  resize() {
    // Update sizes
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;

    // Update camera
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

    // Update renderer
    this.renderer.setSize(this.width, this.height);
  }

  // get the mouse position
  mouseEvents() {
    window.addEventListener("mousemove", (e) => {
      this.mouse.x = e.clientX - this.width / 2;
      this.mouse.y = this.height / 2 - e.clientY;
    });
  }

  addObjects() {
    let that = this;
    this.material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable",
      },
      side: THREE.DoubleSide,
      uniforms: {
        time: { value: 0 },
        uDisplacement: { value: null },
        uTexture: { value: new THREE.TextureLoader().load(ocean) },
        resolution: { value: new THREE.Vector4() },
      },
      vertexShader: vertex,
      fragmentShader: fragment,
    });

    this.max = 100;

    this.geometry = new THREE.PlaneGeometry(64, 64, 1, 1);
    this.geometryFullScreen = new THREE.PlaneGeometry(
      this.width,
      this.height,
      1,
      1
    );
    this.meshes = [];

    for (let i = 0; i < this.max; i++) {
      let m = new THREE.MeshBasicMaterial({
        map: new THREE.TextureLoader().load(brush),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        depthWrite: false,
      });

      let mesh = new THREE.Mesh(this.geometry, m);

      // mesh.visible = false;
      mesh.rotation.z = Math.random() * Math.PI * 2;
      this.scene.add(mesh);
      this.meshes.push(mesh);
    }

    this.quad = new THREE.Mesh(this.geometryFullScreen, this.material);
    this.scene1.add(this.quad);
  }

  setNewWave(x, y, index) {
    let mesh = this.meshes[index];
    mesh.visible = true;
    mesh.position.x = x;
    mesh.position.y = y;
    mesh.scale.x = mesh.scale.y = 0.2;
    mesh.material.opacity = 0.5;
  }

  trackMousePosition() {
    if (
      Math.abs(this.mouse.x - this.prevMouse.x) < 4 &&
      Math.abs(this.mouse.y - this.prevMouse.y) < 4
    ) {
      // nothing
    } else {
      this.currentWave = (this.currentWave + 1) % this.max;
      this.setNewWave(this.mouse.x, this.mouse.y, this.currentWave);
      // console.log(this.currentWave);
    }
    this.prevMouse.x = this.mouse.x;
    this.prevMouse.y = this.mouse.y;
  }

  render() {
    this.trackMousePosition();
    this.time += 0.05;
    this.material.uniforms.time.value = this.time;
    requestAnimationFrame(this.render.bind(this));

    // merge the two scenes
    this.renderer.setRenderTarget(this.baseTexture);
    this.renderer.render(this.scene, this.camera);
    this.material.uniforms.uDisplacement.value = this.baseTexture.texture;
    this.renderer.setRenderTarget(null);
    this.renderer.clear();
    this.renderer.render(this.scene1, this.camera);

    this.meshes.forEach((mesh) => {
      if (mesh.visible) {
        // mesh.position.x = this.mouse.x;
        // mesh.position.y = this.mouse.y;
        mesh.rotation.z += 0.02;
        mesh.material.opacity *= 0.96;
        mesh.scale.x = 0.982 * mesh.scale.x + 0.108;
        mesh.scale.y = mesh.scale.x;
        if (mesh.material.opacity < 0.002) {
          mesh.visible = false;
        }
      }
    });
  }
}

new Sketch({
  dom: document.getElementById("container"),
});
