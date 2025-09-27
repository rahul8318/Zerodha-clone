const {model} = require('mongoose');
const PositionSchema = require('../schema/PositionScema');
const PositionModel = model('Position', PositionSchema);

module.exports = PositionModel;