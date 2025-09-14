import {Router} from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { uploadMany } from "../handler/uploadHandler.js";
import multer from "multer";

const upload = multer();

const router = Router();

router.post("/uploadMany",upload.array("files"),uploadMany);

export default router;