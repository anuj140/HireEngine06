const Cms = require("../models/Cms");
const path = require("path");
const WebsiteSettings = require("../models/WebsiteSettings");
const Banner = require("../models/Banner");
const Card = require("../models/Card");
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

// ===================== WEBSITE SETTINGS =====================

// @desc    Get website settings (public)
// @route   GET /api/cms/website
// @access  Public
exports.getWebsiteSettings = async (req, res) => {
  try {
    const settings = await WebsiteSettings.getSettings();
    
    // Return only public fields (exclude sensitive info if any)
    const publicSettings = settings.toObject();
    
    res.status(200).json({
      success: true,
      data: publicSettings
    });
  } catch (error) {
    console.error("Get website settings error:", error);
    res.status(500).json({
      success: false,
      msg: "Server error fetching website settings"
    });
  }
};

// @desc    Update website settings
// @route   PUT /api/cms/website
// @access  Private/Admin
exports.updateWebsiteSettings = async (req, res) => {
  try {
    const adminId = req.user.id;
    
    // Get current settings
    let settings = await WebsiteSettings.findOne();
    if (!settings) {
      settings = new WebsiteSettings();
    }
    
    // Update fields
    const updateFields = [
      'siteTitle', 'siteDescription', 'siteKeywords',
      'logoUrl', 'faviconUrl', 'headerLogoUrl',
      'primaryColor', 'secondaryColor',
      'navigationItems', 'footerSections', 'footerCopyright',
      'socialLinks', 'contactInfo', 'metaTags'
    ];
    
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        settings[field] = req.body[field];
      }
    });
    
    // Update version for cache busting
    settings.version += 1;
    settings.lastUpdatedBy = adminId;
    
    await settings.save();
    
    res.status(200).json({
      success: true,
      msg: "Website settings updated successfully",
      data: settings,
      version: settings.version
    });
  } catch (error) {
    console.error("Update website settings error:", error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        msg: "Validation error",
        errors
      });
    }
    
    res.status(500).json({
      success: false,
      msg: "Server error updating website settings"
    });
  }
};

// @desc    Update specific website setting (e.g., just colors or logo)
// @route   PATCH /api/cms/website/:field
// @access  Private/Admin
exports.updateWebsiteSetting = async (req, res) => {
  try {
    const { field } = req.params;
    const { value } = req.body;
    const adminId = req.user.id;
    
    if (!value) {
      return res.status(400).json({
        success: false,
        msg: "Value is required"
      });
    }
    
    const allowedFields = [
      'primaryColor', 'secondaryColor', 'logoUrl', 'faviconUrl',
      'headerLogoUrl', 'siteTitle', 'siteDescription', 'footerCopyright'
    ];
    
    if (!allowedFields.includes(field)) {
      return res.status(400).json({
        success: false,
        msg: `Cannot update field: ${field}`
      });
    }
    
    let settings = await WebsiteSettings.findOne();
    if (!settings) {
      settings = new WebsiteSettings();
    }
    
    // Validate color fields
    if ((field === 'primaryColor' || field === 'secondaryColor') && 
        !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value)) {
      return res.status(400).json({
        success: false,
        msg: "Invalid color format. Use hex format (#RRGGBB or #RGB)"
      });
    }
    
    settings[field] = value;
    settings.version += 1;
    settings.lastUpdatedBy = adminId;
    
    await settings.save();
    
    res.status(200).json({
      success: true,
      msg: `${field} updated successfully`,
      data: { [field]: value },
      version: settings.version
    });
  } catch (error) {
    console.error("Update website setting error:", error);
    res.status(500).json({
      success: false,
      msg: "Server error updating website setting"
    });
  }
};

// ===================== BANNER MANAGEMENT =====================

// @desc    Get all banners (public with filtering)
// @route   GET /api/cms/banners
// @access  Public
exports.getBanners = async (req, res) => {
  try {
    const { placement, activeOnly = "true" } = req.query;
    const userRole = req.user?.role || "guest";
    
    let query = {};
    
    // Filter by placement if provided
    if (placement) {
      query.placement = placement;
    }
    
    // Filter active banners only if requested
    if (activeOnly === "true") {
      query.status = "active";
      query.isActive = true;
    }
    
    const banners = await Banner.find(query)
      .sort({ order: 1, priority: -1, createdAt: -1 })
      .select("-__v")
      .lean();
    
    // Filter banners based on audience targeting and schedule
    const filteredBanners = banners.filter(banner => {
      // Check schedule if banner has scheduling
      if (banner.schedule && (banner.schedule.startDate || banner.schedule.daysOfWeek?.length > 0)) {
        const now = new Date();
        const currentDay = now.getDay();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        // Check date range
        if (banner.schedule.startDate && new Date(banner.schedule.startDate) > now) {
          return false;
        }
        if (banner.schedule.endDate && new Date(banner.schedule.endDate) < now) {
          return false;
        }
        
        // Check days of week
        if (banner.schedule.daysOfWeek && banner.schedule.daysOfWeek.length > 0) {
          if (!banner.schedule.daysOfWeek.includes(currentDay)) {
            return false;
          }
        }
        
        // Check time slots
        if (banner.schedule.startTime && banner.schedule.endTime) {
          const [startHour, startMinute] = banner.schedule.startTime.split(":").map(Number);
          const [endHour, endMinute] = banner.schedule.endTime.split(":").map(Number);
          
          const startMinutes = startHour * 60 + startMinute;
          const endMinutes = endHour * 60 + endMinute;
          
          if (currentTime < startMinutes || currentTime > endMinutes) {
            return false;
          }
        }
      }
      
      // Check audience targeting
      if (banner.targetAudience && banner.targetAudience.roles) {
        const roles = banner.targetAudience.roles;
        
        // If roles includes "all" or user is guest and showToGuest is true
        if (roles.includes("all")) {
          return true;
        }
        
        if (userRole === "guest") {
          return banner.targetAudience.showToGuest === true;
        }
        
        // Check if user role is in target roles
        return roles.includes(userRole);
      }
      
      return true;
    });
    
    res.status(200).json({
      success: true,
      count: filteredBanners.length,
      data: filteredBanners
    });
  } catch (error) {
    console.error("Get banners error:", error);
    res.status(500).json({
      success: false,
      msg: "Server error fetching banners"
    });
  }
};

// @desc    Get banner by ID
// @route   GET /api/cms/banners/:id
// @access  Public
exports.getBannerById = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id)
      .select("-__v")
      .lean();
    
    if (!banner) {
      return res.status(404).json({
        success: false,
        msg: "Banner not found"
      });
    }
    
    res.status(200).json({
      success: true,
      data: banner
    });
  } catch (error) {
    console.error("Get banner by ID error:", error);
    
    if (error.kind === "ObjectId") {
      return res.status(404).json({
        success: false,
        msg: "Banner not found"
      });
    }
    
    res.status(500).json({
      success: false,
      msg: "Server error fetching banner"
    });
  }
};

// @desc    Create new banner
// @route   POST /api/cms/banners
// @access  Private/Admin
exports.createBanner = async (req, res) => {
  try {
    const adminId = req.user.id;
    
    const bannerData = {
      ...req.body,
      createdBy: adminId,
      updatedBy: adminId
    };
    
    // If image URL comes from upload middleware
    if (req.file) {
      bannerData.imageUrl = req.file.path;
    }
    
    const banner = await Banner.create(bannerData);
    
    res.status(201).json({
      success: true,
      msg: "Banner created successfully",
      data: banner
    });
  } catch (error) {
    console.error("Create banner error:", error);
    
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        msg: "Validation error",
        errors
      });
    }
    
    res.status(500).json({
      success: false,
      msg: "Server error creating banner"
    });
  }
};

// @desc    Update banner
// @route   PUT /api/cms/banners/:id
// @access  Private/Admin
exports.updateBanner = async (req, res) => {
  try {
    const adminId = req.user.id;
    
    let banner = await Banner.findById(req.params.id);
    
    if (!banner) {
      return res.status(404).json({
        success: false,
        msg: "Banner not found"
      });
    }
    
    // Update fields
    const updateFields = [
      'title', 'subtitle', 'imageUrl', 'mobileImageUrl',
      'backgroundColor', 'textColor', 'ctaButtons',
      'placement', 'targetAudience', 'isActive', 'schedule',
      'order', 'priority', 'status'
    ];
    
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        banner[field] = req.body[field];
      }
    });
    
    // Update image if new file uploaded
    if (req.file) {
      banner.imageUrl = req.file.path;
    }
    
    banner.updatedBy = adminId;
    
    await banner.save();
    
    res.status(200).json({
      success: true,
      msg: "Banner updated successfully",
      data: banner
    });
  } catch (error) {
    console.error("Update banner error:", error);
    
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        msg: "Validation error",
        errors
      });
    }
    
    if (error.kind === "ObjectId") {
      return res.status(404).json({
        success: false,
        msg: "Banner not found"
      });
    }
    
    res.status(500).json({
      success: false,
      msg: "Server error updating banner"
    });
  }
};

// @desc    Delete banner
// @route   DELETE /api/cms/banners/:id
// @access  Private/Admin
exports.deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    
    if (!banner) {
      return res.status(404).json({
        success: false,
        msg: "Banner not found"
      });
    }
    
    // Soft delete by archiving
    banner.status = "archived";
    banner.isActive = false;
    banner.updatedBy = req.user.id;
    
    await banner.save();
    
    res.status(200).json({
      success: true,
      msg: "Banner archived successfully"
    });
  } catch (error) {
    console.error("Delete banner error:", error);
    
    if (error.kind === "ObjectId") {
      return res.status(404).json({
        success: false,
        msg: "Banner not found"
      });
    }
    
    res.status(500).json({
      success: false,
      msg: "Server error deleting banner"
    });
  }
};

// @desc    Update banner order
// @route   PATCH /api/cms/banners/order
// @access  Private/Admin
exports.updateBannerOrder = async (req, res) => {
  try {
    const { bannerOrders } = req.body; // Array of {id, order}
    
    if (!Array.isArray(bannerOrders)) {
      return res.status(400).json({
        success: false,
        msg: "bannerOrders must be an array"
      });
    }
    
    const updatePromises = bannerOrders.map(({ id, order }) =>
      Banner.findByIdAndUpdate(id, { order }, { new: true })
    );
    
    await Promise.all(updatePromises);
    
    res.status(200).json({
      success: true,
      msg: "Banner order updated successfully"
    });
  } catch (error) {
    console.error("Update banner order error:", error);
    res.status(500).json({
      success: false,
      msg: "Server error updating banner order"
    });
  }
};

// ===================== CARD MANAGEMENT =====================

// @desc    Get all cards (public with filtering)
// @route   GET /api/cms/cards
// @access  Public
exports.getCards = async (req, res) => {
  try {
    const { placement, template, status = "active" } = req.query;
    const userRole = req.user?.role || "guest";
    const userId = req.user?.id;
    
    let query = { status };
    
    // Filter by placement if provided
    if (placement) {
      query.placement = placement;
    }
    
    // Filter by template if provided
    if (template) {
      query.template = template;
    }
    
    const cards = await Card.find(query)
      .sort({ order: 1, priority: -1, createdAt: -1 })
      .select("-__v")
      .lean();
    
    // Filter cards based on targeting
    const filteredCards = cards.filter(card => {
      // Check if user is in hide list
      if (userId && card.targetAudience?.hideForUsers?.includes(userId)) {
        return false;
      }
      
      // Check role targeting
      if (card.targetAudience?.roles && card.targetAudience.roles.length > 0) {
        if (!card.targetAudience.roles.includes(userRole)) {
          return false;
        }
      }
      
      // Check user status
      if (card.targetAudience?.userStatus && card.targetAudience.userStatus !== "any") {
        const userIsActive = req.user?.isActive !== false;
        if (card.targetAudience.userStatus === "active" && !userIsActive) {
          return false;
        }
        if (card.targetAudience.userStatus === "inactive" && userIsActive) {
          return false;
        }
      }
      
      // Check schedule
      if (card.schedule) {
        const now = new Date();
        
        if (card.schedule.startDate && new Date(card.schedule.startDate) > now) {
          return false;
        }
        
        if (card.schedule.endDate && new Date(card.schedule.endDate) < now) {
          return false;
        }
        
        if (card.schedule.daysOfWeek && card.schedule.daysOfWeek.length > 0) {
          const currentDay = now.getDay();
          if (!card.schedule.daysOfWeek.includes(currentDay)) {
            return false;
          }
        }
        
        if (card.schedule.timeSlots && card.schedule.timeSlots.length > 0) {
          const currentTime = now.getHours() * 60 + now.getMinutes();
          const isInTimeSlot = card.schedule.timeSlots.some(slot => {
            const [startHour, startMinute] = slot.start.split(":").map(Number);
            const [endHour, endMinute] = slot.end.split(":").map(Number);
            
            const startMinutes = startHour * 60 + startMinute;
            const endMinutes = endHour * 60 + endMinute;
            
            return currentTime >= startMinutes && currentTime <= endMinutes;
          });
          
          if (!isInTimeSlot) {
            return false;
          }
        }
      }
      
      return true;
    });
    
    res.status(200).json({
      success: true,
      count: filteredCards.length,
      data: filteredCards
    });
  } catch (error) {
    console.error("Get cards error:", error);
    res.status(500).json({
      success: false,
      msg: "Server error fetching cards"
    });
  }
};

// @desc    Get card by ID
// @route   GET /api/cms/cards/:id
// @access  Public
exports.getCardById = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id)
      .select("-__v")
      .lean();
    
    if (!card) {
      return res.status(404).json({
        success: false,
        msg: "Card not found"
      });
    }
    
    res.status(200).json({
      success: true,
      data: card
    });
  } catch (error) {
    console.error("Get card by ID error:", error);
    
    if (error.kind === "ObjectId") {
      return res.status(404).json({
        success: false,
        msg: "Card not found"
      });
    }
    
    res.status(500).json({
      success: false,
      msg: "Server error fetching card"
    });
  }
};

// @desc    Create new card
// @route   POST /api/cms/cards
// @access  Private/Admin
exports.createCard = async (req, res) => {
  try {
    const adminId = req.user.id;
    
    const cardData = {
      ...req.body,
      createdBy: adminId,
      updatedBy: adminId
    };
    
    // If image URL comes from upload middleware
    if (req.file) {
      cardData.imageUrl = req.file.path;
    }
    
    const card = await Card.create(cardData);
    
    res.status(201).json({
      success: true,
      msg: "Card created successfully",
      data: card
    });
  } catch (error) {
    console.error("Create card error:", error);
    
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        msg: "Validation error",
        errors
      });
    }
    
    res.status(500).json({
      success: false,
      msg: "Server error creating card"
    });
  }
};

// @desc    Update card
// @route   PUT /api/cms/cards/:id
// @access  Private/Admin
exports.updateCard = async (req, res) => {
  try {
    const adminId = req.user.id;
    
    let card = await Card.findById(req.params.id);
    
    if (!card) {
      return res.status(404).json({
        success: false,
        msg: "Card not found"
      });
    }
    
    // Update fields
    const updateFields = [
      'title', 'content', 'contentType', 'imageUrl',
      'backgroundType', 'backgroundColor', 'textColor',
      'cta', 'badge', 'template', 'placement',
      'targetAudience', 'priority', 'schedule', 'status', 'order'
    ];
    
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        card[field] = req.body[field];
      }
    });
    
    // Update image if new file uploaded
    if (req.file) {
      card.imageUrl = req.file.path;
    }
    
    card.updatedBy = adminId;
    
    await card.save();
    
    res.status(200).json({
      success: true,
      msg: "Card updated successfully",
      data: card
    });
  } catch (error) {
    console.error("Update card error:", error);
    
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        msg: "Validation error",
        errors
      });
    }
    
    if (error.kind === "ObjectId") {
      return res.status(404).json({
        success: false,
        msg: "Card not found"
      });
    }
    
    res.status(500).json({
      success: false,
      msg: "Server error updating card"
    });
  }
};

// @desc    Delete card
// @route   DELETE /api/cms/cards/:id
// @access  Private/Admin
exports.deleteCard = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    
    if (!card) {
      return res.status(404).json({
        success: false,
        msg: "Card not found"
      });
    }
    
    // Soft delete by archiving
    card.status = "archived";
    card.updatedBy = req.user.id;
    
    await card.save();
    
    res.status(200).json({
      success: true,
      msg: "Card archived successfully"
    });
  } catch (error) {
    console.error("Delete card error:", error);
    
    if (error.kind === "ObjectId") {
      return res.status(404).json({
        success: false,
        msg: "Card not found"
      });
    }
    
    res.status(500).json({
      success: false,
      msg: "Server error deleting card"
    });
  }
};