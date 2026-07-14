const { Router } = require('express');
const { ejecutarSeed } = require('../controllers/seed.controller');
// No necesitamos verificarRol aquí porque la seguridad se maneja con una clave secreta

const router = Router();

/**
 * @swagger
 * /seed/run:
 *   post:
 *     summary: (SUPER ADMIN) Ejecuta el seeder para inicializar la base de datos
 *     tags: [Super Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [seed_secret]
 *             properties:
 *               seed_secret:
 *                 type: string
 *                 description: Clave secreta para autorizar la ejecución del seed.
 *     responses:
 *       201:
 *         description: Seed ejecutado y usuario admin creado.
 *       200:
 *         description: El usuario admin ya existía.
 *       403:
 *         description: Clave secreta incorrecta.
 */
router.post('/run', ejecutarSeed);

module.exports = router;
