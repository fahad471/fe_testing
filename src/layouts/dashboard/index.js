import React, { useEffect, useState } from "react";
import axios from "axios";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField"; // Import Material UI TextField
import Button from "@mui/material/Button"; // Import Material UI Button

import MDBox from "components/MDBox";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DefaultLineChart from "examples/Charts/LineCharts/DefaultLineChart";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

function Dashboard() {
  const [sensorChartData, setSensorChartData] = useState(null);
  const [sensorChamberGas, setSensorChamberGas] = useState(null);
  const [sensorEnvironmentHumidity, setSensorEnvironmentHumidity] = useState(null);
  const [sensorRecoaterStatus, setSensorRecoaterStatus] = useState(null);
  const [sensorSliceUsedPowderVolume, setSensorSliceUsedPowderVolume] = useState(null);
  const [sensorSliceCoatingDuration, setSensorSliceCoatingDuration] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [route_influx, setRouteInflux] = useState("_time");
  const [productionIds, setProductionId] = useState(""); // Initially empty production ID
  const [inputProductionId, setInputProductionId] = useState(""); // State to manage input value

  // Fetch the latest production ID on mount
  useEffect(() => {
    const production_id_url = "http://localhost:8000/api/sensor_data/influx/latest_status";

    const fetchProductionId = () => {
      axios
        .get(production_id_url)
        .then((response) => {
          const latestProductionId = response.data.ProductionID;
          setProductionId(latestProductionId); // Set the default to the latest production ID
          setInputProductionId(latestProductionId); // Set the input field to the latest ID
        })
        .catch((error) => {
          console.error("Error fetching production ID:", error);
        });
    };

    fetchProductionId();

    // Set interval to fetch every 2 minutes (120000 ms)
    const intervalId = setInterval(fetchProductionId, 120000);

    // Clear interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  // Fetch data based on production ID
  const fetchData = (field, setter) => {
    const API_URL =
      "http://127.0.0.1:8000/api/sensor_data/influx/Opt_sensor" +
      route_influx +
      "?production_id=" +
      productionIds +
      "&field=" +
      field;

    axios
      .get(API_URL)
      .then((response) => {
        const timeLabels = response.data.map((item) =>
          route_influx === "_slice" ? item._slice : item._time
        );
        const values = response.data.map((item) => item._value);

        setter({
          labels: timeLabels,
          datasets: [
            {
              label: field,
              color: "success", // Default color, adjust dynamically if needed
              data: values,
            },
          ],
        });
        setLastUpdateTime(new Date().toLocaleString());
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  };

  // Handle input change for the production ID
  const handleInputChange = (event) => {
    setInputProductionId(event.target.value); // Update input state
  };
  // Toggle the route_influx state when the switch is toggled
  const handleSwitchToggle = (event) => {
    setRouteInflux(event.target.checked ? "_time" : "_slice");
    fetchData("ProcessChamberOxygenConcentration", setSensorChartData);
    fetchData("ShieldingGasConsumption", setSensorChamberGas);
    fetchData("EnvironmentHumidity", setSensorEnvironmentHumidity);
    fetchData("RecoaterStatus", setSensorRecoaterStatus);
    fetchData("SliceUsedPowderVolume", setSensorSliceUsedPowderVolume);
    fetchData("SliceCoatingDuration", setSensorSliceCoatingDuration);
  };
  // Handle fetch on button click
  const handleFetchData = () => {
    if (!inputProductionId) return; // If input is empty, do nothing

    setProductionId(inputProductionId); // Set the production ID from input
  };

  // Fetch data whenever the production ID changes
  useEffect(() => {
    if (productionIds && productionIds.length > 0) {
      fetchData("ProcessChamberOxygenConcentration", setSensorChartData);
      fetchData("ShieldingGasConsumption", setSensorChamberGas);
      fetchData("EnvironmentHumidity", setSensorEnvironmentHumidity);
      fetchData("RecoaterStatus", setSensorRecoaterStatus);
      fetchData("SliceUsedPowderVolume", setSensorSliceUsedPowderVolume);
      fetchData("SliceCoatingDuration", setSensorSliceCoatingDuration);
    }
  }, [productionIds]); // Runs whenever productionIds changes

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <MDBox mt={4.5}>
          <Grid container spacing={3}>
            {/* Input field for production ID */}
            <Grid item xs={12}>
              <MDBox mb={3}>
                <TextField
                  label="Enter Production ID"
                  variant="outlined"
                  value={inputProductionId} // Bind to state
                  onChange={handleInputChange} // Handle input changes
                  fullWidth
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleFetchData}
                  style={{ marginTop: "16px" }}
                >
                  Fetch Data
                </Button>
              </MDBox>
            </Grid>
            <div>
              {/* Add Switch to toggle between "Opt_sensor_slice" and "Opt_sensor_time" */}
              <label>
                <input
                  type="checkbox"
                  checked={route_influx === "_time"}
                  onChange={handleSwitchToggle}
                />
                Toggle Data Type
              </label>

              {/* Example: Trigger data fetch for a specific field */}

              {/* Render your data here */}
            </div>
            {/* Display last update time */}
            <Grid item xs={12}>
              {lastUpdateTime && (
                <MDBox mb={3}>
                  <p>
                    <strong>Last Update: </strong>
                    {lastUpdateTime}
                  </p>
                </MDBox>
              )}
            </Grid>

            {/* Render charts for sensor data */}
            <Grid item xs={8} md={8} lg={6}>
              <MDBox mb={8}>
                {sensorChartData && (
                  <DefaultLineChart
                    icon={{ color: "success", component: "leaderboard" }}
                    title="Oxygen Concentration"
                    height="20rem"
                    description="Sensor data over time"
                    chart={sensorChartData}
                  />
                )}
              </MDBox>
            </Grid>
            <Grid item xs={8} md={8} lg={6}>
              <MDBox mb={8}>
                {sensorChamberGas && (
                  <DefaultLineChart
                    icon={{ color: "success", component: "leaderboard" }}
                    title="Shielding Gas Consumption"
                    height="20rem"
                    description="Sensor data over time"
                    chart={sensorChamberGas}
                  />
                )}
              </MDBox>
            </Grid>

            <Grid item xs={8} md={8} lg={6}>
              <MDBox mb={8}>
                {sensorEnvironmentHumidity && (
                  <DefaultLineChart
                    icon={{ color: "success", component: "leaderboard" }}
                    title="Environment Humidity"
                    height="20rem"
                    description="Sensor data over time"
                    chart={sensorEnvironmentHumidity}
                  />
                )}
              </MDBox>
            </Grid>

            <Grid item xs={8} md={8} lg={6}>
              <MDBox mb={8}>
                {sensorRecoaterStatus && (
                  <DefaultLineChart
                    icon={{ color: "light", component: "leaderboard" }}
                    title="Recoater Status"
                    height="20rem"
                    description="Sensor data over time"
                    chart={sensorRecoaterStatus}
                  />
                )}
              </MDBox>
            </Grid>

            <Grid item xs={8} md={8} lg={6}>
              <MDBox mb={8}>
                {sensorSliceUsedPowderVolume && (
                  <DefaultLineChart
                    icon={{ color: "success", component: "leaderboard" }}
                    title="Powder Volume used per Slice"
                    height="20rem"
                    description="Sensor data over time"
                    chart={sensorSliceUsedPowderVolume}
                  />
                )}
              </MDBox>
            </Grid>
            <Grid item xs={8} md={8} lg={6}>
              <MDBox mb={8}>
                {sensorSliceCoatingDuration && (
                  <DefaultLineChart
                    icon={{ color: "success", component: "leaderboard" }}
                    title="Slice Coating Duration"
                    height="20rem"
                    description="Sensor data over time"
                    chart={sensorSliceCoatingDuration}
                  />
                )}
              </MDBox>
            </Grid>
          </Grid>
        </MDBox>
      </MDBox>
    </DashboardLayout>
  );
}

export default Dashboard;
