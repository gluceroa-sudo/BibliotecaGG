class CircuitBreaker {
    constructor({ nombre, umbralFallos = 3, tiempoReintentoMs = 15000 } = {}) {
        this.nombre = nombre || "circuito";
        this.umbralFallos = umbralFallos;
        this.tiempoReintentoMs = tiempoReintentoMs;
        this.fallos = 0;
        this.estado = "cerrado";
        this.proximoIntento = 0;
    }

    async ejecutar(operacion, alternativa) {
        if (this.estado === "abierto") {
            if (Date.now() < this.proximoIntento) {
                const error = new Error(`Circuito ${this.nombre} abierto`);
                if (alternativa) {
                    return alternativa(error);
                }
                throw error;
            }
            this.estado = "semiabierto";
        }

        try {
            const resultado = await operacion();
            this.fallos = 0;
            this.estado = "cerrado";
            return resultado;
        } catch (error) {
            this.fallos += 1;
            if (this.estado === "semiabierto" || this.fallos >= this.umbralFallos) {
                this.estado = "abierto";
                this.proximoIntento = Date.now() + this.tiempoReintentoMs;
            }
            if (alternativa) {
                return alternativa(error);
            }
            throw error;
        }
    }

    reiniciar() {
        this.fallos = 0;
        this.estado = "cerrado";
        this.proximoIntento = 0;
    }
}

const circuitoRedis = new CircuitBreaker({ nombre: "redis", umbralFallos: 3, tiempoReintentoMs: 10000 });
const circuitoNeo4j = new CircuitBreaker({ nombre: "neo4j", umbralFallos: 3, tiempoReintentoMs: 10000 });

function reiniciarCircuitos() {
    circuitoRedis.reiniciar();
    circuitoNeo4j.reiniciar();
}

module.exports = {
    CircuitBreaker,
    circuitoRedis,
    circuitoNeo4j,
    reiniciarCircuitos
};
