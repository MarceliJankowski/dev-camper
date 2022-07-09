// PACKAGES
import mongoose from "mongoose";

enum SkillLevels {
  BEGINNER = "beginner",
  INTERMEDIATE = "intermediate",
  ADVANCED = "advanced",
}

export interface CourseType {
  _id: mongoose.Schema.Types.ObjectId;
  title: string;
  description: string;
  weeks: number;
  tuition: number;
  minimumSkill: SkillLevels;
  scholarshipAvailable: boolean;
  createdAt: number;
  bootcamp: mongoose.Schema.Types.ObjectId;
}

const courseSchema = new mongoose.Schema<CourseType>(
  {
    title: {
      type: String,
      trim: true,
      required: [true, "please add title"],
    },
    description: {
      type: String,
      trim: true,
      required: [true, "please add description"],
    },
    weeks: {
      type: Number,
      required: [true, "please add number of weeks the course takes"],
    },
    tuition: {
      type: Number,
      required: [true, "please add tuition cost"],
    },
    minimumSkill: {
      type: String,
      required: [true, "please add minimumSkill"],
      enum: {
        values: [SkillLevels.BEGINNER, SkillLevels.INTERMEDIATE, SkillLevels.ADVANCED],
        message: `please supply valid minimumSkill value: ${SkillLevels.BEGINNER}, ${SkillLevels.INTERMEDIATE}, ${SkillLevels.ADVANCED}`,
      },
    },
    scholarshipAvailable: {
      type: Boolean,
      default: false,
      required: false,
    },
    createdAt: {
      type: Number,
      required: false,
      default: Date.now,
      select: false,
    },
    bootcamp: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bootcamp",
      required: [true, "course always belongs to some bootcamp, please provide one"],
    },
  },
  {
    writeConcern: { w: "majority", j: true, wtimeout: 1000 },
    id: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const Course = mongoose.model<CourseType>("Course", courseSchema);
export default Course;
