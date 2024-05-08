const router = require('express').Router();
const { Product, Category, Tag, ProductTag } = require('../../models');

// The `/api/products` endpoint

// get all products
router.get('/', async (req, res) => {
  // find all products
  // be sure to include its associated Category and Tag data
  try {
    const productData = await Product.findAll({
      include: [{ model: Category }, {model: Tag }], 
      order: [['id', 'ASC']]
    });
    res.status(200).json(productData);
  } catch (err) {
    res.status(500).json(err);
  }
});

// get one product
router.get('/:id', async (req, res) => {
  // find a single product by its `id`
  // be sure to include its associated Category and Tag data
  try {
    const productData = await Product.findByPk(req.params.id, {
      include: [{ model: Category }, 
      { model: Tag, through: ProductTag }]
    }); 

    if (!productData) {
      res.status(404).json({ message: 'No product found with this id.' });
      return;
    }

    res.status(200).json(productData);
  } catch (err) {
    res.status(500).json(err);
  }
});

// create new product
router.post('/', (req, res) => {
  /* req.body should look like this...
    {
      "product_name": "Basketball",
      "price": 200.00,
      "stock": 3,
      "tagIds": [1, 2, 3, 4]
    }
  */
  Product.create(req.body)
    .then((product) => {
      // if there are tags for the product, we need to create pairings to bulk create in the ProductTag model
      if (req.body.tagIds.length) {
        const productTagIdArr = req.body.tagIds.map((tag_id) => {
          return {
            product_id: product.id,
            tag_id,
          };
        });
        return ProductTag.bulkCreate(productTagIdArr);
      }
      // if no product tags, just respond
      res.status(200).json(product);
    })
    .then((productTagIds) => res.status(200).json(productTagIds))
    .catch((err) => {
      console.log(err);
      res.status(400).json(err);
    });
});

// update product
router.put('/:id', (req, res) => {
  // update product data
  Product.update(req.body, {
    where: {
      id: req.params.id,
    },
  })
    .then((product) => {
      if (req.body.tagIds && req.body.tagIds.length) {
        // fetches all the existing ProductTag records from the database where the product_id matches the ID provided in the request parameters (req.params.id)
        ProductTag.findAll({
          where: { product_id: req.params.id }
        }).then((productTags) => {
          // create filtered list of new tag_ids
          // If we already have tagIds, why to we have to make a filtered list of new tag_ids? What is the filter doing? Filter returns a new array containing only the elements whose callback returns a truthy value. The callback would return a truthy value if productTagIds did not include the tag_id

          // The below line extracts only the tag_id property from each object in the productTags array and stores them in a new array called productTagIds. The map() method iterates over each element of the productTags array and applies the provided function to each element. The result is an array containing only the tag_id values from the productTags array.
          const productTagIds = productTags.map(({ tag_id }) => tag_id);
          // The below line (think of the .filter line as a continuation of the below line) filters the tagIds array present in the request body. It filters out any tag_id that is already present in the productTagIds array (eg it creates an array which only includes any tag_id which was not already present in the productTagIds array)
          // WHY WOULD req.body HAVE A PROPERTY CALLED tagIds? DO I NEED TO DO SOMETHING TO MAKE IT HAVE A PROPERTY CALLED tagIds?
          const newProductTags = req.body.tagIds
          .filter((tag_id) => !productTagIds.includes(tag_id))
          // Only a new tag_id would make it to this step. If the tag_id is new, then we want to make a new object which has the product_id and tag_id. 
          .map((tag_id) => {
            return {
              product_id: req.params.id,
              tag_id,
            };
          });

            // figure out which ones to remove
            // The below line (think of the .filter as a continuation of the below line) filters the productTags array to find the tags that are present in the database but not present in the tagIds array of the request body. The callback, !req.body.tagIds.includes(tag_id), would return a truthy value if the tagIds array in the request body DID NOT include the given tag_id from the database we're currently checking out. So, I believe the array created by this filter would include only the tag id's which were in our database but were not provided by the user in the request body.
          const productTagsToRemove = productTags
          .filter(({ tag_id }) => !req.body.tagIds.includes(tag_id))
          // I believe this map method would grab only the id property from the array created by the last filter method, and create an array containing only the ids. I believe the id would just be the product id, the primary key of Product. I'm a bit confused as to why we need to do that.
          .map(({ id }) => id);
                  // run both actions
          return Promise.all([
            // Remove the product tags that are no longer associated with the product using ProductTag.destroy().
            ProductTag.destroy({ where: { id: productTagsToRemove } }),
            // Add the new product tags using ProductTag.bulkCreate()
            ProductTag.bulkCreate(newProductTags),
          ]);
        });
      }

      return res.json(product);
    })
    .catch((err) => {
      // console.log(err);
      res.status(400).json(err);
    });
});

router.delete('/:id', async (req, res) => {
  // delete one product by its `id` value
  try {
    const productData = await Product.destroy({
      where: {
        id: req.params.id
      }
    });

    if (!productData) {
      res.status(404).json({ message: 'No product found with this id.' });
      return;
    }

    res.status(200).json(productData);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
