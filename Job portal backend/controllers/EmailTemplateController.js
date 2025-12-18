const EmailTemplate = require("../models/EmailTemplate");
const { NotFoundError, BadRequestError } = require("../errors");

// Create or Update Template (Upsert)
exports.upsertTemplate = async (req, res, next) => {
  try {
    const { name, subject, body } = req.body;
    if (!name || !subject || !body) throw new BadRequestError("Name, subject and body required");

    const template = await EmailTemplate.findOneAndUpdate(
      { name },
      { subject, body, updatedBy: req.user.id },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ success: true, template });
  } catch (err) {
    next(err);
  }
};

// Get Template by name
exports.getTemplate = async (req, res, next) => {
  try {
    const template = await EmailTemplate.findOne({ name: req.params.name });
    if (!template) throw new NotFoundError("Template not found");
    res.json({ success: true, template });
  } catch (err) {
    next(err);
  }
};

// Delete Template
exports.deleteTemplate = async (req, res, next) => {
  try {
    const deleted = await EmailTemplate.findOneAndDelete({ name: req.params.name });
    if (!deleted) throw new NotFoundError("Template not found");
    res.json({ success: true, message: "Template deleted" });
  } catch (err) {
    next(err);
  }
};

// List Templates
exports.listTemplates = async (req, res, next) => {
  try {
    const templates = await EmailTemplate.find().sort({ updatedAt: -1 });
    res.json({ success: true, count: templates.length, templates });
  } catch (err) {
    next(err);
  }
};