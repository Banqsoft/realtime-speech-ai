customElements.define(
  "slide-show",
  class extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
    }
    connectedCallback() {
      this.shadowRoot!.innerHTML = `
        <h1>My Presentation Component</h1>
        <p>This is a presentation component</p>
        `;
    }

    async componentInfo() {
      return "You are looking at the presentation";
    }
  },
);
