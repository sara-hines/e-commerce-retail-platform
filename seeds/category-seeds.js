const { Category } = require('../models');
console.log(Category);

const categoryData = [
    {
        category_name: 'Shirts',
    },
    {
        category_name: 'Shorts',
    },
    {
        category_name: 'Music',
    },
    {
        category_name: 'Hats',
    },
    {
        category_name: 'Shoes',
    },
];

const seedCategories = () => Category.bulkCreate(categoryData);

module.exports = seedCategories;
