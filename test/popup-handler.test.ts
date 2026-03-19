import {describe, it, expect, beforeEach, afterEach, vi} from "vitest";

// jsdom doesn't implement CSS.supports
globalThis.CSS = {supports: () => true} as unknown as typeof CSS;

// Mock a11y-dialog before importing PopupHandler
vi.mock("a11y-dialog", () => {
  return {
    default: class MockA11yDialog {
      shown = false;
      private listeners: Record<string, EventListener[]> = {};

      constructor(_el: HTMLElement) {}

      show() {
        this.shown = true;
      }

      hide() {
        this.shown = false;
        this.listeners["hide"]?.forEach((fn) => fn(new Event("hide")));
      }

      on(event: string, listener: EventListener) {
        if (!this.listeners[event]) {
          this.listeners[event] = [];
        }
        this.listeners[event].push(listener);
      }
    },
  };
});

import {PopupHandler} from "../src/handlers/popup-handler";

describe("PopupHandler", () => {
  const expectedOrigin = "https://mfa.example.com";
  const url = `${expectedOrigin}/challenge?token=abc&mode=popup`;

  let activeHandler: PopupHandler | null = null;

  beforeEach(() => {
    document.body.innerHTML = "";
    document.head.innerHTML = "";
  });

  afterEach(() => {
    // Ensure handler is fully cleaned up including message listeners
    if (activeHandler) {
      try {
        // @ts-expect-error accessing private method for test cleanup
        activeHandler.destroy();
      } catch {
        // Already destroyed
      }
      activeHandler = null;
    }
    document.body.innerHTML = "";
    document.head.innerHTML = "";
    vi.restoreAllMocks();
  });

  function createHandler(options: {width?: string; height?: string; isClosable?: boolean} = {}) {
    activeHandler = new PopupHandler({
      width: options.width,
      height: options.height,
      isClosable: options.isClosable,
    });
    return activeHandler;
  }

  function dispatchMessage(data: unknown, origin = expectedOrigin) {
    const event = new MessageEvent("message", {data, origin});
    window.dispatchEvent(event);
  }

  describe("resizeIframe", () => {
    it("should update iframe height from resize message", () => {
      const handler = createHandler();
      handler.show({url, expectedOrigin});

      dispatchMessage({height: 500});

      const iframe = document.querySelector<HTMLIFrameElement>("#__authsignal-popup-iframe");
      expect(iframe?.style.height).toBe("500px");
    });

    it("should ignore resize messages from unexpected origins", () => {
      const handler = createHandler();
      handler.show({url, expectedOrigin});

      dispatchMessage({height: 500}, "https://evil.com");

      const iframe = document.querySelector<HTMLIFrameElement>("#__authsignal-popup-iframe");
      expect(iframe?.style.height).not.toBe("500px");
    });

    it("should not set up resize listener when height is fixed", () => {
      const handler = createHandler({height: "600px"});
      handler.show({url, expectedOrigin});

      dispatchMessage({height: 500});

      const iframe = document.querySelector<HTMLIFrameElement>("#__authsignal-popup-iframe");
      expect(iframe?.style.height).not.toBe("500px");
    });
  });

  describe("scrolling attribute", () => {
    it("should set scrolling='no' in dynamic height mode", () => {
      const handler = createHandler();
      handler.show({url, expectedOrigin});

      const iframe = document.querySelector<HTMLIFrameElement>("#__authsignal-popup-iframe");
      expect(iframe?.getAttribute("scrolling")).toBe("no");
    });

    it("should not set scrolling='no' in fixed height mode", () => {
      const handler = createHandler({height: "600px"});
      handler.show({url, expectedOrigin});

      const iframe = document.querySelector<HTMLIFrameElement>("#__authsignal-popup-iframe");
      expect(iframe?.getAttribute("scrolling")).toBeNull();
    });
  });

  describe("AUTHSIGNAL_READY", () => {
    it("should reveal popup when AUTHSIGNAL_READY is received", async () => {
      const handler = createHandler();
      handler.show({url, expectedOrigin});

      const container = document.querySelector("#__authsignal-popup-container");
      expect(container?.classList.contains("as-popup-visible")).toBe(false);

      dispatchMessage(JSON.stringify({event: "AUTHSIGNAL_READY"}));

      // Wait for double rAF
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      expect(container?.classList.contains("as-popup-visible")).toBe(true);
    });

    it("should add as-iframe-ready class when AUTHSIGNAL_READY is received", () => {
      const handler = createHandler();
      handler.show({url, expectedOrigin});

      dispatchMessage(JSON.stringify({event: "AUTHSIGNAL_READY"}));

      const iframe = document.querySelector<HTMLIFrameElement>("#__authsignal-popup-iframe");
      expect(iframe?.classList.contains("as-iframe-ready")).toBe(true);
    });

    it("should fallback and reveal after 3 seconds if AUTHSIGNAL_READY is never received", async () => {
      vi.useFakeTimers();

      const handler = createHandler();
      handler.show({url, expectedOrigin});

      const iframe = document.querySelector<HTMLIFrameElement>("#__authsignal-popup-iframe");
      expect(iframe?.classList.contains("as-iframe-ready")).toBe(false);

      vi.advanceTimersByTime(3000);

      expect(iframe?.classList.contains("as-iframe-ready")).toBe(true);

      vi.useRealTimers();
    });

    it("should not reveal twice if AUTHSIGNAL_READY arrives after fallback", () => {
      vi.useFakeTimers();

      const handler = createHandler();
      handler.show({url, expectedOrigin});

      vi.advanceTimersByTime(3000);

      const iframe = document.querySelector<HTMLIFrameElement>("#__authsignal-popup-iframe");
      expect(iframe?.classList.contains("as-iframe-ready")).toBe(true);

      // Sending AUTHSIGNAL_READY after fallback should not cause issues
      dispatchMessage(JSON.stringify({event: "AUTHSIGNAL_READY"}));

      // Still has the class, no errors thrown
      expect(iframe?.classList.contains("as-iframe-ready")).toBe(true);

      vi.useRealTimers();
    });
  });

  describe("close animation", () => {
    it("should add as-popup-closing class and remove as-popup-visible", async () => {
      const handler = createHandler();
      handler.show({url, expectedOrigin});

      // Trigger ready to make popup visible
      dispatchMessage(JSON.stringify({event: "AUTHSIGNAL_READY"}));
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      const container = document.querySelector("#__authsignal-popup-container");
      expect(container?.classList.contains("as-popup-visible")).toBe(true);

      handler.close();

      expect(container?.classList.contains("as-popup-visible")).toBe(false);
      expect(container?.classList.contains("as-popup-closing")).toBe(true);
    });

    it("should call hide after fallback timeout", () => {
      vi.useFakeTimers();

      const handler = createHandler();
      handler.show({url, expectedOrigin});

      handler.close();

      // Container should still exist before timeout
      expect(document.querySelector("#__authsignal-popup-container")).not.toBeNull();

      vi.advanceTimersByTime(150);

      // After timeout, hide() is called which triggers destroy()
      expect(document.querySelector("#__authsignal-popup-container")).toBeNull();

      vi.useRealTimers();
    });
  });

  describe("message listener cleanup", () => {
    it("should remove resize listener on destroy", () => {
      const removeSpy = vi.spyOn(window, "removeEventListener");

      const handler = createHandler();
      handler.show({url, expectedOrigin});

      handler.close();

      // Trigger the fallback timeout to call hide/destroy
      const container = document.querySelector("#__authsignal-popup-container");
      const content = document.querySelector("#__authsignal-popup-content");
      content?.dispatchEvent(new Event("transitionend"));

      expect(removeSpy).toHaveBeenCalledWith("message", expect.any(Function));

      removeSpy.mockRestore();
    });
  });

  describe("reduced motion", () => {
    it("should include prefers-reduced-motion media query in styles", () => {
      const handler = createHandler();

      const style = document.querySelector("#__authsignal-popup-style");
      expect(style?.textContent).toContain("prefers-reduced-motion: reduce");
      expect(style?.textContent).toContain("transition: none !important");
    });
  });
});
