import React, { useEffect, useState } from "react";
import axios from "axios";

const Dashboard = () => {
  const [imagesData, setImagesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h1>Image Dashboard</h1>
      <div className="image-gallery">
        {imagesData.map((image) => (
          <div key={image.id} className="image-item">
            <h3>{image.position}</h3>
            <img
              src={`images/${image.image}`} // Constructing image URL
              alt={`Position: ${image.position}`}
              style={{ width: "200px", height: "200px" }} // Add styles as needed
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
