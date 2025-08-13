export const findOne = async ({
  model,
  filter = {},
  select = "",
  populate = [],
} = {}) => {
  return await model.findOne(filter).select(select).populate(populate);
};
export const find = async ({
  model,
  filter = {},
  select = "",
  populate = [],
  sort = {},
  skip = 0,
  limit = 0,
} = {}) => {
  const [data, total] = await Promise.all([
    model
      .find(filter)
      .select(select)
      .populate(populate)
      .sort(sort)
      .skip(skip)
      .limit(limit),
    model.countDocuments(filter),
  ]);

  return { data, total };
};

export const count = async ({
  model,
  filter = {}
} = {}) => {
  return await model.countDocuments(filter);
};

export const findById = async ({
  model,
  id,
  select = "",
  populate = [],
} = {}) => {
  return await model.findById(id).select(select).populate(populate);
};

export const create = async ({
  model,
  data = [{}],
  options = { ValidatBeforeSave: true },
} = {}) => {
  return await model.create(data, options);
};

export const updateOne = async ({
  model,
  filter,
  data = {},
  options = { runValidators: true },
} = {}) => {
  return await model.updateOne(filter, data, options);
};

export const findOneAndUpdate = async ({
  model,
  filter = {},
  data = {},
  options = { runValidators: true, new: true },
  select = "",
  populate = [],
} = {}) => {
  return await model
    .findOneAndUpdate(
      filter,
      {
        ...data,
        $inc: { __v: 1 },
      },
      options
    )
    .select(select)
    .populate(populate);
};

export const findOneAndDelete = async ({
  model,
  filter = {},
  select = "",
  populate = [],
} = {}) => {
  return await model
    .findOneAndDelete(filter)
    .select(select)
    .populate(populate);
};


export const deleteOne = async ({ model, filter = {} } = {}) => {
  return await model.deleteOne(filter);
};

export const deleteMany = async ({ model, filter = {} } = {}) => {
  return await model.deleteMany(filter);
};
