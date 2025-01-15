const symbol = "LUCEUSDT"; // Change the symbol as needed
const depth = 50; // Order book depth level
const update_times = {
    1: 10,
    50: 20,
    200: 100,
    500: 100
};
const maxAge = 30000; // ms
var matrixElementHeight = Math.ceil(window.innerHeight / 100);
const rightChartWidthPercentage = 0.1; // Width of the bar chart as a percentage of the canvas
const chartMargin = 10; // Margin between the two charts in pixels
const canvas = document.getElementById('chartCanvas');
const ctx = canvas.getContext('2d');

var maxPriceOrderVolume = 0;
let localOrderBook = { bids: [], asks: [] }; // Local order book

const heatmapData = []; // Array to hold heatmap data
const bookPriceData = []; // Array to hold trade data
const tradeData = []; // Array to hold trade data

const ws = new WebSocket(`wss://stream.bybit.com/v5/public/linear`);

function updateOrderBook(snapshot) {
    localOrderBook.bids = snapshot.b.map(([price, size]) => ({ price: parseFloat(price), size: parseFloat(size) }));
    localOrderBook.asks = snapshot.a.map(([price, size]) => ({ price: parseFloat(price), size: parseFloat(size) }));
}

function applyDelta(delta) {
    const updateSide = (side, updates, side_str) => {
        updates.forEach(([price, size]) => {
            price = parseFloat(price);
            size = parseFloat(size);
            const index = side.findIndex(order => order.price === price);

            if (size === 0) {
                if (index !== -1) side.splice(index, 1); // Remove entry

                // only delete if this price would now be the other side
                // if (side_str === 'b') {
                //     if (price >= localOrderBook.bids[Math.round(localOrderBook.bids.length - 1 / 2)].price) {
                //         if (index !== -1) side.splice(index, 1); // Remove entry
                //     }
                // } else {
                //     if (price <= localOrderBook.asks[Math.round(localOrderBook.asks.length - 1 / 2)].price) {
                //         if (index !== -1) side.splice(index, 1); // Remove entry
                //     }
                // }
            } else if (index !== -1) {
                side[index].size = size; // Update entry
            } else {
                side.push({ price, size }); // Insert new entry
            }
        });

        side.sort((a, b) => a.price - b.price); // Ensure the side is sorted
    };

    updateSide(localOrderBook.bids, delta.b, 'b');
    updateSide(localOrderBook.asks, delta.a, 'a');
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);


    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const rightChartWidth = canvas.width * rightChartWidthPercentage;
    const leftChartWidth = canvas.width - rightChartWidth - chartMargin;

    // price range ( go through heatmap data to find the count of unique prices)
    var price_counts = {};
    heatmapData.forEach(data => {
        price_counts[data.price] = price_counts[data.price] ? price_counts[data.price] + 1 : 1;
    });
    var prices = Object.keys(price_counts);
    maxPrice = Math.max(...prices);
    minPrice = Math.min(...prices);
    total_range = prices.length;
    matrixElementHeight = Math.ceil(window.innerHeight / total_range);

    const maxSize = Math.max(
        ...localOrderBook.bids.map(order => order.size),
        ...localOrderBook.asks.map(order => order.size)
    );

    // maxTradeVolume = Math.max(...tradeData.map(trade => trade.size));

    // Draw heatmap
    heatmapData.forEach(data => {
        const age = Date.now() - data.time;
        if (age > maxAge) return;

        const alpha = 1 - age / maxAge; // Fade out older data
        maxPriceOrderVolume = Math.max(maxPriceOrderVolume, data.size);
        let intensity = Math.min(data.size / maxPriceOrderVolume, 1); // Normalize size

        // convert to ^(1/1.5) to make the color more distinguishable
        intensity = Math.pow(intensity, 1 / 1.2);

        // Map intensity to gradient: dark blue -> blue -> light blue -> yellow -> orange -> red
        let r, g, b;
        if (intensity < 0.2) {
            // Dark blue to blue
            r = 40;
            g = 40;
            // 50 to 255
            b = Math.round(50 + intensity * 1250);
        } else if (intensity < 0.4) {
            // Blue to light blue
            r = 40;
            g = Math.round((intensity - 0.2) * 1280); // 0 to 255
            b = 255;
        } else if (intensity < 0.6) {
            // Light blue to yellow
            r = Math.round((intensity - 0.4) * 1275); // 0 to 255
            g = 255;
            b = 255 - Math.round((intensity - 0.4) * 1275); // 255 to 0
        } else if (intensity < 0.8) {
            // Yellow to orange
            r = 255;
            g = 255 - Math.round((intensity - 0.6) * 1275); // 255 to 0
            b = 0;
        } else {
            // Orange to red
            r = 255;
            g = Math.round(255 - (intensity - 0.8) * 1275); // 255 to 0
            b = 0;
        }

        // const color = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        const color = `rgb(${r}, ${g}, ${b})`;
        ctx.fillStyle = color;

        const x = leftChartWidth - (Date.now() - data.time) / maxAge * leftChartWidth;
        const y = canvas.height - (data.price - minPrice) / (maxPrice - minPrice) * canvas.height;

        // pixels from x to leftChartWidth
        const barWidth = leftChartWidth - x;

        ctx.fillRect(x, y - matrixElementHeight / 2, barWidth, matrixElementHeight);
    });






    const bid_price_line_color = 'rgba(50, 200, 50, 1)';
    const ask_price_line_color = 'rgba(200, 50, 50, 1)';
    var last_price_data = { time: 0, bid: 0, ask: 0 };
    bookPriceData.forEach(trade => {
        const age = Date.now() - trade.time;
        if (age > maxAge) return; // Skip old data

        const alpha = 1 - age / maxAge;
        // ctx.globalAlpha = alpha;

        const last_x = leftChartWidth - (Date.now() - last_price_data.time) / maxAge * leftChartWidth;
        const last_y_bid = canvas.height - (last_price_data.bid - minPrice) / (maxPrice - minPrice) * canvas.height;
        const last_y_ask = canvas.height - (last_price_data.ask - minPrice) / (maxPrice - minPrice) * canvas.height;

        const x = leftChartWidth - (Date.now() - trade.time) / maxAge * leftChartWidth;
        const y_bid = canvas.height - (trade.bid - minPrice) / (maxPrice - minPrice) * canvas.height;
        const y_ask = canvas.height - (trade.ask - minPrice) / (maxPrice - minPrice) * canvas.height;

        ctx.beginPath();
        if (last_price_data.time !== 0) {
            ctx.moveTo(last_x, last_y_bid);
            ctx.lineTo(x, last_y_bid);
        }
        ctx.lineTo(x, y_bid);
        ctx.strokeStyle = bid_price_line_color;
        ctx.stroke();


        ctx.beginPath();
        if (last_price_data.time !== 0) {
            ctx.moveTo(last_x, last_y_ask);
            ctx.lineTo(x, last_y_ask);
        }
        ctx.lineTo(x, y_ask);
        ctx.strokeStyle = ask_price_line_color;
        ctx.stroke();

        last_price_data = trade;

    });

    const last_order_price_avg = (last_price_data.bid + last_price_data.ask) / 2;

    // draw a line at last level to the end of the canvas

    const last_x_2 = leftChartWidth - (Date.now() - last_price_data.time) / maxAge * leftChartWidth;
    const last_y_bid_2 = canvas.height - (last_price_data.price - minPrice) / (maxPrice - minPrice) * canvas.height;
    const last_y_ask_2 = canvas.height - (last_price_data.price - minPrice) / (maxPrice - minPrice) * canvas.height;

    ctx.beginPath();
    ctx.moveTo(last_x_2, last_y_bid_2);
    ctx.lineTo(leftChartWidth, last_y_bid_2);
    ctx.strokeStyle = bid_price_line_color;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(last_x_2, last_y_ask_2);
    ctx.lineTo(leftChartWidth, last_y_ask_2);
    ctx.strokeStyle = ask_price_line_color;
    ctx.stroke();






    // Draw trades
    const trade_line_color = 'rgba(255, 255, 255, 1)';
    var last_price_data = { time: 0, price: 0, size: 0 };
    tradeData.forEach(trade => {
        const age = Date.now() - trade.time;
        if (age > maxAge) return; // Skip old data

        const alpha = 1 - age / maxAge;
        // ctx.globalAlpha = alpha;

        const last_x = leftChartWidth - (Date.now() - last_price_data.time) / maxAge * leftChartWidth;
        const last_y = canvas.height - (last_price_data.price - minPrice) / (maxPrice - minPrice) * canvas.height;

        const x = leftChartWidth - (Date.now() - trade.time) / maxAge * leftChartWidth;
        const y = canvas.height - (trade.price - minPrice) / (maxPrice - minPrice) * canvas.height;

        // ctx.beginPath();
        // // go to last price point
        // if (last_price_data.time !== 0) {
        //     ctx.moveTo(last_x, last_y);
        //     ctx.lineTo(x, last_y);
        // }

        // ctx.lineTo(x, y);
        // ctx.strokeStyle = trade_line_color;
        // ctx.stroke();

        // if (trade.size * trade.price > 5000) {
        ctx.beginPath();
        if (trade.takerSide === 'Buy') {
            ctx.fillStyle = 'rgba(50, 200, 50, 0.5)';
            ctx.strokeStyle = 'rgba(50, 200, 50, 1)';
        } else {
            ctx.fillStyle = 'rgba(200, 50, 50, 0.5)';
            ctx.strokeStyle = 'rgba(200, 50, 50, 1)'; 5
        }

        const radius = Math.max(2, ((trade.size * trade.price) / 10000) * 20);
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        if (trade.size * trade.price > 5000) {
            // put the trade size on the chart
            ctx.font = "12px Arial";
            ctx.fillStyle = "white";
            ctx.fillText(Math.round(trade.size * trade.price), x - 10, y + 10);
        }

        last_price_data = trade;

    });

    // draw a line at last level to the end of the canvas

    // const last_x = leftChartWidth - (Date.now() - last_price_data.time) / maxAge * leftChartWidth;
    // const last_y = canvas.height - (last_price_data.price - minPrice) / (maxPrice - minPrice) * canvas.height;

    // ctx.beginPath();
    // ctx.moveTo(last_x, last_y);
    // ctx.lineTo(leftChartWidth, last_y);
    // ctx.strokeStyle = trade_line_color;
    // ctx.stroke();


    // draw a rectangle behind the orderbook bars with the same color as the background
    ctx.fillStyle = 'rgb(39, 39, 50)';
    ctx.fillRect(canvas.width - rightChartWidth - 10, 0, rightChartWidth, canvas.height);



    // Draw bar chart for order book size
    var largest_order = { price: 0, size: 0 };
    localOrderBook.bids.concat(localOrderBook.asks).forEach(order => {
        const y = canvas.height - (order.price - minPrice) / (maxPrice - minPrice) * canvas.height;
        const orderSize = Math.pow((order.size / maxSize), 1 / 1.5);
        const barWidth = Math.round(orderSize * rightChartWidth);
        const barX = canvas.width - rightChartWidth;

        if (order.price < last_order_price_avg) {
            ctx.fillStyle = 'rgba(0, 255, 0, 1)'; // Green for asks
        } else {
            ctx.fillStyle = 'rgba(255, 0, 0, 1)'; // Red for bids
        }

        ctx.fillRect(barX, y - matrixElementHeight / 2, barWidth, matrixElementHeight - 1);

        if (order.size > largest_order.size) {
            largest_order = order;
        }
    });

    // Draw the largest order amount next to the bar
    ctx.font = "12px Arial";
    ctx.fillStyle = "white";
    const y = canvas.height - (largest_order.price - minPrice) / (maxPrice - minPrice) * canvas.height;
    const orderSize = Math.round(largest_order.size * largest_order.price);
    const barWidth = Math.round(orderSize * rightChartWidth);
    const barX = canvas.width - rightChartWidth;

    ctx.fillText(orderSize, barX + 10, y + 5);



    setTimeout(() => { requestAnimationFrame(draw); }, 1000 / 30);
}

ws.onopen = () => {
    console.log('WebSocket connected');
    const payload = {
        op: "subscribe",
        args: [
            `publicTrade.${symbol}`,
            `orderbook.${depth}.${symbol}`
        ]
    };
    ws.send(JSON.stringify(payload));
};


ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    const now = Date.now();

    if (message.topic === `orderbook.${depth}.${symbol}`) {
        if (message.type === "snapshot") {
            updateOrderBook(message.data);
        } else if (message.type === "delta") {
            applyDelta(message.data);
        }

        const time = new Date(message.cts);

        localOrderBook.bids.forEach(order => {
            heatmapData.push({ price: order.price, size: order.size, time: time });
        });
        localOrderBook.asks.forEach(order => {
            heatmapData.push({ price: order.price, size: order.size, time: time });
        });


        let lowestAsk = localOrderBook.asks[0].price;
        let highestBid = localOrderBook.bids[localOrderBook.bids.length - 1].price;

        bookPriceData.push({ time: time, bid: highestBid, ask: lowestAsk });

        if (bookPriceData.length > (maxAge / update_times[depth])) {
            bookPriceData.shift();
        }


        if (heatmapData.length > (maxAge / update_times[depth]) * depth * 2) {
            heatmapData.splice(0, localOrderBook.bids.length + localOrderBook.asks.length);
        }
    }

    if (message.topic === `publicTrade.${symbol}`) {
        const trades = message.data;

        trades.forEach(trade => {
            const price = parseFloat(trade.p);
            const size = parseFloat(trade.v);
            const time = new Date(trade.T);
            tradeData.push({ price: price, size: size, time: time, takerSide: trade.S });
        });

        if (tradeData.length > 1000) {
            tradeData.shift();
        }
    }
};

ws.onerror = (error) => {
    console.error('WebSocket error:', error);
};

ws.onclose = () => {
    console.log('WebSocket disconnected');
};

draw();