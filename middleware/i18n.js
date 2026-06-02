const fs = require("fs");
const path = require("path");

const locales = {};
const langs = ["ar", "en"];

langs.forEach(lang => {
  locales[lang] = JSON.parse(fs.readFileSync(path.join(__dirname, "../locales", lang + ".json"), "utf8"));
});

module.exports = (req, res, next) => {
  let lang = req.session.lang || "ar";
  if (req.query.lang && langs.includes(req.query.lang)) {
    lang = req.query.lang;
    req.session.lang = lang;
  }
  const dict = locales[lang] || locales.ar;
  res.locals.lang = lang;
  res.locals.dir = lang === "ar" ? "rtl" : "ltr";
  res.locals.__ = (key) => dict[key] || key;
  res.locals.locales = langs;
  next();
};
