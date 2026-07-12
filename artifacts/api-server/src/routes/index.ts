import { Router, type IRouter } from "express";
import healthRouter from "./health";
import leadsRouter from "./leads";
import checkoutRouter from "./checkout";
import debriefRouter from "./debrief";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(leadsRouter);
router.use(checkoutRouter);
router.use(debriefRouter);
router.use(adminRouter);

export default router;
