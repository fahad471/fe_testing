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
  const [previousSliceNumber, setPreviousSliceNumber] = useState(null); // for tracking previous slice number

  // Function to fetch image data based on the slice number
  const fetchImageData = async (sliceNumber) => {
    setLoading(true); // Show the loading state
    try {
      const response = await axios.get(
        `http://localhost:8000/api/image_data/maria/images/?production_id=f77c322a-1f91-4d9c-91f9-eb1c18163e31&slice_number=${sliceNumber}`
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

  // Initial fetch when the component is mounted with the default slice number
  useEffect(() => {
    fetchImageData(sliceNumber); // Fetch images when the component mounts or sliceNumber changes
  }, [sliceNumber]); // Dependency on sliceNumber ensures it fetches when sliceNumber changes

  // Function to handle the defect detection logic (can be enhanced)
  const fetchDefectData = async () => {
    try {
      const response = await axios.post(
        "http://localhost:8000/api/image_data/detect_defects/", // API endpoint for defect detection
        null, // No body required
        { params: { detect_defects: detectDefects } } // Include detect_defects parameter
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
  }, [detectDefects]);

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

  // Button click to fetch images based on input slice number
  const handleFetchData = () => {
    if (inputSliceNumber !== previousSliceNumber) {
      // If the slice number has changed, reset detectDefects to false
      setDetectDefects(false);

      // Fetch images with the new slice number
      fetchImageData(inputSliceNumber); // This should be fetchImageData, not fetchImages

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
    <div style={{ paddingLeft: "300px" }}>
      <h1>Image Dashboard</h1>
      <div>
        {/* Text input for slice number */}
        <TextField
          label="Slice Number"
          variant="outlined"
          value={inputSliceNumber} // Use the temporary state for the input field
          onChange={handleSliceNumberInputChange} // Update temporary state on input change
          style={{ marginBottom: "20px", marginRight: "10px" }}
        />
        <Button variant="contained" color="white" onClick={handleFetchData}>
          Fetch Images
        </Button>
      </div>

      <div>
        {/* Checkbox to toggle defect detection */}
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

                    const new_boxleft = ((boxLeft - boxWidth / 1.3) / imageDimension.width) * 100;
                    const new_boxtop = ((boxTop - boxHeight / 1.3) / imageDimension.height) * 100;

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
  );
};

export default Dashboard;
