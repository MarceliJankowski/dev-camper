// PACKAGES
import { Query } from "mongoose";
import { Request } from "express";

export const DEFAULT_SORT_BY = "-createdAt";
export const DEFAULT_FIELDS = "-__v";
export const DEFAULT_LIMIT = 10;
export const DEFAULT_PAGE = 1;

export type ReqQuery = Request["query"];
type ReqQueryProperty = ReqQuery[keyof ReqQuery];

/**@desc interface enabling: `sorting`, `filtering`, `pagination` and `projection`
@param cursor object returned from mongoose `Collection.find()` method
@param query `req.query` property*/
export class FeatureQuery<DocType extends object> {
  constructor(
    public readonly cursor: Query<Partial<DocType>[], DocType>,
    private readonly reqQuery: ReqQuery
  ) {}

  /**@desc enables usage of cherry-picked mongo operators by mutating `query` param*/
  private enableMongoOperators(query: ReqQuery): void {
    (function prefixMongoOperatorsWithDolarSign(queryProp: ReqQueryProperty): void {
      if (Array.isArray(queryProp)) {
        for (let i = 0; i < queryProp.length; i++) prefixMongoOperatorsWithDolarSign(queryProp[i]);
        return;
      }

      if (typeof queryProp === "object") {
        for (const key in queryProp) {
          if (/^(?:gt|lt|gte|lte|in)$/.test(key)) {
            queryProp["$" + key] = queryProp[key]; // express-mongo-sanitize middleware already removed '$' from req.query (which renders key collision impossible)
            delete queryProp[key]; // I'm aware of performance hit that 'delete' keyword can cause, however in this instance I don't think it'll be a problem
          }

          prefixMongoOperatorsWithDolarSign(queryProp[key]);
        }
      }
    })(query);
  }

  /**@desc allows user to specify how documents should be filtered. It:
  - Enables usage of: `'gt'`, `'lt'`, `'gte'`, `'lte'` and `'in'` MongoDB operators
  - Disables filtering with: `'sort'`, `'fields'`, `'page'` and `'limit'` query params (these are reserved for other features)*/
  addFiltering(): this {
    const preparedReqQuery = {
      ...this.reqQuery,

      // disabling reserved query params
      sort: undefined,
      fields: undefined,
      page: undefined,
      limit: undefined,
    };

    this.enableMongoOperators(preparedReqQuery);

    this.cursor.find(preparedReqQuery);

    return this;
  }

  /**@desc allows user to specify how documents should be sorted
  @param defaultSortBy defaults to '-createdAt'. User can overwrite this by specifying `sort` query param*/
  addSorting(defaultSortBy = DEFAULT_SORT_BY): this {
    // mongoose expects spaces instead of commas
    const sortBy =
      typeof this.reqQuery.sort === "string" ? this.reqQuery.sort.replace(/,/g, " ") : defaultSortBy;

    this.cursor.sort(sortBy);

    return this;
  }

  /**@desc allows user to specify which document fields he wants to receive (or omit)
  @param defaultFields defaults to `-__v`. User can overwrite this by specifying `fields` query param*/
  addProjection(defaultFields = DEFAULT_FIELDS): this {
    // mongoose expects spaces instead of commas
    const fields =
      typeof this.reqQuery.fields === "string" ? this.reqQuery.fields.replace(/,/g, " ") : defaultFields;

    this.cursor.select(fields);

    return this;
  }

  /**@desc allows user to specify how many documents should there be within each page and which page he wants to receive
  @param defaultLimit defaults to `10` documents. User can overwrite this by specifying `limit` query param
  @param defaultPage defaults to `first` page. User can overwrite this by specifying `page` query param*/
  addPagination(defaultLimit = DEFAULT_LIMIT, defaultPage = DEFAULT_PAGE): this {
    const limit = Number(this.reqQuery.limit) || defaultLimit;
    const page = Number(this.reqQuery.page) || defaultPage;

    const documentsToSkip = (page - 1) * limit;

    this.cursor.skip(documentsToSkip).limit(limit);

    return this;
  }

  /**@desc applies all features (with default parameters)*/
  addAllFeatures(): this {
    return this.addFiltering().addPagination().addProjection().addSorting();
  }

  /**@desc executes `FeatureQuery` / awaits `cursor`*/
  async execute() {
    return await this.cursor;
  }
}
