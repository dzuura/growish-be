const sanitizeFilePath = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
};

module.exports = { sanitizeFilePath };