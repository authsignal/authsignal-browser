import A11yDialog, {A11yDialogEvent} from "a11y-dialog";

const CONTAINER_ID = "__authsignal-popup-container";
const CONTENT_ID = "__authsignal-popup-content";
const OVERLAY_ID = "__authsignal-popup-overlay";
const STYLE_ID = "__authsignal-popup-style";
const IFRAME_ID = "__authsignal-popup-iframe";

const DEFAULT_WIDTH = "385px";

const INITIAL_HEIGHT = "384px";

type PopupShowInput = {
  url: string;
};

type PopupHandlerOptions = {
  width?: string;
  height?: string;
  isClosable?: boolean;
};

export class PopupHandler {
  private popup: A11yDialog | null = null;
  private height: string | undefined;

  constructor({width, height, isClosable}: PopupHandlerOptions) {
    if (document.querySelector(`#${CONTAINER_ID}`)) {
      throw new Error("Multiple instances of Authsignal popup is not supported.");
    }

    this.height = height;

    this.create({width, height, isClosable});
  }

  create({width = DEFAULT_WIDTH, height, isClosable = true}: PopupHandlerOptions) {
    const isWidthValidCSSValue = CSS.supports("width", width);

    let popupWidth = width;

    if (!isWidthValidCSSValue) {
      console.warn("Invalid CSS value for `popupOptions.width`. Using default value instead.");
      popupWidth = DEFAULT_WIDTH;
    }

    // Create dialog container
    const container = document.createElement("div");
    container.setAttribute("id", CONTAINER_ID);
    container.setAttribute("aria-hidden", "true");

    if (!isClosable) {
      container.setAttribute("role", "alertdialog");
    }

    // Create dialog overlay
    const overlay = document.createElement("div");
    overlay.setAttribute("id", OVERLAY_ID);

    if (isClosable) {
      overlay.setAttribute("data-a11y-dialog-hide", "true");
    }

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
        background-color: rgba(0, 0, 0, 0.18);
      }

      #${CONTENT_ID} {
        margin: auto;
        z-index: 2147483647;
        position: relative;
        background-color: transparent;
        border-radius: 8px;
        width: ${popupWidth};
      }

      #${CONTENT_ID} iframe {
        width: 1px;
        min-width: 100%;
        border-radius: inherit;
        max-height: 95vh;
        height: ${height ?? INITIAL_HEIGHT};
      }
    `;

    // Attach the created elements
    document.head.insertAdjacentElement("beforeend", style);
    container.appendChild(overlay);
    container.appendChild(content);

    this.popup = new A11yDialog(container);

    // Safari and Firefox will fail the WebAuthn request if the document making
    // the request does not have focus. This will reduce the chances of that
    // happening by focusing on the dialog container.
    container.focus();

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

    window.removeEventListener("message", resizeIframe);
  }

  show({url}: PopupShowInput) {
    if (!this.popup) {
      throw new Error("Popup is not initialized");
    }

    const iframe = document.createElement("iframe");

    iframe.setAttribute("id", IFRAME_ID);
    iframe.setAttribute("name", "authsignal");
    iframe.setAttribute("title", "Authsignal multi-factor authentication");
    iframe.setAttribute("src", url);
    iframe.setAttribute("frameborder", "0");
    iframe.setAttribute("allow", "publickey-credentials-get *; publickey-credentials-create *; clipboard-write");

    const dialogContent = document.querySelector(`#${CONTENT_ID}`);

    if (dialogContent) {
      dialogContent.appendChild(iframe);
    }

    // Dynamic resizing if no height is set.
    if (!this.height) {
      window.addEventListener("message", resizeIframe);
    }

    this.popup?.show();
  }

  close() {
    if (!this.popup) {
      throw new Error("Popup is not initialized");
    }

    this.popup.hide();
  }

  on(event: A11yDialogEvent, listener: EventListener) {
    if (!this.popup) {
      throw new Error("Popup is not initialized");
    }

    this.popup.on(event, listener);
  }
}

/**
 * Resize the iframe to the height of the pre-built UI's (#widget_container)
 * @param event MessageEvent
 */
function resizeIframe(event: MessageEvent) {
  const iframeEl = document.querySelector<HTMLIFrameElement>(`#${IFRAME_ID}`);

  if (iframeEl && event.data.height) {
    iframeEl.style.height = event.data.height + "px";
  }
}
