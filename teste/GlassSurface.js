// Requer que GSAP, Draggable e Tweakpane já tenham sido carregados no HTML.
//
// Exemplo:
// <script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js"></script>
// <script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/Draggable.min.js"></script>
// <script src="https://cdn.jsdelivr.net/npm/tweakpane@4.0.4/dist/tweakpane.min.js"></script>

gsap.registerPlugin(Draggable);

const { Pane } = Tweakpane;

const toggle = document.querySelector(".liquid-toggle");

const config = {
  theme: "light",
  complete: 0,
  active: false,
  deviation: 2,
  alpha: 16,
  bounce: true,
  hue: 144,
  delta: true,
  bubble: true,
  mapped: false,
  debug: false,
};

const ctrl = new Pane({
  title: "config",
});

const update = () => {
  gsap.set("#goo feGaussianBlur", {
    attr: {
      stdDeviation: config.deviation,
    },
  });

  gsap.set("#goo feColorMatrix", {
    attr: {
      values: `
        1 0 0 0 0
        0 1 0 0 0
        0 0 1 0 0
        0 0 0 ${config.alpha} -10
      `,
    },
  });

  document.documentElement.dataset.theme = config.theme;
  document.documentElement.dataset.mapped = config.mapped;
  document.documentElement.dataset.delta = config.delta;
  document.documentElement.dataset.debug = config.debug;
  document.documentElement.dataset.active = config.active;
  document.documentElement.dataset.bounce = config.bounce;

  toggle.style.setProperty("--complete", config.complete);
  toggle.style.setProperty("--hue", config.hue);
};

const sync = (event) => {
  const label =
    event.target?.controller?.view?.labelElement?.innerText;

  if (
    !document.startViewTransition ||
    label !== "theme"
  ) {
    update();
    return;
  }

  document.startViewTransition(() => update());
};

// -------------------------
// Tweakpane
// -------------------------

const debugSettings = ctrl.addFolder({
  title: "debug",
  expanded: false,
});

debugSettings.addBinding(config, "debug");
debugSettings.addBinding(config, "active");

debugSettings.addBinding(config, "complete", {
  min: 0,
  max: 100,
  label: "complete (%)",
  step: 1,
});

const behaviorSettings = ctrl.addFolder({
  title: "behavior",
  expanded: false,
});

behaviorSettings.addBinding(config, "bounce");
behaviorSettings.addBinding(config, "mapped");
behaviorSettings.addBinding(config, "bubble");
behaviorSettings.addBinding(config, "delta");

behaviorSettings.addBinding(config, "hue", {
  min: 0,
  max: 359,
  step: 1,
});

const settings = ctrl.addFolder({
  title: "filter",
  disabled: false,
  expanded: false,
});

settings.addBinding(config, "deviation", {
  min: 0,
  max: 50,
  step: 1,
  label: "stdDeviation",
});

settings.addBinding(config, "alpha", {
  min: 0,
  max: 50,
  step: 1,
  label: "alpha",
});

ctrl.addBinding(config, "theme", {
  label: "theme",
  options: {
    system: "system",
    light: "light",
    dark: "dark",
  },
});

ctrl.on("change", sync);

update();

// -------------------------
// Toggle
// -------------------------

const toggleState = async () => {
  toggle.dataset.pressed = "true";

  if (config.bubble) {
    toggle.dataset.active = "true";
  }

  await Promise.allSettled(
    !config.bounce
      ? toggle
          .getAnimations({ subtree: true })
          .map((animation) => animation.finished)
      : []
  );

  const pressed = toggle.matches("[aria-pressed=true]");

  gsap
    .timeline({
      onComplete: () => {
        gsap.delayedCall(0.05, () => {
          toggle.dataset.active = "false";
          toggle.dataset.pressed = "false";

          toggle.setAttribute(
            "aria-pressed",
            String(
              !toggle.matches("[aria-pressed=true]")
            )
          );
        });
      },
    })
    .to(toggle, {
      "--complete": pressed ? 0 : 100,
      duration: 0.12,
      delay:
        config.bounce && config.bubble
          ? 0.18
          : 0,
    });
};

// -------------------------
// Drag
// -------------------------

const proxy = document.createElement("div");

Draggable.create(proxy, {
  allowContextMenu: true,
  handle: ".liquid-toggle",

  onDragStart: function () {
    const toggleBounds =
      toggle.getBoundingClientRect();

    const pressed =
      toggle.matches("[aria-pressed=true]");

    const bounds = pressed
      ? toggleBounds.left - this.pointerX
      : toggleBounds.left +
        toggleBounds.width -
        this.pointerX;

    this.dragBounds = bounds;

    toggle.dataset.active = "true";
  },

  onDrag: function () {
    const pressed =
      toggle.matches("[aria-pressed=true]");

    const dragged =
      this.x - this.startX;

    const complete = gsap.utils.clamp(
      0,
      100,
      pressed
        ? gsap.utils.mapRange(
            this.dragBounds,
            0,
            0,
            100,
            dragged
          )
        : gsap.utils.mapRange(
            0,
            this.dragBounds,
            0,
            100,
            dragged
          )
    );

    this.complete = complete;

    gsap.set(toggle, {
      "--complete": complete,
      "--delta": Math.min(
        Math.abs(this.deltaX),
        12
      ),
    });
  },

  onDragEnd: function () {
    const complete =
      this.complete ?? 0;

    gsap.fromTo(
      toggle,
      {
        "--complete": complete,
      },
      {
        "--complete":
          complete >= 50
            ? 100
            : 0,

        duration: 0.15,

        onComplete: () => {
          gsap.delayedCall(0.05, () => {
            toggle.dataset.active = "false";

            toggle.setAttribute(
              "aria-pressed",
              String(complete >= 50)
            );
          });
        },
      }
    );
  },

  onPress: function () {
    this.__pressTime = Date.now();

    const arrow =
      document.querySelector(
        ".arrow--main"
      );

    if (arrow) {
      arrow.style.setProperty(
        "opacity",
        "0"
      );
    }

    toggle.dataset.active = "true";
    toggle.dataset.pressed = "true";
  },

  onRelease: function () {
    this.__releaseTime = Date.now();

    gsap.set(toggle, {
      "--delta": 0,
    });

    if (
      this.__releaseTime -
        this.__pressTime <=
      150
    ) {
      toggleState();
      return;
    }

    if (!this.isDragging) {
      toggle.dataset.active = "false";
      toggle.dataset.pressed = "false";
    }
  },
});

// -------------------------
// Teclado
// -------------------------

toggle.addEventListener(
  "keydown",
  (event) => {
    const arrow =
      document.querySelector(
        ".arrow--main"
      );

    if (arrow) {
      arrow.style.setProperty(
        "opacity",
        "0"
      );
    }

    if (event.key === "Enter") {
      toggleState();
    }

    if (event.key === " ") {
      event.preventDefault();
    }
  }
);

toggle.addEventListener(
  "keyup",
  (event) => {
    if (event.key === " ") {
      toggleState();
    }
  }
);

// -------------------------
// Painel Tweakpane arrastável
// -------------------------

const tweakClass = "div.tp-dfwv";

const draggablePane =
  Draggable.create(tweakClass, {
    type: "x,y",
    allowEventDefault: true,
    trigger:
      tweakClass +
      " button.tp-rotv_b",
  });

const tweakPane =
  document.querySelector(
    tweakClass
  );

if (tweakPane) {
  tweakPane.addEventListener(
    "dblclick",
    () => {
      gsap.to(tweakClass, {
        x: `+=${draggablePane[0].x * -1}`,
        y: `+=${draggablePane[0].y * -1}`,

        onComplete: () => {
          gsap.set(tweakClass, {
            clearProps: "all",
          });
        },
      });
    }
  );
}