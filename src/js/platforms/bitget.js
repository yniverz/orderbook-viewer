import { PlatformClient, Trade, OrderBookSnapshot } from './platform.js';

/**
 * Represents a client for the Bitget exchange.
 * @property {string} symbol - The trading pair symbol.
 * @property {number} depth - The number of levels of depth to (1, 5, 15, 400)
 * @property {string} endpoint - The WebSocket endpoint to connect to.
 * @property {string} name - The name of the platform.
 */
class BitgetBaseClient extends PlatformClient {
    constructor(symbol, depth, name) {
        super("wss://ws.bitget.com/v2/ws/public", name);
        this.symbol = symbol.toUpperCase();
        this.depth = depth;
        if (this.depth === 400) {
            this.depth = "";
        }

        this.localOrderBook = new OrderBookSnapshot([], []);
    }


    updateOrderBook(snapshot) {
        this.localOrderBook.bids = snapshot.bids.map(([price, size]) => ({ price: parseFloat(price), size: parseFloat(size) }));
        this.localOrderBook.asks = snapshot.asks.map(([price, size]) => ({ price: parseFloat(price), size: parseFloat(size) }));


        // sort the order book
        this.localOrderBook.bids.sort((a, b) => a.price - b.price);
        this.localOrderBook.asks.sort((a, b) => a.price - b.price);
    }

    applyDelta(delta) {
        const updateSide = (side, updates, side_str) => {
            updates.forEach(([price, size]) => {
                price = parseFloat(price);
                size = parseFloat(size);
                const index = side.findIndex(order => order.price === price);

                if (size === 0) {
                    if (index !== -1) side.splice(index, 1); // Remove entry
                } else if (index !== -1) {
                    side[index].size = size; // Update entry
                } else {
                    side.push({ price, size }); // Insert new entry
                }
            });

            side.sort((a, b) => a.price - b.price); // Ensure the side is sorted
        };

        updateSide(this.localOrderBook.bids, delta.bids, 'b');
        updateSide(this.localOrderBook.asks, delta.asks, 'a');
    }

    handleMessage(rawMessage) {
        const message = JSON.parse(rawMessage);
        
        if (message.event === "subscribe") {
            return;
        }

        if (message.arg.channel === `books${this.depth}`) {
            if (message.action === "snapshot") {
                this.updateOrderBook(message.data[0]);
            } else if (message.action === "update") {
                this.applyDelta(message.data[0]);
            }

            this.localOrderBook.time = new Date(parseFloat(message.data[0].ts));

            this.onOrderBookUpdate(this.localOrderBook);
        }

        if (message.arg.channel === `trade`) {
            const trades = message.data;

            let tradeData = [];
            trades.forEach(trade => {
                const price = parseFloat(trade.price);
                const size = parseFloat(trade.size);
                const takerSideBuy = trade.side === "buy" ? true : false;
                const time = new Date(parseFloat(trade.ts));
                
                tradeData.push(new Trade(price, size, takerSideBuy, time));
            });

            this.onTradeUpdate(tradeData);
        }
    }
}






/**
 * Represents a client for the Bitget exchange.
 * @property {string} symbol - The trading pair symbol.
 * @property {number} depth - The number of levels of depth to (1, 50, 200, 500)
 */
export class BitgetUsdtFuturesClient extends BitgetBaseClient {
    constructor(symbol, depth = 15) {
        super(symbol, depth, "Bitget USDT-Futures");
    }


    onOpen() {
        console.log("Connected to ByBit WebSocket");
        this.socket.send(JSON.stringify({
            op: "subscribe",
            args: [
                {
                    "instType": "USDT-FUTURES",
                    "channel": `books${this.depth}`,
                    "instId": this.symbol
                },
                {
                    "instType": "USDT-FUTURES",
                    "channel": "trade",
                    "instId": this.symbol
                }
            ]
        }));
    }
}


/**
 * Represents a client for the Bitget exchange.
 * @property {string} symbol - The trading pair symbol.
 * @property {number} depth - The number of levels of depth to (1, 50, 200, 500)
 */
export class BitgetSpotClient extends BitgetBaseClient {
    constructor(symbol, depth = 15) {
        super(symbol, depth, "Bitget Spot");
    }

    onOpen() {
        console.log("Connected to ByBit WebSocket");
        this.socket.send(JSON.stringify({
            op: "subscribe",
            args: [
                {
                    "instType": "SPOT",
                    "channel": `books${this.depth}`,
                    "instId": this.symbol
                },
                {
                    "instType": "SPOT",
                    "channel": "trade",
                    "instId": this.symbol
                }
            ]
        }));
    }
}
