# AI Buddy Service

AI-powered customer support assistant that provides real-time product recommendations and shopping assistance through WebSocket connections. Built with LangChain, Google Gemini AI, and Socket.io.

## Overview

The AI Buddy service acts as an intelligent shopping assistant that can:

- Search for products based on natural language queries
- Add products to the user's shopping cart
- Provide personalized product recommendations
- Handle customer support queries in real-time

## Architecture

### Tech Stack

- **AI Framework**: LangChain with LangGraph for agent orchestration
- **AI Model**: Google Gemini 2.5 Flash (via @langchain/google-genai)
- **Real-time Communication**: Socket.io for WebSocket connections
- **Runtime**: Node.js with Express
- **Authentication**: JWT token-based authentication
- **Schema Validation**: Zod for input validation

## Features

### AI Agent Capabilities

1. **Product Search Tool**

   - Natural language product search
   - Integration with Product Service API
   - Returns formatted product results

2. **Cart Management Tool**

   - Add products to shopping cart
   - Specify quantities
   - Integration with Cart Service API

3. **Agent Graph**
   - State-based conversation flow
   - Tool calling and execution
   - Message history management
   - Conditional routing between chat and tools

### Real-time Communication

- WebSocket-based chat interface
- JWT authentication middleware for socket connections
- Cookie-based token extraction
- User session management

## Installation

### Prerequisites

- Node.js (v14 or higher)
- Google Cloud API key with Gemini AI access
- Running Product Service (port 3001)
- Running Cart Service (port 3002)
- Running Auth Service for JWT token generation

### Setup Steps

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables (see below)

3. Start the service:

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## Environment Variables

Create a `.env` file in the root of the ai-buddy directory:

```env
# JWT Secret (must match Auth Service)
JWT_SECRET=your_jwt_secret_key_here

# Google AI API Key
GOOGLE_API_KEY=your_google_api_key_here
```

### Environment Variable Details

| Variable         | Description                                                     | Required | Example                            |
| ---------------- | --------------------------------------------------------------- | -------- | ---------------------------------- |
| `JWT_SECRET`     | Secret key for JWT token verification (must match auth service) | Yes      | `4011d00c625503d77cfa54f2de74ee63` |
| `GOOGLE_API_KEY` | Google Cloud API key with Gemini AI access                      | Yes      | `AIzaSyXXXXXXXXXXXXXXXXX`          |

### Getting Google API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key or use an existing one
3. Enable Gemini API access
4. Copy the API key to your `.env` file

## API Endpoints

### HTTP Endpoints

#### Health Check

```
GET /
```

**Response:**

```json
{
  "message": "AI service is running"
}
```

### WebSocket Events

#### Connection

Connect to the WebSocket server with authentication:

```javascript
const socket = io("http://localhost:3005", {
  extraHeaders: {
    Cookie: `token=${yourJWTToken}`,
  },
});
```

#### Send Message

**Event:** `message`

**Client sends:**

```javascript
socket.emit("message", "Show me laptops under $1000");
```

**Server responds:**

```javascript
socket.on("message", (response) => {
  console.log(response); // AI assistant's response
});
```

## Agent Tools

### 1. Search Product

**Description:** Search for products based on natural language query

**Parameters:**

- `query` (string): The search query for products

**Example:**

```javascript
// User: "Show me gaming laptops"
// Tool executes: GET http://localhost:3001/api/products?q=gaming laptops
```

### 2. Add Product to Cart

**Description:** Add a product to the user's shopping cart

**Parameters:**

- `productId` (string): The ID of the product to add
- `qty` (number): Quantity to add (default: 1)

**Example:**

```javascript
// User: "Add this laptop to my cart"
// Tool executes: POST http://localhost:3002/api/cart/items
// Body: { productId: "...", qty: 1 }
```

## Usage Examples

### Frontend Integration

```javascript
import io from "socket.io-client";

// Get JWT token from authentication
const token = getCookie("token");

// Connect to AI Buddy service
const socket = io("http://localhost:3005", {
  extraHeaders: {
    Cookie: `token=${token}`,
  },
});

// Listen for connection
socket.on("connect", () => {
  console.log("Connected to AI Buddy");
});

// Send user message
socket.emit("message", "I need a laptop for gaming");

// Receive AI response
socket.on("message", (response) => {
  console.log("AI:", response);
});

// Handle errors
socket.on("error", (error) => {
  console.error("Socket error:", error);
});
```

### Example Conversations

**Product Search:**

```
User: "Show me wireless headphones"
AI: "I found several wireless headphones for you: [product details]"

User: "Add the first one to my cart"
AI: "I've added the Sony WH-1000XM5 to your cart"
```

**Product Recommendations:**

```
User: "I need a laptop for video editing"
AI: "For video editing, I recommend these laptops with powerful processors and dedicated graphics: [product details]"
```

## Docker Deployment

### Build Docker Image

```bash
# From project root
docker build -t supernova-ai-buddy:latest ./ai-buddy

# Or from ai-buddy directory
cd ai-buddy
docker build -t supernova-ai-buddy:latest .
```

### Run Docker Container

```bash
docker run -d \
  -p 3005:3005 \
  -e JWT_SECRET=your_jwt_secret \
  -e GOOGLE_API_KEY=your_google_api_key \
  --name ai-buddy-service \
  supernova-ai-buddy:latest
```

### Docker Compose

```yaml
ai-buddy:
  build: ./ai-buddy
  ports:
    - "3005:3005"
  environment:
    - JWT_SECRET=${JWT_SECRET}
    - GOOGLE_API_KEY=${GOOGLE_API_KEY}
  depends_on:
    - auth
    - product
    - cart
```

## Development

### Running in Development Mode

```bash
npm run dev
```

This will start the server with nodemon for auto-reloading on file changes.

### Adding New Tools

To add new capabilities to the AI agent:

1. **Define the tool in `agent/tools.js`:**

```javascript
const newTool = tool(
  async ({ param1, param2, token }) => {
    // Tool implementation
    const response = await axios.get("http://localhost:3001/api/endpoint", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return JSON.stringify(response.data);
  },
  {
    name: "newTool",
    description: "Description of what the tool does",
    schema: z.object({
      param1: z.string().describe("Description of param1"),
      param2: z.number().describe("Description of param2"),
    }),
  }
);
```

2. **Export the tool:**

```javascript
module.exports = { searchProduct, addProductToCart, newTool };
```

3. **Register the tool in `agent/agent.js`:**

```javascript
const response = await model.invoke(state.messages, {
  tools: [tools.searchProduct, tools.addProductToCart, tools.newTool],
});
```

## Service Dependencies

The AI Buddy service depends on:

- **Auth Service** (port 3001): For JWT token validation
- **Product Service** (port 3001): For product search functionality
- **Cart Service** (port 3002): For cart management operations

Ensure these services are running before starting the AI Buddy service.

## Configuration

### Agent Configuration

In `agent/agent.js`, you can customize:

- **Model**: Currently using `gemini-2.5-flash`
- **Temperature**: Set to `0.5` for balanced creativity/accuracy
- **Tools**: Configure available tools for the agent

### Socket Configuration

In `socket.server.js`, you can customize:

- **Authentication**: JWT token verification
- **Cookie name**: Default is `token`
- **CORS settings**: Configure allowed origins

## Troubleshooting

### Common Issues

**Connection Refused:**

```
Error: connect ECONNREFUSED 127.0.0.1:3005
```

- Ensure the service is running on port 3005
- Check if another service is using the same port

**Authentication Error:**

```
Authentication error: Token not provided
```

- Ensure JWT token is included in cookie header
- Verify token is valid and not expired

**Tool Execution Failed:**

```
Error: Tool searchProduct not found
```

- Verify dependent services (Product, Cart) are running
- Check service URLs in `tools.js`

**Google AI API Error:**

```
Error: Invalid API key
```

- Verify `GOOGLE_API_KEY` is correctly set in `.env`
- Ensure Gemini API is enabled in Google Cloud Console

## Performance Considerations

- The AI agent maintains conversation state across multiple turns
- Tool execution is parallel when possible
- WebSocket connections are lightweight and scalable
- Consider implementing rate limiting for production

## Security

- JWT tokens are required for all WebSocket connections
- Tokens are verified on each connection using the shared secret
- User context is extracted from JWT and attached to socket
- All external API calls include authentication headers

## License

ISC
