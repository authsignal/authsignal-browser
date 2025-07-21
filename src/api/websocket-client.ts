import {TokenCache} from "../token-cache";
import {
  WebSocketMessage,
  CreateChallengeMessage,
  ChallengeCreatedMessage,
  StateChangeMessage,
  WebSocketQrCodeOptions,
  WebSocketQrCodeResponse,
} from "./types/websocket";

const CHALLENGE_CREATED_HANDLER = "CHALLENGE_CREATED_HANDLER";

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private baseUrl: string;
  private tenantId: string;
  private messageHandlers: Map<string, (message: WebSocketMessage) => void> = new Map();
  private options: WebSocketQrCodeOptions | null = null;
  private refreshInterval: NodeJS.Timeout | null = null;
  private tokenCache = TokenCache.shared;

  constructor({baseUrl, tenantId}: {baseUrl: string; tenantId: string}) {
    const wsUrl = baseUrl
      .replace("https://", "wss://")
      .replace("http://", "ws://")
      .replace("v1", "ws-v1-challenge")
      .replace("api", "api-ws");

    this.baseUrl = wsUrl;
    this.tenantId = tenantId;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const protocols = ["authsignal-ws"];
        if (this.tokenCache.token) {
          protocols.push(`x.authsignal.token.${this.tokenCache.token}`);
        } else {
          protocols.push(`x.authsignal.tenant.${this.tenantId}`);
        }
        this.ws = new WebSocket(this.baseUrl, protocols);

        this.ws.onopen = () => {
          resolve();
        };

        this.ws.onerror = (error) => {
          reject(new Error(`WebSocket connection error: ${error}`));
        };

        this.ws.onclose = () => {
          if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
          }

          this.messageHandlers.clear();

          this.ws = null;
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as WebSocketMessage;
            this.handleMessage(message);
          } catch (error) {
            console.error("Failed to parse WebSocket message:", error);
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleMessage(message: WebSocketMessage): void {
    if (message.type === "CHALLENGE_CREATED") {
      const handler = this.messageHandlers.get(CHALLENGE_CREATED_HANDLER);
      if (handler) {
        handler(message);
      } else {
        throw new Error("Challenge created handler not found");
      }
    } else if (message.type === "STATE_CHANGE") {
      const handler = this.messageHandlers.get(message.data.challengeId);
      if (handler) {
        handler(message);
      }
    }
  }

  async createQrCodeChallenge(options: WebSocketQrCodeOptions): Promise<WebSocketQrCodeResponse> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      await this.connect();
    }

    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    this.options = options;

    return new Promise((resolve, reject) => {
      const handler = (message: WebSocketMessage) => {
        if (message.type === "CHALLENGE_CREATED") {
          const created = message as ChallengeCreatedMessage;

          this.messageHandlers.delete(CHALLENGE_CREATED_HANDLER);

          this.monitorChallengeState(created.data.challengeId, options);
          this.startRefreshCycle(created.data.challengeId, options);

          resolve({
            challengeId: created.data.challengeId,
            expiresAt: created.data.expiresAt,
            state: created.data.state,
          });
        }
      };

      this.messageHandlers.set(CHALLENGE_CREATED_HANDLER, handler);
      this.sendChallengeRequest(options).catch(reject);
    });
  }

  private monitorChallengeState(challengeId: string, options: WebSocketQrCodeOptions): void {
    this.messageHandlers.set(challengeId, (message: WebSocketMessage) => {
      if (message.type === "STATE_CHANGE") {
        const stateMessage = message as StateChangeMessage;
        options.onStateChange?.(stateMessage.data.state, stateMessage.data.accessToken);

        if (stateMessage.data.state === "approved" || stateMessage.data.state === "rejected") {
          this.messageHandlers.delete(challengeId);
        }
      }
    });
  }

  private startRefreshCycle(currentChallengeId: string, options: WebSocketQrCodeOptions): void {
    const interval = options.refreshInterval || 9 * 60 * 1000;
    let challengeId = currentChallengeId;

    this.refreshInterval = setInterval(async () => {
      this.messageHandlers.delete(challengeId);

      try {
        const newChallenge = await this.createQrCodeChallenge(options);
        challengeId = newChallenge.challengeId;

        options.onRefresh?.(newChallenge.challengeId, newChallenge.expiresAt);
      } catch (error) {
        console.error("Failed to refresh QR code challenge:", error);
        if (this.refreshInterval) {
          clearInterval(this.refreshInterval);
          this.refreshInterval = null;
        }
      }
    }, interval);
  }

  private async sendChallengeRequest(options: WebSocketQrCodeOptions): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      await this.connect();
    }

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket connection could not be established");
    }

    this.sendMessage({
      type: "CREATE_CHALLENGE",
      data: {
        challengeType: "QR_CODE",
        actionCode: options.action,
        custom: options.custom,
      },
    });
  }

  private sendMessage(message: CreateChallengeMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket not connected");
    }
    this.ws.send(JSON.stringify(message));
  }

  async refreshQrCodeChallenge({custom}: {custom?: Record<string, unknown>}): Promise<WebSocketQrCodeResponse> {
    if (!this.options) {
      throw new Error("Call createQrCodeChallenge first");
    }

    const newChallenge = await this.createQrCodeChallenge({
      ...this.options,
      ...(custom !== undefined && {custom}),
    });

    this.options.onRefresh?.(newChallenge.challengeId, newChallenge.expiresAt);

    return newChallenge;
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
    }
  }
}
