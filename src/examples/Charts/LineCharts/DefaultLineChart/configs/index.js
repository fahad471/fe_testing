/**
=========================================================
* Material Dashboard 2 React - v2.1.0
=========================================================

* Product Page: https://www.creative-tim.com/product/nextjs-material-dashboard-pro
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/
// Material Dashboard 2 React base styles
import typography from "assets/theme/base/typography";

function configs(labels, datasets, customOptions) {
  const dataLength = labels.length;
  const sliceTickInterval = Math.floor(0.05 * dataLength); // For Slice axis
  const timeTickInterval = Math.floor(0.1 * dataLength);
  // Default options definition
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    interaction: {
      intersect: false,
      mode: "index",
    },
    scales: {
      y: {
        grid: {
          drawBorder: false,
          display: true,
          drawOnChartArea: true,
          drawTicks: false,
          borderDash: [5, 5],
          color: "#c1c4ce5c",
        },
        ticks: {
          display: true,
          padding: 10,
          color: "#b2b9bf",
          font: {
            size: 11,
            family: typography.fontFamily,
            style: "normal",
            lineHeight: 2,
          },
        },
      },
      x: {
        grid: {
          drawBorder: false,
          display: true,
          drawOnChartArea: true,
          drawTicks: true,
          borderDash: [5, 5],
          color: "#c1c4ce5c",
        },
        ticks: {
          autoSkip: true,
          maxTicksLimit: dataLength / sliceTickInterval, //
          stepSize: sliceTickInterval, //
          callback: function (label) {
            let realLabel = this.getLabelForValue(label);
            var slice = realLabel.split(";")[0];
            return slice;
          },
          display: true,
          color: "#b2b9bf",
          padding: 20,
          font: {
            size: 11,
            family: typography.fontFamily,
            style: "normal",
            lineHeight: 2,
          },
        },
      },
      x1: {
        type: "category", // specify category type for combined labels
        position: "bottom", // position it on the bottom as well
        grid: {
          drawOnChartArea: false,
        },
        offset: true, // Ensures x1 (time) axis does not overlap with x (slice) axis
        ticks: {
          autoSkip: true,
          maxTicksLimit: dataLength / timeTickInterval, //
          stepSize: timeTickInterval, //
          callback: function (label) {
            let realLabel = this.getLabelForValue(label);
            var time = realLabel.split(";")[1];
            return time;
          },
          display: true,
          color: "#b2b9bf",
          padding: 20,
          font: {
            size: 11,
            family: typography.fontFamily,
            style: "normal",
            lineHeight: 2,
          },
        },
      },
    },
  };

  // Merge custom options with default options
  const mergedOptions = { ...defaultOptions, ...customOptions };

  // Return the final configuration object
  return {
    data: {
      labels,
      datasets: [...datasets],
    },
    options: mergedOptions,
  };
}

export default configs;
