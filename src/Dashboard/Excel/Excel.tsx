import * as XLSX from "xlsx";

interface ExcelExporterProps {
  data: any[];
  columns: { title: string; dataIndex: string }[];
  fileName?: string;
  sheetName?: string;
  tableTitle?: string;
}

export const exportToExcel = ({
  data,
  columns,
  fileName = "table_data.xlsx",
  sheetName = "TableData",
  tableTitle = "Exported Table Data",
}: ExcelExporterProps) => {
  if (!data || data.length === 0) {
    console.warn("No data available to export.");
    return;
  }

  // Add an index column
  const indexedData = data.map((row, index) => ({
    // "#": index + 1, // Add the index column
    ...columns.reduce((acc, col) => {
      acc[col.title] = row[col.dataIndex];
      return acc;
    }, {}),
  }));

  // Create a worksheet
  const worksheet = XLSX.utils.json_to_sheet([], { skipHeader: true });

  // Add table title as the first row
  XLSX.utils.sheet_add_aoa(worksheet, [[tableTitle]], { origin: "A1" });

  // Merge cells for the title
  const titleRange = XLSX.utils.encode_range({
    s: { c: 0, r: 0 }, // Start cell (column 0, row 0)
    e: { c: columns.length, r: 0 }, // End cell (last column + 1 for index, row 0)
  });
  worksheet["!merges"] = worksheet["!merges"] || [];
  worksheet["!merges"].push(XLSX.utils.decode_range(titleRange));

  // Add column headers as the second row
  const columnHeaders = [...columns.map((col) => col.title)];
  XLSX.utils.sheet_add_aoa(worksheet, [columnHeaders], { origin: "A2" });

  // Add indexed data starting from the third row
  XLSX.utils.sheet_add_json(worksheet, indexedData, {
    origin: "A3",
    skipHeader: true,
  });

  // Style the table title
  worksheet["A1"].s = {
    font: { bold: true, sz: 16 },
    alignment: { horizontal: "center", vertical: "center" },
  };

  // Style the column headers
  columnHeaders.forEach((_, index) => {
    const cellAddress = XLSX.utils.encode_cell({ r: 1, c: index }); // Row 1 (second row in Excel) for headers
    if (worksheet[cellAddress]) {
      worksheet[cellAddress].s = {
        font: { bold: true },
        alignment: { horizontal: "center", vertical: "center" },
      };
    }
  });

  // Apply column widths
  worksheet["!cols"] = [
    { wch: 5 }, // Width for the index column
    ...columns.map(() => ({ wch: 20 })), // Width for each data column
  ];

  // Increase row height
  worksheet["!rows"] = worksheet["!rows"] || [];
  worksheet["!rows"][0] = { hpx: 30 }; // Title row height
  worksheet["!rows"][1] = { hpx: 20 }; // Header row height
  for (let i = 2; i < indexedData.length + 3; i++) {
    worksheet["!rows"].push({ hpx: 18 }); // Data row height
  }

  // Create a workbook and append the worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Trigger download
  XLSX.writeFile(workbook, fileName);
};
