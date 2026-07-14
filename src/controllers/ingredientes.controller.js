const Sabor = require('../models/sabor.model');
const Fruta = require('../models/fruta.model');
const Topping = require('../models/topping.model');

const crearItem = (model) => async (req, res) => {
  try {
    const { nombre, precio_extra } = req.body;
    const creador = req.usuario;

    const data = {
      nombre,
      empresa_id: creador.empresa_id
    };

    if (precio_extra !== undefined) {
      data.precio_extra = precio_extra;
    }

    const nuevoItem = await model.create(data);
    res.status(201).json({ data: nuevoItem });
  } catch (error) {
    res.status(500).json({ error: `Error al crear el item: ${error.message}` });
  }
};

const obtenerItems = (model) => async (req, res) => {
  try {
    const items = await model.findAll({
      where: { empresa_id: req.usuario.empresa_id, activo: true }
    });
    res.json({ data: items });
  } catch (error) {
    res.status(500).json({ error: `Error al obtener los items: ${error.message}` });
  }
};

module.exports = {
  crearSabor: crearItem(Sabor),
  obtenerSabores: obtenerItems(Sabor),
  crearFruta: crearItem(Fruta),
  obtenerFrutas: obtenerItems(Fruta),
  crearTopping: crearItem(Topping),
  obtenerToppings: obtenerItems(Topping)
};
