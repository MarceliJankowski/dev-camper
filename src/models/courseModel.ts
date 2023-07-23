// PACKAGES
import mongoose from "mongoose";

enum SkillLevel {
  BEGINNER = "beginner",
  INTERMEDIATE = "intermediate",
  ADVANCED = "advanced",
}

export interface ICourse {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  weeks: number;
  tuition: number;
  minimumSkill: SkillLevel;
  scholarshipAvailable: boolean;
  createdAt: number;
  bootcamp: mongoose.Types.ObjectId;
}

const courseSchema = new mongoose.Schema<ICourse>(
  {
    title: {
      type: String,
      trim: true,
      required: [true, "title is required"],
    },
    description: {
      type: String,
      required: [true, "description is required"],
      maxlength: [500, "description cannot exceed 500 characters"],
    },
    weeks: {
      type: Number,
      required: [true, "weeks field is required, please specify course duration"],
    },
    tuition: {
      type: Number,
      required: [true, "tuition is required"],
    },
    minimumSkill: {
      type: String,
      required: [true, "minimumSkill is required"],
      enum: {
        message: `provided minimumSkill is invalid`,
        values: [SkillLevel.BEGINNER, SkillLevel.INTERMEDIATE, SkillLevel.ADVANCED],
      },
    },
    scholarshipAvailable: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Number,
      default: Date.now,
      select: false,
    },
    bootcamp: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bootcamp",
      required: [true, "bootcamp is required"],
    },
  },
  {
    writeConcern: { w: "majority", j: true, wtimeout: 5000 },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    id: false,
  }
);

const Course = mongoose.model<ICourse>("Course", courseSchema);
export default Course;
