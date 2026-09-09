import jwt from "jsonwebtoken";

export function generateAccessToken(user) {
  return jwt.sign(
    {
      id: user._id.toString(),
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "2h",
    }
  );
}

export function sanitizeUser(user) {
  const data = user.toObject
    ? user.toObject()
    : { ...user };

  delete data.password;

  return data;
}
