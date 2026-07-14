const GrupoOpciones = require('../models/grupo_opciones.model');
const Producto = require('../models/producto.model');
const Sabor = require('../models/sabor.model');
const Fruta = require('../models/fruta.model');
const Topping = require('../models/topping.model');

const crearGrupo = async (req, res) => {
  try {
    const { nombre, tipo_seleccion, producto_id } = req.body;
    const creador = req.usuario;

    const producto = await Producto.findOne({ where: { id: producto_id, empresa_id: creador.empresa_id } });
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado en tu empresa.' });
    }

    const nuevoGrupo = await GrupoOpciones.create({
      nombre,
      tipo_seleccion,
      producto_id
    });

    res.status(201).json({ data: nuevoGrupo });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el grupo de opciones.' });
  }
};

const agregarItemAGrupo = async (req, res) => {
  try {
    const { grupo_id } = req.params;
    const { item_id, item_tipo } = req.body; // item_tipo: 'sabor', 'fruta', 'topping'

    const grupo = await GrupoOpciones.findByPk(grupo_id);
    if (!grupo) {
      return res.status(404).json({ error: 'Grupo de opciones no encontrado.' });
    }

    let item;
    let metodo;

    switch (item_tipo) {
      case 'sabor':
        item = await Sabor.findByPk(item_id);
        metodo = 'addSabor';
        break;
      case 'fruta':
        item = await Fruta.findByPk(item_id);
        metodo = 'addFruta';
        break;
      case 'topping':
        item = await Topping.findByPk(item_id);
        metodo = 'addTopping';
        break;
      default:
        return res.status(400).json({ error: 'Tipo de item no válido.' });
    }

    if (!item) {
      return res.status(404).json({ error: `El item de tipo '${item_tipo}' con ID ${item_id} no fue encontrado.` });
    }

    await grupo[metodo](item);

    res.status(200).json({ mensaje: `Item '${item.nombre}' agregado al grupo '${grupo.nombre}'.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al agregar el item al grupo.' });
  }
};

const obtenerConfiguracionProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const producto = await Producto.findByPk(id, {
            include: [
                {
                    model: GrupoOpciones,
                    as: 'grupos_opciones',
                    include: [
                        { model: Sabor, as: 'sabores', attributes: ['id', 'nombre'] },
                        { model: Fruta, as: 'frutas', attributes: ['id', 'nombre'] },
                        { model: Topping, as: 'toppings', attributes: ['id', 'nombre', 'precio_extra'] }
                    ]
                },
                {
                    model: require('../models/variante.model'),
                    as: 'variantes'
                }
            ]
        });

        if (!producto) {
            return res.status(404).json({ error: 'Producto no encontrado.' });
        }

        res.json({ data: producto });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener la configuración del producto.' });
    }
};

module.exports = { crearGrupo, agregarItemAGrupo, obtenerConfiguracionProducto };
