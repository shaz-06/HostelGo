const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    password: {
      type: String,
      required: false
    },
    role: {
      type: String,
      enum: ["user", "admin", "rider"],
      default: "user"
    },
    addresses: [
      {
        type: String
      }
    ],
    latitude: {
      type: Number,
      default: null
    },
    longitude: {
      type: Number,
      default: null
    },
    vehicleType: {
      type: String,
      trim: true,
      default: ""
    },
    isOnline: {
      type: Boolean,
      default: false
    },
    isSuspended: {
      type: Boolean,
      default: false
    },
    currentLocation: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      address: { type: String, default: "" }
    },
    totalDeliveries: {
      type: Number,
      default: 0
    },
    totalEarnings: {
      type: Number,
      default: 0
    },
    todayEarnings: {
      type: Number,
      default: 0
    },
    weeklyEarnings: {
      type: Number,
      default: 0
    },
    profileImage: {
      type: String,
      default: ""
    },
    aadhaarVerified: {
      type: Boolean,
      default: false
    },
    drivingLicenseVerified: {
      type: Boolean,
      default: false
    },
    buyCoins: {
      type: Number,
      default: 0
    },
    buyCoinsLifetimeEarned: {
      type: Number,
      default: 0
    },
    buyCoinsRedeemed: {
      type: Number,
      default: 0
    },
    savedLists: [
      {
        name: { type: String, required: true },
        items: [
          {
            name: { type: String, required: true },
            completed: { type: Boolean, default: false }
          }
        ]
      }
    ],
    savedProducts: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product"
        },
        addedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    fcmToken: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);