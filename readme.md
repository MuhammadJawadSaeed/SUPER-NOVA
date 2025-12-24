# SUPER-NOVA

A microservices-based e-commerce platform built with Node.js, featuring AI-powered assistance and real-time capabilities.

## Architecture

This project follows a microservices architecture with the following services:

### Services

#### AI Buddy

- **Port**: TBD
- **Description**: AI-powered assistant for customer support and product recommendations
- **Features**: Agent-based intelligence, real-time socket communication
- **Tech Stack**: Node.js, Socket.io

#### Authentication Service

- **Port**: TBD
- **Description**: Handles user authentication and authorization
- **Features**:
  - User registration and login
  - JWT-based authentication
  - Session management with Redis
  - User profile management
- **Tech Stack**: Node.js, Express, JWT, Redis

#### Cart Service

- **Port**: TBD
- **Description**: Manages shopping cart operations
- **Features**:
  - Add/remove items from cart
  - Update item quantities
  - Cart persistence
- **Tech Stack**: Node.js, Express, MongoDB

#### Order Service

- **Port**: TBD
- **Description**: Handles order creation and management
- **Features**:
  - Order creation
  - Order cancellation
  - Order status tracking
  - Address management
- **Tech Stack**: Node.js, Express, MongoDB

#### Payment Service

- **Port**: TBD
- **Description**: Processes payments and transactions
- **Features**: Payment processing integration
- **Tech Stack**: Node.js, Express, MongoDB

#### Product Service

- **Port**: TBD
- **Description**: Manages product catalog
- **Features**:
  - Product CRUD operations
  - Image upload with ImageKit
  - Seller product management
  - Product search and filtering
- **Tech Stack**: Node.js, Express, MongoDB, ImageKit

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Redis
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd SUPER-NOVA
```

2. Install dependencies for each service:

```bash
# Auth Service
cd auth
npm install

# Cart Service
cd ../cart
npm install

# Order Service
cd ../order
npm install

# Payment Service
cd ../payment
npm install

# Product Service
cd ../product
npm install

# AI Buddy
cd ../ai-buddy
npm install
```

3. Configure environment variables for each service (create `.env` files)

4. Start services:

```bash
# Start each service in separate terminals
cd auth && npm start
cd cart && npm start
cd order && npm start
cd payment && npm start
cd product && npm start
cd ai-buddy && npm start
```

## Testing

Each service includes comprehensive test suites using Jest.

Run tests for a specific service:

```bash
cd <service-directory>
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

### Test Coverage

- **Auth Service**: Login, Register, Logout, User Profile, Addresses
- **Cart Service**: Get cart, Add items, Update quantities
- **Order Service**: Create order, Get orders, Update address, Cancel order
- **Product Service**: CRUD operations, Seller management

## API Documentation

### Authentication Service

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get user profile
- `GET /api/auth/addresses` - Get user addresses

### Cart Service

- `GET /api/cart` - Get user cart
- `POST /api/cart/items` - Add item to cart
- `PATCH /api/cart/items` - Update cart item

### Order Service

- `POST /api/orders` - Create new order
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order by ID
- `PATCH /api/orders/:id/address` - Update order address
- `POST /api/orders/:id/cancel` - Cancel order

### Payment Service

- Payment endpoints (TBD)

### Product Service

- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product
- `PATCH /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/products/seller` - Get seller products

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **Cache**: Redis
- **Testing**: Jest
- **Image Storage**: ImageKit
- **Real-time**: Socket.io
- **Authentication**: JWT

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
