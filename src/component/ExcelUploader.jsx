import { useState } from "react";
import * as XLSX from "xlsx";
import { MdLogout } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import img  from '../src/assets/mzcet.png'; // Adjust the path as necessary

const ExcelUploader = () => {
  const [file, setFile] = useState(null);
  const [data, setData] = useState([]);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

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
    if (!file) {
      alert("No file uploaded to save data from!");
      return;
    }
    const timestamp = new Date().toISOString();
    const savedFileName = file.name;

    // Add metadata to each student record
    const dataWithMeta = data.map((row) => ({
      ...row,
      savedFileName,
      savedAt: timestamp,
    }));

    try {
      const response = await fetch("http://localhost:5000/save-to-mongodb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataWithMeta),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert("Failed to send data to MongoDB: " + errorData.message);
        return;
      }

      alert("All student data sent to MongoDB!");
      console.log("Sending to MongoDB:", dataWithMeta);
    } catch (error) {
      alert("Error sending data to MongoDB: " + error.message);
      console.error("Error sending data to MongoDB:", error);
    }
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

const handleCreateLeaveReport = () => {
  navigate("/leave-reports");
};

  return (
    <div className="justify-center text-center mt-60">
      
      <div className=" text-pink-700 text-5xl"><h1>Attendance Managment</h1></div>
      <h2 className="mt-10 text-2xl">Upload Excel File</h2>
      {!file && (
        <div
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              handleFileUpload({ target: { files: e.dataTransfer.files } });
              e.dataTransfer.clearData();
            }
          }}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={(e) => e.preventDefault()}
          onClick={() => document.getElementById('fileInput').click()}
        className="mb-4 border-4 border-dashed border-indigo-600 rounded-lg p-4 cursor-pointer text-indigo-600 hover:bg-indigo-100 max-w-md mx-auto"
        >
          Drag and drop your Excel file here, or click to select file
        </div>
      )}
      <input
        id="fileInput"
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileUpload}
        className="hidden"
      />
      {file && (
        <>
          <p className="mt-9"> Uploaded Your Excel File Here ! {file.name}</p>
          <button
            onClick={() => {
              setFile(null);
              setData([]);
            }}
            className="mt-2 px-4 py-2 bg-red-500 text-white rounded"
          >
            Remove File
          </button>
        </>
      )}

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
          <button onClick={handleExport} className="mt-4 px-7 py-2 bg-blue-500 text-white rounded">Initiate call</button><br/>
          <button onClick={handleDownloadExcel} className="px-4 py-2 mt-2 bg-green-500 text-white rounded">
  Download Modified Excel
</button><br/>
      <button onClick={handleSendAllData} className="mt-4 ml-4 px-4 py-2 bg-purple-500 text-white rounded">
        Save to MongoDB
      </button>
      <br />
      <button onClick={handleCreateLeaveReport} className="mt-4 ml-4 px-4 py-2 bg-indigo-600 text-white rounded">
        View Leave Reports
      </button>
    </div>
  )}


</div>
  );
};

export default ExcelUploader;
