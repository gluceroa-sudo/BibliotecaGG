class BusEventos {
    constructor() {
        this.suscriptores = new Map();
    }

    suscribir(evento, observador) {
        if (!this.suscriptores.has(evento)) {
            this.suscriptores.set(evento, []);
        }
        this.suscriptores.get(evento).push(observador);
    }

    async publicar(evento, payload) {
        const lista = this.suscriptores.get(evento) || [];
        const errores = [];
        for (const observador of lista) {
            try {
                await observador(payload);
            } catch (error) {
                errores.push(error.message);
            }
        }
        return errores;
    }

    limpiar() {
        this.suscriptores.clear();
    }
}

const busEventos = new BusEventos();

module.exports = {
    BusEventos,
    busEventos
};
