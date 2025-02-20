import React, { useEffect, useState } from "react";
import axios from "axios";
import { Modal, Box, IconButton, TextField, Button } from "@mui/material";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { Close as CloseIcon } from "@mui/icons-material";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS } from "chart.js/auto";

const Dashboard = () => {
  const [imagesData, setImagesData] = useState([]);
  const [amiquamData, setAmiquamData] = useState([]);
  const [amiquamloading, setAmiquamLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [detectDefects, setDetectDefects] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({});
  const [sliceNumber, setSliceNumber] = useState("10"); // Default slice number
  const [inputSliceNumber, setInputSliceNumber] = useState(sliceNumber); // Temporary state for slice number input
  const [productionId, setProductionId] = useState("31daea9f-7091-45fb-97f5-99354e3f7da1"); // Default production ID

  // const [localhost] = useState("141.60.181.147"); // VPN:141.60.177.220
  const [apiBaseUrl, setApiBaseUrl] = useState("");

  useEffect(() => {
    const hostname = window.location.hostname;
    const baseUrl = hostname === "localhost" ? "localhost" : "141.60.181.147"; // External IP
    setApiBaseUrl(baseUrl);
  }, []);

  // Function to fetch image data based on the slice number and production ID
  const fetchImageData = async (productionId, sliceNumber) => {
    setLoading(true); // Show the loading state
    if (apiBaseUrl) {
      try {
        const response = await axios.get(
          `http://${apiBaseUrl}:8000/api/image_data/maria/images/?production_id=${productionId}&slice_number=${sliceNumber}`
        );
        setImagesData(response.data); // Update the images data with the new images fetched from the backend
        setError(null); // Reset the error state if the fetch was successful
      } catch (err) {
        setError("Error fetching image data");
        console.error(err);
      } finally {
        setLoading(false); // Hide loading state after the request completes
      }
    }
  };

  // Function to handle the defect detection logic (can be enhanced)
  const fetchDefectData = async (inputSliceNumber) => {
    if (apiBaseUrl) {
      try {
        const response = await axios.post(
          `http://${apiBaseUrl}:8000/api/image_data/detect_defects/`, // API endpoint for defect detection
          null, // No body required
          {
            params: {
              detect_defects: true, // Set detect_defects to true
              slice_number: inputSliceNumber, // Set slice_number to inputSliceNumber
            },
          }
        );

        // Map defect data to the imagesData array
        const updatedImages = imagesData.map((image) => {
          const normalizedImagePath = `http://${apiBaseUrl}:8000/${image.image}`;
          const imageFileName = normalizedImagePath.split("/").pop();
          const defectData = response.data.find((defect) => {
            const defectFileName = defect.image_path.split("\\").pop();
            return defectFileName === imageFileName;
          });

          return { ...image, detections: defectData ? defectData.detections : [] };
        });

        setImagesData(updatedImages); // Update images with detection data
      } catch (err) {
        console.error("Error fetching defect data:", err);
      }
    }
  };

  // Function to fetch amiquam data based on slice number and production ID
  const fetchAmiquamData = async (productionId, sliceNumber) => {
    setAmiquamLoading(true); // Show the loading state
    if (apiBaseUrl) {
      try {
        const response = await axios.get(
          `http://${apiBaseUrl}:8000/api/parameter_data/mongo/inspection-data-legacy?production_id=${productionId}&slice_number=${sliceNumber}`
          // `http://${apiBaseUrl}:8000/api/image_data/maria/images/?production_id=${productionId}&slice_number=${sliceNumber}`
        );
        console.log("Amiquam Data:", response.data);
        setAmiquamData(response.data); // Update the amiquam data with the new images fetched from the backend
        setError(null); // Reset the error state if the fetch was successful
      } catch (err) {
        setError("Error fetching amiquam data");
        console.error(err);
      } finally {
        setAmiquamLoading(false); // Hide loading state after the request completes
      }
    }
  };

  // Handle input change for slice number field
  const handleSliceNumberInputChange = (event) => {
    setInputSliceNumber(event.target.value); // Update temporary input state
  };

  // Handle input change for production ID field
  const handleProductionIdInputChange = (event) => {
    setProductionId(event.target.value); // Update production ID state
  };

  // Button click to fetch images based on input slice number and production ID
  const handleFetchData = async () => {
    if (apiBaseUrl) {
      await fetchImageData(productionId, inputSliceNumber); // Fetch images based on the current input values
      await fetchAmiquamData(productionId, inputSliceNumber);

      setDetectDefects(false);
      // Trigger defect detection if checkbox is checked
      // if (detectDefects) {
      //   await fetchDefectData(inputSliceNumber); // Fetch defect data based on inputSliceNumber
      // }
    }
  };

  // Handle the defect detection checkbox change
  const handleDefectDetectionChange = (event) => {
    setDetectDefects(event.target.checked); // Toggle the defect detection flag
    // If defect detection is enabled, fetch defect data immediately after toggling
    if (event.target.checked) {
      fetchDefectData(inputSliceNumber); // Fetch defect data immediately when checked
    } else {
      // Optionally, clear defect data or reset the detections if unchecked
      const updatedImages = imagesData.map((image) => ({
        ...image,
        detections: [],
      }));
      setImagesData(updatedImages); // Reset detections
    }
  };

  // Function to open the image modal for a selected image
  const openImageModal = (image) => {
    setSelectedImage(image);
  };

  // Function to close the image modal
  const closeImageModal = () => {
    setSelectedImage(null);
  };

  // Handle image load and update image dimensions
  const handleImageLoad = (imageId, e) => {
    const { naturalWidth, naturalHeight } = e.target;
    setImageDimensions((prev) => ({
      ...prev,
      [imageId]: { width: naturalWidth, height: naturalHeight },
    }));
  };

  //handle amiquamdata
  const getChartData = (amiquamData, objectType) => {
    const liftoffValues = amiquamData
      .map((entry) => entry[objectType]?.liftoff)
      .filter((value) => value !== undefined);

    return {
      labels: liftoffValues.map((_, index) => `Sample ${index + 1}`), // Label for x-axis
      datasets: [
        {
          label: `Liftoff (${objectType})`,
          data: liftoffValues,
          borderColor: objectType === "0" ? "blue" : "green",
          tension: 0.4,
          fill: false,
        },
      ],
      options: {
        scales: {
          x: {
            title: {
              display: true,
              text: "Sample Index", // X-axis label
            },
          },
          y: {
            title: {
              display: true,
              text: "Liftoff Value", // Y-axis label
            },
          },
        },
      },
    };
  };

  // Fetch data on initial load (page refresh)
  useEffect(() => {
    // Fetch data using default values on first load
    if (apiBaseUrl) {
      fetchImageData(productionId, sliceNumber);
      fetchAmiquamData(productionId, sliceNumber);

      // If defect detection is enabled, also fetch defect data
      // if (detectDefects) {
      //   fetchDefectData(sliceNumber);
      // }
    }
  }, [apiBaseUrl, productionId, sliceNumber]); // Empty dependency array ensures this runs only once on page load

  if (loading) {
    return (
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 9999,
          fontSize: "24px",
          fontWeight: "bold",
          backgroundColor: "rgba(255, 255, 255, 0.8)",
          padding: "10px 20px",
          borderRadius: "5px",
        }}
      >
        Loading...
      </div>
    );
  }

  if (error) return <div>{error}</div>;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <div>
        {/* Text input for production ID */}
        <TextField
          label="Production ID"
          variant="outlined"
          value={productionId} // Use the state for production ID
          onChange={handleProductionIdInputChange} // Update production ID state on input change
          //onChange={(e) => setProductionId(e.target.value)}
          style={{ marginBottom: "30px", marginRight: "20px", width: "300px", fontSize: "16px" }}
        />
        {/* Text input for slice number */}
        <TextField
          label="Slice Number"
          variant="outlined"
          value={inputSliceNumber} // Use the temporary state for the input field
          onChange={handleSliceNumberInputChange} // Update temporary state on input change
          //onChange={(e) => setInputSliceNumber(e.target.value)}
          style={{ marginBottom: "30px", marginRight: "20px", fontSize: "16px" }}
        />
        <Button
          variant="contained"
          color="white"
          onClick={() => {
            fetchAmiquamData(productionId, inputSliceNumber);
            handleFetchData();
          }}
        >
          Fetch Data
        </Button>

        {/* Checkbox to toggle defect detection */}
        <div>
          <label>
            <input type="checkbox" checked={detectDefects} onChange={handleDefectDetectionChange} />{" "}
            Enable Defect Detection
          </label>
        </div>

        {/* Main layout */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: "20px" }}>
          {/* Image Gallery */}
          <div
            className="image-gallery"
            style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" }}
          >
            {imagesData.map((image) => (
              <div className="Image Position" style={{ textAlign: "center" }} key={image.id}>
                <h3>{image.position}</h3>
                <div className="image-item" style={{ textAlign: "center", position: "relative" }}>
                  <img
                    src={`http://${apiBaseUrl}:8000/${image.image}`} // Corrected image URL
                    alt={`Position: ${image.position}`} // Corrected alt text
                    style={{ width: "600px", height: "auto", cursor: "pointer" }}
                    onClick={() => openImageModal(image)}
                    onLoad={(e) => handleImageLoad(image.id, e)} // Pass the event and image ID
                  />

                  {detectDefects && image.detections && image.detections.length === 0 && (
                    <div
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        color: "red",
                        fontWeight: "bold",
                        fontSize: "20px",
                      }}
                    >
                      No defects detected
                    </div>
                  )}

                  {image.detections && image.detections.length > 0 && detectDefects && (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                      }}
                    >
                      {image.detections.map((detection, idx) => {
                        const { box, label } = detection;
                        const [centerX, centerY, width, height] = box;

                        const imageDimension = imageDimensions[image.id] || { width: 1, height: 1 };
                        const scaleX = imageDimension.width / 640; // Assuming 640 is the base image size for scaling
                        const scaleY = imageDimension.height / 640;

                        const boxLeft = centerX * scaleX;
                        const boxTop = centerY * scaleY;
                        const boxWidth = width * scaleX * 0.8;
                        const boxHeight = height * scaleY * 0.8;

                        const new_boxleft =
                          ((boxLeft - boxWidth / 1.0) / imageDimension.width) * 600;
                        const new_boxtop =
                          ((boxTop - boxHeight / 1.0) / imageDimension.height) * 600;

                        // Mapping numeric label IDs to descriptive defect names
                        const defectLabels = {
                          0: "Grooves_defect",
                          1: "Protruding_defect",
                          2: "Recoating_defect",
                        };

                        // Get the defect label by the detection labelId
                        const defectLabel = defectLabels[label] || "Unknown Defect";

                        return (
                          <div
                            key={idx}
                            style={{
                              position: "absolute",
                              left: `${new_boxleft}px`,
                              top: `${new_boxtop}px`,
                              width: `${boxWidth}px`,
                              height: `${boxHeight}px`,
                              border: "2px solid red",
                              boxSizing: "border-box",
                            }}
                          >
                            <div
                              style={{
                                position: "absolute",
                                top: "-25px",
                                left: "50%",
                                transform: "translateX(-50%)",
                                color: "red",
                                fontSize: "12px",
                                fontWeight: "bold",
                                backgroundColor: "white",
                                padding: "2px 5px",
                                borderRadius: "5px",
                              }}
                            >
                              {defectLabel}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Display Amiquam Data graph */}
          {/* Display Amiquam Data in a Table */}
          {/* {amiquamData.length > 0 && (
          <div style={{ marginTop: "30px" }}>
            <h4>Amiquam Data Table</h4>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ border: "1px solid black", padding: "8px" }}>Object Type</th>
                  <th style={{ border: "1px solid black", padding: "8px" }}>Liftoff Value</th>
                </tr>
              </thead>
              <tbody>
                {amiquamData.map((entry, index) => (
                  <tr key={index}>
                    <td style={{ border: "1px solid black", padding: "8px" }}>
                      {entry["0"] ? "Object 0" : "Object 1"}
                    </td>
                    <td style={{ border: "1px solid black", padding: "8px" }}>
                      {entry["0"] ? entry["0"].liftoff : entry["1"] ? entry["1"].liftoff : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )} */}

          {/* Display Amiquam Data Graph if Needed */}
          <div style={{ flex: 1, height: "600px", width: "500px" }}>
            {amiquamData.length > 0 && (
              <div style={{ flex: 1, height: "600px", width: "500px" }}>
                <h4 style={{ textAlign: "center", paddingTop: "30px" }}>Object 0 Liftoff</h4>
                <Line data={getChartData(amiquamData, "0")} />
                <h4 style={{ textAlign: "center", paddingTop: "30px" }}>Object 1 Liftoff</h4>
                <Line data={getChartData(amiquamData, "1")} />
              </div>
            )}
          </div>
        </div>

        {/* Modal for viewing the image in a larger view */}
        <Modal
          open={selectedImage !== null}
          onClose={closeImageModal}
          aria-labelledby="image-zoom-modal"
          aria-describedby="zoomed-in-image"
        >
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              backgroundColor: "white",
              padding: 2,
              borderRadius: 2,
              maxWidth: "90%",
              maxHeight: "90%",
              overflow: "auto",
            }}
          >
            <IconButton
              onClick={closeImageModal}
              sx={{ position: "absolute", top: 0, right: 0, color: "black" }}
            >
              <CloseIcon />
            </IconButton>
            <img
              src={`http://${apiBaseUrl}:8000/${selectedImage?.image}`} // Corrected image URL
              alt={`Position: ${selectedImage?.position}`} // Corrected alt text
              style={{ width: "100%", height: "auto" }}
            />
          </Box>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
