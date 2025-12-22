const Recruiter = require("../models/Recruiter");
const TeamMember = require("../models/TeamMember");
const { BadRequestError, NotFoundError, ForbiddenError } = require("../errors");
const cloudinary = require("../config/cloudinary");

// Helper to upload a base64 image string to Cloudinary
const uploadImage = async (base64Image) => {
  // If it's not a base64 string (e.g., already a URL), return it as is.
  if (!base64Image || !base64Image.startsWith("data:image")) {
    return base64Image;
  }
  try {
    const result = await cloudinary.uploader.upload(base64Image, {
      folder: "jobportal/company_profiles",
      resource_type: "image",
    });
    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error("Image upload failed");
  }
};

// GET Recruiter Profile (for logged-in recruiter or team member)
exports.getRecruiterProfile = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      throw new NotFoundError("User profile not found in token");
    }

    let userProfile;

    // Check if user is a team member (HRManager or team_member role)
    if (
      req.user.role === "HRManager" ||
      req.user.role === "team_member" ||
      req.user.recruiterId
    ) {
      // Fetch team member data
      const teamMember = await TeamMember.findById(req.user.id).select("-password");

      if (!teamMember) {
        throw new NotFoundError("Team member not found");
      }

      userProfile = teamMember.toObject();
      // Map role for display
      userProfile.role = "HR Manager";
    } else {
      // Fetch recruiter data from database
      const recruiter = await Recruiter.findById(req.user.id).select("-password");

      if (!recruiter) {
        throw new NotFoundError("Recruiter not found");
      }

      userProfile = recruiter.toObject();

      // Frontend `Company` type uses `name` for the company name.
      // Map the backend's `companyName` to `name` for compatibility.
      userProfile.name = userProfile.companyName;

      // Map role for display
      if (userProfile.role === "recruiter" && !userProfile.recruiterId) {
        userProfile.role = "Admin";
      } else if (userProfile.role === "team_member") {
        userProfile.role = "HR Manager";
      }
    }

    res.status(200).json({ success: true, recruiter: userProfile });
  } catch (err) {
    next(err);
  }
};

exports.upsertCompanyProfile = async (req, res, next) => {
  console.log("upsertCompanyProfile controller is called!!!");
  try {
    const recruiterId = req.user.id;
    let updates = req.body;

    // Map frontend's `name` (company name) back to `companyName` for the backend model.
    if (updates.name) {
      updates.companyName = updates.name;
      delete updates.name; // Avoid overwriting the recruiter's personal name
    }

    // Process image uploads (base64) by uploading to Cloudinary
    if (updates.bannerUrl) {
      updates.bannerUrl = await uploadImage(updates.bannerUrl);
    }
    if (updates.logoUrl) {
      updates.logoUrl = await uploadImage(updates.logoUrl);
    }
    if (updates.overview?.diversityInclusion?.imageUrl) {
      updates.overview.diversityInclusion.imageUrl = await uploadImage(
        updates.overview.diversityInclusion.imageUrl
      );
    }
    if (updates.overview?.communityEngagement?.images) {
      updates.overview.communityEngagement.images = await Promise.all(
        (updates.overview.communityEngagement.images || []).map((img) => uploadImage(img))
      );
    }
    if (updates.overview?.leaders) {
      updates.overview.leaders = await Promise.all(
        (updates.overview.leaders || []).map(async (leader) => ({
          ...leader,
          imageUrl: await uploadImage(leader.imageUrl),
        }))
      );
    }

    const updatedRecruiter = await Recruiter.findByIdAndUpdate(
      recruiterId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    const responseProfile = updatedRecruiter.toObject();
    responseProfile.name = responseProfile.companyName; // Map back for the response

    return res.status(200).json({
      success: true,
      message: "Company profile updated successfully",
      recruiter: responseProfile,
    });
  } catch (err) {
    next(err);
  }
};
