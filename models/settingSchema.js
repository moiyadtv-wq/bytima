const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const settingSchema = new Schema({
  key: { type: String, required: true, unique: true },
  value: { type: Schema.Types.Mixed, required: true },
  updatedAt: { type: Date, default: Date.now }
});

settingSchema.statics.get = async function(key, defaultValue) {
  const s = await this.findOne({ key });
  return s ? s.value : defaultValue;
};

settingSchema.statics.set = async function(key, value) {
  await this.findOneAndUpdate(
    { key },
    { key, value, updatedAt: new Date() },
    { upsert: true }
  );
};

module.exports = mongoose.model("Setting", settingSchema);