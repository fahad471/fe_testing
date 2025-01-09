import React, { useEffect, useState } from "react";
import axios from "axios";
import { Modal, Box, IconButton } from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";

const Dashboard = () => {
  const [imagesData, setImagesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    // Fetch the image data from the backend using axios
    const fetchImageData = async () => {
      try {
        const response = await axios.get(
          "http://localhost:8000/api/image_data/maria/images/?production_id=eff67ab2-0ff0-4e05-a86d-28fb8a870578&slice_number=55"
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

  const openImageModal = (image) => {
    setSelectedImage(image);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
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
      {" "}
      {/* Adjust padding to prevent overlap with the sidenav */}
      <h1>Image Dashboard</h1>
      <div
        className="image-gallery"
        style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}
      >
        {imagesData.map((image) => (
          <div key={image.id} className="image-item" style={{ textAlign: "center" }}>
            <h3>{image.position}</h3>
            <img
              src={`http://localhost:8000/${image.image}`}
              alt={`Position: ${image.position}`}
              style={{ width: "90%", height: "auto", cursor: "pointer" }}
              onClick={() => openImageModal(image)} // Open modal on click
            />
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
            src={`http://localhost:8000/${selectedImage?.image}`}
            alt={`Position: ${selectedImage?.position}`}
            style={{ width: "100%", height: "auto" }}
          />
        </Box>
      </Modal>
    </div>
  );
};

export default Dashboard;
