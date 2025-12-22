// Middleware to parse JSON strings in form-data
const parseFormDataJson = (req, res, next) => {
  // Only parse if content-type is multipart/form-data
  if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
    const fieldsToParse = [
      'ctaButtons', 'targetAudience', 'schedule',
      'cta', 'badge', 'navigationItems', 'socialLinks',
      'footerSections', 'contactInfo'
    ];
    
    fieldsToParse.forEach(field => {
      if (req.body[field] && typeof req.body[field] === 'string') {
        try {
          req.body[field] = JSON.parse(req.body[field]);
        } catch (error) {
          // If parsing fails, leave as is (will be caught by validation)
        }
      }
    });
    
    // Convert string booleans
    if (req.body.isActive === 'true') req.body.isActive = true;
    if (req.body.isActive === 'false') req.body.isActive = false;
    
    // Convert string numbers
    if (req.body.order) req.body.order = parseInt(req.body.order) || 0;
    if (req.body.priority) req.body.priority = parseInt(req.body.priority) || 0;
  }
  
  next();
};

module.exports = parseFormDataJson;