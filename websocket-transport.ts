const WebSocket = globalThis.WebSocket || NodeWebSocket;

export class WebSocketTransport implements ITransport {
    ws: WebSocket | NodeWebSocket;
    protocols?: string | string[];

    constructor(public events: ITransportEventMap) {}

    public send(data: ArrayBuffer | Array<number>): void {
        // Check if the WebSocket is in the OPEN state before sending
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            if (data instanceof ArrayBuffer) {
                this.ws.send(data);
            } else if (Array.isArray(data)) {
                this.ws.send((new Uint8Array(data)).buffer);
            }
        } else {
            // Optionally, handle the case where the WebSocket is not open.
            // This could involve logging, queuing the message for later,
            // or informing the user that the connection is not ready.
            console.warn("Attempted to send data while WebSocket is not OPEN. Current state:", this.ws ? this.ws.readyState : 'not initialized');
        }
    }

    public connect(url: string) {
        this.ws = new WebSocket(url, this.protocols);
        this.ws.binaryType = 'arraybuffer';
        this.ws.onopen = this.events.onopen;
        this.ws.onmessage = this.events.onmessage;
        this.ws.onclose = this.events.onclose;
        this.ws.onerror = this.events.onerror;
    }

    public close(code?: number, reason?: string) {
        // Only attempt to close if the WebSocket is not already closing or closed
        if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
            this.ws.close(code, reason);
        }
    }
}