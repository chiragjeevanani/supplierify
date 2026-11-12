import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    configKey: {
      type: String,
      default: 'default_store_settings',
      unique: true,
      index: true
    },

    // 1. GST / Tax Configuration
    gstRate: {
      type: Number,
      default: 5, // 5% GST standard
      min: [0, 'GST rate cannot be negative'],
      max: [100, 'GST rate cannot exceed 100%']
    },

    // 1b. Wholesale rules
    minOrderQtyKg: {
      type: Number,
      default: 5, // Minimum kilograms per product line (a product can override this)
      min: [1, 'Minimum order quantity must be at least 1 kg']
    },
    // WhatsApp number (country code + number, digits only) used by the "Enquire on WhatsApp" buttons
    whatsappNumber: {
      type: String,
      trim: true,
      default: ''
    },
    // Opening line of every pre-typed WhatsApp message, e.g. "Hello Supplierfy"
    whatsappGreeting: {
      type: String,
      trim: true,
      maxlength: [120, 'WhatsApp greeting cannot exceed 120 characters'],
      default: 'Hello Supplierfy'
    },

    // 1c. Storefront branding (managed by the admin)
    logoUrl: { type: String, trim: true, default: '' },
    faviconUrl: { type: String, trim: true, default: '' },
    theme: {
      primary: { type: String, default: '#0E2A1B' },
      accent: { type: String, default: '#D4AF37' },
      background: { type: String, default: '#F7F3E9' },
      text: { type: String, default: '#182019' }
    },
    // Text size as a percentage of normal (100 = default), applied across the whole site
    fontScale: {
      type: Number,
      default: 100,
      min: [85, 'Text size cannot be below 85%'],
      max: [125, 'Text size cannot exceed 125%']
    },

    // 1d. Pay on credit (buy now, pay later) for regular customers
    creditEnabled: { type: Boolean, default: false },
    // Customers unlock credit once their paid orders add up to this amount (₹)
    creditEligibilityAmount: { type: Number, default: 50000, min: [0, 'Eligibility amount cannot be negative'] },
    // Credit limit every eligible customer gets (₹); can be overridden per customer
    creditLimit: { type: Number, default: 25000, min: [0, 'Credit limit cannot be negative'] },
    // Days a customer has to pay for a credit order
    creditDueDays: { type: Number, default: 30, min: [1, 'Due days must be at least 1'], max: [365, 'Due days cannot exceed 365'] },

    // 2. Delivery Configuration
    standardDeliveryFee: {
      type: Number,
      default: 150, // Online / prepaid delivery fee
      min: [0, 'Standard delivery fee cannot be negative']
    },
    codDeliveryFee: {
      type: Number,
      default: 150, // COD delivery fee
      min: [0, 'COD delivery fee cannot be negative']
    },
    freeDeliveryThreshold: {
      type: Number,
      default: 10000, // Free delivery for orders >= ₹10,000
      min: [0, 'Free delivery threshold cannot be negative']
    },

    // 3. Inventory Configuration
    lowStockThreshold: {
      type: Number,
      default: 30, // Products with <= 30 units trigger low-stock alert
      min: [0, 'Low stock threshold cannot be negative']
    },

    // 4. Warehouse & Logistics Hub Information
    warehouseName: {
      type: String,
      trim: true,
      default: 'Main Warehouse'
    },
    warehouseAddress: {
      type: String,
      trim: true,
      default: 'Warehouse Address'
    },
    warehouseCity: {
      type: String,
      trim: true,
      default: 'Mumbai'
    },
    warehouseState: {
      type: String,
      trim: true,
      default: 'Maharashtra'
    },
    warehousePincode: {
      type: String,
      trim: true,
      default: '400001'
    },
    warehousePhone: {
      type: String,
      trim: true,
      default: '+91 00000 00000'
    },
    hubAddress: {
      type: String,
      trim: true,
      default: 'Warehouse Address, Mumbai, Maharashtra - 400001'
    },

    // 5. Store Identity & Customer Support Information
    storeName: {
      type: String,
      trim: true,
      default: 'Dry Fruit Wholesale'
    },
    storeEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: 'support@example.com'
    },
    supportEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: 'support@example.com'
    },
    storePhone: {
      type: String,
      trim: true,
      default: '+91 00000 00000'
    },
    supportPhone: {
      type: String,
      trim: true,
      default: '+91 00000 00000'
    },
    storeAddress: {
      type: String,
      trim: true,
      default: 'Dry Fruit Wholesale, Warehouse Address, Mumbai, Maharashtra - 400001'
    },
    currency: {
      type: String,
      trim: true,
      default: '₹'
    },
    timezone: {
      type: String,
      trim: true,
      default: 'Asia/Kolkata'
    },

    // 6. Help & Support page (admin-managed, shown on Account + /help-support)
    helpSupport: {
      title: {
        type: String,
        trim: true,
        default: 'Help & Support'
      },
      subtitle: {
        type: String,
        trim: true,
        default:
          'Reach customer care or browse quick answers about orders, shipping, and payments.'
      },
      phone: {
        type: String,
        trim: true,
        default: '+91 00000 00000'
      },
      phoneHours: {
        type: String,
        trim: true,
        default: 'Mon–Sat, 9 AM – 6 PM'
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
        default: 'support@example.com'
      },
      emailNote: {
        type: String,
        trim: true,
        default: 'Reply within 24 hours'
      },
      writeTitle: {
        type: String,
        trim: true,
        default: 'Write to us'
      },
      writeLink: {
        type: String,
        trim: true,
        default: '/contact'
      },
      writeNote: {
        type: String,
        trim: true,
        default: 'Orders, refunds & feedback'
      },
      fullHelpLink: {
        type: String,
        trim: true,
        default: '/help-support'
      },
      faqs: {
        type: [
          {
            q: { type: String, trim: true, required: true },
            a: { type: String, trim: true, required: true }
          }
        ],
        default: () => [
          {
            q: 'How do I track my order?',
            a: 'Open My Orders and tap Track, or use the tracking link from your confirmation message.'
          },
          {
            q: 'What payment methods do you accept?',
            a: 'Pay online with UPI, cards, or net banking (Razorpay), or choose Cash on Delivery where available.'
          },
          {
            q: 'Can I cancel an order?',
            a: 'You can cancel from the order tracking page while the order is still Received, Accepted, or Packed.'
          },
          {
            q: 'How do I update my delivery address?',
            a: 'Go to Saved Addresses to add, edit, or set a default address before placing your next order.'
          },
          {
            q: 'My payment succeeded but I do not see an order.',
            a: 'Wait a few minutes and refresh My Orders. If it still does not appear, email support with your payment ID.'
          }
        ]
      }
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Ensure composite hubAddress stays consistent if individual warehouse components are updated
settingsSchema.pre('save', function (next) {
  if (this.isModified('warehouseName') || this.isModified('warehouseAddress') || this.isModified('warehouseCity') || this.isModified('warehouseState') || this.isModified('warehousePincode')) {
    if (!this.isModified('hubAddress') || !this.hubAddress) {
      this.hubAddress = `${this.warehouseName}, ${this.warehouseAddress}, ${this.warehouseCity}, ${this.warehouseState} - ${this.warehousePincode}`;
    }
  }
  // Sync supportEmail and storeEmail
  if (this.isModified('supportEmail') && !this.isModified('storeEmail')) {
    this.storeEmail = this.supportEmail;
  } else if (this.isModified('storeEmail') && !this.isModified('supportEmail')) {
    this.supportEmail = this.storeEmail;
  }
  // Sync supportPhone and storePhone
  if (this.isModified('supportPhone') && !this.isModified('storePhone')) {
    this.storePhone = this.supportPhone;
  } else if (this.isModified('storePhone') && !this.isModified('supportPhone')) {
    this.supportPhone = this.storePhone;
  }
  next();
});

export const Settings = mongoose.model('Settings', settingsSchema);
export default Settings;
