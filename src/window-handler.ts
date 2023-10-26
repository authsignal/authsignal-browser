import {popupCenterScreen} from "./helpers";

type PopupShowInput = {
  url: string;
  width?: string;
  height?: string;
};

const DEFAULT_WIDTH = "400";
const DEFAULT_HEIGHT = "500";

class WindowHandler {
  private popup: Window | null = null;

  show({url, width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT}: PopupShowInput) {
    const popup = popupCenterScreen({url, width, height, win: window});

    if (!popup) {
      throw new Error("Popup is not initialized");
    }
    this.popup = popup;
    return popup;
  }

  close() {
    if (!this.popup) {
      throw new Error("Popup is not initialized");
    }

    this.popup.close();
  }
}

export {WindowHandler};
