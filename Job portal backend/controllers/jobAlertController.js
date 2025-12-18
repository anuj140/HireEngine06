
const JobAlert = require("../models/JobAlert");
const { NotFoundError } = require("../errors");

exports.getAlerts = async (req, res) => {
  const alerts = await JobAlert.find({ user: req.user.id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: alerts });
};

exports.createAlert = async (req, res) => {
  const alert = await JobAlert.create({ ...req.body, user: req.user.id });
  res.status(201).json({ success: true, data: alert });
};

exports.updateAlert = async (req, res) => {
  const alert = await JobAlert.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    req.body,
    { new: true, runValidators: true }
  );
  if (!alert) throw new NotFoundError("Alert not found");
  res.status(200).json({ success: true, data: alert });
};

exports.deleteAlert = async (req, res) => {
  const alert = await JobAlert.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!alert) throw new NotFoundError("Alert not found");
  res.status(200).json({ success: true, message: "Alert deleted" });
};
