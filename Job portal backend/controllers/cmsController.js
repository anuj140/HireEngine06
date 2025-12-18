
const Cms = require("../models/Cms");
const path = require("path");
// Use path.join to resolve the data file from the project root relative to this controller file
const { MOCK_CMS_CONTENT } = require(path.join(__dirname, "../data"));

// @desc    Get public CMS content
// @route   GET /api/v1/cms
// @access  Public
exports.getPublicCmsContent = async (req, res) => {
  try {
    let cms = await Cms.findOne({ singleton: "cms-content" });

    if (!cms) {
      // Fallback: If no CMS content in DB, return mock content.
      // This prevents the user-facing site from breaking if the DB is not seeded.
      return res.status(200).json({ success: true, data: MOCK_CMS_CONTENT });
    }

    res.status(200).json({ success: true, data: cms.content || {} });
  } catch (error) {
    // Ensure we return a valid response structure even on error
    console.error("CMS Fetch Error:", error);
    return res.status(200).json({ success: true, data: MOCK_CMS_CONTENT });
  }
};
