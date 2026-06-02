module.exports = (req, res, next) => {
  const __ = (key) => (res.locals.__ ? res.locals.__(key) : key);
  res.locals.success = req.session.success ? __(req.session.success) : null;
  res.locals.error = req.session.error ? __(req.session.error) : null;
  delete req.session.success;
  delete req.session.error;
  next();
};
