import axiosClient from "../../../../shared/api/axiosClient";
import type {
  AdminFinancialReportDto,
  AdminFinancialReportQuery,
} from "../types/adminInvoice";

export const adminInvoiceApi = {
  getFinancialReport(params: AdminFinancialReportQuery) {
    return axiosClient
      .get<AdminFinancialReportDto[]>("/admin/reports/financial", { params })
      .then((res) => res.data);
  },
};
