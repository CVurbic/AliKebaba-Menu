import React, { useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useDropzone } from "react-dropzone";
import { supabase } from "../supabaseClient";
import { MenuItem } from "./MenuSection";
import {
  Download,
  Upload,
  AlertCircle,
  CheckCircle2,
  X,
  FileSpreadsheet,
  Eye,
  EyeOff,
} from "lucide-react";

interface ExcelImportExportProps {
  items: MenuItem[];
  onUploadComplete: (updatedItems: MenuItem[]) => Promise<void>;
  onClose: () => void;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

const ExcelImportExport: React.FC<ExcelImportExportProps> = ({
  items,
  onUploadComplete,
  onClose,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedItems, setParsedItems] = useState<MenuItem[]>([]);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);

  // Column definitions for Excel export/import
  const columns = [
    { key: "external_id", header: "ID", required: true, type: "string" },
    { key: "collection", header: "Kategorija", required: true, type: "string" },
    {
      key: "product_name",
      header: "Naziv (HR)",
      required: true,
      type: "string",
    },
    { key: "price", header: "Cijena (€)", required: true, type: "number" },
    {
      key: "product_name_en",
      header: "Naziv (EN)",
      required: false,
      type: "string",
    },
    {
      key: "product_name_de",
      header: "Naziv (DE)",
      required: false,
      type: "string",
    },
    {
      key: "product_name_tr",
      header: "Naziv (TR)",
      required: false,
      type: "string",
    },
    {
      key: "description_hr",
      header: "Opis (HR)",
      required: false,
      type: "string",
    },
    {
      key: "description_en",
      header: "Opis (EN)",
      required: false,
      type: "string",
    },
    {
      key: "description_de",
      header: "Opis (DE)",
      required: false,
      type: "string",
    },
    {
      key: "description_tr",
      header: "Opis (TR)",
      required: false,
      type: "string",
    },
    {
      key: "collection_order",
      header: "Redoslijed",
      required: false,
      type: "number",
    },
    { key: "size", header: "Veličina", required: false, type: "string" },
    { key: "image", header: "URL slike", required: false, type: "string" },
  ];

  // Generate and download Excel template
  const handleExportToExcel = () => {
    try {
      // Convert MenuItem[] to a format suitable for Excel
      const excelData = items.map((item) => {
        const row: any = {};
        columns.forEach((col) => {
          row[col.header] = item[col.key as keyof MenuItem];
        });
        return row;
      });

      // Set preview data for table preview
      setPreviewData(excelData.slice(0, 10)); // Limit to 10 rows for preview

      // Create a new workbook and worksheet
      const workbook = XLSX.utils.book_new();

      // Create worksheet from data
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Format the worksheet for better appearance

      // 1. Add some styling and column widths
      const colWidths = columns.map((col) => ({
        wch: col.key.includes("description") ? 40 : 20, // Wider columns for descriptions
      }));
      worksheet["!cols"] = colWidths;

      // 2. Define cell range for formatting
      const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
      const totalColumns = range.e.c + 1;

      // 3. Add header styling
      // First, we need to add a header row with our custom headers
      // This requires us to shift all data down by one row
      XLSX.utils.sheet_add_aoa(worksheet, [columns.map((col) => col.header)], {
        origin: "A1",
      });

      // 4. Format the header row
      for (let i = 0; i < totalColumns; i++) {
        const cellRef = XLSX.utils.encode_cell({ r: 0, c: i });
        if (!worksheet[cellRef]) continue;

        worksheet[cellRef].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "C41E3A" } }, // Red background for header
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
          },
        };
      }

      // 5. Format data cells
      for (let r = 1; r <= range.e.r + 1; r++) {
        for (let c = 0; c <= range.e.c; c++) {
          const cellRef = XLSX.utils.encode_cell({ r, c });
          if (!worksheet[cellRef]) continue;

          // Add basic styling to all cells
          if (!worksheet[cellRef].s) worksheet[cellRef].s = {};

          // Add zebra striping
          if (r % 2 === 0) {
            worksheet[cellRef].s.fill = { fgColor: { rgb: "F9FAFB" } }; // Light gray for even rows
          }

          // Format number columns
          const column = columns[c];
          if (column && column.type === "number") {
            worksheet[cellRef].z =
              column.key === "price" ? "#,##0.00 €" : "#,##0"; // Format price with currency
          }

          // Add borders
          worksheet[cellRef].s.border = {
            top: { style: "thin", color: { rgb: "E5E7EB" } },
            bottom: { style: "thin", color: { rgb: "E5E7EB" } },
            left: { style: "thin", color: { rgb: "E5E7EB" } },
            right: { style: "thin", color: { rgb: "E5E7EB" } },
          };
        }
      }

      // 6. Set autofilter for the header row
      worksheet["!autofilter"] = {
        ref: `A1:${XLSX.utils.encode_col(range.e.c)}1`,
      };

      // 7. Freeze the header row
      worksheet["!freeze"] = {
        xSplit: 0,
        ySplit: 1,
        topLeftCell: "A2",
        activePane: "bottomLeft",
      };

      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, "Menu Items");

      // Generate Excel file and trigger download
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
        cellStyles: true, // Important for styling to work
      });
      const data = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      // Create filename with date
      const fileName = `Ali-Kebaba-Menu-${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      saveAs(data, fileName);

      // Show success message
      setExportSuccess(true);
      setTimeout(() => {
        setExportSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Error generating Excel file:", error);
      alert(
        "Došlo je do greške pri generiranju Excel datoteke. Molimo pokušajte ponovno."
      );
    }
  };

  // Toggle preview
  const togglePreview = () => {
    if (!showPreview && previewData.length === 0) {
      // Generate preview data if not already generated
      const previewRows = items.slice(0, 10).map((item) => {
        const row: any = {};
        columns.forEach((col) => {
          row[col.header] = item[col.key as keyof MenuItem];
        });
        return row;
      });
      setPreviewData(previewRows);
    }
    setShowPreview(!showPreview);
  };

  // Handle file drop for upload
  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setFileName(file.name);
    setIsUploading(true);
    setValidationErrors([]);
    setUploadSuccess(false);

    try {
      // Read the Excel file
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });

          // Get the first worksheet
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

          // Convert to JSON
          const jsonData: any[] = XLSX.utils.sheet_to_json(firstSheet, {
            header: columns.map((col) => col.header),
          });

          // Skip the header row if it exists
          const dataRows =
            jsonData[0] &&
            Object.keys(jsonData[0]).every((key) =>
              columns.some((col) => col.header === key)
            )
              ? jsonData.slice(1)
              : jsonData;

          // Parse and validate data
          parseAndValidateData(dataRows);
        } catch (error) {
          console.error("Error parsing Excel file:", error);
          setValidationErrors([
            {
              row: 0,
              field: "file",
              message:
                "Neispravan format datoteke. Molimo koristite ispravan XLSX format.",
            },
          ]);
        } finally {
          setIsUploading(false);
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("Error reading file:", error);
      setIsUploading(false);
      setValidationErrors([
        {
          row: 0,
          field: "file",
          message: "Greška pri učitavanju datoteke. Molimo pokušajte ponovno.",
        },
      ]);
    }
  };

  // Parse and validate the Excel data
  const parseAndValidateData = (excelData: any[]) => {
    const errors: ValidationError[] = [];
    const parsedItems: MenuItem[] = [];

    // First, create a map of existing items for easier lookup
    const existingItemsMap = new Map<string, MenuItem>();
    items.forEach((item) => {
      existingItemsMap.set(item.external_id, item);
    });

    // Map column headers to keys
    const headerToKeyMap = new Map(columns.map((col) => [col.header, col.key]));

    // Process each row
    excelData.forEach((row, index) => {
      // Extract the external_id first to check if this item exists
      const idHeader = columns.find((col) => col.key === "external_id")?.header;
      const externalId = row[idHeader || "ID"];

      if (!externalId) {
        errors.push({
          row: index + 1,
          field: "ID",
          message: "ID artikla (external_id) je obavezan",
        });
        return; // Skip this row
      }

      // Check if the item exists in the original data
      const existingItem = existingItemsMap.get(externalId);
      if (!existingItem) {
        errors.push({
          row: index + 1,
          field: "ID",
          message: `Artikl s ID-om "${externalId}" ne postoji u bazi`,
        });
        return; // Skip this row
      }

      // Create a new item based on the existing one to maintain structure
      const newItem: MenuItem = { ...existingItem };

      // Update fields from Excel
      for (const [header, value] of Object.entries(row)) {
        if (value === undefined || value === null || value === "") {
          continue; // Skip empty values
        }

        const key = headerToKeyMap.get(header);
        if (!key) continue;

        const column = columns.find((col) => col.key === key);
        if (!column) continue;

        try {
          // Convert and validate based on column type
          if (column.type === "number") {
            // Za cijene, osigurajmo da imamo broj s 2 decimale
            let numValue: number;

            // Ako je string koji možda ima euro simbol ili zarez umjesto točke, očistimo ga
            if (typeof value === "string") {
              // Očisti string od valutnih simbola i formatiranja
              const cleanValue = value
                .replace(/[€$,\s]/g, "") // Ukloni € i $ znakove, zareze i razmake
                .replace(/,/g, ".") // Zamijeni zareze točkama za decimalne brojeve
                .trim();

              numValue = Number(cleanValue);
            } else {
              // Već je broj
              numValue = Number(value);
            }

            if (isNaN(numValue)) {
              errors.push({
                row: index + 1,
                field: header,
                message: `Polje "${header}" mora biti broj`,
              });
            } else if (
              numValue < 0 &&
              (key === "price" || key === "collection_order")
            ) {
              errors.push({
                row: index + 1,
                field: header,
                message: `Polje "${header}" ne može biti negativno`,
              });
            } else {
              // Fix the type casting here
              if (key === "price") {
                // Za cijenu koristimo fiksni broj decimala (2) kako bi osigurali konzistentnost
                newItem.price = Number(numValue.toFixed(2));
              } else if (key === "collection_order") {
                newItem.collection_order = Math.round(numValue); // Za redoslijed koristimo cijeli broj
              } else {
                // Handle other numeric fields if needed
                (newItem as any)[key] = numValue;
              }
            }
          } else {
            // String type - trim and ensure it's a string
            // Fix the type casting here
            if (key === "external_id") {
              newItem.external_id = String(value).trim();
            } else if (key === "collection") {
              newItem.collection = String(value).trim();
            } else if (key === "product_name") {
              newItem.product_name = String(value).trim();
            } else if (key === "product_name_en") {
              newItem.product_name_en = String(value).trim();
            } else if (key === "product_name_de") {
              newItem.product_name_de = String(value).trim();
            } else if (key === "product_name_tr") {
              newItem.product_name_tr = String(value).trim();
            } else if (key === "description_hr") {
              newItem.description_hr = String(value).trim();
            } else if (key === "description_en") {
              newItem.description_en = String(value).trim();
            } else if (key === "description_de") {
              newItem.description_de = String(value).trim();
            } else if (key === "description_tr") {
              newItem.description_tr = String(value).trim();
            } else if (key === "size") {
              newItem.size = String(value).trim();
            } else if (key === "image") {
              newItem.image = String(value).trim();
            } else {
              // Handle other string fields if needed
              (newItem as any)[key] = String(value).trim();
            }
          }
        } catch (err) {
          errors.push({
            row: index + 1,
            field: header,
            message: `Greška pri obradi: ${err}`,
          });
        }
      }

      parsedItems.push(newItem);
    });

    setParsedItems(parsedItems);
    setValidationErrors(errors);
  };

  // Submit updated items to database
  const handleSubmit = async () => {
    if (validationErrors.length > 0) {
      alert("Molimo ispravite greške u datoteci prije spremanja.");
      return;
    }

    // Check if there are any differences
    if (differences.length === 0) {
      alert("Nema promjena za spremiti. Molimo napravite izmjene u datoteci.");
      return;
    }

    setIsProcessing(true);

    try {
      // Create a filtered array of only items that have changes
      const changedItemIds = new Set(
        differences.map((diff) => diff.external_id)
      );
      const itemsToUpdate = parsedItems.filter((item) =>
        changedItemIds.has(item.external_id)
      );

      // Osiguranje da su cijene pravilno formatirane prije slanja u bazu
      itemsToUpdate.forEach((item) => {
        // Za cijene, osigurajmo da su uvijek brojevi sa dvije decimale
        if (typeof item.price === "string") {
          item.price = Number(Number(item.price).toFixed(2));
        } else if (typeof item.price === "number") {
          item.price = Number(item.price.toFixed(2));
        }

        // Za collection_order, osigurajmo da su cijeli brojevi
        if (item.collection_order !== undefined) {
          if (typeof item.collection_order === "string") {
            item.collection_order = Math.round(Number(item.collection_order));
          } else if (typeof item.collection_order === "number") {
            item.collection_order = Math.round(item.collection_order);
          }
        }
      });

      if (itemsToUpdate.length > 0) {
        // Process the update
        await onUploadComplete(itemsToUpdate);
        setUploadSuccess(true);

        // Auto-close after successful upload
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        alert("Nakon provjere nisu pronađene stvarne promjene za spremanje.");
        setIsProcessing(false);
      }
    } catch (error) {
      setValidationErrors([
        {
          row: 0,
          field: "database",
          message:
            "Greška pri ažuriranju baze podataka. Molimo pokušajte ponovno.",
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
    },
    multiple: false,
    disabled: isUploading || isProcessing,
  });

  const compareItems = (
    originalItems: MenuItem[],
    updatedItems: MenuItem[]
  ) => {
    const differences = updatedItems.map((updatedItem) => {
      const originalItem = originalItems.find(
        (item) => item.external_id === updatedItem.external_id
      );

      if (!originalItem) return null;

      const changes = Object.keys(updatedItem).reduce((acc, key) => {
        const typedKey = key as keyof MenuItem;
        // Get values for better debugging
        const origValue = originalItem[typedKey];
        const updatedValue = updatedItem[typedKey];

        // Special handling for numeric values - compare actual numbers
        if (key === "price" || key === "collection_order") {
          // Pretvaranje u brojeve za usporedbu
          const origNum = Number(origValue);
          const updatedNum = Number(updatedValue);

          // Usporedba sa tolerancijom za decimalne brojeve zbog potencijalnih razlika u zaokruživanju
          const diff = Math.abs(origNum - updatedNum);
          const isEqual = diff < 0.001; // Za cijene, razlika manja od 0.001 je praktički jednako

          if (!isEqual) {
            acc[key] = {
              old: origValue,
              new: updatedValue,
            };
          }
        }
        // For strings, normalize for comparison (null/undefined → empty string)
        else {
          const origStr = origValue?.toString() || "";
          const updatedStr = updatedValue?.toString() || "";

          if (origStr !== updatedStr) {
            acc[key] = {
              old: origValue,
              new: updatedValue,
            };
          }
        }

        return acc;
      }, {} as Record<string, { old: any; new: any }>);

      return { external_id: updatedItem.external_id, changes };
    });

    const filteredDifferences = differences.filter(
      (diff) => diff && Object.keys(diff.changes).length > 0
    );

    return filteredDifferences;
  };

  // Calculate differences when parsedItems changes
  const [differences, setDifferences] = useState<any[]>([]);

  // Update differences when parsed items change
  React.useEffect(() => {
    if (parsedItems.length > 0) {
      const diffs = compareItems(items, parsedItems);
      setDifferences(diffs);
    }
  }, [parsedItems, items]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#C41E3A]">
            Import/Export Excel
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-gray-100"
            disabled={isProcessing}
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Export section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-2">
              Preuzmi Excel template
            </h3>
            <p className="text-gray-600 mb-4">
              Preuzmite trenutne podatke kao Excel datoteku, uredite podatke i
              zatim uploadajte ažuriranu datoteku.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportToExcel}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Download className="mr-2 h-5 w-5" />
                Preuzmi Excel template
              </button>

              <button
                onClick={togglePreview}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {showPreview ? (
                  <>
                    <EyeOff className="mr-2 h-5 w-5" />
                    Sakrij pregled
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-5 w-5" />
                    Prikaži pregled
                  </>
                )}
              </button>
            </div>

            {exportSuccess && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center excel-notification">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <p className="text-green-800 font-medium">
                  Excel datoteka je uspješno generirana i preuzeta!
                </p>
              </div>
            )}

            {/* Data preview table */}
            {showPreview && previewData.length > 0 && (
              <div className="mt-4 border rounded-lg overflow-auto">
                <div className="overflow-x-auto">
                  <table className="xlsx-preview-table">
                    <thead>
                      <tr>
                        {columns.map((column) => (
                          <th key={column.key}>{column.header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {columns.map((column) => (
                            <td key={column.key}>
                              {column.type === "number" &&
                              column.key === "price"
                                ? `${
                                    row[column.header]?.toFixed(2) || "0.00"
                                  } €`
                                : row[column.header] || ""}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-3 bg-gray-50 border-t text-center text-sm text-gray-500">
                  Prikazanih prvih 10 redaka od ukupno {items.length} artikala
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t my-6"></div>

          {/* Import section */}
          <div>
            <h3 className="text-lg font-semibold mb-2">
              Upload ažuriranih podataka
            </h3>
            <p className="text-gray-600 mb-4">
              Uploadajte Excel datoteku s ažuriranim podacima. Sustav će
              validirati podatke prije ažuriranja.
            </p>

            {/* Upload area */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed p-8 rounded-lg text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-blue-400"
              } ${
                isUploading || isProcessing
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              <input {...getInputProps()} />

              {fileName ? (
                <div className="flex items-center justify-center gap-2">
                  <FileSpreadsheet className="h-10 w-10 text-green-600" />
                  <div className="text-left">
                    <p className="font-medium">{fileName}</p>
                    <p className="text-sm text-gray-500">
                      {parsedItems.length} artikala učitano
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <Upload className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-lg font-medium">
                    {isDragActive
                      ? "Ispustite datoteku ovdje"
                      : "Povucite i ispustite Excel datoteku ovdje"}
                  </p>
                  <p className="text-gray-500 mt-1">
                    ili kliknite za odabir datoteke
                  </p>
                </div>
              )}
            </div>

            {/* Changes preview */}
            {differences.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-800 mb-2">
                  Promijenjene vrijednosti ({differences.length})
                </h4>
                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-60 overflow-y-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                            ID
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                            Polje
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                            Stara vrijednost
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                            Nova vrijednost
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {differences.flatMap((diff) =>
                          Object.entries(diff.changes).map(
                            ([field, values]: [string, any], idx) => (
                              <tr
                                key={`${diff.external_id}-${field}`}
                                className="hover:bg-gray-50"
                              >
                                {idx === 0 ? (
                                  <td
                                    rowSpan={Object.keys(diff.changes).length}
                                    className="px-4 py-2 align-top"
                                  >
                                    <span className="font-medium">
                                      {diff.external_id}
                                    </span>
                                  </td>
                                ) : null}
                                <td className="px-4 py-2 font-medium">
                                  {field}
                                </td>
                                <td className="px-4 py-2 text-gray-500">
                                  {String(values.old)}
                                </td>
                                <td className="px-4 py-2 bg-green-50 text-green-800">
                                  {String(values.new)}
                                </td>
                              </tr>
                            )
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Validation errors */}
            {validationErrors.length > 0 && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start mb-2">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                  <h4 className="font-medium text-red-800">
                    Pronađene su greške ({validationErrors.length})
                  </h4>
                </div>
                <div className="pl-7 max-h-60 overflow-y-auto">
                  <ul className="list-disc pl-5 space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index} className="text-sm text-red-700">
                        {error.row > 0
                          ? `Red ${error.row}, ${error.field}: `
                          : ""}
                        {error.message}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Success message */}
            {uploadSuccess && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <p className="text-green-800 font-medium">
                  Podaci su uspješno ažurirani!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            disabled={isProcessing}
          >
            Odustani
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              isUploading ||
              isProcessing ||
              validationErrors.length > 0 ||
              parsedItems.length === 0
            }
            className="flex items-center px-4 py-2 bg-[#C41E3A] text-white rounded-lg hover:bg-[#a01930] disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isProcessing ? "Spremanje..." : "Spremi promjene"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExcelImportExport;
