import { PlatformClient, Trade, OrderBookSnapshot } from './platform.js';

/**
 * Represents a client for the ByBit exchange.
 * @property {string} symbol - The trading pair symbol.
 * @property {number} depth - The number of levels of depth to (1, 50, 200, 500)
 */
class BinanceBaseClient extends PlatformClient {
    constructor(symbol, depth, endpoint, name) {
        super(endpoint, name);

        this.symbol = symbol.toLowerCase();
        this.depth = depth;
        this.localOrderBook = new OrderBookSnapshot([], []);
    }


    updateOrderBook(snapshot) {
        this.localOrderBook.bids = snapshot.bids.map(([price, size]) => ({ price: parseFloat(price), size: parseFloat(size) }));
        this.localOrderBook.asks = snapshot.asks.map(([price, size]) => ({ price: parseFloat(price), size: parseFloat(size) }));

        // sort the order book
        this.localOrderBook.bids.sort((a, b) => a.price - b.price);
        this.localOrderBook.asks.sort((a, b) => a.price - b.price);

        console.log(this.localOrderBook);
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

        updateSide(this.localOrderBook.bids, delta.b, 'b');
        updateSide(this.localOrderBook.asks, delta.a, 'a');

        console.log(this.localOrderBook);
    }

}

/**
 * Represents a client for the Binance Spot exchange.
 * @property {string} symbol - The trading pair symbol.
 * @property {number} depth - The number of levels of depth to (1, 50, 200, 500)
 */
export class BinanceSpotClient extends BinanceBaseClient {
    constructor(symbol, depth = 20) {
        super(symbol, depth, "wss://stream.binance.com:9443/stream?streams="+symbol.toLowerCase()+"@depth"+depth+"@100ms/"+symbol.toLowerCase()+"@trade", "Binance Spot");
    }

    handleMessage(rawMessage) {
        const message = JSON.parse(rawMessage);

        console.log(message);

        if (message.stream === `${this.symbol}@depth${this.depth}@100ms`) {
            // if e attribute in message.data
            if (message.data.e === "depthUpdate") {
                console.log("Delta Update");
                const delta = message.data;
                this.applyDelta(delta);
                this.localOrderBook.time = new Date(delta.E);
            } else {
                console.log("Snapshot Update");
                this.updateOrderBook(message.data);
                this.localOrderBook.time = Date.now();
            }

            this.onOrderBookUpdate(this.localOrderBook);
        }

        if (message.stream === `${this.symbol}@trade`) {
            const trade = message.data;

            const price = parseFloat(trade.p);
            const size = parseFloat(trade.q);
            const takerSideBuy = trade.m ? false : true;
            const time = new Date(trade.T);

            this.onTradeUpdate([new Trade(price, size, takerSideBuy, time)]);
        }
    }
}

/**
 * Represents a client for the Binance USDT Perpetual exchange.
 * @property {string} symbol - The trading pair symbol.
 * @property {number} depth - The number of levels of depth to (1, 50, 200, 500)
 */
export class BinanceFuturesClient extends BinanceBaseClient {
    constructor(symbol, depth = 20) {
        super(symbol, depth, "wss://fstream.binance.com/stream?streams="+symbol.toLowerCase()+"@depth"+depth+"@100ms/"+symbol.toLowerCase()+"@aggTrade", "Binance USDT Perpetual");
    }

    handleMessage(rawMessage) {
        const message = JSON.parse(rawMessage);

        console.log(message);

        if (message.stream === `${this.symbol}@depth${this.depth}@100ms`) {
            // if e attribute in message.data
            if (message.data.e === "depthUpdate") {
                console.log("Delta Update");
                const delta = message.data;
                this.applyDelta(delta);
                this.localOrderBook.time = new Date(delta.E);
            } else {
                console.log("Snapshot Update");
                this.updateOrderBook(message.data);
                this.localOrderBook.time = Date.now();
            }

            this.onOrderBookUpdate(this.localOrderBook);
        }

        if (message.stream === `${this.symbol}@aggTrade`) {
            const trade = message.data;

            const price = parseFloat(trade.p);
            const size = parseFloat(trade.q);
            const takerSideBuy = trade.m ? false : true;
            const time = new Date(trade.T);

            this.onTradeUpdate([new Trade(price, size, takerSideBuy, time)]);
        }
    }
}