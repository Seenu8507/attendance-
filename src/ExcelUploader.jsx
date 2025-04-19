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
      setData(parsedData.map(row => ({ ...row, Absent: "No" })));
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
    updatedData[rowIndex]["Absent"] = updatedData[rowIndex]["Absent"] === "Yes" ? "No" : "Yes";
    setData(updatedData);
  };

  const handleExport = async() => {
    const filePath = "C:\Users\seenu\Downloads\ "
    await fetch("http://localhost:5000/trigger-uipath", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ filePath })
})
  .then(res => res.text())
  .then(msg => alert("UiPath Triggered: " + msg))
  .catch(err => alert("Failed to trigger UiPath"));


    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  
    // Export using same filename
    const originalName = file?.name || "UpdatedFile.xlsx";
    XLSX.writeFile(wb, originalName);
  };
  const handleSaveToDB = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/save-excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      alert(result.message);
    } catch (error) {
      alert("Failed to save data to MongoDB");
      console.error(error);
    }
  };
  const saveToMongo = async () => {
    try {
      const response = await fetch("http://localhost:27107/api/save-excel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data), // sending Excel JSON data
      });
  
      const result = await response.json();
      alert(result.message);
    } catch (error) {
      console.error("Error saving to MongoDB:", error);
      alert("Error saving to MongoDB");
    }
  };
  

  return (
    

    <div className="justify-center text-center min-h-screen p-8 bg-gradient-to-br from-purple-300 via-pink-200 to-yellow-100 text-center">
      
      <div className=" text-pink-700 text-5xl"><h1>Attendance</h1></div>
      <h2>Upload Excel File</h2>
      <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="mb-4" />
      
      {file && <p className="mt-4"> Uploaded Your Excel File Here ! {file.name}</p>}

      {data.length > 0 && (
        <div>
          <table className="border-collapse border border-black w-full">
            <thead>
              <tr>
                {Object.keys(data[0]).map((key) => (
                  <th key={key} className="border border-black p-7">{key}</th>
                ))}
                
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {Object.keys(row).map((colKey, colIndex) => (
                    <td key={colIndex} className="border border-black p-2">
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
          <button onClick={handleExport} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">Export to Excel</button>
        </div>
      )}
      <button
         onClick={saveToMongo}
         className="mt-4 ml-4 px-4 py-2 bg-green-500 text-white rounded"
         >
         Save to MongoDB
        </button>
    </div>
  
  );
};

export default ExcelUploader;
