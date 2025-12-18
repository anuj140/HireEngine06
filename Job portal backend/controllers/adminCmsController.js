
const Cms = require("../models/Cms");
const path = require("path");
// Use path.join to resolve the data file from the project root relative to this controller file
const { MOCK_CMS_CONTENT } = require(path.join(__dirname, "../data"));

// Get CMS Content
exports.getCmsContent = async (req, res) => {
  let cms = await Cms.findOne({ singleton: "cms-content" });

  if (!cms) {
    // If no CMS content exists, create it from mock data
    cms = await Cms.create({
      content: MOCK_CMS_CONTENT,
      lastUpdatedBy: req.user.id,
    });
  }

  res.status(200).json({ success: true, data: cms.content });
};

// Update CMS Content
exports.updateCmsContent = async (req, res) => {
  const cms = await Cms.findOneAndUpdate(
    { singleton: "cms-content" },
    { content: req.body, lastUpdatedBy: req.user.id },
    { new: true, upsert: true }
  );
  res.status(200).json({ success: true, data: cms.content });
};
