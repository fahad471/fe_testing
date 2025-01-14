import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Modal,
  Box,
  IconButton,
  Checkbox,
  FormControlLabel,
  TextField,
  Button,
} from "@mui/material";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { Close as CloseIcon } from "@mui/icons-material";

const Dashboard = () => {
  const [imagesData, setImagesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [detectDefects, setDetectDefects] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({});
  const [sliceNumber, setSliceNumber] = useState("1028"); // Default slice number
  const [inputSliceNumber, setInputSliceNumber] = useState(sliceNumber); // Temporary state for slice number input
  const [productionId, setProductionId] = useState("f77c322a-1f91-4d9c-91f9-eb1c18163e31"); // Default production ID
  const [previousSliceNumber, setPreviousSliceNumber] = useState(null); // for tracking previous slice number

  // Function to fetch image data based on the slice number and production ID
  const fetchImageData = async (productionId, sliceNumber) => {
    setLoading(true); // Show the loading state
    try {
      const response = await axios.get(
        `http://localhost:8000/api/image_data/maria/images/?production_id=${productionId}&slice_number=${sliceNumber}`
      );
      setImagesData(response.data); // Update the images data with the new images fetched from the backend
      setError(null); // Reset the error state if the fetch was successful
    } catch (err) {
      setError("Error fetching image data");
      console.error(err);
    } finally {
      setLoading(false); // Hide loading state after the request completes
    }
  };

  // Initial fetch when the component is mounted with the default slice number and production ID
  useEffect(() => {
    fetchImageData(productionId, sliceNumber); // Fetch images when the component mounts or sliceNumber/productionId changes
  }, [sliceNumber, productionId]); // Dependency on sliceNumber and productionId

  // Function to handle the defect detection logic (can be enhanced)
  const fetchDefectData = async () => {
    try {
      const response = await axios.post(
        "http://localhost:8000/api/image_data/detect_defects/", // API endpoint for defect detection
        null, // No body required
        {
          params: {
            detect_defects: true, // Set detect_defects to true
            slice_number: inputSliceNumber, // Set slice_number to 1028
          },
        } // Include detect_defects parameter
      );

      // Map defect data to the imagesData array
      const updatedImages = imagesData.map((image) => {
        const normalizedImagePath = `http://localhost:8000/${image.image}`;
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
  };

  useEffect(() => {
    if (detectDefects) {
      fetchDefectData(); // Trigger defect detection when checkbox is checked
    }
  }, [detectDefects, inputSliceNumber]);

  const openImageModal = (image) => {
    setSelectedImage(image);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  const handleDefectDetectionChange = (event) => {
    setDetectDefects(event.target.checked); // Toggle the defect detection flag
  };

  const handleImageLoad = (imageId, e) => {
    const { naturalWidth, naturalHeight } = e.target;
    setImageDimensions((prev) => ({
      ...prev,
      [imageId]: { width: naturalWidth, height: naturalHeight },
    }));
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
  const handleFetchData = () => {
    if (inputSliceNumber !== previousSliceNumber) {
      // If the slice number has changed, reset detectDefects to false
      setDetectDefects(false);

      // Fetch images with the new slice number and production ID
      fetchImageData(productionId, inputSliceNumber);

      // Update previous slice number
      setPreviousSliceNumber(inputSliceNumber);
    }
  };

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
        {" "}
        {/*style={{ paddingTop: "20px", paddingLeft: "300px" }}*/}
        {/* <h2 style={{ fontFamily: "Arial, sans-serif", fontSize: "18px" }}>Image Dashboard</h2> */}
        <div style={{ paddingTop: "5px" }}>
          {/* Text input for production ID */}
          <TextField
            label="Production ID"
            variant="outlined"
            value={productionId} // Use the state for production ID
            onChange={handleProductionIdInputChange} // Update production ID state on input change
            style={{ marginBottom: "30px", marginRight: "20px", width: "300px", fontSize: "16px" }}
          />
          {/* Text input for slice number */}
          <TextField
            label="Slice Number"
            variant="outlined"
            value={inputSliceNumber} // Use the temporary state for the input field
            onChange={handleSliceNumberInputChange} // Update temporary state on input change
            style={{ marginBottom: "30px", marginRight: "20px", fontSize: "16px" }}
          />
          <Button variant="contained" color="white" onClick={handleFetchData}>
            Fetch Images
          </Button>
        </div>
        {/* 
      <div>
       // Checkbox to toggle defect detection 
        <FormControlLabel
          control={
            <Checkbox
              checked={detectDefects}
              onChange={handleDefectDetectionChange}
              name="detectDefects"
            />
          }
          label="Enable Defect Detection"
        />
      </div>
       */}
        <div>
          {/* Add Switch to toggle between "defect detection " */}
          <label>
            <input type="checkbox" checked={detectDefects} onChange={handleDefectDetectionChange} />{" "}
            Enable Defect Detection
          </label>
        </div>
        <div
          className="image-gallery"
          style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}
        >
          {imagesData.map((image) => (
            <div className="Image Position" style={{ textAlign: "center" }} key={image.id}>
              <h3>{image.position}</h3>
              <div className="image-item" style={{ textAlign: "center", position: "relative" }}>
                <img
                  src={`http://localhost:8000/${image.image}`} // Corrected image URL
                  alt={`Position: ${image.position}`} // Corrected alt text
                  style={{ width: "100%", height: "auto", cursor: "pointer" }}
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
                      const { box, label } = detection; // Assuming each detection contains 'box' and 'label'
                      const [centerX, centerY, width, height] = box;

                      const imageDimension = imageDimensions[image.id] || { width: 1, height: 1 };
                      const scaleX = imageDimension.width / 640; // Assuming 640 is the base image size for scaling
                      const scaleY = imageDimension.height / 640;

                      const boxLeft = centerX * scaleX;
                      const boxTop = centerY * scaleY;
                      const boxWidth = width * scaleX * 1.1;
                      const boxHeight = height * scaleY * 1.1;

                      const new_boxleft = ((boxLeft - boxWidth / 1.5) / imageDimension.width) * 100;
                      const new_boxtop = ((boxTop - boxHeight / 1.5) / imageDimension.height) * 100;

                      // Mapping numeric label IDs to descriptive defect names
                      const defectLabels = {
                        0: "Grooves_defect",
                        1: "Protruding_defect",
                        2: "Recoating_defect",
                      };

                      // Get the defect label by the detection labelId
                      const defectLabel = defectLabels[label] || "Unknown Defect"; // Default to "Unknown Defect" if the ID doesn't match

                      return (
                        <div
                          key={idx}
                          style={{
                            position: "absolute",
                            left: `${new_boxleft}%`,
                            top: `${new_boxtop}%`,
                            width: `${boxWidth}px`,
                            height: `${boxHeight}px`,
                            border: "2px solid red",
                            boxSizing: "border-box",
                          }}
                        >
                          {/* Label for the bounding box */}
                          <div
                            style={{
                              position: "absolute",
                              top: "-25px", // Adjust as needed
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
                            {defectLabel} {/* Label text */}
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
              src={`http://localhost:8000/${selectedImage?.image}`} // Corrected image URL
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
