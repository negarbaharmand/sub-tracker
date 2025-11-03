// Import the express module to create a web server
import express from "express";
import { PORT } from "./config/env.js";
import userRouter from "./routes/user.routes.js";
import authRouter from "./routes/auth.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import connectToDatabase from "./database/mongodb.js";
import errorMiddleware from "./middlewares/error.middleware.js";
import cookieParser from "cookie-parser";
import arcjetMiddleware from "./middlewares/arcjet.middleware.js";
import workflowRouter from "./routes/workflow.routes.js";

// Create an instance of the express application
const app = express();

//Express built-in middlewares
app.use(express.json());
// Parses incoming requests with JSON payloads and makes the data available in req.body
app.use(express.urlencoded({ extended: false }));
// Parses incoming requests with URL-encoded payloads (from forms), using the querystring library
app.use(cookieParser());
// Parses cookies attached to the client request and makes them available in req.cookies
app.use(arcjetMiddleware);

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/workflows", workflowRouter);

app.use(errorMiddleware);

// Define a route for the root ("/") URL using the GET method
app.get("/", (req, res) => {
  // Send a simple message as a response when the root URL is accessed
  res.send("Welcome to the Subscription Tracker API");
});

// The server doesn't start listening yet, we'll need to specify a port at the end of this file.
app.listen(PORT, "0.0.0.0", async () => {
  console.log(`Subscription Tracker API is running on port ${PORT}`);
  await connectToDatabase();
});

export default app;
