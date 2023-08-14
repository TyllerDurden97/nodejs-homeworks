import User from '../models/user.js';
import { HttpError, sendEmail, createVerifyEmail } from '../helpers/index.js';
import  ctrlWrapper  from '../decorators/cntrWrapper.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import gravatar from 'gravatar';
import path from 'path';
import fs from 'fs/promises';
import Jimp from 'jimp';
import {nanoid} from 'nanoid';

const { JWT_SECRET } = process.env;
const avatarPath = path.resolve("public", "avatars");

const signup = async (req, res) => {
   const { email, password, subscription } = req.body;
   const user = await User.findOne({ email });
   if (user) {
      throw HttpError(409, 'Email in use');
   }
   const hashPassword = await bcrypt.hash(password, 10);
   const verificationCode = nanoid();
   const avatarUrl = gravatar.url(email);

   const newUser = await User.create({ ...req.body, password: hashPassword, avatarUrl, subscription, verificationCode });
   const verifyEmail = createVerifyEmail({ email,  verificationCode});
   await sendEmail(verifyEmail);

   res.status(201).json({
      email: newUser.email,
      subscription: newUser.subscription,
      avatarUrl: newUser.avatarUrl,
   });
};

const verify = async (req, res) => {
   const { verificationCode } = req.params;
   const user = await User.findOne({ verificationCode });
   if (!user) {
      throw HttpError(404, `User not found`);
   }
   await User.findByIdAndUpdate(user._id, { verify: true, verificationCode: "" });
   res.json({
      message: 'Verification successful'
   })
}

const resendVerifyEmail = async (req, res) => {
   const { email} = req.body;
   const user = await User.findOne({ email });
   if (!user) {
      throw HttpError(404, 'Email not found');
   }
   if (user.verify) {
      throw HttpError(400, 'Verification has already been passed');
}
   const verifyEmail = createVerifyEmail({ email,  verificationCode: user.verificationCode});
   await sendEmail(verifyEmail);

   res.json({
      message: 'Verification email sent'
   });
}

const signin = async (req, res) => {
   const { email, password } = req.body;
   const user = await User.findOne({ email });
   if (!user) {
      throw HttpError(401, 'Email or password invalid');
   }
   if (!user.verify) {
      throw HttpError(401, 'Email not verify');
}

   const passwordCompare = await bcrypt.compare(password, user.password);
   if (!passwordCompare) {
      throw HttpError(401, 'Email or password invalid');
   }
   const payload = {
      id: user._id,
   }
   const token = jwt.sign(payload, JWT_SECRET, {expiresIn: '23h'});
   await User.findByIdAndUpdate(user._id, { token });
   res.json({
      token,
   })
};

const getCurrent = (req, res) => {
   const { email, subscription } = req.user;
   res.json({
      email,
      subscription,
   })
};

const signout = async (req, res) => {
   const { _id } = req.user;
   await User.findByIdAndUpdate(_id, { token: '' });

   res.status(204).json({
      message: 'No Content',
   });
};

const updateSubscription = async (req, res) => {
      const { _id } = req.user;
      const result = await User.findByIdAndUpdate(_id, { ...req.body }, {new: true});
      if (!result) {
         throw HttpError(404, `Contact with id=${_id} not found`);
      }
   res.json(result);
}; 

const updateAvatar = async (req, res) => {
   const { _id } = req.user;
   const { path: oldPath, filename } = req.file;
   const newPath = path.join(avatarPath, filename);
   Jimp.read(oldPath)
      .then(image => {
         return image
            .resize(250, 250)
            .write(newPath);
      })
      .catch(error => {
         console.error(error);
      });
   await fs.rename(oldPath, newPath);
   const avatarUrl = path.join("avatars", filename);
   await User.findByIdAndUpdate(_id, { avatarUrl });
   res.status(201).json(avatarUrl);
};


export default {
   signup: ctrlWrapper(signup),
   verify: ctrlWrapper(verify),
   resendVerifyEmail: ctrlWrapper(resendVerifyEmail),
   signin: ctrlWrapper(signin),
   getCurrent: ctrlWrapper(getCurrent),
   signout: ctrlWrapper(signout),
   updateSubscription: ctrlWrapper(updateSubscription),
   updateAvatar: ctrlWrapper(updateAvatar),
}