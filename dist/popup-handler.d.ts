declare type PopupShowInput = {
    url: string;
};
declare type EventType = "show" | "hide" | "destroy" | "create";
declare type EventHandler = (node: Element, event?: Event) => void;
declare type PopupHandlerOptions = {
    width?: string;
};
declare class PopupHandler {
    private popup;
    private isHeightAutoResized;
    constructor({ width }: PopupHandlerOptions);
    create({ width }: PopupHandlerOptions): void;
    destroy(): void;
    show({ url }: PopupShowInput): void;
    close(): void;
    on(event: EventType, handler: EventHandler): void;
}
export { PopupHandler };
