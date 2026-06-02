const Customer = require("../models/customerSchema");
const Product = require("../models/productSchema");
const { Parser } = require("json2csv");

exports.peopleCSV = async (req, res, next) => {
  try {
    const data = await Customer.find().lean();
    const fields = ["name", "email", "phone", "country", "governorate", "status", "totalOrders", "totalSpent", "createdAt"];
    const parser = new Parser({ fields });
    const csv = parser.parse(data);
    res.header("Content-Type", "text/csv");
    res.attachment("customers.csv");
    res.send(csv);
  } catch (err) {
    next(err);
  }
};

exports.productsCSV = async (req, res, next) => {
  try {
    const data = await Product.find().lean();
    const fields = ["name", "price", "category", "description", "createdAt"];
    const parser = new Parser({ fields });
    const csv = parser.parse(data);
    res.header("Content-Type", "text/csv");
    res.attachment("products.csv");
    res.send(csv);
  } catch (err) {
    next(err);
  }
};
