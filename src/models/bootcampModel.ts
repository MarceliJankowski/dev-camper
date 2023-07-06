// PACKAGES
import mongoose from "mongoose";
import validator from "validator";

enum Career {
  WEB_DEV = "Web Development",
  MOBILE_DEV = "Mobile Development",
  UI_UX = "UI/UX",
  DATA_SCIENCE = "Data Science",
  BUSINESS = "Business",
  OTHER = "Other",
}

interface ILocation {
  type: "Point";
  coordinates: [longitude: number, latitude: number];
  formattedAddress: string;
  street: string;
  city: string;
  state: string;
  zipcode: string;
  country: string;
}

type OptionalBootcampFields = Partial<{
  website: string;
  phone: string;
  averageRating: number;
  averageCost: number;
  address: string; // ephemeral field
}>;

interface IBootcamp extends OptionalBootcampFields {
  name: string;
  slug: string;
  description: string;
  email: string;
  location: ILocation;
  careers: Career[];
  photo: string;
  housing: boolean;
  jobAssistance: boolean;
  jobGuarantee: boolean;
  acceptGi: boolean;
  createdAt: number;
}

const bootcampSchema = new mongoose.Schema<IBootcamp>(
  {
    name: {
      type: String,
      required: [true, "name is required"],
      unique: true,
      trim: true,
      maxlength: [50, "name cannot exceed 50 characters"],
      minlength: [6, "name minimum length is 6"],
    },
    slug: {
      // slug is automatically generated from 'name' field
      type: String,
    },
    description: {
      type: String,
      required: [true, "description is required"],
      maxlength: [500, "description cannot exceed 500 characters"],
    },
    website: {
      type: String,
      validate: {
        validator: (value: string) =>
          validator.isURL(value, {
            require_protocol: true,
            require_valid_protocol: true,
            protocols: ["https", "http"],
          }),
        message: "provided website is invalid",
      },
    },
    phone: {
      type: String,
      maxlength: [20, "phone cannot exceed 20 characters"],
    },
    email: {
      type: String,
      required: [true, "email is required"],
      lowercase: true,
      trim: true,
      validate: {
        validator: (value: string) => validator.isEmail(value),
        message: "provided email is invalid",
      },
    },
    address: {
      type: String,
      // address won't be saved to the database, it's required so that geocoder can parse it into location data
      required: [true, "address is required"],
    },
    location: {
      type: {
        type: String,
        default: "Point",
        enum: {
          values: ["Point"],
          message: "location.type has to be a 'Point'",
        },
      },
      coordinates: {
        type: [Number],
        index: "2dsphere",
      },
      formattedAddress: String,
      street: String,
      city: String,
      state: String,
      zipcode: String,
      country: String,
    },
    careers: {
      type: [String],
      required: [true, "careers field requires at least one career, please specify it"],
      enum: {
        message: "provided career is invalid",
        values: [
          Career.WEB_DEV,
          Career.BUSINESS,
          Career.DATA_SCIENCE,
          Career.UI_UX,
          Career.MOBILE_DEV,
          Career.OTHER,
        ],
      },
    },
    averageRating: {
      type: Number,
      min: [1, "rating minimum is 1"],
      max: [10, "rating cannot exceed 10"],
    },
    averageCost: {
      type: Number,
    },
    photo: {
      type: String,
      default: "default.png",
    },
    housing: {
      type: Boolean,
      default: false,
    },
    jobAssistance: {
      type: Boolean,
      default: false,
    },
    jobGuarantee: {
      type: Boolean,
      default: false,
    },
    acceptGi: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Number,
      select: false,
      default: Date.now,
    },
  },
  {
    writeConcern: { w: "majority", j: true, wtimeout: 5000 },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const Bootcamp = mongoose.model<IBootcamp>("Bootcamp", bootcampSchema);
export default Bootcamp;
