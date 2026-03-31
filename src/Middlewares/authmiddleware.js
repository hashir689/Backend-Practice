import { asyncHandler } from "../utils/asyncHandler";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  const Token =
    req.cookies.accessToken ||
    req.header("Authorization")?.replace("Bearer " + "");
});
