import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 8000;

const corsOptions = {
    origin: "*",
    methods: "POST,GET,PUT,DELETE,PATCH,HEAD",
    credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
    res.send("Server is up and running");
});

app.listen(port, () => {
    console.log(`Server is running at: http://localhost:${port}`);
});
