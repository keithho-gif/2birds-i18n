// Returns the visitor's country code (ISO 3166-1 alpha-2) from Vercel's edge geolocation header,
// so the site header can preselect the region and language on a first visit.
// Only the country code is returned; nothing is logged or stored.
module.exports = (req, res) => {
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  const country = (req.headers["x-vercel-ip-country"] || "").toString().toUpperCase().slice(0, 2) || null;
  res.statusCode = 200;
  res.end(JSON.stringify({ country }));
};
