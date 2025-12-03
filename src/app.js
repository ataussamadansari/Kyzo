import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";
import authRouter from "./routes/auth-routes.js";
import userRouter from "./routes/user-routes.js";
import notificationRouter from "./routes/notification-routes.js";
import postRouter from "./routes/post-routes.js";

const app = express();

app.use(cors());
app.use(express.json());

// Swagger Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Kyzo Social API Docs"
}));

// API JSON endpoint
app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// Routes
app.use("/api/auth", authRouter);
app.use("/api/user/", userRouter);
app.use("/api/post/", postRouter);
app.use("/api/notifications", notificationRouter);

export default app;