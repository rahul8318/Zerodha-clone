const {Schema} = require('mongoose');
const OrderSchema = new Schema({
  name: String,
  qty: Number,
  price: Number,
  model: String,
});
module.exports = OrderSchema;