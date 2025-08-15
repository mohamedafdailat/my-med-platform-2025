const Joi = require('joi');

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  displayName: Joi.string().required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const flashcardSchema = Joi.object({
  front: Joi.object({
    fr: Joi.string().required(),
    ar: Joi.string().required(),
  }).required(),
  back: Joi.object({
    fr: Joi.string().required(),
    ar: Joi.string().required(),
  }).required(),
});

const validateRequest = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};

module.exports = { validateRequest, registerSchema, loginSchema, flashcardSchema };