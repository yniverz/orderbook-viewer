import PlatformClient from '../platform.js';

/**
 * Represents a client for the ByBit exchange.
 * @property {string} symbol - The trading pair symbol.
 * @property {number} depth - The number of levels of depth to (1, 50, 200, 500)
 */
class BybitClient extends PlatformClient {
    constructor(symbol, depth = 50) {
        super("wss://stream.bybit.com/v5/public/linear", "ByBit");
        this.symbol = symbol;
        this.depth = depth;
    }

    onOpen() {
        console.log("Connected to ByBit WebSocket");
        this.socket.send(JSON.stringify({
            op: "subscribe",
            args: [
                `publicTrade.${this.symbol}`,
                `orderbook.${this.depth}.${this.symbol}`
            ]
        }));
    }
}