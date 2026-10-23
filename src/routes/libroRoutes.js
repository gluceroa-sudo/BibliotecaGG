const express = require("express");
const libroController = require("../controllers/libroController");
const { autenticar, requerirRol } = require("../middlewares/auth");

const router = express.Router();

router.get("/", libroController.listar);
router.get("/:id", libroController.obtener);
router.post("/", autenticar, requerirRol("Administrador", "Bibliotecario"), libroController.crear);

module.exports = router;
