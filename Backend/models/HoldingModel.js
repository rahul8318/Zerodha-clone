const {model} = require('mongoose');
const HoldingSchema = require('../schema/HoldingSchema');

const HoldingModel = model('Holding', HoldingSchema);

module.exports = HoldingModel;
