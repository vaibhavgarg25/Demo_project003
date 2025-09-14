import {Router} from "express";
import { getTrains } from "../handler/trainHandler.js";
import { getTrainById } from "../handler/trainHandler.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
const router = Router();

router.get("/getTrains",getTrains);
router.get("/getTrain/:id",getTrainById);

export default router;