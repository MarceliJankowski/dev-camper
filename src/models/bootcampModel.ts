// PACKAGES
import mongoose from "mongoose";
import validator from "validator";
import slugify from "slugify";

// PROJECT_MODULES
import { geocoder, IntentionalError } from "../utils";
import Course from "./courseModel";

enum Careers {
  WEB_DEV = "Web Development",
  MOBILE_DEV = "Mobile Development",
  UI_UX = "UI/UX",
  DATA_SCIENCE = "Data Science",
  BUSINESS = "Business",
  OTHER = "Other",
}

type CoordinatesTuple = [latitute: number, longitude: number];

interface LocationType {
  type: "Point";
  coordinates: CoordinatesTuple;
  formattedAddress: string;
  street: string;
  city: string;
  state: string;
  zipcode: string;
  country: string;
}

type OptionalBootcampFields = Partial<{
  slug: string;
  website: string;
  phone: string;
  averageRating: number;
  averageCost: number;
  address: string;
}>;

export interface BootcampType extends OptionalBootcampFields {
  _id: mongoose.Schema.Types.ObjectId;
  name: string;
  description: string;
  email: string;
  location: LocationType;
  careers: Careers[];
  housing: boolean;
  jobAssistance: boolean;
  jobGuarantee: boolean;
  acceptGi: boolean;
  photo: string;
  createdAt: number;
}

const bootcampSchema = new mongoose.Schema<BootcampType>(
  {
    name: {
      type: String,
      required: [true, "please add a name"],
      unique: true,
      trim: true,
      maxlength: [50, "name can't exceed 50 character's"],
    },
    slug: {
      type: String,
    },
    description: {
      type: String,
      required: [true, "please add description"],
      maxlength: [500, "description cannot be more than 500 characters"],
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
        message: "please provide valid url",
      },
    },
    phone: {
      type: String,
      maxlength: [20, "phone number can not exceed 20 characters"],
    },
    email: {
      type: String,
      required: [true, "please add an email"],
      lowercase: true,
      trim: true,
      validate: {
        validator: validator.isEmail,
        message: "please provide a valid email",
      },
    },
    address: {
      type: String,
      // user is required to provide the address so that geocoder can parse it. Address isn't saved to the database though
      required: [true, "Please add an address"],
    },
    location: {
      type: {
        type: String,
        default: "Point",
        enum: {
          values: ["Point"],
          message: "location can only be Point",
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
      required: true,
      enum: {
        values: [
          Careers.WEB_DEV,
          Careers.BUSINESS,
          Careers.DATA_SCIENCE,
          Careers.UI_UX,
          Careers.MOBILE_DEV,
          Careers.OTHER,
        ],
        message: "please provide valid bootcamp career",
      },
    },
    averageRating: {
      type: Number,
      min: [1, "rating must abe at least 1"],
      max: [10, "rating can not exceed 10"],
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
    writeConcern: { w: "majority", j: true, wtimeout: 1000 },
    id: false,
    // keep virtual fields when either of these methods are used
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// VIRTUALS

bootcampSchema.virtual("courses", {
  ref: "Course",
  localField: "_id",
  foreignField: "bootcamp",
});

// MIDDLEWARES

// generate slug from document name
bootcampSchema.pre("save", function (this: BootcampType, next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// parse address into location data and delete address field
bootcampSchema.pre("save", async function (this: BootcampType, next) {
  const [{ longitude, latitude, formattedAddress, streetName, city, stateCode, zipcode, countryCode }] =
    await geocoder.geocode(this.address as string);

  if (
    !formattedAddress ||
    !latitude ||
    !longitude ||
    !streetName ||
    !city ||
    !stateCode ||
    !zipcode ||
    !countryCode
  ) {
    next(new IntentionalError(`couldn't parse address: ${this.address}`, 400));
    return;
  }

  // save location into database
  this.location = {
    type: "Point",
    coordinates: [longitude, latitude],
    street: streetName,
    state: stateCode,
    country: countryCode,
    formattedAddress,
    zipcode,
    city,
  };

  // don't persist address to the database because after parsing it, it's redundant
  this.address = undefined;

  next();
});

// cascade delete courses when bootcamp is deleted
bootcampSchema.pre("remove", async function (this: BootcampType, next) {
  await Course.deleteMany({ bootcamp: this._id });
  next();
});

const Bootcamp = mongoose.model<BootcampType>("Bootcamp", bootcampSchema);
export default Bootcamp;
