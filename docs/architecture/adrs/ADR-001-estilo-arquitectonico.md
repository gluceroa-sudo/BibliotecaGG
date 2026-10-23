# ADR-001: Estilo arquitectónico modular en capas

- Estado: Aceptado
- Fecha: 2026-10-22
- Decisores: Giovanni Francia, Gerardo Lucero
- Estándar: ISO/IEC/IEEE 42010:2011

## Contexto

Biblioteca GG debe registrar usuarios, libros y préstamos, consultar el catálogo con baja latencia y dejar trazabilidad de las relaciones entre lectores, obras y autores. El equipo es de dos personas y el sistema se entrega como una aplicación ejecutable en un curso. Se compararon cuatro estilos frente a los atributos de ISO/IEC 25010: arquitectura en capas, repositorio, microservicios y arquitectura orientada a eventos.

## Opciones

1. Capas estrictas. Separa interfaz, aplicación, dominio e infraestructura. Favorece la mantenibilidad y el desempeño predecible. Limita la escalabilidad horizontal a un solo proceso.
2. Repositorio. Centraliza el acceso a datos detrás de una interfaz. Encaja con PostgreSQL como fuente de verdad y permite cambiar el adaptador sin tocar los casos de uso.
3. Microservicios. Separa autenticación, catálogo y préstamos. Mejora la escalabilidad independiente y complica el despliegue, la consistencia y las pruebas para este alcance.
4. Arquitectura orientada a eventos. Desacopla la réplica documental y el grafo. Aporta evolución independiente y acepta consistencia eventual. Un bus distribuido sería excesivo para el MVP.

## Opción elegida

Monolito modular en capas, con patrón Repository en la frontera de PostgreSQL y un bus de eventos en proceso (Observer) para los efectos secundarios. No se adoptan microservicios. La orientación a eventos queda acotada a la réplica hacia MongoDB y Neo4j.

## Consecuencias

- La mantenibilidad sube porque cada caso de uso vive en un servicio y cada motor tiene un gateway.
- El desempeño de la consulta se apoya en Cache-Aside, sin operar un clúster.
- La escalabilidad queda vertical en esta entrega. El corte por contenedores C4 deja identificado el límite si más adelante se extrae el catálogo.
- La consistencia fuerte cubre usuarios, libros y préstamos. La ficha documental y el grafo pueden ir un paso detrás.

## Relación con otras vistas

El nivel 2 de C4 muestra un solo contenedor de API y cuatro almacenes. El nivel 3 muestra controladores, servicios, estrategia, observadores y gateways.
