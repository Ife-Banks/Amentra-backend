const defaultLimit = parseInt(process.env.PAGINATION_DEFAULT_LIMIT || '20', 10);

export const paginateQuery = async (model, filter, options = {}) => {
  const page = Math.max(1, parseInt(options.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(options.limit, 10) || defaultLimit));
  const sort = options.sort || { createdAt: -1 };
  const skip = (page - 1) * limit;
  let query = model.find(filter).sort(sort).skip(skip).limit(limit);
  if (options.select) query = query.select(options.select);
  if (options.populate && (Array.isArray(options.populate) ? options.populate.length : options.populate)) query = query.populate(options.populate);
  const [docs, total] = await Promise.all([query.lean(), model.countDocuments(filter)]);
  const pages = Math.ceil(total / limit) || 1;
  return { docs, total, page, pages, limit };
};
