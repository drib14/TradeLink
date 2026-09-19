const Joi = require('joi');
const { CAMPUSES } = require('../config/constants');

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Full name is required.',
    'string.min': 'Name must be at least 2 characters.'
  }),
  studentId: Joi.string().trim().pattern(/^\d{6,20}$/).required().messages({
    'string.pattern.base': 'Student ID must contain between 6 and 20 digits with no hyphens or letters.',
    'string.empty': 'Student ID is required.'
  }),
  email: Joi.string().trim().email().required().messages({
    'string.email': 'Please provide a valid email address.',
    'string.empty': 'Email is required.'
  }),
  password: Joi.string().min(8).max(100)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long.',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number.',
      'string.empty': 'Password is required.'
    }),
  campus: Joi.string().valid(...CAMPUSES).required().messages({
    'any.only': 'Please select a valid University of Cebu campus.'
  }),
  college: Joi.string().trim().max(50).required().messages({
    'string.empty': 'College / Department is required.'
  }),
  yearLevel: Joi.string().trim().max(50).required().messages({
    'string.empty': 'Year level is required.'
  }),
  avatar: Joi.string().uri().allow('', null),
  idPhotoUrl: Joi.string().uri().allow('', null)
});

const loginSchema = Joi.object({
  studentId: Joi.string().trim(),
  idNumber: Joi.string().trim(),
  emailOrStudentId: Joi.string().trim(),
  identifier: Joi.string().trim(),
  email: Joi.string().trim(),
  password: Joi.string().required().messages({
    'string.empty': 'Please enter your password.'
  })
}).or('studentId', 'idNumber', 'emailOrStudentId', 'identifier', 'email').messages({
  'object.missing': 'Please enter your Student ID number.'
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().trim().email().required().messages({
    'string.email': 'Please enter a valid email address.',
    'string.empty': 'Email address is required.'
  })
});

const resetPasswordSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  code: Joi.string().trim().length(6).required().messages({
    'string.length': 'Verification code must be 6 digits.'
  }),
  newPassword: Joi.string().min(8).max(100)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'New password must be at least 8 characters.',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number.'
    })
});

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  bio: Joi.string().trim().max(1000).allow(''),
  avatar: Joi.string().uri().allow('', null),
  campus: Joi.string().valid(...CAMPUSES),
  college: Joi.string().trim().max(50),
  yearLevel: Joi.string().trim().max(50)
});

const adminLoginSchema = Joi.object({
  email: Joi.string().trim().required().messages({
    'string.empty': 'Administrator email or ID is required.'
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Administrator password is required.'
  })
});

const adminForgotPasswordSchema = Joi.object({
  email: Joi.string().trim().email().required().messages({
    'string.email': 'Please enter a valid administrator email address.',
    'string.empty': 'Administrator email is required.'
  })
});

const adminResetPasswordSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  code: Joi.string().trim().length(6).required().messages({
    'string.length': 'Verification code must be 6 digits.'
  }),
  newPassword: Joi.string().min(10).max(100)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
    .required()
    .messages({
      'string.min': 'Admin password must be at least 10 characters long.',
      'string.pattern.base': 'Admin password must contain at least one uppercase letter, one lowercase letter, one number, and one special symbol.'
    })
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  adminLoginSchema,
  adminForgotPasswordSchema,
  adminResetPasswordSchema
};

