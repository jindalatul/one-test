/*
import AFRAME from "aframe";
import "aframe-mouse-spawner-component";
import "aframe-mouse-dragndrop-component";
*/
AFRAME.registerComponent("viz-cursor", {
  init: function() {
    this.el.addState("cursor-type");
  },
  remove: function() {
    this.el.removeState("cursor-type");
  }
});

AFRAME.registerSystem("registry", {
  init: function() {
    this.members = [];
    this.geoData = null;
    this.focused = null;

    this.el.addEventListener("import-hotspots", e => {
      let template = this.el.components.spawner.data.template;
      if (template) {
        if (e.detail) {
          e.detail.forEach(val => {
            let el = document.createElement("a-entity");
            el.setAttribute("mixin", template);
            el.setAttribute("position", val);
            el.emit("watch-camera");
          });
        } else {
          console.error("no imports available");
        }
      } else {
        console.error("no template provided");
      }
    });

    this.el.addEventListener("export-hotspots", () => {
      if (this.geoData) {
        this.el.emit("hotspots-exported", this.geoData);
      }
    });

    // ask the current focused hotspot to face to camera
    this.el.addEventListener("direct-to-camera", () => {
      if (this.focused) {
        this.focused.emit("watch-camera");
      }
    });

    // update current focus with absolute value
    this.el.addEventListener("edit-focused", e => {
      if (this.focused) {
        if (e.detail.type) {
          if (e.detail.type == "position") {
            this.focused.setAttribute("position", e.detail.data);
          } else if (e.detail.type == "rotation") {
            this.focused.setAttribute("rotation", e.detail.data);
          }
        }
      }
    });

    // siwtch scene, and clean up entites
    this.el.addEventListener("switch-scene", e => {
      if (this.focused) {
        this.changeFocus(this.focused);
      }

      this.updateGeo();
      let cam = this.el.sceneEl.camera.el;  // actual camera

      let camRot = { ...cam.getAttribute("rotation") };

      let camParent = cam.parentNode;   // rig

      let parentRot = { ...camParent.getAttribute("rotation") };

      this.el.emit("scene-latest", {
        hotspots: this.geoData,
        camRot: camRot,
        parentRot: parentRot
      });



      // rotate the camera rig to reset to front.
      camParent.setAttribute("rotation", {
        y: -camRot.y
      });

      this.members.forEach(el => {
        this.el.removeChild(el);
      });
    });
  },
  changeFocus: function(el) {
    if (this.focused) {
      this.focused.emit("clear-focus");
      this.focused.removeState("focused");
      if (el != this.focused) {
        this.focused = el;
        this.focused.addState("focused");
        this.focused.emit("set-focus");
      } else {
        this.focused = null;
        this.el.emit("focused-cleared");
      }
    } else {
      this.focused = el;
      this.focused.addState("focused");
      this.focused.emit("set-focus");
    }
  },
  register: function(el) {
    this.members.push(el);
    this.updateGeo();
  },
  unregister: function(el) {
    let idx = this.members.findIndex(e => e == el);
    this.members.splice(idx, 1);
    this.updateGeo();
  },
  updateGeo: function() {
    if (!this.members.length == 0) {
      this.geoData = this.members.map(e => {
        return {
          position: e.getAttribute("position"),
          rotation: e.getAttribute("rotation")
        };
      });
    } else {
      this.geoData = null;
    }
  },
  tick: function() {
    if (this.focused) {
      let pos = this.focused.getAttribute("position");
      let rot = this.focused.getAttribute("rotation");
      this.el.emit("update-focused", { position: pos, rotation: rot });
    }
  }
});

AFRAME.registerComponent("registry", {
  schema: {
    basicMixin: {
      type: "string"
    },
    focusMixin: {
      type: "string"
    }
  },
  init: function() {
    this.system.register(this.el);
    this.origin = null;
    this.counting = 0;

    this.el.addEventListener("click", () => {
      if (this.el.is("interested")) {
        this.system.changeFocus(this.el);
        if (this.el.is("cursor-type")) {
          this.el.object3D.lookAt(this.el.sceneEl.camera.el.object3D.position);
        }
      }
    });

    this.el.addEventListener("mousedown", () => {
      this.el.addState("counting");
      this.el.addState("interested");
    });

    this.el.addEventListener("mouseup", () => {
      this.el.removeState("counting");
      this.counting = 0;
    });

    this.el.addEventListener("set-focus", () => {
      if (this.data.focusMixin) {
        this.el.setAttribute("mixin", this.data.focusMixin);
      }
    });
    this.el.addEventListener("clear-focus", () => {
      if (this.data.basicMixin) {
        this.el.setAttribute("mixin", this.data.basicMixin);
      }
    });

    this.el.addEventListener("watch-camera", () => {
      if (this.el.is("cursor-type")) {
        this.el.object3D.lookAt(this.el.sceneEl.camera.el.object3D.position);
      }
    });
  },
  remove: function() {
    this.system.unregister(this.el);
  },
  tick: function(_, delta) {
    if (this.el.is("dragging") & this.el.is("cursor-type")) {
      this.el.object3D.lookAt(this.el.sceneEl.camera.el.object3D.position);
    }

    if (this.el.is("counting")) {
      this.counting += delta;
      if (this.counting >= 500) {
        this.el.removeState("interested");
      }
    }
  }
});


AFRAME.registerComponent("scene-node", {
  schema: {
    url: {
      type: "string"
    },
    id: {
      type: "string"
    }
  },
  init: function() {
    this.spots = [];

    // imports any potentail preloaded spots vai this event
    this.el.addEventListener("inject", e => {
      this.spots = e.detail;
    });

    // when gaze controller trigger a click event
    this.el.addEventListener("click", () => {
      let img = document.createElement("a-image");
      img.id = this.data.id;
      img.setAttribute("src", this.data.url);
      img.setAttribute("scale", "0 0 0");
      this.el.sceneEl.appendChild(img);
      let sky = document.getElementById("sky");
      sky.setAttribute("src", `#${this.data.id}`);

      // scene cleanup
      this.el.sceneEl.emit("switch-scene");

      // preload new spots to next scene
      this.el.sceneEl.emit("import-hotspots", this.spots);
    });
  }
});