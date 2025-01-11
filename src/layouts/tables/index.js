import React, { useEffect, useState } from "react";
import axios from "axios";
import { Modal, Box, IconButton, Checkbox, FormControlLabel } from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";

const Dashboard = () => {
  const [imagesData, setImagesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [detectDefects, setDetectDefects] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({});

  useEffect(() => {
    // Fetch the image data from the backend using axios
    const fetchImageData = async () => {
      try {
        const response = await axios.get(
          "http://localhost:8000/api/image_data/maria/images/?production_id=f77c322a-1f91-4d9c-91f9-eb1c18163e31&slice_number=1028"
        ); // Replace with the correct API endpoint
        setImagesData(response.data); // Set the fetched image data into state
      } catch (err) {
        setError("Error fetching image data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchImageData();
  }, []);

  const fetchDefectData = async () => {
    try {
      const response = await axios.post(
        "http://localhost:8000/api/image_data/detect_defects/", // API endpoint for defect detection
        null, // No body required
        { params: { detect_defects: detectDefects } } // Include detect_defects parameter
      );
      console.log("Defect Data Response:", response.data); // Debugging log for defect data response

      const updatedImages = imagesData.map((image) => {
        // Normalize the image path from imagesData
        const normalizedImagePath = `http://localhost:8000/${image.image}`;

        // Get just the file name from the path (ignore directory structure)
        const imageFileName = normalizedImagePath.split("/").pop();

        // Find defect data for the image by comparing the file name
        const defectData = response.data.find((defect) => {
          // Normalize defect path by extracting just the file name
          const defectFileName = defect.image_path.split("\\").pop(); // Use "\\" to split the Windows path correctly

          console.log("Comparing Image File:", imageFileName); // Debugging log to check file names
          console.log("With Defect File:", defectFileName); // Debugging log to check file names

          return defectFileName === imageFileName; // Compare file names only
        });

        console.log("Defect Data for Image:", defectData); // Debugging log for each image's defect data
        // Set detections to empty array if no defects are found
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
  }, [detectDefects]); // Run whenever detectDefects state changes

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
          <div
            key={image.id}
            className="image-item"
            style={{ textAlign: "center", position: "relative" }}
          >
            <h3>{image.position}</h3>
            <img
              src={`http://localhost:8000/${image.image}`} // Corrected image URL
              alt={`Position: ${image.position}`} // Corrected alt text
              style={{ width: "80%", height: "auto", cursor: "pointer" }}
              onClick={() => openImageModal(image)}
              onLoad={(e) => handleImageLoad(image.id, e)} // Pass the event and image ID
            />

            {/* Render "No defects detected" message if defect detection is enabled and no detections */}
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

            {/* Render bounding boxes if defect detection is enabled and there are detections */}
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
                  const { box } = detection;
                  const [centerX, centerY, width, height] = box;

                  const imageDimension = imageDimensions[image.id] || { width: 1, height: 1 }; // Default to 1 to avoid divide by 0

                  // Rescale the bounding box values based on the actual image dimensions
                  const scaleX = imageDimension.width / 640; // Scale factor for width
                  const scaleY = imageDimension.height / 640;

                  // Apply the rescaling to bounding box coordinates
                  const boxLeft = (centerX - width / 2) * scaleX;
                  const boxTop = (centerY - height / 2) * scaleY;
                  const boxWidth = width * scaleX;
                  const boxHeight = height * scaleY;

                  return (
                    <div
                      key={idx}
                      style={{
                        position: "absolute",
                        left: `${boxLeft}px`,
                        top: `${boxTop}px`,
                        width: `${boxWidth}px`,
                        height: `${boxHeight}px`,
                        border: "2px solid red",
                        boxSizing: "border-box",
                      }}
                    />
                  );
                })}
              </div>
            )}
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
