export type IsoDateString = string;

export type Decimal = number;

export type OrderStatus = string;

export type PaymentStatus = string;

export type InvoiceStatus = string;

export type UserRole = string;

export interface DateRangeQuery {
  fromDate?: IsoDateString;
  toDate?: IsoDateString;
}

export interface PaginationQuery {
  pageNumber?: number;
  pageSize?: number;
}
