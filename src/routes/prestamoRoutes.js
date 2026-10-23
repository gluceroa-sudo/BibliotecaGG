const express = require("express");
const prestamoController = require("../controllers/prestamoController");
const { autenticar, requerirRol } = require("../middlewares/auth");

const router = express.Router();

router.get("/", autenticar, requerirRol("Administrador", "Bibliotecario"), prestamoController.listar);
router.post("/", autenticar, requerirRol("Administrador", "Bibliotecario"), prestamoController.crear);

module.exports = router;
