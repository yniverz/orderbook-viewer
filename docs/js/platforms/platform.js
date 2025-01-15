
export class OrderBookEntry {
    constructor(price, size, time) {
        this.price = price;
        this.size = size;
        this.time = time;
    }
}

/**
 * A standardized data structure for parsed messages.
 * @property {string} platform - Which platform this message came from.
 * @property {string} type - The "type" or category of the message.
 * @property {OrderBookEntry[]} bids - Array of bid entries.
 * @property {OrderBookEntry[]} asks - Array of ask entries.
 * @property {number} timestamp - When the message was received/parsed.
 */
export class OrderBookSnapshot {
    constructor(bids, asks, time = Date.now()) {
        this.bids = bids;
        this.asks = asks;
        this.time = time;
    }
}


/**
 * Represents a trade on an exchange.
 * @property {number} price - The trade price.
 * @property {number} size - The trade size.
 * @property {boolean} takerSideBuy - The trade side (true for buy, false for sell).
 * @property {number} time - The trade timestamp.
 */
export class Trade {
    constructor(price, size, takerSideBuy, time) {
        this.price = price;
        this.size = size;
        this.takerSideBuy = takerSideBuy;
        this.time = time;
    }
}



export class PlatformClient {
    constructor(url, platformName) {
        this.url = url;                // WebSocket endpoint URL
        this.platformName = platformName || "Unknown";
        this.socket = null;            // Will hold the WebSocket object
    }

    /**
     * Connect to the WebSocket server at `this.url`.
     */
    connect() {
        console.log(`Connecting to WebSocket at: ${this.url}`);
        this.socket = new WebSocket(this.url);

        // Default event listeners
        this.socket.addEventListener("open", () => {
            this.onOpen();
        });

        this.socket.addEventListener("close", () => {
            console.log("WebSocket closed:", this.url);
        });

        this.socket.addEventListener("error", (err) => {
            console.error("WebSocket error:", err);
        });

        this.socket.addEventListener("message", (event) => {
            const rawData = event.data;
            // console.log(`Received raw message from ${this.platformName}:`, rawData);

            // Parse the raw message (child classes will provide custom parse logic).
            this.handleMessage(rawData);
        });
    }

    /**
     * Default event handler for when the WebSocket connection is opened.
     * Child classes can override this method to provide custom behavior.
     */
    onOpen() {
        console.log("WebSocket open:", this.url);
    }



    /**
     * Send a message if the WebSocket connection is open.
     * (You could also choose to only send raw strings or JSON, etc.)
     */
    sendMessage(msg) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(msg);
        } else {
            console.warn("WebSocket is not open. Cannot send message.");
        }
    }

    /**
     * Child classes *must* override this method to return a PlatformMessage object.
     * This default implementation might return null or throw an error.
     */
    handleMessage(rawData) {
        // Default or “abstract” behavior. 
        // Child classes *must* override and can call onOrderBookUpdate or onTradeUpdate.
        console.warn(`parseRawMessage is not implemented in base class. Raw: ${rawData}`);
    }

    /**
     * Custom handler function for incoming *OrderBook Updates*.
     * @property {OrderBookSnapshot} snapshot - The new order book snapshot.
     */
    onOrderBookUpdate(snapshot) {
        console.log("Received order book update:", snapshot);
    }

    /**
     * Custom handler function for incoming *Trade Updates*.
     * @property {Trade[]} trades - Array of recent trades.
     */
    onTradeUpdate(trades) {
        console.log("Received trade update:", trades);
    }

    /**
     * Close the WebSocket connection.
     */
    close() {
        if (this.socket) {
            this.socket.close();
        }
    }
}