const request = require("supertest");
const app = require("../src/app");
const { getAuthCookie } = require("../test/auth");
const axios = require("axios");
const mongoose = require("mongoose");

jest.mock("axios");

describe("POST /api/orders — Create order from current cart", () => {
  const sampleAddress = {
    street: "123 Main St",
    city: "Metropolis",
    state: "CA",
    pincode: "90210",
    country: "USA",
  };

  beforeEach(() => {
    // Generate valid MongoDB ObjectIds
    const productId1 = new mongoose.Types.ObjectId().toString();
    const productId2 = new mongoose.Types.ObjectId().toString();

    // Mock cart service response
    const mockCartResponse = {
      data: {
        cart: {
          items: [
            { productId: productId1, quantity: 2 },
            { productId: productId2, quantity: 1 },
          ],
        },
      },
    };

    // Mock product service responses
    const mockProduct1 = {
      data: {
        data: {
          _id: productId1,
          title: "Test Product 1",
          price: { amount: 100, currency: "PKR" },
          stock: 10,
        },
      },
    };

    const mockProduct2 = {
      data: {
        data: {
          _id: productId2,
          title: "Test Product 2",
          price: { amount: 200, currency: "PKR" },
          stock: 5,
        },
      },
    };

    // Setup axios mock to return different responses based on URL
    axios.get.mockImplementation((url) => {
      if (url.includes("/api/cart")) {
        return Promise.resolve(mockCartResponse);
      } else if (url.includes(`/api/products/${productId1}`)) {
        return Promise.resolve(mockProduct1);
      } else if (url.includes(`/api/products/${productId2}`)) {
        return Promise.resolve(mockProduct2);
      }
      return Promise.reject(new Error("Unknown URL"));
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("creates order from current cart, computes totals, sets status=PENDING, reserves inventory", async () => {
    // Example: Provide any inputs the API expects (headers/cookies/body). Adjust when auth is wired.
    const res = await request(app)
      .post("/api/orders")
      .set("Cookie", getAuthCookie())
      .send({ shippingAddress: sampleAddress })
      .expect("Content-Type", /json/)
      .expect(201);

    // Response shape assertions (adjust fields as you implement)
    expect(res.body).toBeDefined();
    expect(res.body.order).toBeDefined();
    const { order } = res.body;
    expect(order._id).toBeDefined();
    expect(order.user).toBeDefined();
    expect(order.status).toBe("PENDING");

    // Items copied from priced cart
    expect(Array.isArray(order.items)).toBe(true);
    expect(order.items.length).toBeGreaterThan(0);
    for (const it of order.items) {
      expect(it.product).toBeDefined();
      expect(it.quantity).toBeGreaterThan(0);
      expect(it.price).toBeDefined();
      expect(typeof it.price.amount).toBe("number");
      expect(["USD", "PKR"]).toContain(it.price.currency);
    }

    // Totals include taxes + shipping
    expect(order.totalPrice).toBeDefined();
    expect(typeof order.totalPrice.amount).toBe("number");
    expect(["USD", "PKR"]).toContain(order.totalPrice.currency);

    // Shipping address persisted
    expect(order.shippingAddress).toMatchObject({
      street: sampleAddress.street,
      city: sampleAddress.city,
      state: sampleAddress.state,
      zip: sampleAddress.pincode,
      country: sampleAddress.country,
    });

    // Inventory reservation acknowledgement (shape up to you)
    // For example, you might include a flag or reservation id
    // expect(res.body.inventoryReservation).toEqual({ success: true })
  });

  it("returns 422 when shipping address is missing/invalid", async () => {
    const res = await request(app)
      .post("/api/orders")
      .set("Cookie", getAuthCookie())
      .send({})
      .expect("Content-Type", /json/)
      .expect(400);

    expect(res.body.errors || res.body.message).toBeDefined();
  });
});
