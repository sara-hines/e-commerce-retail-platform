const router = require('express').Router();
const { Category, Product } = require('../../models');

// The `/api/categories` endpoint

router.get('/', async (req, res) => {
  // find all categories
  // be sure to include its associated Products
  try {
    const categoryData = await Category.findAll({
      include: [{ model: Product }], 
      order: [['id', 'ASC']]
    });
    res.status(200).json(categoryData);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

router.get('/:id', async (req, res) => {
  // find one category by its `id` value
  // be sure to include its associated Products
  try {
    const categoryData = await Category.findByPk(req.params.id, {
      include: [{ model: Product }]
    });

    if (!categoryData) {
      res.status(404).json({ message: 'No category found with this id.' });
      return;
    }

    res.status(200).json(categoryData);
  } catch (err) {
    res.status(500).json(err);
  }
});

// create a new category
router.post('/', (req, res) => {
  /* req.body should look like this: 
    {
      category_name: "category name here"
    }
  */
  Category.create(req.body)
    .then((category) => {
      // if no product ids, just respond
      res.status(200).json(category);
    })
    .catch((err) => {
      console.log(err);
      res.status(400).json(err);
    });
});

// update a category by its `id` value
router.put('/:id', (req, res) => {
  Category.update(req.body, {
    where: {
      id: req.params.id, 
    },
  })
    .then((category) => {
      if (req.body.productIds && req.body.productIds.length) {

        Category.findAll({
          where: { category_id: req.params.id }
        }).then((resultingCategory) => {
          // create filtered list of new product_ids
          const productIds = resultingCategory.map(({ product_id }) => product_id);
          const newProductIds = req.body.productIds
          .filter((product_id) => !productIds.includes(product_id))
          .map((product_id) => {
            return {
              category_id: req.params.id,
              product_id,
            };
          });

          const productIdsToRemove = productIds
          .filter(({ product_id }) => !req.body.productIds.includes(product_id))
          .map(({ id }) => id);

          return Promise.all([
            Category.destroy({ where: { id: productIdsToRemove } }),
            Category.bulkCreate(newProductIds),
          ]);
        });
      }

      return res.json(category);
    })
    .catch((err) => {
      res.status(400).json(err);
    });
});

router.delete('/:id', async (req, res) => {
  // delete a category by its `id` value
  try {
    const categoryData = await Category.destroy({
      where: {
        id: req.params.id
      }
    });

    if (!categoryData) {
      res.status(404).json({ message: 'No category found with this id.' });
      return;
    }

    res.status(200).json(categoryData);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
