import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../Models/user.model.js";
import { UploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
const registerUser = asyncHandler(async (req, res) => {
  const { fullname, email, username, password } = req.body;
  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All Fields are required");
  }

  const existedUser = await User.findOne({ $or: [{ username }, { email }] }); // we check two fields in one array
  if (existedUser) {
    throw new ApiError(409, "User with email or username already exist");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar File is required");
  }

  const avatar = await UploadOnCloudinary(avatarLocalPath);
  const coverImage = await UploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar File is required");
  }

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  ); // by default all fields are select we use - and name of field to exclude the field because we dont want to get reponse to user with password and refresttoken
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  // return res.status(201).json({createdUser}); // this code also word but we follow structure so we use ApiResponse
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Registered Successfully"));
});

const generateRefreshandAccessToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    //console.log(user + "generate user token");
    const accessToken = user.generateAccessToken();

    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;

    const savedUser = await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (Error) {
    throw new ApiError(
      400,
      "Something went wrong with generating refresh and access token" +
        Error.message
    );
  }
};

const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  if (!(username || email)) {
    throw new ApiError(400, "username or email required");
  }
  const user = await User.findOne({ $or: [{ email }, { username }] });
  if (!user) {
    throw new ApiError(400, "Please register first");
  }
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Password does not match");
  }
  const { refreshToken, accessToken } = await generateRefreshandAccessToken(
    user._id
  );

  const LoggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: LoggedInUser,
          accessToken,
          refreshToken,
        },
        "Login in Successfully"
      )
    );
});
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true, //its means now you will get new changes when you request
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incommingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;
    if (!incommingRefreshToken) {
      throw new ApiError(400, "Refresh token is required");
    }
    const decodedToken = jwt.verify(
      incommingRefreshToken,
      process.env.REFRESH_TOKEN_SECRETE
    );
    const user = await User.findById(decodedToken._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }
    if (incommingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }
    const options = {
      httpOnly: true,
      secure: true,
    };
    const { accessToken, newRefreshToken } =
      await generateRefreshandAccessToken(user._id);
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(200, {
          accessToken,
          refreshToken: new newRefreshToken(),
        })
      );
  } catch (error) {
    throw new ApiError(401, error.message);
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id);
  const ispasswordCorrect = await user.ispasswordCorrect(oldPassword);
  if (!ispasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(200, req.user, "Current userFetch Successfully");
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;
  if (!fullname || !email) {
    throw new ApiError(400, "All fields are required");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname: fullname,
        email: email,
      },
    },
    {
      new: true,
    }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfuly"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }
  const avatar = await UploadOnCloudinary(avatarLocalPath);
  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading on avatar");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "avatar updated successfully"));
});

const updateUsercoverAvatar = asyncHandler(async (req, res) => {
  const converAvatarLocalPath = req.file?.path;
  if (!converAvatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }
  const converAvatar = await UploadOnCloudinary(converAvatarLocalPath);
  if (!converAvatar.url) {
    throw new ApiError(400, "Error while uploading on avatar");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        converAvatar: converAvatar.url,
      },
    },
    { new: true }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover Image updated successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUsercoverAvatar,
};
