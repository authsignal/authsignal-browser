import A11yDialog from "a11y-dialog";
import {AuthsignalChallenge} from "./types";

const DIALOG_CONTAINER_ID = "authsignal-popup";
const DIALOG_CONTENT_ID = "authsignal-popup-content";

class PopupHandler {
  private popup: A11yDialog | null = null;

  constructor() {
    if (document.querySelector(`#${DIALOG_CONTAINER_ID}`)) {
      throw new Error("Multiple instances of Authsignal popup is not supported.");
    }

    this.create();
  }

  create() {
    // Dialog container
    const container = document.createElement("div");
    container.setAttribute("id", DIALOG_CONTAINER_ID);
    container.setAttribute("aria-hidden", "true");
    container.setAttribute("class", "dialog-container");

    // Dialog overlay
    const overlay = document.createElement("div");
    overlay.setAttribute("class", "dialog-overlay");
    overlay.setAttribute("data-a11y-dialog-hide", "true");
    container.appendChild(overlay);

    // Dialog content
    const content = document.createElement("div");
    content.setAttribute("class", "dialog-content");
    content.setAttribute("id", DIALOG_CONTENT_ID);
    container.appendChild(content);

    document.body.appendChild(container);

    this.popup = new A11yDialog(container);
    this.popup.on("hide", this.destroy);
  }

  destroy() {
    const dialogEl = document.querySelector(`#${DIALOG_CONTAINER_ID}`);
    if (dialogEl) {
      document.body.removeChild(dialogEl);
    }
  }

  show({challengeUrl}: {challengeUrl: AuthsignalChallenge["challengeUrl"]}) {
    if (!this.popup) {
      throw new Error("Popup is not initialized");
    }

    const iframe = document.createElement("iframe");
    iframe.setAttribute("name", "authsignal");
    iframe.setAttribute("title", "Authsignal multi-factor authentication challenge");
    iframe.setAttribute("src", challengeUrl);
    iframe.setAttribute("width", "600");
    iframe.setAttribute("height", "600");
    iframe.setAttribute("frameborder", "0");

    const dialogContent = document.querySelector(`#${DIALOG_CONTENT_ID}`);
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
}

export {PopupHandler};
