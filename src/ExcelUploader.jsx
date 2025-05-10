import { useState } from "react";
import * as XLSX from "xlsx";
import LogoutButton from "./component/Logout";

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
      setData(parsedData.map(row => ({ ...row, Absent: "No" })));
    };
    reader.readAsBinaryString(uploadedFile);
  };

  const handleCellChange = (rowIndex, colKey, value) => {
    const updatedData = [...data];
    updatedData[rowIndex][colKey] = value;
    setData(updatedData);
  };
  const handleSendAllData = async () => {
    const allData = data.map(row => ({
      studentName: row["Student Name"],
      parentNumber: row["Parent Number"],
      status: row["Absent"] === "Yes" ? "Absent" : "Present"
    }));
  
    fetch("http://localhost:5000/save-to-mongodb", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    console.log("Sending to MongoDB:", data);

  
    alert("All student data sent to MongoDB!");
  };
  <button onClick={handleSendAllData} className="mt-4 px-4 py-2 bg-purple-500 text-white rounded">
  Send All Student Data to MongoDB
</button>


  const handleAbsentChange = (rowIndex, value) => {
    const updatedData = [...data];
    updatedData[rowIndex]["Absent"] = value;
    setData(updatedData);
  };

  const toggleExtraAbsent = (rowIndex) => {
    const updatedData = [...data];
    updatedData[rowIndex]["Absent"] = updatedData[rowIndex]["Absent"] === "Yes" ? "No" : "Yes";
    setData(updatedData);
  };
  const handleExport = async () => {
  try {
    const response = await fetch("http://localhost:5000/api/run-uipath", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}), // send empty or custom data
    });

    const result = await response.json();
    if (response.ok) {
      alert("UiPath process started!");
    } else {
      alert("Error: " + result.message);
    }
  } catch (err) {
    alert("Network error when calling UiPath trigger");
    console.error(err);
  }
};
const handleDownloadExcel = () => {
  if (!file) return alert("No file uploaded yet!");

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], { type: "application/octet-stream" });

  // Get original filename without extension
  const originalName = file.name.replace(/\.[^/.]+$/, "");

  // Format date and time
  const now = new Date();
  const formatted = now
    .toISOString()
    .replace(/T/, "_")
    .replace(/:/g, "-")
    .split(".")[0]; // e.g., 2025-05-10_14-31-00

  const newFilename = `${originalName}_${formatted}.xlsx`;

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = newFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};


  
  

  return (
    <div className="justify-center text-center">
      <div className=" text-pink-700 text-5xl"><h1>Attendance</h1></div>
      <h2>Upload Excel File</h2>
      <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="mb-4" />
      
      {file && <p className="mt-4"> Uploaded Your Excel File Here ! {file.name}</p>}

      {data.length > 0 && (
        <div>
          <table className="border-collapse border border-white w-full">
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
                      ) : colKey === "Absent" ? (
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
          <button onClick={handleExport} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">Initiate call</button>
          <button onClick={handleDownloadExcel} className="px-4 py-2 bg-green-500 text-white rounded">
  Download Modified Excel
</button>
        </div>
      )}
      <LogoutButton />
    </div>
  );
};

export default ExcelUploader;
