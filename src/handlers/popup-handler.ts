import A11yDialog, {A11yDialogEvent} from "a11y-dialog";
import {AuthsignalWindowMessage} from "../types";

const CONTAINER_ID = "__authsignal-popup-container";
const CONTENT_ID = "__authsignal-popup-content";
const OVERLAY_ID = "__authsignal-popup-overlay";
const STYLE_ID = "__authsignal-popup-style";
const IFRAME_ID = "__authsignal-popup-iframe";

const DEFAULT_WIDTH = "385px";

const INITIAL_HEIGHT = "384px";

type PopupShowInput = {
  url: string;
  expectedOrigin: string;
};

type PopupHandlerOptions = {
  width?: string;
  height?: string;
  isClosable?: boolean;
};

export class PopupHandler {
  private popup: A11yDialog | null = null;
  private height: string | undefined;
  private resizeListener: ((event: MessageEvent) => void) | null = null;
  private iframeReady = false;

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
        opacity: 0;
        transition: opacity 150ms ease-out;
      }

      #${CONTAINER_ID}.as-popup-visible #${OVERLAY_ID} {
        opacity: 1;
      }

      #${CONTAINER_ID}.as-popup-closing #${OVERLAY_ID} {
        opacity: 0;
        transition-duration: 120ms;
        transition-timing-function: ease-in;
      }

      #${CONTENT_ID} {
        margin: auto;
        z-index: 2147483647;
        position: relative;
        background-color: transparent;
        border-radius: 8px;
        overflow: hidden;
        width: ${popupWidth};
        opacity: 0;
        transform: scale(0.95);
        transition: opacity 150ms ease-out, transform 150ms ease-out;
      }

      #${CONTAINER_ID}.as-popup-visible #${CONTENT_ID} {
        opacity: 1;
        transform: scale(1);
      }

      #${CONTAINER_ID}.as-popup-closing #${CONTENT_ID} {
        opacity: 0;
        transform: scale(0.95);
        transition-duration: 120ms;
        transition-timing-function: ease-in;
      }

      #${CONTENT_ID} iframe {
        width: 1px;
        min-width: 100%;
        border-radius: inherit;
        max-height: ${height ? "100%" : "95vh"};
        height: ${height ?? INITIAL_HEIGHT};
        opacity: 0;
        transition: opacity 200ms ease-out;
      }

      #${CONTENT_ID} iframe.as-iframe-ready {
        opacity: 1;
      }

      @media (prefers-reduced-motion: reduce) {
        #${OVERLAY_ID},
        #${CONTENT_ID},
        #${CONTENT_ID} iframe {
          transition: none !important;
        }
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

    if (this.resizeListener) {
      window.removeEventListener("message", this.resizeListener);
      this.resizeListener = null;
    }
  }

  show({url, expectedOrigin}: PopupShowInput) {
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

    // Disable scrolling in dynamic height mode — the iframe resizes to fit
    // content, so scrollbars are never needed and would flash during load.
    if (!this.height) {
      iframe.setAttribute("scrolling", "no");
    }

    const dialogContent = document.querySelector(`#${CONTENT_ID}`);

    if (dialogContent) {
      dialogContent.appendChild(iframe);
    }

    this.popup?.show();

    const container = document.querySelector(`#${CONTAINER_ID}`);

    const triggerOpenAnimation = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          container?.classList.add("as-popup-visible");
        });
      });
    };

    // Dynamic resizing if no height is set.
    if (!this.height) {
      const revealPopup = () => {
        if (this.iframeReady) return;
        this.iframeReady = true;
        iframe.classList.add("as-iframe-ready");
        triggerOpenAnimation();
      };

      // Fallback: reveal after 3s if AUTHSIGNAL_READY is never received
      // (e.g. due to a network issue or unexpected error in the pre-built UI)
      const fallbackTimer = setTimeout(revealPopup, 3000);

      this.resizeListener = (event: MessageEvent) => {
        if (event.origin !== expectedOrigin) return;

        // Handle resize messages (raw objects with height property)
        resizeIframe(event);

        // Wait for explicit ready signal from the pre-built UI
        if (!this.iframeReady) {
          let eventName: string | undefined;

          try {
            const data = JSON.parse(event.data);
            eventName = data?.event;
          } catch {
            // Resize messages are raw objects, not JSON-stringified
          }

          if (eventName === AuthsignalWindowMessage.AUTHSIGNAL_READY) {
            clearTimeout(fallbackTimer);
            revealPopup();
          }
        }
      };

      window.addEventListener("message", this.resizeListener);
    } else {
      // Fixed height mode: animate in immediately, reveal iframe on load
      triggerOpenAnimation();

      iframe.addEventListener("load", () => {
        setTimeout(() => {
          iframe.classList.add("as-iframe-ready");
        }, 50);
      });
    }
  }

  close() {
    if (!this.popup) {
      throw new Error("Popup is not initialized");
    }

    const container = document.querySelector(`#${CONTAINER_ID}`);
    const content = document.querySelector(`#${CONTENT_ID}`);

    container?.classList.remove("as-popup-visible");
    container?.classList.add("as-popup-closing");

    let hidden = false;

    const hide = () => {
      if (hidden) return;
      hidden = true;
      this.popup?.hide();
    };

    content?.addEventListener("transitionend", hide, {once: true});

    // Fallback in case transitionend doesn't fire
    setTimeout(hide, 150);
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
