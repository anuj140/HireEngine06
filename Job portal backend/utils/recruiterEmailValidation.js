// const blockedDomains = [
//   // Popular free providers
//   "gmail",
//   "yahoo",
//   "hotmail",
//   "outlook",
//   "aol",
//   "icloud",
//   "protonmail",
//   "zoho",
//   "yandex",
//   "rediffmail",
//   "gmx",
//   "qq",
//   "mail",

//   // Disposable/temporary email providers
//   "tempmail",
//   "10minutemail",
//   "guerrillamail",
//   "mailinator",
//   "dispostable",
//   "fakeinbox",
//   "throwawaymail",
//   "getnada",
//   "yopmail",
//   "sharklasers",
//   "trashmail",
//   "mintemail",
// ];

// const blacklistedGroup = blockedDomains.join("|").replace(/\./g, "\\.");
// const companyEmailRegex = new RegExp(
//   `^[A-Za-z0-9._%+-]+@(?!(?:${blacklistedGroup})(?:\\.[A-Za-z]{2,})+$)[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$`,
//   "i"
// );

// const isCompanyEmail = (email) => {
//   return companyEmailRegex.test(email);
// };

// module.exports = isCompanyEmail;
