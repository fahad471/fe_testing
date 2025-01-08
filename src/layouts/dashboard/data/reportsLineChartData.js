/**
=========================================================
* Material Dashboard 2 React - v2.2.0
=========================================================

* Product Page: https://www.creative-tim.com/product/material-dashboard-react
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/
// Fetch data from API
import React, { useEffect, useState } from "react";

function ContentComp() {
  const [currentData, setCurrentData] = useState([]);
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    fetch(
      `http://127.0.0.1:8000/api/sensor_data/influx/Opt_sensor_time?production_id=eff67ab2-0ff0-4e05-a86d-28fb8a870578&field=ProcessChamberOxygenConcentration`
    )
      .then((res) => res.json())
      .then((data) => {
        console.log("Data fetched");
        setCurrentData(data);

        // Transform the data into the desired format
        const formattedChartData = {
          sales: {
            labels: data.map((item) => item._time), // Extracting time (_time) as labels
            datasets: [
              {
                label: "Sensor data",
                data: data.map((item) => item._value), // Extracting values (_value) for the dataset
              },
            ],
          },
          tasks: {
            labels: ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
            datasets: [
              {
                label: "Desktop apps",
                data: [50, 40, 300, 220, 500, 250, 400, 230, 500], // Static data for tasks
              },
            ],
          },
        };

        setChartData(formattedChartData); // Update the state with the chart data
        console.log(formattedChartData); // Log the transformed chart data
      })
      .catch((err) => {
        console.log("Error loading the data", err);
      });
  }, []); // Empty dependency array means this runs once after the component mounts

  return (
    <div>
      {/* Render your chart or any other content using chartData */}
      {chartData && (
        <div>
          <h1>Chart Data</h1>
          {/* Example: Render chartData */}
          <pre>{JSON.stringify(chartData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default ContentComp;
