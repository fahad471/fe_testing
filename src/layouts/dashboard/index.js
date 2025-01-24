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
  const [route_influx, setRouteInflux] = useState("_slice");
  const [productionIds, setProductionId] = useState(""); // Initially empty production ID
  const [inputProductionId, setInputProductionId] = useState(""); // State to manage input value
  const [liveCheck, setLiveCheck] = useState(true); // Live data toggle, default to true
  const [jobDate, setJobDate] = useState(null); // job date, default to null

  // Fetch the latest production ID on mount
  useEffect(() => {
    const production_id_url = "http://localhost:8000/api/sensor_data/influx/latest_status";

    const fetchProductionId = () => {
      if (liveCheck) {
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
      }
    };

    fetchProductionId();

    // Set interval to fetch every 2 minutes (120000 ms)
    const intervalId = setInterval(fetchProductionId, 120000);

    // Clear interval on unmount
    return () => clearInterval(intervalId);
  }, [liveCheck]);

  // // Fetch data based on production ID
  // const fetchData = (field, setter) => {
  //   const API_URL =
  //     "http://127.0.0.1:8000/api/sensor_data/influx/Opt_sensor" +
  //     route_influx +
  //     "?production_id=" +
  //     productionIds +
  //     "&field=" +
  //     field;

  //   axios
  //     .get(API_URL)
  //     .then((response) => {
  //       const timeLabels = response.data.map((item) =>
  //         route_influx === "_slice" ? item._slice : item._time
  //       );
  //       const values = response.data.map((item) => item._value);

  //       setter({
  //         labels: timeLabels,
  //         datasets: [
  //           {
  //             label: field,
  //             color: "success", // Default color, adjust dynamically if needed
  //             data: values,
  //           },
  //         ],
  //       });
  //       const jobDate =
  //         response.data.length > 0 ? new Date(response.data[0]._time).toLocaleString() : "No data";
  //       setJobDate(jobDate); //
  //       setLastUpdateTime(new Date().toLocaleString());
  //     })
  //     .catch((error) => {
  //       console.error("Error fetching data:", error);
  //     });
  // };

  // Fetch data for slice and time (separately) for each sensor
  const fetchData = (field, setter) => {
    const sliceAPI_URL = `http://localhost:8000/api/sensor_data/influx/Opt_sensor_slice?production_id=${productionIds}&field=${field}`;
    const timeAPI_URL = `http://localhost:8000/api/sensor_data/influx/Opt_sensor_time?production_id=${productionIds}&field=${field}`;

    // Fetch both slice and time data concurrently
    Promise.all([axios.get(sliceAPI_URL), axios.get(timeAPI_URL)])
      .then((responses) => {
        const sliceData = responses[0].data;
        const timeData = responses[1].data;

        // Ensure both datasets are valid (i.e., they have matching lengths)
        if (sliceData.length && timeData.length) {
          // Combine the slice data for x-axis, and use the values for both time and slice
          const combinedLabels = sliceData.map((item, index) => {
            const slice = item._slice;
            const time = timeData && timeData[index] ? timeData[index]._time : "";
            return `Slice ${slice} - ${time}`;
          });

          setter({
            labels: sliceData.map((item) => item._slice), // Use only slice data for x-axis labels
            datasets: [
              {
                label: `${field}`,
                color: "success", // You can adjust the color dynamically if needed
                data: sliceData.map((item) => item._value), // Use values from sliceData
                xAxisID: "x", // Use the bottom x-axis
              },
              {
                label: `${field} (Time)`,
                color: "primary", // You can adjust the color dynamically if needed
                data: timeData.map((item) => item._value), // Use values from timeData
                xAxisID: "x1", // Use the top x-axis
              },
            ],
          });

          // Extract the first job date from timeData
          const jobDate =
            timeData.length > 0 ? new Date(timeData[0]._time).toLocaleString() : "No data";
          setJobDate(jobDate);
          setLastUpdateTime(new Date().toLocaleString());
        }
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

  // Toggle Live Data stream checkbox
  const handleLiveToggle = () => {
    setLiveCheck((prevState) => !prevState);
  };

  // Chart Configuration
  const chartOptions = {
    responsive: true,
    scales: {
      x: {
        type: "category",
        position: "bottom",
        labels: sensorChartData?.labels,
        title: {
          display: true,
          text: "Slice and Time",
        },
        ticks: {
          rotation: 45,

          autoSkip: true,
          maxRotation: 90,
        },
      },
    },
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <MDBox mt={4.5}>
          <Grid container spacing={1}>
            {/* Input field for production ID */}
            <Grid item xs={12}>
              <MDBox mb={6}>
                <Grid container spacing={1}>
                  {/* Left side: Input field, Button, Toggle, and Last Update */}
                  <Grid item xs={8} md={8} lg={6}>
                    <div style={{ marginTop: "0px" }}>
                      {/* Display last update time */}
                      {lastUpdateTime && (
                        <MDBox mb={3}>
                          <p>
                            <strong>Last Update: </strong>
                            {lastUpdateTime}
                          </p>
                        </MDBox>
                      )}

                      <div style={{ marginLeft: "0px", marginTop: "0%", marginBottom: "2%" }}>
                        {/* Add Switch to toggle between "live data" and "fetching old data" */}
                        <label>
                          <input type="checkbox" checked={liveCheck} onChange={handleLiveToggle} />{" "}
                          Live Data Stream
                        </label>
                      </div>

                      <TextField
                        label="Enter Production ID"
                        variant="outlined"
                        value={inputProductionId} // Bind to state
                        onChange={handleInputChange} // Handle input changes
                        style={{
                          marginBottom: "30px",
                          marginRight: "20px",
                          width: "300px",
                          fontSize: "16px",
                        }}
                        disabled={liveCheck}
                      />
                      <Button
                        variant="contained"
                        color="white"
                        onClick={handleFetchData}
                        style={{ marginTop: "0px" }}
                        disabled={liveCheck}
                      >
                        Fetch Data
                      </Button>
                    </div>

                    {/* Display Job date extracted from _time */}
                    {jobDate && (
                      <MDBox mb={3}>
                        <p>
                          <strong>Job Date : </strong>
                          {jobDate}
                        </p>
                      </MDBox>
                    )}

                    {/* <div style={{ marginLeft: "0px", marginTop: "40%" }}>
                      {/*Add Switch to toggle between "Opt_sensor_slice" and "Opt_sensor_time"} 
                      <label>
                        <input
                          type="checkbox"
                          checked={route_influx === "_time"}
                          onChange={handleSwitchToggle}
                        />{" "}
                        Toggle Data Type
                      </label>
                    </div> */}
                  </Grid>

                  {/* Right side: Indoor Camera */}
                  <Grid item xs={12} md={4} textAlign="right">
                    <MDBox mb={8}>
                      <h3>Indoor Camera</h3>
                      <img
                        src="http://141.60.140.120:23600/S0711Q0247/camera.mjpg"
                        alt="Camera Stream"
                        style={{
                          width: "150%",
                          height: "auto",
                          maxWidth: "1000px",
                          maxHeight: "aut0",
                        }} // Adjusted size
                      />
                    </MDBox>
                  </Grid>
                </Grid>
              </MDBox>
            </Grid>

            {/* Render charts for sensor data */}
            <Grid item xs={8} md={8} lg={6}>
              <MDBox mb={8}>
                {sensorChartData && (
                  <DefaultLineChart
                    icon={{ color: "success", component: "leaderboard" }}
                    title="Oxygen Concentration"
                    height="20rem"
                    description="Sensor data over time and slice"
                    chart={sensorChartData}
                    options={chartOptions}
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
                    options={chartOptions}
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
                    options={chartOptions}
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
                    options={chartOptions}
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
                    options={chartOptions}
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
                    options={chartOptions}
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
