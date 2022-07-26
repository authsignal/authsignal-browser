import A11yDialog from "a11y-dialog";

const CONTAINER_ID = "__authsignal-popup-container";
const CONTENT_ID = "__authsignal-popup-content";
const OVERLAY_ID = "__authsignal-popup-overlay";
const STYLE_ID = "__authsignal-popup-style";

type PopupShowInput = {
  url: string;
};

type EventType = "show" | "hide" | "destroy" | "create";

type EventHandler = (node: Element, event?: Event) => void;

class PopupHandler {
  private popup: A11yDialog | null = null;

  constructor() {
    if (document.querySelector(`#${CONTAINER_ID}`)) {
      throw new Error("Multiple instances of Authsignal popup is not supported.");
    }

    this.create();
  }

  create() {
    // Create dialog container
    const container = document.createElement("div");
    container.setAttribute("id", CONTAINER_ID);
    container.setAttribute("aria-hidden", "true");

    // Create dialog overlay
    const overlay = document.createElement("div");
    overlay.setAttribute("id", OVERLAY_ID);
    overlay.setAttribute("data-a11y-dialog-hide", "true");

    // Create dialog content
    const content = document.createElement("div");
    content.setAttribute("id", CONTENT_ID);

    document.body.appendChild(container);

    // Create CSS for dialog
    const style = document.createElement("style");
    style.setAttribute("id", STYLE_ID);
    style.textContent = `
      #${CONTAINER_ID},
      #${OVERLAY_ID} {
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
      }

      #${CONTAINER_ID} {
        z-index: 2147483647;
        display: flex;
      }

      #${CONTAINER_ID}[aria-hidden='true'] {
        display: none;
      }

      #${OVERLAY_ID} {
        background-color: rgba(43, 46, 56, 0.9);
      }

      #${CONTENT_ID} {
        margin: auto;
        z-index: 2147483647;
        position: relative;
        background-color: white;
        height: 600px;
        width: 600px;
        border-radius: 5px;
      }

      #${CONTENT_ID} iframe {
        width: 100%;
        height: 100%;
      }
    `;

    // Attach the created elements
    document.head.insertAdjacentElement("beforeend", style);
    container.appendChild(overlay);
    container.appendChild(content);

    this.popup = new A11yDialog(container);

    // Make sure to remove any trace of the dialog on hide
    this.popup.on("hide", () => {
      this.destroy();
    });
  }

  destroy() {
    const dialogEl = document.querySelector(`#${CONTAINER_ID}`);
    const styleEl = document.querySelector(`#${STYLE_ID}`);

    if (dialogEl && styleEl) {
      document.body.removeChild(dialogEl);
      document.head.removeChild(styleEl);
    }
  }

  show({url}: PopupShowInput) {
    if (!this.popup) {
      throw new Error("Popup is not initialized");
    }

    const iframe = document.createElement("iframe");

    iframe.setAttribute("name", "authsignal");
    iframe.setAttribute("title", "Authsignal multi-factor authentication");
    iframe.setAttribute("src", url);
    iframe.setAttribute("frameborder", "0");

    const dialogContent = document.querySelector(`#${CONTENT_ID}`);

    if (dialogContent) {
      dialogContent.appendChild(iframe);
    }

    this.popup.show();
  }

  close() {
    if (!this.popup) {
      throw new Error("Popup is not initialized");
    }

    this.popup.hide();
  }

  on(event: EventType, handler: EventHandler) {
    if (!this.popup) {
      throw new Error("Popup is not initialized");
    }

    this.popup.on(event, handler);
  }
}

export {PopupHandler};
