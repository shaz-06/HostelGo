const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: undefined
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
      enum: ["user", "admin", "rider", "customer"],
      default: "user"
    },
    addresses: [
      {
        label: { type: String },
        apartment: { type: String },
        room: { type: String },
        floor: { type: String },
        landmark: { type: String }
      }
    ],
    gender: {
      type: String,
      default: ""
    },
    dateOfBirth: {
      type: Date,
      default: null
    },
    avatar: {
      type: String,
      default: ""
    },
    profileCompleted: {
      type: Boolean,
      default: false
    },
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
    vehicleNumber: {
      type: String,
      trim: true,
      default: ""
    },
    riderStatus: {
      type: String,
      enum: ["Available", "Assigned", "Busy", "Delivered"],
      default: "Available"
    },
    assignedOrderId: {
      type: String,
      default: null,
      index: true
    },
    rating: {
      type: Number,
      default: 5.0
    },
    isOnline: {
      type: Boolean,
      default: false
    },
    isSuspended: {
      type: Boolean,
      default: false
    },
    fulfillmentStoreId: {
      type: String,
      default: ""
    },
    fulfillmentStoreName: {
      type: String,
      default: ""
    },
    riderCode: {
      type: String,
      default: ""
    },
    isActive: {
      type: Boolean,
      default: true
    },
    deletedAt: {
      type: Date,
      default: null
    },
    deletedBy: {
      type: String,
      default: ""
    },
    driversLicense: {
      type: String,
      default: ""
    },
    emergencyContact: {
      type: String,
      default: ""
    },
    joiningDate: {
      type: Date,
      default: null
    },
    notes: {
      type: String,
      default: ""
    },
    suspensionReason: {
      type: String,
      default: ""
    },
    suspendedBy: {
      type: String,
      default: ""
    },
    suspendedAt: {
      type: Date,
      default: null
    },
    suspensionNotes: {
      type: String,
      default: ""
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
    buyCoinsStats: {
      totalEarned: {
        type: Number,
        default: 0
      },
      totalRedeemed: {
        type: Number,
        default: 0
      },
      welcomeBonusClaimed: {
        type: Boolean,
        default: false
      }
    },
    buyCoinsLifetimeEarned: {
      type: Number,
      default: 0
    },
    buyCoinsRedeemed: {
      type: Number,
      default: 0
    },
    totalBuyCoinsEarned: {
      type: Number,
      default: 0
    },
    totalBuyCoinsSpent: {
      type: Number,
      default: 0
    },
    welcomeBonusGiven: {
      type: Boolean,
      default: false
    },
    referralCode: {
      type: String
    },
    referredBy: {
      type: String
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
    },
    fcmTokens: [
      {
        token: { type: String, required: true },
        platform: { type: String, default: "" },
        lastUsedAt: { type: Date, default: Date.now }
      }
    ],
    notificationPreferences: {
      orderUpdates: { type: Boolean, default: true },
      promotions: { type: Boolean, default: true },
      cartReminders: { type: Boolean, default: true },
      newOrderAlerts: { type: Boolean, default: true },
      riderAlerts: { type: Boolean, default: true },
      lowStockAlerts: { type: Boolean, default: true },
      newUserRegistrations: { type: Boolean, default: true }
    },
    cartHasItems: {
      type: Boolean,
      default: false
    },
    cartActivityAt: {
      type: Date,
      default: Date.now
    },
    cartReminderSent: {
      type: Boolean,
      default: false
    },
    isFounder: {
      type: Boolean,
      default: false
    },
    adminPin: {
      type: String,
      default: null
    },
    pinAttempts: {
      type: Number,
      default: 0
    },
    lockoutUntil: {
      type: Date,
      default: null
    },
    passwordChangedAt: {
      type: Date,
      default: null
    },
    passwordResetTokenHash: {
      type: String,
      default: null,
      index: true
    },
    passwordResetExpires: {
      type: Date,
      default: null,
      index: true
    },
    verificationTokenHash: {
      type: String,
      default: null,
      index: true
    },
    verificationTokenExpires: {
      type: Date,
      default: null,
      index: true
    },
    failedLoginAttempts: {
      type: Number,
      default: 0
    },
    accountLockedUntil: {
      type: Date,
      default: null,
      index: true
    },
    passwordHistory: [
      {
        hash: { type: String, required: true },
        changedAt: { type: Date, default: Date.now }
      }
    ]
  },
  {
    timestamps: true
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    if (typeof next === "function") return next();
    return;
  }
  try {
    this.password = await bcrypt.hash(this.password, 12);
    if (typeof next === "function") next();
  } catch (err) {
    if (typeof next === "function") next(err);
    else throw err;
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);