const { resetStores } = require("./config/stores");
const { reiniciarCircuitos } = require("./services/patrones/circuitBreaker");
const { registrarObservadores } = require("./services/observadores");

function reiniciarEstado() {
    resetStores();
    reiniciarCircuitos();
    registrarObservadores();
}

module.exports = {
    reiniciarEstado
};
