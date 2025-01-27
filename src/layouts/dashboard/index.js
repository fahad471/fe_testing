import React, { useEffect, useState } from "react";
import axios from "axios";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField"; // Import Material UI TextField
import Button from "@mui/material/Button"; // Import Material UI Button
import MenuItem from "@mui/material/MenuItem"; // Import MenuItem from Material UI

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
  //const [route_influx, setRouteInflux] = useState("_slice"); //dont need anymore since slice and time labels are displayed together now
  const [productionIds, setProductionId] = useState(""); // Initially empty production ID
  const [inputProductionId, setInputProductionId] = useState(""); // State to manage input value
  const [liveCheck, setLiveCheck] = useState(true); // Live data toggle, default to true
  const [jobDate, setJobDate] = useState(null); // job date, default to null
  const [productionIdList, setProductionIdList] = useState([]); // State to store production IDs list

  // const [localhost] = useState("141.60.177.220"); //VPN:141.60.177.220
  const [apiBaseUrl, setApiBaseUrl] = useState("");

  useEffect(() => {
    const hostname = window.location.hostname;
    const baseUrl = hostname === "localhost" ? "localhost" : "141.60.181.147"; // External IP
    setApiBaseUrl(baseUrl);
  }, []);

  // Fetch the latest production ID on mount
  useEffect(() => {
    if (apiBaseUrl) {
      const production_id_url = `http://${apiBaseUrl}:8000/api/sensor_data/influx/latest_status`;

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
    }
  }, [apiBaseUrl, liveCheck]);

  // Fetch data based on production ID
  const fetchData = (field, setter) => {
    if (!apiBaseUrl) {
      return; // If apiBaseUrl is not set, do nothing
    }
    // const API_URL =
    //   "http://127.0.0.1:8000/api/sensor_data/influx/Opt_sensor" +
    //   route_influx +
    //   "?production_id=" +
    //   productionIds +
    //   "&field=" +
    //   field;

    const sliceAPI_URL = `http://${apiBaseUrl}:8000/api/sensor_data/influx/Opt_sensor_slice?production_id=${productionIds}&field=${field}`;
    const timeAPI_URL = `http://${apiBaseUrl}:8000/api/sensor_data/influx/Opt_sensor_time?production_id=${productionIds}&field=${field}`;

    Promise.all([axios.get(sliceAPI_URL), axios.get(timeAPI_URL)])
      .then((responses) => {
        const sliceData = responses[0].data;
        const timeData = responses[1].data;

        // Ensure both datasets are valid (i.e., they have matching lengths)
        if (sliceData.length && timeData.length) {
          setter({
            datasets: [
              {
                label: `${field}`,
                color: "success",
                data: sliceData.map((item) => item._value),
              },
            ],
            labels: sliceData.map((item, index) => {
              // Combine _slice and _time into one label: _slice[index];_time[index]
              const time = new Date(timeData[index]._time);
              const formattedTime =
                time.getHours() + ":" + (time.getMinutes() < 10 ? "0" : "") + time.getMinutes(); // Format time as HH:mm
              return `${item._slice};${formattedTime}`; // Concatenate slice and formatted time
            }),
          });
          const jobDate =
            timeData.length > 0 ? new Date(timeData[0]._time).toLocaleString() : "No data";
          setJobDate(jobDate);
          setLastUpdateTime(new Date().toLocaleString());
        }
      })

      // axios
      //   .get(API_URL)
      //   .then((response) => {
      //     const timeLabels = response.data.map((item) =>
      //       route_influx === "_slice" ? item._slice : item._time
      //     );
      //     const values = response.data.map((item) => item._value);

      //     setter({
      //       labels: timeLabels,
      //       datasets: [
      //         {
      //           label: field,
      //           color: "success", // Default color, adjust dynamically if needed
      //           data: values,
      //         },
      //       ],
      //     });
      //     const jobDate =
      //       response.data.length > 0 ? new Date(response.data[0]._time).toLocaleString() : "No data";
      //     setJobDate(jobDate); //
      //     setLastUpdateTime(new Date().toLocaleString());
      //   })

      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  };

  // Handle input change for the production ID
  const handleInputChange = (event) => {
    setInputProductionId(event.target.value); // Update input state
  };

  // Toggle the route_influx state when the switch is toggled
  // const handleSwitchToggle = (event) => {
  //   setRouteInflux(event.target.checked ? "_time" : "_slice");
  //   fetchData("ProcessChamberOxygenConcentration", setSensorChartData);
  //   fetchData("ShieldingGasConsumption", setSensorChamberGas);
  //   fetchData("EnvironmentHumidity", setSensorEnvironmentHumidity);
  //   fetchData("RecoaterStatus", setSensorRecoaterStatus);
  //   fetchData("SliceUsedPowderVolume", setSensorSliceUsedPowderVolume);
  //   fetchData("SliceCoatingDuration", setSensorSliceCoatingDuration);
  // };

  // Handle fetch on button click
  const handleFetchData = () => {
    if (!inputProductionId) return; // If input is empty, do nothing

    setProductionId(inputProductionId); // Set the production ID from input
  };

  // Fetch data whenever the production ID changes
  useEffect(() => {
    if (apiBaseUrl && productionIds && productionIds.length > 0) {
      fetchData("ProcessChamberOxygenConcentration", setSensorChartData);
      fetchData("ShieldingGasConsumption", setSensorChamberGas);
      fetchData("EnvironmentHumidity", setSensorEnvironmentHumidity);
      fetchData("RecoaterStatus", setSensorRecoaterStatus);
      fetchData("SliceUsedPowderVolume", setSensorSliceUsedPowderVolume);
      fetchData("SliceCoatingDuration", setSensorSliceCoatingDuration);
    }
  }, [apiBaseUrl, productionIds]); // Runs whenever productionIds changes

  // Toggle Live Data stream checkbox
  const handleLiveToggle = () => {
    setLiveCheck((prevState) => !prevState);
  };

  //Function that will fetch the production IDs from backend InfluxDB
  const fetchProductionIdList = () => {
    if (apiBaseUrl) {
      axios
        .get(`http://${apiBaseUrl}:8000/api/sensor_data/influx/productionid`)
        .then((response) => {
          const productionIds = response.data.map((item) => item.ProductionID);
          setProductionIdList(productionIds); // Store production IDs in the state
        })
        .catch((error) => {
          console.error("Error fetching production IDs:", error);
        });
    }
  };

  // Fetch production IDs when Live Data Stream is unchecked
  useEffect(() => {
    if (apiBaseUrl) {
      fetchProductionIdList();
    }
  }, [apiBaseUrl]);

  // Fetch data on live data stream every 1 minute
  useEffect(() => {
    let intervalId;
    if (liveCheck) {
      // Fetch data every minute (60000 ms)
      intervalId = setInterval(() => {
        if (apiBaseUrl && productionIds && productionIds.length > 0) {
          fetchData("ProcessChamberOxygenConcentration", setSensorChartData);
          fetchData("ShieldingGasConsumption", setSensorChamberGas);
          fetchData("EnvironmentHumidity", setSensorEnvironmentHumidity);
          fetchData("RecoaterStatus", setSensorRecoaterStatus);
          fetchData("SliceUsedPowderVolume", setSensorSliceUsedPowderVolume);
          fetchData("SliceCoatingDuration", setSensorSliceCoatingDuration);
        }
      }, 60000);
    }

    // Clear interval when live data is disabled
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [liveCheck, apiBaseUrl, productionIds]);

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

                      {liveCheck ? (
                        // Display input field when Live Data is ON
                        <TextField
                          label="Current Production ID"
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
                      ) : (
                        // Display dropdown when Live Data is OFF
                        <TextField
                          select
                          label="Select Production ID"
                          value={inputProductionId} // Bind to the inputProductionId state
                          onChange={handleInputChange} // Handle change event
                          variant="outlined"
                          // fullWidth
                          style={{
                            marginBottom: "30px",
                            marginRight: "20px",
                            minWidth: "300px",
                            minHeight: "40 px",
                            width: "auto", // Allow the width to grow based on content
                            fontSize: "16px",
                          }}
                        >
                          <MenuItem value="">Select Production ID</MenuItem>{" "}
                          {/* Default empty option */}
                          {productionIdList.map((prodId) => (
                            <MenuItem key={prodId} value={prodId}>
                              {prodId}
                            </MenuItem> // Use MenuItem for dropdown options
                          ))}
                        </TextField>
                      )}

                      {/* //   <div style={{ marginBottom: "30px" }}>
                      //     <label htmlFor="productionIdDropdown" style={{ marginRight: "10px" }}>
                      //       Select Production ID:
                      //     </label>
                      //     <select
                      //       id="productionIdDropdown"
                      //       value={inputProductionId} // Bind to the inputProductionId state
                      //       onChange={handleInputChange} // Handle change event
                      //       style={{
                      //         minWidth: "200px", // Set minimum width
                      //         width: "auto", // Allow the width to grow based on content
                      //         padding: "10px",
                      //         fontSize: "16px",
                      //         whiteSpace: "nowrap", // Prevent wrapping
                      //         overflow: "hidden", // Hide overflow
                      //         textOverflow: "ellipsis", // Show ellipsis if the text overflows
                      //       }}
                      //     >
                      //       <option value="">Select Production ID</option>
                      //       {productionIdList.map((prodId) => (
                      //         <option key={prodId} value={prodId}>
                      //           {prodId}
                      //         </option>
                      //       ))}
                      //     </select>
                      //   </div>
                      // )} */}

                      {/* <TextField
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
                      /> */}

                      <Button
                        variant="contained"
                        color="success"
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
                      Add Switch to toggle between "Opt_sensor_slice" and "Opt_sensor_time"
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
                  <Grid item xs={8} md={8} lg={6}>
                    <MDBox mb={8}>
                      <h3 style={{ textAlign: "center" }}>Indoor Camera</h3>
                      <img
                        src="http://141.60.140.120:23600/S0711Q0247/camera.mjpg"
                        alt="Camera Stream"
                        style={{
                          width: "100%",
                          height: "auto",
                          // maxWidth: "1000px",
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
