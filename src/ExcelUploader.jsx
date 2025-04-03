import { useState } from "react";
import * as XLSX from "xlsx";

const ExcelUploader = () => {
  const [file, setFile] = useState(null);
  const [data, setData] = useState([]);

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);

    const reader = new FileReader();
    reader.onload = (event) => {
      const workbook = XLSX.read(event.target.result, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const parsedData = XLSX.utils.sheet_to_json(sheet);
      setData(parsedData.map(row => ({ ...row, ExtraAbsent: "No" })));
    };
    reader.readAsBinaryString(uploadedFile);
  };

  const handleCellChange = (rowIndex, colKey, value) => {
    const updatedData = [...data];
    updatedData[rowIndex][colKey] = value;
    setData(updatedData);
  };

  const handleAbsentChange = (rowIndex, value) => {
    const updatedData = [...data];
    updatedData[rowIndex]["Absent"] = value;
    setData(updatedData);
  };

  const toggleExtraAbsent = (rowIndex) => {
    const updatedData = [...data];
    updatedData[rowIndex]["ExtraAbsent"] = updatedData[rowIndex]["ExtraAbsent"] === "Yes" ? "No" : "Yes";
    setData(updatedData);
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "Edited_Excel.xlsx");
  };

  return (
    <div className="justify-center text-center">
      <h2>Upload Excel File</h2>
      <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="mb-4" />
      
      {file && <p className="mt-4"> Uploaded Your excel File: {file.name}</p>}

      {data.length > 0 && (
        <div>
          <table className="border-collapse border border-gray-400 w-full">
            <thead>
              <tr>
                {Object.keys(data[0]).map((key) => (
                  <th key={key} className="border border-gray-300 p-2">{key}</th>
                ))}
                
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {Object.keys(row).map((colKey, colIndex) => (
                    <td key={colIndex} className="border border-gray-300 p-2">
                      {colKey === "Absent" ? (
                        <select
                          value={row[colKey] || "No"}
                          onChange={(e) => handleAbsentChange(rowIndex, e.target.value)}
                          className="px-2 py-1 border rounded"
                        >
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      ) : colKey === "ExtraAbsent" ? (
                        <button
                          onClick={() => toggleExtraAbsent(rowIndex)}
                          className={`px-4 py-2 rounded ${row[colKey] === "Yes" ? "bg-green-500" : "bg-red-500"} text-white`}
                        >
                          {row[colKey] === "Yes" ? "Yes" : "No"}
                        </button>
                      ) : (
                        <input
                          type="text"
                          value={row[colKey] || ""}
                          onChange={(e) => handleCellChange(rowIndex, colKey, e.target.value)}
                          className="w-full border-none focus:outline-none"
                        />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={handleExport} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">Export to Excel</button>
        </div>
      )}
    </div>
  );
};

export default ExcelUploader;
