export const attachTenant = (req, res, next) => {
  if (req.user && req.user.institutionId) {
    req.institutionId = req.user.institutionId;
  }
  next();
};
