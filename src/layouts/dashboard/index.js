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

// @mui material components
import React, { useEffect, useState } from "react";
import axios from "axios";
import Grid from "@mui/material/Grid";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DefaultLineChart from "examples/Charts/LineCharts/DefaultLineChart";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

// Import missing components
import ReportsBarChart from "examples/Charts/BarCharts/ReportsBarChart";
import ReportsLineChart from "examples/Charts/LineCharts/ReportsLineChart";

// Data
import reportsBarChartData from "layouts/dashboard/data/reportsBarChartData";
import reportsLineChartData from "layouts/dashboard/data/reportsLineChartData";

function Dashboard() {
  const { sales, tasks } = reportsLineChartData;

  const [sensorChartData, setSensorChartData] = useState(null);
  const [sensorChamberGas, setSensorChamberGas] = useState(null);

  const [sensorEnvironmentHumidity, setSensorEnvironmentHumidity] = useState(null);
  const [sensorRecoaterStatus, setSensorRecoaterStatus] = useState(null);
  const [sensorSliceUsedPowderVolume, setSensorSliceUsedPowderVolume] = useState(null);
  const [sensorSliceCoatingDuration, setSensorSliceCoatingDuration] = useState(null);

  const [lastUpdateTime, setLastUpdateTime] = useState(null); // Track the last update time

  let [productionIds, setProductionId] = useState("eff67ab2-0ff0-4e05-a86d-28fb8a870578");

  useEffect(() => {
    // Fetch productionid first
    const production_id_url = "http://localhost:8000/api/sensor_data/influx/latest_status";

    const fetchProductionId = () => {
      axios
        .get(production_id_url)
        .then((response) => {
          productionIds = response.data.ProductionID;
          console.log("productionid", productionIds);
          setProductionId(productionIds);
        })
        .catch((error) => {
          console.error("Error fetching data:", error);
        });
    };

    // Initial fetch
    fetchProductionId();

    // Set interval to fetch every 2 minutes (120000 ms)
    const intervalId = setInterval(fetchProductionId, 120000);

    // Clear interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    // Fetch sensor data only when productionid is available
    if (productionIds && productionIds.length > 0) {
      const fetchData = (field, setter) => {
        const API_URL =
          "http://127.0.0.1:8000/api/sensor_data/influx/Opt_sensor_slice?production_id=" +
          productionIds +
          "&field=" +
          field;

        axios
          .get(API_URL)
          .then((response) => {
            const timeLabels = response.data.map((item) => item.slice);
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

      fetchData("ProcessChamberOxygenConcentration", setSensorChartData);
      fetchData("ShieldingGasConsumption", setSensorChamberGas);
      fetchData("EnvironmentHumidity", setSensorEnvironmentHumidity);
      fetchData("RecoaterStatus", setSensorRecoaterStatus);
      fetchData("SliceUsedPowderVolume", setSensorSliceUsedPowderVolume);
      fetchData("SliceCoatingDuration", setSensorSliceCoatingDuration);

      // Fetch all sensor data on mount and every 2 minutes
      const intervalId = setInterval(() => {
        fetchData("ProcessChamberOxygenConcentration", setSensorChartData);
        fetchData("ShieldingGasConsumption", setSensorChamberGas);
        fetchData("EnvironmentHumidity", setSensorEnvironmentHumidity);
        fetchData("RecoaterStatus", setSensorRecoaterStatus);
        fetchData("SliceUsedPowderVolume", setSensorSliceUsedPowderVolume);
        fetchData("SliceCoatingDuration", setSensorSliceCoatingDuration);
      }, 120000);

      // Cleanup interval on unmount
      return () => clearInterval(intervalId);
    }
  }, [productionIds]);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <MDBox mt={4.5}>
          <Grid container spacing={3}>
            {/* <Grid item xs={12} md={6} lg={4}>
              <MDBox mb={3}>
                <ReportsBarChart
                  color="info"
                  title="website views"
                  description="Last Campaign Performance"
                  date="campaign sent 2 days ago"
                  chart={reportsBarChartData}
                />
              </MDBox>
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
              <MDBox mb={3}>
                <ReportsLineChart
                  color="success"
                  title="daily sales"
                  description={
                    <>
                      <strong>+15%</strong> increase in today&apos;s sales.
                    </>
                  }
                  date="updated 4 min ago"
                  chart={sales}
                />
              </MDBox>
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
              <MDBox mb={3}>
                <ReportsLineChart
                  color="dark"
                  title="ProcessChamberGas"
                  description="Sensor data over time"
                  date="datetime"
                  chart={tasks}
                />
              </MDBox>
            </Grid> */}

            <Grid item xs={12}>
              {/* Display the last update time */}
              {lastUpdateTime && (
                <MDBox mb={3}>
                  <p>
                    <strong>Last Update: </strong>
                    {lastUpdateTime}
                  </p>
                </MDBox>
              )}
            </Grid>

            <Grid item xs={8} md={8} lg={6}>
              <MDBox mb={8}>
                {/* DefaultLineChart to visualize sensor data */}
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
                {/* DefaultLineChart to visualize sensor data */}
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
                {/* DefaultLineChart to visualize sensor data */}
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
                {/* DefaultLineChart to visualize sensor data */}
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
                {/* DefaultLineChart to visualize sensor data */}
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
                {/* DefaultLineChart to visualize sensor data */}
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
