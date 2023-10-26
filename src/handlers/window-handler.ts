type WindowShowInput = {
  url: string;
  width?: number;
  height?: number;
};

const DEFAULT_WIDTH = 400;
const DEFAULT_HEIGHT = 500;

export class WindowHandler {
  private windowRef: Window | null = null;

  show({url, width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT}: WindowShowInput) {
    const windowRef = openWindow({url, width, height, win: window});

    if (!windowRef) {
      throw new Error("Window is not initialized");
    }

    this.windowRef = windowRef;

    return windowRef;
  }

  close() {
    if (!this.windowRef) {
      throw new Error("Window is not initialized");
    }

    this.windowRef.close();
  }
}

type OpenWindowInput = {
  url: string;
  width: number;
  height: number;
  win: Window;
};

function openWindow({url, width, height, win}: OpenWindowInput): Window | null {
  if (!win.top) {
    return null;
  }

  const y = win.top.outerHeight / 2 + win.top.screenY - height / 2;
  const x = win.top.outerWidth / 2 + win.top.screenX - width / 2;

  return window.open(
    url,
    "",
    `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=${width}, height=${height}, top=${y}, left=${x}`
  );
}
