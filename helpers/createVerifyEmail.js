   const { BASE_URL } = process.env;

const createVerifyEmail = ({ email, verificationCode }) => {

   const verifyEmail = {
      to: email,
      subject: 'Verify email',
      html: `<a href="${BASE_URL}/api/users/verify/${verificationCode}" target="_blank">Click to verify email</a>`
   };
   return verifyEmail;
}

export default createVerifyEmail;