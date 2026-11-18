// Small HTML pieces used in more than one place.

// A "− value +" control. Clicks are handled in main.js through data-step, data-index and data-delta.
export const stepper = (target, value, index = "", small = false) => `<div class="step${small ? " sm" : ""}"><button data-step="${target}" data-index="${index}" data-delta="-1" aria-label="Less">−</button><span>${value}</span><button data-step="${target}" data-index="${index}" data-delta="1" aria-label="More">+</button></div>`;

// A product design image in a tile or in the cart.
export const thumbnail = (src, fit) => `<img class="sw${fit === "contain" ? " contain" : ""}" src="${src}" alt="">`;
