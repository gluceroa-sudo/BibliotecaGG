const express = require("express");
const { crear, listar } = require("../controllers/authController");
const { autenticar, requerirRol } = require("../middlewares/auth");

const router = express.Router();

router.get("/", autenticar, requerirRol("Administrador", "Bibliotecario"), listar);
router.post("/", autenticar, requerirRol("Administrador"), crear);

module.exports = router;
