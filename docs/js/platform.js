
class OrderBookEntry {
    constructor(price, size) {
        this.price = price;
        this.size = size;
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
class OrderBookSnapshot {
    constructor(platform, type, bids, asks, timestamp = Date.now()) {
        this.platform = platform;
        this.type = type;
        this.bids = bids;
        this.asks = asks;
        this.timestamp = timestamp;
    }
}

/**
 * A standardized data structure for parsed messages.
 * @property {OrderBookSnapshot} orderBook - The current order book snapshot.
 * @property {Trade[]} trades - Array of recent trades.
 */
class PlatformMessage {
    constructor(orderBook, trades) {
        this.orderBook = orderBook;
        this.trades = trades;
    }
}



class PlatformClient {
    constructor(url, platformName) {
        this.url = url;                // WebSocket endpoint URL
        this.platformName = platformName || "Unknown";
        this.socket = null;            // Will hold the WebSocket object
        this.onMessageHandler = null;  // Callback for incoming *parsed* messages
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
            console.log(`Received raw message from ${this.platformName}:`, rawData);

            // Parse the raw message (child classes will provide custom parse logic).
            const parsed = this.parseRawMessage(rawData);

            // If there's a custom message handler defined by the user, call it with the *parsed* data
            if (this.onMessageHandler && parsed) {
                this.onMessageHandler(parsed);
            }
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
    parseRawMessage(rawData) {
        // Default or “abstract” behavior. 
        // Child classes *must* override and return a PlatformMessage object.
        console.warn(`parseRawMessage is not implemented in base class. Raw: ${rawData}`);
        return null;
    }

    /**
     * Set a custom handler function for incoming *parsed* messages.
     */
    setOnMessageHandler(handlerFn) {
        this.onMessageHandler = handlerFn;
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