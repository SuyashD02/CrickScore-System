const mongoose = require('mongoose');

const BallSchema = new mongoose.Schema({
    ballNumber: Number,
    run: Number,
    isOut: Boolean,
});

const OverSchema = new mongoose.Schema({
    overNumber: Number,
    balls: [BallSchema],
});

const MatchSchema = new mongoose.Schema({
    currentScore: {
        runs: Number,
        wickets: Number,
    },
    currentOver: Number,
    overs: [OverSchema],
});

module.exports = mongoose.model('Match', MatchSchema);
