const amqplib = require("amqplib");

let channel = null;
let connection = null;

async function connect() {
  if (connection) return connection;
  try {
    connection = await amqplib.connect(
      process.env.RABBIT_URL || "amqp://localhost"
    );
    channel = await connection.createChannel();
    // Ensure commonly used queues exist
    await channel.assertQueue("emailQueue", { durable: true });
    await channel.assertQueue("PAYMENT_NOTIFICATION.PAYMENT_COMPLETED", {
      durable: true,
    });
    await channel.assertQueue("PAYMENT_NOTIFICATION.PAYMENT_FAILED", {
      durable: true,
    });
    console.log("Connected to RabbitMQ");
    // Handle connection close / errors
    connection.on("error", (err) =>
      console.error("RabbitMQ connection error", err)
    );
    connection.on("close", () => {
      console.warn("RabbitMQ connection closed");
      connection = null;
      channel = null;
    });
    return connection;
  } catch (error) {
    console.error("Error connecting to RabbitMQ", error);
    throw error;
  }
}

async function ensureChannel() {
  if (!channel || !connection) await connect();
  return channel;
}

async function publishToQueue(queueName, data) {
  const ch = await ensureChannel();
  await ch.assertQueue(queueName, { durable: true });
  ch.sendToQueue(queueName, Buffer.from(JSON.stringify(data)), {
    persistent: true,
  });
  console.log("Message sent to queue", queueName);
}

async function subscribeToQueue(queueName, callback) {
  const ch = await ensureChannel();
  await ch.assertQueue(queueName, { durable: true });
  ch.consume(
    queueName,
    async (msg) => {
      if (msg !== null) {
        try {
          const data = JSON.parse(msg.content.toString());
          await callback(data);
          ch.ack(msg);
        } catch (err) {
          console.error("Error processing message", err);
          // option: ch.nack(msg, false, false) to drop, or true to requeue
          ch.nack(msg, false, false);
        }
      }
    },
    { noAck: false }
  );
}

module.exports = {
  connect,
  channel: () => channel,
  connection: () => connection,
  publishToQueue,
  subscribeToQueue,
};
