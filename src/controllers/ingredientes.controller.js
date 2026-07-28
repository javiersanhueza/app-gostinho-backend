const Sabor = require('../models/sabor.model');
const Fruta = require('../models/fruta.model');
const Topping = require('../models/topping.model');
const Endulzante = require('../models/endulzante.model');

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
    const whereClause = { empresa_id: req.usuario.empresa_id };
    if (req.query.todas !== 'true') {
      whereClause.activo = true;
    }
    const items = await model.findAll({
      where: whereClause
    });
    res.json({ data: items });
  } catch (error) {
    res.status(500).json({ error: `Error al obtener los items: ${error.message}` });
  }
};

const actualizarItem = (model) => async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, precio_extra, activo } = req.body;
    const empresa_id = req.usuario.empresa_id;

    const item = await model.findOne({ where: { id, empresa_id } });
    if (!item) return res.status(404).json({ error: 'Item no encontrado' });

    const dataToUpdate = { nombre };
    if (activo !== undefined) dataToUpdate.activo = activo;
    if (precio_extra !== undefined) dataToUpdate.precio_extra = precio_extra;

    await item.update(dataToUpdate);
    res.json({ data: item });
  } catch (error) {
    res.status(500).json({ error: `Error al actualizar el item: ${error.message}` });
  }
};

const borrarItem = (model) => async (req, res) => {
  try {
    const { id } = req.params;
    const empresa_id = req.usuario.empresa_id;

    const item = await model.findOne({ where: { id, empresa_id } });
    if (!item) return res.status(404).json({ error: 'Item no encontrado' });

    await item.destroy();
    res.json({ mensaje: 'Item eliminado con éxito' });
  } catch (error) {
    res.status(500).json({ error: `Error al eliminar el item: ${error.message}` });
  }
};

module.exports = {
  crearSabor: crearItem(Sabor),
  obtenerSabores: obtenerItems(Sabor),
  actualizarSabor: actualizarItem(Sabor),
  borrarSabor: borrarItem(Sabor),

  crearFruta: crearItem(Fruta),
  obtenerFrutas: obtenerItems(Fruta),
  actualizarFruta: actualizarItem(Fruta),
  borrarFruta: borrarItem(Fruta),

  crearTopping: crearItem(Topping),
  obtenerToppings: obtenerItems(Topping),
  actualizarTopping: actualizarItem(Topping),
  borrarTopping: borrarItem(Topping),

  crearEndulzante: crearItem(Endulzante),
  obtenerEndulzantes: obtenerItems(Endulzante),
  actualizarEndulzante: actualizarItem(Endulzante),
  borrarEndulzante: borrarItem(Endulzante)
};
