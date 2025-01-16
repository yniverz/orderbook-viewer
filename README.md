# OrderBook Viewer

**OrderBook Viewer** is a simple web-based interface that allows you to visualize real-time order book data and trades from supported cryptocurrency exchanges. With this tool, you can see a dynamic, color-coded “heatmap” of the order book as well as watch recent trades in real time.

---

## Quick Start

1. **Open the Home Page**  
   - Go to the deployed website (if hosted via GitHub Pages or another hosting service) or open the `docs/index.html` file in your browser.

2. **Choose Your Exchange**  
   - From the main screen, select one of the available exchanges.

3. **Enter the Relevant Infotmation**  
   - Depending on the exchange, you may need to enter a symbol (e.g., `BTCUSDT`) and/or a depth (e.g., `10`, `20`, `50`).

4. **Click “Go”**  
   - After entering your symbol and desired depth, click the **Go** button.  
   - The OrderBook Viewer will load and begin displaying live order book updates and trades for that symbol.
   - If nothing happens, check the given symbol and depth for typos or try a different combination.

---

## Features

- **Real-Time Order Book**:  
  A constantly updating heatmap showing current bid/ask prices. Colors intensify for larger order sizes.

- **Price Chart Overlay**:  
  Lines indicating best bid and ask prices over time.

- **Trade Bubbles**:  
  When trades occur, circles appear on the chart. Larger trades are drawn with bigger circles and optionally display their notional value.

- **Fully In-Browser**:  
  Everything runs in your browser—no additional software required.

---

## Tips for Best Use

- **Screen Size**:  
  For an optimal view, use a full desktop browser. The visualization stretches to fit your entire window.

- **Symbol Conventions**:  
  - **Bybit** uses uppercase symbols (e.g., `BTCUSDT`).  
  - **Binance** is also compatible with uppercase symbols, but the script internally handles them as lowercase. Just type `BTCUSDT` or `btcusdt`, and it will work.

- **Depth Selection**:  
  - Choosing a smaller depth (like `5`) displays fewer price levels but updates quickly.  
  - Larger depths (like `50`, `200`) offer more market granularity but may be more resource-intensive.

- **Data Freshness**:  
  The heatmap automatically fades out older data points. Brighter or more vivid colors indicate recent and/or larger orders.

---

## Frequently Asked Questions

1. **Do I need an API key to use this?**  
   - No. The viewer uses public WebSocket endpoints from each exchange and does not require authentication for order book and trade data.

2. **Why are some large trade circles labeled with numbers?**  
   - High-value trades (based on price * size) show their notional value. This is a quick way to spot significant market moves.

3. **Why might I see a blank or partially loaded chart?**  
   - It can take a few moments for data to arrive from the exchange. If it remains blank, ensure you have a stable internet connection or try a different symbol.

4. **Why is the chart so laggy?**  
   - The viewer is not very optimized for performance at the moment, so it may struggle with very high update rates or large depths when using it on an older computer or phone. Try reducing the depth or refreshing the page.

---

## Disclaimer

This tool is for **informational purposes only** and should not be considered financial advice. Cryptocurrency markets are volatile, and any trades you make are at your own risk. Always do your own research and exercise caution when trading.