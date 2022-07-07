// PACKAGES
import { Query } from "mongoose";

export interface QueryObject {
  [key: string]: any;
}

/**Constructor holding methods which enable: sorting, pagination and projection
@cursor is the object which is returned from "find" mongodb method
@query is req.query property*/
export default class ApiFeatures<DocType extends object> {
  constructor(public readonly cursor: Query<any, DocType>, private readonly query: QueryObject) {
    this.cursor = cursor;
    this.query = query;
  }

  /**transform query to:
  - exclude [page, sort, limit, fields] query params from being used in cursor.find(). Which in turn enables their usage for api features
  - enable usage of [gt, lt, gte, lte, in] mongodb operators for the queryParams*/
  transform(): ApiFeatures<DocType> {
    const queryShallowCopy = { ...this.query };
    const possibleQueryParams = ["page", "sort", "limit", "fields"];

    // remove possibleQueryParams from queryShallowCopy so that they're omitted from cursor.find() method
    possibleQueryParams.forEach(queryParam => delete queryShallowCopy[queryParam]);

    // enable usage of some mongodb operators (JSON.{stringify, parse} are slowing down JS engine just like "delete" keyword)
    const queryString = JSON.stringify(queryShallowCopy).replace(
      /\b(?:gt|lt|gte|lte|in)\b/g,
      match => "$" + match
    );

    const queryObj = JSON.parse(queryString);

    this.cursor.find(queryObj);

    return this;
  }

  /**specify how to sort query results
  @param defaultSortBy specifies how to sort documents (defaults to -createdAt). User can overwrite it with 'sort' queryParam*/
  sort(defaultSortBy: string = "-createdAt"): ApiFeatures<DocType> {
    // transform comas into spaces because that's the expected format by mongoose
    const sortBy = this.query.sort?.replace(/,/g, " ") ?? defaultSortBy;

    this.cursor.sort(sortBy);

    return this;
  }

  /**apply projection. User can decide which fields from document he want's to get back
  @defaultProjection projection string which is used by default (defaults to -__v). User can overwrite it by providing 'fields' queryParam*/
  project(defaultProjection: string = "-__v"): ApiFeatures<DocType> {
    // transform comas into spaces because that's the expected format by mongoose
    const fields = this.query.fields?.replace(/,/g, " ") ?? defaultProjection;

    this.cursor.select(fields);

    return this;
  }

  /**add pagination. Allow user to decide how many documents there should be within each page and which page he want's to receive.
  @param defaultQuantity quantity of documents within each page (defaults to 10). User can overwrite this value with 'limit' queryParam
  @param defaultPage specify which page should be returned (defaults to 1). User can overwrite this value with 'page' queryParam*/
  paginate(defaultQuantity: number = 10, defaultPage: number = 1): ApiFeatures<DocType> {
    const limit = Number(this.query.limit) || defaultQuantity;
    const page = Number(this.query.page) || defaultPage;

    const documentsToSkip = (page - 1) * limit;

    this.cursor.skip(documentsToSkip).limit(limit);

    return this;
  }

  /**apply all apiFeatures (with default parameters) to cursor object*/
  allFeatures(): Query<any, DocType> {
    return this.transform().paginate().project().sort().cursor;
  }
}
