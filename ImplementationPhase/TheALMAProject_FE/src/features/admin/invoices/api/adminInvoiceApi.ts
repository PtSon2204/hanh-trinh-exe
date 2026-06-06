import axiosClient from "../../../../shared/api/axiosClient";
import type { PagedResult } from "../../../../shared/types/pagination";
import type {
  AdminFinancialReportDto,
  AdminFinancialReportQuery,
  AdminInvoiceDto,
  AdminInvoiceListDto,
  AdminInvoiceQuery,
} from "../types/adminInvoice";

const adminInvoicePath = "/admin/invoices";

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export const adminInvoiceApi = {
  getInvoices(params: AdminInvoiceQuery = {}) {
    return axiosClient
      .get<PagedResult<AdminInvoiceListDto>>(adminInvoicePath, { params })
      .then((res) => res.data);
  },

  getInvoiceById(id: number) {
    return axiosClient
      .get<AdminInvoiceDto>(`${adminInvoicePath}/${id}`)
      .then((res) => res.data);
  },

  async downloadInvoice(id: number, invoiceNumber: string) {
    const response = await axiosClient.get<Blob>(`${adminInvoicePath}/${id}/download`, {
      responseType: "blob",
    });
    downloadBlob(response.data, `HoaDon_TheAlma_${invoiceNumber || id}.pdf`);
  },

  async exportInvoices(params: AdminInvoiceQuery = {}) {
    const response = await axiosClient.get<Blob>(`${adminInvoicePath}/export`, {
      params,
      responseType: "blob",
    });
    downloadBlob(response.data, "admin-invoices.csv");
  },

  getFinancialReport(params: AdminFinancialReportQuery) {
    return axiosClient
      .get<AdminFinancialReportDto[]>("/admin/reports/financial", { params })
      .then((res) => res.data);
  },

  async exportFinancialReport(params: AdminFinancialReportQuery) {
    const response = await axiosClient.get<Blob>("/admin/reports/financial/export", {
      params,
      responseType: "blob",
    });
    downloadBlob(response.data, "admin-financial-report.csv");
  },
};
