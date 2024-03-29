if (window.AFRAME == null) {
  console.error("Aframe not imported, please import it before this component.")
}

AFRAME.registerComponent("spawner", {
  dependencies: ["track-cursor"],
  schema: {
    distance: { type: "int", default: 3 },
    enabled: { type: "bool", default: false },
    template: { type: "string" }
  },
  init: function() {
    this.scene = this.el.sceneEl;
    this.camera = this.scene.camera.el;
	document.querySelector("a-scene").addEventListener("dblclick", () => {
      if (this.data.enabled) {
        if (!this.el.is("cursor-hovering")) {
          let direction = this.scene
            .getAttribute("raycaster")
            .direction.clone();
          let target = this.camera.object3D.position
            .clone()
            .add(direction.multiplyScalar(this.data.distance));

          let el = document.createElement("a-entity");
          if (this.data.template) {
            el.setAttribute("mixin", this.data.template)
          } else {
            el.setAttribute("geometry", { primitive: "sphere" });
            el.setAttribute("material", { color: "red" });
          }
          el.setAttribute("position", target.clone());
          el.setAttribute("dragndrop", {});
          el.setAttribute("visible", true)
          this.el.appendChild(el);
          el.addEventListener("loaded", e => {
            el.object3D.lookAt(this.camera.object3D.position);
          })
        }
      }
    });
  }
}); 